@echo off
echo Starting API server for Treasure Hunt Game...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP:~1%

echo API server will be available at:
echo   - Local: http://localhost:3000
if defined LOCAL_IP (
    echo   - Network: http://%LOCAL_IP%:3000
)
echo.
echo For other devices to connect:
echo   1. Make sure they are on the same network
echo   2. Open the game in browser: http://YOUR_IP:8000
echo   3. Or use query parameter: http://YOUR_IP:8000?server=http://%LOCAL_IP%:3000
echo.
echo Socket.io ready for connections
echo Press Ctrl+C to stop the server
echo.
cd server
node src/server.js
pause

