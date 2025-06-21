@echo off
REM === CONFIGURA TUS DATOS AQUÍ ===
set "PROJECT_DIR=C:\Users\Marc\Desktop\INTELIA LIMPIO 02"
set "REMOTE_URL=https://github.com/MarcValls/vamosintelia.git"

REM === NO TOCAR DE AQUÍ HACIA ABAJO ===
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git no encontrado. Instalando con winget...
    winget install --id Git.Git -e
    echo Cierra y vuelve a ejecutar este script tras finalizar la instalacion.
    pause
    exit /b
)

cd "%PROJECT_DIR%" || (
    echo La ruta %PROJECT_DIR% no existe. Edita el script y corrígela.
    pause
    exit /b
)

git config --global user.name  "MarcValls"
git config --global user.email "marcvallssanvictor@gmail.com"

git init
git add .
git commit -m "Primer commit: carga inicial del proyecto"

git branch -M main
git remote add origin "%REMOTE_URL%"

git push -u origin main
echo ---
echo ¡Proyecto subido correctamente!
pause
