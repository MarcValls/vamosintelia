// trabajo_individual.js

// 1. Leer parámetros de la URL
function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    semana: params.get('semana') || '',
    fecha: params.get('fecha') || '',
    hora: params.get('hora') || '',
    matricula: params.get('matricula') || ''
  };
}

window.addEventListener('load', function() {
  const { semana, fecha, hora, matricula } = getQueryParams();

  // 2. Recuperar el presupuesto final de localStorage
  const clavePresuFinal = `presupuestoFinal_semana${semana}_${fecha}_${hora}_${matricula}`;
  const presuJSON = localStorage.getItem(clavePresuFinal);
  if (!presuJSON) {
    document.getElementById('msgTrabajo').textContent =
      'Error: no se encontró el presupuesto para este trabajo.';
    return;
  }
  const presu = JSON.parse(presuJSON);

  // 3. Rellenar inputs generales (para que se puedan editar si se desea)
  document.getElementById('trabClienteInput').value    = presu.cliente;
  document.getElementById('trabVehiculoInput').value   = presu.vehiculo;
  document.getElementById('trabMatriculaInput').value  = presu.matricula;
  document.getElementById('trabFechaInput').value      = presu.fechaCita;
  document.getElementById('trabHoraInput').value       = presu.horaCita;

  // 4. Listar tareas (presu.detalles) con checkboxes
  const listaTareasDiv = document.getElementById('listaTareas');
  presu.detalles.forEach((item, idx) => {
    const divItem = document.createElement('div');
    divItem.style.marginBottom = '0.5rem';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `tarea_${idx}`;
    checkbox.dataset.idx = idx;
    checkbox.onchange = validarTareasMarcadas;

    const label = document.createElement('label');
    label.htmlFor = `tarea_${idx}`;
    label.textContent = ` ${item.concepto} (x${item.cantidad}) – €${item.precioUnitario.toFixed(2)}`;

    divItem.appendChild(checkbox);
    divItem.appendChild(label);
    listaTareasDiv.appendChild(divItem);
  });

  // 5. Marcar cita como “en ejecución”
  const claveEjecucion = `trabajo_ejecucion_semana${semana}_${fecha}_${hora}_${matricula}`;
  localStorage.setItem(claveEjecucion, 'true');

  // 6. Registrar listener en “Finalizar Trabajo”
  document.getElementById('btnFinalizarTrabajo').addEventListener('click', function() {
    finalizarTrabajo(semana, fecha, hora, matricula);
  });
});

// 7. Habilita “Finalizar Trabajo” solo si todos los checkboxes están marcados
function validarTareasMarcadas() {
  const checkboxes = document.querySelectorAll('#listaTareas input[type="checkbox"]');
  const todosMarcados = Array.from(checkboxes).every(chk => chk.checked);
  document.getElementById('btnFinalizarTrabajo').disabled = !todosMarcados;
}

function finalizarTrabajo(semana, fecha, hora, matricula) {
  // 8. Marcar “trabajo_finalizado_*”
  const claveFinalizado = `trabajo_finalizado_semana${semana}_${fecha}_${hora}_${matricula}`;
  localStorage.setItem(claveFinalizado, 'true');

  // 9. Eliminar “trabajo_ejecucion_*”
  const claveEjecucion = `trabajo_ejecucion_semana${semana}_${fecha}_${hora}_${matricula}`;
  localStorage.removeItem(claveEjecucion);

  // 10. Generar la factura (PDF o HTML)
  generarFactura(semana, fecha, hora, matricula);

  // 11. Regresar a “Trabajos Pendientes”
  window.location.href = 'visor_trabajos.html';
}

