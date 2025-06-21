:: 1. Ir a la carpeta del backend (ajusta si usas otra ruta)
cd /d "%~dp0"

)

:: 2. Activar entorno virtual y arrancar servidor

call venv\Scripts\activate


echo Iniciando backend...
start "INTELIA Backend" cmd /k "python main.py"

timeout /t 5 > nul
start "" "http://localhost:5000/login.html"

exit
