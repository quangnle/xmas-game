@echo off
echo Starting API server for Treasure Hunt Game...
echo.
echo API server will be available at: http://localhost:3000
echo Socket.io ready for connections
echo Press Ctrl+C to stop the server
echo.
cd server
node src/server.js
pause

