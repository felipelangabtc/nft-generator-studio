@echo off
title NFT Generator Studio - Build Installer
cd /d "%~dp0"

echo ============================================
echo    Building Windows Installer
echo ============================================
echo.

if not exist "node_modules\" (
    echo [INFO] Installing dependencies first...
    call npm install --loglevel=error
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo [INFO] Step 1/3: Building Vite application...
call npx vite build
if %errorlevel% neq 0 (
    echo [ERROR] Vite build failed.
    pause
    exit /b 1
)

echo [INFO] Step 2/3: Building Electron main process...
call npx vite build --config vite.config.ts --mode production
if %errorlevel% neq 0 (
    echo [ERROR] Electron build failed.
    pause
    exit /b 1
)

echo [INFO] Step 3/3: Creating Windows installer...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo [ERROR] Installer creation failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    SUCCESS! Installer created in:
echo    %~dp0release\
echo ============================================
echo.
echo You can now distribute the .exe installer.
pause
