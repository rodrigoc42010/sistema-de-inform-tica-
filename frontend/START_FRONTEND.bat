@echo off
echo ========================================
echo   Iniciando Frontend - Sistema de TI
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Iniciando servidor de desenvolvimento...
echo.
echo O navegador abrira automaticamente em http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm start

pause
