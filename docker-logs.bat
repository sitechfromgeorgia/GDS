@echo off
REM View Docker container logs

echo.
echo ========================================
echo Docker Container Logs
echo ========================================
echo.
echo Press Ctrl+C to exit
echo.

docker-compose logs -f --tail=100
