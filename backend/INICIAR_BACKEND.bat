@echo off
echo ========================================
echo  Iniciando Backend - Sistema de Informatica
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando pacotes npm...
if not exist "node_modules\axios" (
    echo.
    echo Pacotes nao encontrados! Instalando...
    call npm install axios node-cache express-async-handler
    echo.
)

echo [2/3] Verificando arquivo .env...
if not exist ".env" (
    echo.
    echo Criando arquivo .env...
    echo GOOGLE_MAPS_API_KEY=AIzaSyAyj0qK-Dl-vjLtepAWGDdPWuPNpOzdbNw > .env
    echo Arquivo .env criado!
    echo.
)

echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo  Backend iniciando na porta 5001
echo  Mantenha esta janela aberta!
echo ========================================
echo.

call npm start

pause
