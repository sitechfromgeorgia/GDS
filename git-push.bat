@echo off
echo ===================================
echo Git Push Helper Script
echo ===================================
echo.

echo Step 1: Adding all changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo SUCCESS: Files added
echo.

echo Step 2: Committing changes...
git commit -m "refactor: Enhance environment variable loading and UI improvements"
if %errorlevel% neq 0 (
    echo ERROR: Failed to commit
    pause
    exit /b 1
)
echo SUCCESS: Changes committed
echo.

echo Step 3: Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERROR: Failed to push
    pause
    exit /b 1
)
echo SUCCESS: Pushed to GitHub!
echo.

echo ===================================
echo All done! Changes uploaded to GitHub
echo ===================================
pause
