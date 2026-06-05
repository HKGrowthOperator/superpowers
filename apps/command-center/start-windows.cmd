@echo off
REM Start the Command Center on a local static server using Docker.
REM Double-click this file. Requires Docker Desktop to be running.
cd /d "%~dp0"
echo.
echo   Command Center
echo   --------------
echo   Starte lokalen Webserver auf http://localhost:8080
echo   Ein Browser-Tab oeffnet sich. Falls leer: einmal F5 druecken.
echo.
echo   Lass DIESES Fenster offen, solange du die App nutzt. Schliessen = stoppen.
echo.
start "" http://localhost:8080
docker run --rm -p 8080:80 -v "%cd%:/usr/share/nginx/html:ro" nginx
