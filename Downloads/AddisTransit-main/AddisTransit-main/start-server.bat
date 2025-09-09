@echo off
echo Starting PHP Transit API Server...
echo.

:start
cd backend\php-api
php -S 0.0.0.0:3001 -t public
echo.
echo Server stopped. Restarting in 5 seconds...
timeout /t 5 /nobreak > nul
goto start
