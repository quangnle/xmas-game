@echo off
cd /d "%~dp0"
echo Starting web server for Treasure Hunt Game...
echo.

REM Check if index.html exists
if not exist index.html (
    echo ERROR: index.html not found in current directory!
    echo Please make sure you run this file from the project root.
    pause
    exit /b 1
)

REM Kill any existing processes on port 8000
echo Checking for existing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo Current directory: %CD%
echo Game will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

REM Check if http-server is installed globally
where http-server >nul 2>&1
if errorlevel 1 (
    echo http-server not found. Installing globally...
    npm install -g http-server
    if errorlevel 1 (
        echo ERROR: Failed to install http-server. Please install manually: npm install -g http-server
        pause
        exit /b 1
    )
)

REM Start http-server with CORS enabled and no caching
http-server -p 8000 -c-1 --cors
pause

