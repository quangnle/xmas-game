#!/bin/bash
echo "Starting web server for Treasure Hunt Game..."
echo ""
echo "Game will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
python3 -m http.server 8000

