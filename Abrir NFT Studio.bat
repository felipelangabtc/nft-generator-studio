@echo off
title NFT Generator Studio
cd /d "%~dp0"

echo ============================================
echo    NFT Generator Studio
echo    Iniciando...
echo ============================================

if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install --loglevel=error
)

echo Iniciando aplicacao...
start "" http://localhost:5173
npm run dev
