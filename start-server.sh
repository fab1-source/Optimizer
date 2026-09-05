#!/usr/bin/env bash
set -e

echo "==============================================================================="
echo "    2D GLASS CUTTING STOCK OPTIMIZER - COMPANY SERVER LAUNCHER"
echo "==============================================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 18 or 20 (e.g. sudo apt install nodejs npm) and retry."
    exit 1
fi

echo "Node version: $(node -v)"
echo "NPM version:  $(npm -v)"
echo ""

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "[STEP 1/3] Installing dependencies..."
    npm install
else
    echo "[INFO] node_modules already installed."
fi

# Build project
echo ""
echo "[STEP 2/3] Building production assets..."
npm run build || {
    echo "[WARNING] Build failed, starting development mode directly..."
    npm run dev
    exit 0
}

# Start production server
echo ""
echo "[STEP 3/3] Starting company server on port 3000..."
echo "==============================================================================="
echo "  SERVER IS RUNNING!"
echo "  Central database: ./data/jobs.json"
echo ""
echo "  To access from any of your 4 PCs on the local network (LAN):"
echo "  Find this server's IP address (run 'ip a' or 'ifconfig') and navigate to:"
echo "  http://<SERVER-IP>:3000"
echo "==============================================================================="
echo ""

npm start
