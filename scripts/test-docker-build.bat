@echo off
REM Georgian Distribution Management - Docker Build Test Script
REM This script tests the Docker build locally before deploying to Dockploy

echo ========================================
echo Docker Build Test Script
echo Georgian Distribution Management System
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check for required environment variables
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo [WARNING] NEXT_PUBLIC_SUPABASE_URL not set
    echo Using default: https://data.greenland77.ge
    set NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
) else (
    echo [OK] NEXT_PUBLIC_SUPABASE_URL: %NEXT_PUBLIC_SUPABASE_URL%
)

if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY not set!
    echo.
    echo Please set your Supabase anonymous key:
    echo set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
    echo.
    echo Then run this script again.
    pause
    exit /b 1
) else (
    echo [OK] NEXT_PUBLIC_SUPABASE_ANON_KEY: ***************
)

if "%NEXT_PUBLIC_APP_URL%"=="" (
    echo [WARNING] NEXT_PUBLIC_APP_URL not set
    echo Using default: http://localhost:3000
    set NEXT_PUBLIC_APP_URL=http://localhost:3000
) else (
    echo [OK] NEXT_PUBLIC_APP_URL: %NEXT_PUBLIC_APP_URL%
)

echo.
echo ========================================
echo Step 1: Building Docker Image
echo ========================================
echo This may take 10-15 minutes on first build...
echo.

docker-compose build ^
    --build-arg NODE_ENV=production ^
    --build-arg NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% ^
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% ^
    --build-arg NEXT_PUBLIC_APP_URL=%NEXT_PUBLIC_APP_URL%

if errorlevel 1 (
    echo.
    echo [ERROR] Docker build failed!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo [OK] Build completed successfully!
echo.

echo ========================================
echo Step 2: Starting Container
echo ========================================
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start container!
    pause
    exit /b 1
)

echo [OK] Container started
echo.

echo ========================================
echo Step 3: Waiting for Application Startup
echo ========================================
echo Waiting 60 seconds for health check grace period...
echo.

timeout /t 60 /nobreak >nul

echo ========================================
echo Step 4: Testing Health Endpoint
echo ========================================
echo.

REM Try to reach health endpoint
curl -f http://localhost:3000/api/health/liveness

if errorlevel 1 (
    echo.
    echo [WARNING] Health check failed or curl not available
    echo.
    echo Manual check: Open browser and go to:
    echo http://localhost:3000/api/health/liveness
    echo.
) else (
    echo.
    echo [OK] Health check passed!
)

echo.
echo ========================================
echo Step 5: Checking Container Status
echo ========================================
echo.

docker-compose ps

echo.
echo ========================================
echo Step 6: Recent Container Logs
echo ========================================
echo.

docker-compose logs --tail=50 frontend

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Your application should now be running at:
echo http://localhost:3000
echo.
echo To view live logs:
echo   docker-compose logs -f frontend
echo.
echo To stop the container:
echo   docker-compose down
echo.
echo To stop and remove volumes:
echo   docker-compose down -v
echo.
pause
