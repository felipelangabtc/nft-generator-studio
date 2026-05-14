@echo off
title NFT Generator Studio (Dev Mode)
cd /d "%~dp0"

echo Starting NFT Generator Studio in development mode...
echo The Electron window will open shortly.
echo.

call npm run dev
pause
