@echo off
REM Quick Docker status checker

echo.
echo ========================================
echo Docker Container Status
echo ========================================
echo.

docker-compose ps

echo.
echo ========================================
echo Container Health Status
echo ========================================
echo.

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ========================================
echo Quick Commands:
echo ========================================
echo - View logs: docker-compose logs -f
echo - Restart: restart-docker.bat
echo - Stop: docker-compose down
echo.
