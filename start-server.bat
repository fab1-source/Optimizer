@echo off
TITLE 2D Glass Cutting Stock Optimizer - Company Central Server
COLOR 0B

echo ===============================================================================
echo     2D GLASS CUTTING STOCK OPTIMIZER - COMPANY SERVER LAUNCHER
echo ===============================================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18 or 20 from https://nodejs.org/ and run this script again.
    echo.
    pause
    exit /b 1
)

node -v
echo.

if not exist node_modules (
    echo [STEP 1/3] Installing dependencies for first-time run...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies already installed.
)

echo.
echo [STEP 2/3] Building application bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Build returned non-zero code, starting dev server mode instead...
    echo.
    echo [STEP 3/3] Starting company server on port 3000...
    call npm run dev
    pause
    exit /b 0
)

echo.
echo [STEP 3/3] Starting centralized server on Port 3000...
echo ===============================================================================
echo   SERVER IS RUNNING!
echo   Central database: ./data/jobs.json
echo.
echo   To access from other PCs on your local company network:
echo     1. Ensure Windows Defender Firewall allows port 3000
echo     2. Open your browser on PC 1, PC 2, PC 3, or PC 4 and navigate to:
echo        http://%COMPUTERNAME%:3000
echo        or use this server's LAN IP address shown below.
echo ===============================================================================
echo.

call npm start

pause
