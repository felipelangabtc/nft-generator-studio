@echo off
title NFT Generator Studio
cd /d "%~dp0"

echo ============================================
echo    NFT Generator Studio - Launcher
echo ============================================
echo.

:check_deps
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install --loglevel=error
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        echo.  
        echo Make sure you have Node.js installed from: https://nodejs.org
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
)

:start_app
echo [INFO] Starting NFT Generator Studio...
echo [INFO] The application window will open automatically.
echo [INFO] Press Ctrl+C in this window to stop the application.
echo.
start "" http://localhost:5173
call npm run dev

if %errorlevel% neq 0 (
    echo [ERROR] Application failed to start.
    pause
    exit /b 1
)

pause
