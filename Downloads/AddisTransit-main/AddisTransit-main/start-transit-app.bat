@echo off
title Transit App - PHP Server Monitor
echo ========================================
echo    TRANSIT APP - PHP SERVER MONITOR
echo ========================================
echo.

:start
echo [%date% %time%] Starting PHP Transit API Server...
cd backend\php-api
start "PHP Server" /min php -S 0.0.0.0:3001 -t public

echo [%date% %time%] PHP Server started on port 3001
echo [%date% %time%] Starting frontend development server...
cd ..\..
start "Frontend Server" /min npm run dev

echo.
echo ========================================
echo    BOTH SERVERS STARTED SUCCESSFULLY
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo API: http://localhost:3001
echo.
echo Press Ctrl+C to stop monitoring
echo.

:monitor
timeout /t 10 /nobreak > nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '[%date% %time%] API Server: OK' } catch { Write-Host '[%date% %time%] API Server: DOWN - Restarting...'; taskkill /F /IM php.exe 2>nul; cd backend\php-api; start php -S 0.0.0.0:3001 -t public }"
goto monitor
