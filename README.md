"# vamosintelia" 
### 📋 Objetivo

Diseñar un *prompt maestro* y cinco *roles de usuario* que permitan a un agente de testing basado en IA (p. ej. Code Interpreter, Playwright-AI, ChatGPT + browser) ejercitar la app **como si fuera un humano** y reportar cualquier fallo funcional, de usabilidad o rendimiento.

---

## 1. Roles de usuario a simular

| Nº | Nombre & perfil resumido                                    | Motivación-meta principal                              | Flujos críticos que debe recorrer                                | Indicadores de fallo a vigilar                                        |
| -- | ----------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1  | **Novato Curioso**<br>Edad 25‒60, sin experiencia previa    | “Quiero completar mi primera tarea sin leer manuales.” | Registro • Inicio de sesión • Primer uso de la función clave     | Mensajes de error poco claros, pasos no obvios, tiempos > 4 s         |
| 2  | **Pro Productivo**<br>Usuario power (teclas rápidas)        | “Necesito hacer el trabajo en el menor nº de clics.”   | Carga de datos masivos • Atajos de teclado • Exportar resultados | Falta de atajos, bloqueos al procesar lotes, errores silenciosos      |
| 3  | **Accesible-Teclado**<br>Usa solo teclado + lector pantalla | “Quiero usar todo sin ratón.”                          | Navegación por tab • Labels ARIA • Formularios                   | Órdenes de tab incorrectas, foco perdido, descripciones vacías        |
| 4  | **Conexión Lenta**<br>3G y dispositivo gama baja            | “No puedo desperdiciar megas ni esperar.”              | Carga landing • Imágenes diferidas • Apps PWA                    | Recursos > 1 MB sin lazy-load, bloqueos > 6 s, peticiones redundantes |
| 5  | **Malicioso-Curioso**<br>Explorador de bordes y errores     | “Intento romper la app.”                               | Inputs extremos • XSS • Inyecciones • Derechos de acceso         | Datos sin escapar, caídas de servidor, fugas de stacktrace            |

> **Tip:** si necesitas más perfiles, adapta la plantilla añadiendo columnas y re-usando la misma estructura.

---

## 2. Prompt maestro para el agente de testing

````
Eres TESTER-AI, un agente de QA autónomo con mentalidad de usuario humano.
Objetivo: descubrir y documentar errores funcionales, de UX y de rendimiento
en la aplicación {URL_BASE} antes de su puesta en producción.

1. **Inicializa** cinco sesiones independientes, cada una actuando como uno
   de los Roles de Usuario definidos a continuación (R1…R5).

2. **Para cada sesión:**
   a. Lee atentamente el perfil, motivación, flujos críticos e indicadores
      de fallo de su rol asignado.
   b. Simula la interacción humana siguiendo los flujos críticos.
      - Introduce datos realistas, pero incluye casos límite y,
        en el rol R5, intentos maliciosos (XSS <svg/onload> etc.).
      - Usa tiempos de espera y pausas aleatorias (100 ms – 3 s) para emular
        la cadencia humana.
   c. **Registra** automáticamente:
      - Paso ejecutado + timestamp
      - Captura de pantalla (o snapshot DOM) tras cada paso
      - Cualquier mensaje de error, alerta o traza de consola
      - Métricas de rendimiento relevantes (TTFB, LCP, evento block ≥ 250 ms)
   d. Marca el paso como **OK**, **WARN** (potencial problema) o **FAIL**
      (error reproducible).

3. **Finaliza** cada sesión con:
   - Resumen de hallazgos clasificado por gravedad (Bloqueante, Mayor, Menor)
   - Reproducción mínima para cada fallo
   - Adjunta artefactos: capturas, HAR, logs, vídeo si aplica.

4. **Formato de salida global (`report.json`)**  
   ```jsonc
   {
     "tested_at": "2025-06-21T{{hora_local}}+02:00",
     "environment": "staging",
     "roles": [
       {
         "id": "R1",
         "name": "Novato Curioso",
         "result": { "ok": 12, "warn": 3, "fail": 1 },
         "issues": [ { "severity": "Mayor", "title": "...", "steps": [...] } ]
       },
       ...
     ]
   }
````

5. **Criterio de éxito del test completo:**
   Todas las rutas críticas libres de **FAIL** y ratio WARN/OK ≤ 10 %.

Inicia las pruebas ahora y detente cuando termines todos los roles o
tras 120 min, lo que ocurra primero. Cuando finalices, devuelve solo
el objeto `report.json`.

```

---

## 3. Cómo integrarlo

1. **Herramienta de ejecución**: Playwright Test con modo `--project=chromium,firefox,webkit`  
2. **Hook**: `npx playwright test --config=qa.config.ts --grep @human-test`  
3. **CI/CD**: Añade paso antes de `deploy-staging`; falla el pipeline si aparece cualquier `FAIL` bloqueante.  
4. **Artefactos**: Carga `report.json` + carpeta `screenshots/` como artefactos de la build.

5. **Prueba local rápida**:

   ```bash
   npx playwright test --config=qa.config.ts --grep @human-test
   ```

---

### ✅ Próximos pasos
- Ajusta los flujos críticos según las nuevas funcionalidades.  
- Crea datos seed específicos para pruebas de rendimiento.  
- Añade un sexto rol “Administrador” si la app ofrece capa back-office.

Con este set de roles y el prompt maestro tu agente de testing podrá comportarse como usuarios reales, descubrir errores incapaces de detectarse con pruebas puramente unitarias y entregar un informe listo para el equipo de desarrollo. ¡Listo para implementar!
```