// 12. Generar factura (PDF o HTML, similar al ejemplo anterior)
function generarFactura(semana, fecha, hora, matricula) {
  const clavePresuFinal = `presupuestoFinal_semana${semana}_${fecha}_${hora}_${matricula}`;
  const presuJSON = localStorage.getItem(clavePresuFinal);
  if (!presuJSON) {
    alert('Error: no se encontró el presupuesto para generar factura.');
    return;
  }
  const presu = JSON.parse(presuJSON);

  // Crear número de factura
  const numeroFactura = `FAC-${Date.now()}-${matricula}`;  
  // Generar HTML de la factura
  const fechaEmision = new Date().toLocaleDateString();
  const detalles = presu.detalles;
  let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura ${numeroFactura}</title>
      <link rel="stylesheet" href="../assets/intelia_manager.css">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .encabezado { text-align: center; margin-bottom: 20px; }
        .detalle, .totales { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .detalle th, .detalle td { border: 1px solid #ccc; padding: 8px; }
        .totales td { padding: 8px; }
        .firma { margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="encabezado">
        <h1>Factura de Reparación</h1>
        <p>Factura N.º: ${numeroFactura} — Fecha: ${fechaEmision}</p>
      </div>
      <p><strong>Cliente:</strong> ${presu.cliente}</p>
      <p><strong>Vehículo:</strong> ${presu.vehiculo} (${presu.matricula})</p>
      <p><strong>Fecha Trabajo:</strong> ${presu.fechaCita} ${presu.horaCita}</p>

      <table class="detalle">
        <thead>
          <tr>
            <th>#</th>
            <th>Concepto</th>
            <th>Cantidad</th>
            <th>Precio Unitario (€)</th>
            <th>Subtotal (€)</th>
          </tr>
        </thead>
        <tbody>
  `;

  let yTotal = 0;
  detalles.forEach((item, idx) => {
    const subtotal = item.cantidad * item.precioUnitario;
    yTotal += subtotal;
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.concepto}</td>
        <td style="text-align: center;">${item.cantidad}</td>
        <td style="text-align: right;">${item.precioUnitario.toFixed(2)}</td>
        <td style="text-align: right;">${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });

  const totalConIva = yTotal * 1.21; // IVA 21%
  html += `
        </tbody>
      </table>

      <table class="totales">
        <tr>
          <td><strong>Total a Pagar (€):</strong></td>
          <td style="text-align: right;"><strong>${totalConIva.toFixed(2)}</strong></td>
        </tr>
      </table>

      <div class="firma">
        <p>Firma del Cliente: ____________________________</p>
      </div>
    </body>
    </html>
  `;

  // Guardar la factura en localStorage
  const claveFacturaHTML = `facturaHTML_${numeroFactura}`;
  localStorage.setItem(claveFacturaHTML, html);

  // Descargarla como archivo .html
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${numeroFactura}.html`;
  a.click();
  URL.revokeObjectURL(a.href);

  alert(`Factura generada: ${numeroFactura}.html`);
}


function finalizarTrabajo() {
  const params = new URLSearchParams(window.location.search);
  const semana    = params.get('semana');
  const fecha     = params.get('fecha');
  const hora      = params.get('hora');
  const matricula = params.get('matricula');
  const claveBase = `semana${semana}_${fecha}_${hora}_${matricula}`;

  // Marcar como en ejecución y luego finalizado
  localStorage.setItem(`trabajo_ejecucion_${claveBase}`, 'true');
  localStorage.setItem(`trabajo_finalizado_${claveBase}`, 'true');

  // Construir datos de la factura real (recoger de formularios)
  const datosFactura = {
    numero: `FAC-${Date.now()}-${matricula}`,
    fecha: new Date().toISOString().split('T')[0],
    cliente: {
      nombre: document.getElementById('inputCliente').value,
      direccion: document.getElementById('inputDireccion').value,
      nif: document.getElementById('inputNIF').value
    },
    vehiculo: {
      modelo: document.getElementById('inputModelo').value,
      matricula: matricula
    },
    conceptos: obtenerConceptosDelFormulario(), // función que recorre filas de la tabla
    iva: 21
  };
  // Calcular totales
  datosFactura.totalSinIVA = datosFactura.conceptos.reduce((sum, c) => sum + c.cantidad * c.precioUnitario, 0);
  datosFactura.totalConIVA = datosFactura.totalSinIVA * (1 + datosFactura.iva / 100);

  // Construir HTML de la factura
  const htmlFacturaReal = construirHTMLFactura(datosFactura);
  localStorage.setItem(`facturaHTML_${datosFactura.numero}`, htmlFacturaReal);

  // Descargar la factura HTML
  const blob = new Blob([htmlFacturaReal], { type: "text/html" });
  const urlBlob = URL.createObjectURL(blob);
  const descarga = document.createElement("a");
  descarga.href = urlBlob;
  descarga.download = `${datosFactura.numero}.html`;
  descarga.click();
  URL.revokeObjectURL(urlBlob);

  // Redirigir de vuelta
  window.location.href = `visor_trabajos.html`;
}

const btnFinalizarTrabajo = document.getElementById('btnFinalizarTrabajo');
if (btnFinalizarTrabajo) btnFinalizarTrabajo.addEventListener('click', finalizarTrabajo);
