@echo off
REM Georgian Distribution Management - Docker Restart Script
REM Stops, rebuilds, and restarts Docker containers with new configuration

echo.
echo ========================================
echo Georgian Distribution Management
echo Docker Restart Script
echo ========================================
echo.

echo [1/4] Stopping existing containers...
docker-compose down
if %errorlevel% neq 0 (
    echo WARNING: docker-compose down failed or no containers were running
)
echo.

echo [2/4] Cleaning up old images (optional)...
docker system prune -f
echo.

echo [3/4] Building new image with Node 22...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Starting containers with health checks...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Container startup failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Containers are starting...
echo ========================================
echo.
echo Wait 40 seconds for health checks to begin...
echo.
echo Monitor status with: docker-compose ps
echo View logs with: docker-compose logs -f
echo.
echo Health Check Details:
echo - Endpoint: http://localhost:3000/api/health
echo - Interval: 30s
echo - Timeout: 10s
echo - Retries: 3
echo.
echo Resource Limits:
echo - CPU: 2.0 cores max, 0.5 cores min
echo - Memory: 2GB max, 512MB min
echo.

REM Wait and check status
timeout /t 5 /nobreak > nul
docker-compose ps

echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause > nul
docker-compose logs -f
