@echo off
REM Start the AI Intelligence Dashboard on a local static server using Docker.
REM Double-click this file. Requires Docker Desktop to be running.
cd /d "%~dp0"
echo.
echo   AI Intelligence Dashboard
echo   -------------------------
echo   Starting a local web server on http://localhost:8080
echo   A browser tab will open. If it is blank, just refresh once.
echo.
echo   Leave THIS window open while you use the app. Close it to stop.
echo.
start "" http://localhost:8080
docker run --rm -p 8080:80 -v "%cd%:/usr/share/nginx/html:ro" nginx
