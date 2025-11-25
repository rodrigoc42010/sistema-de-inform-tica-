@echo off
echo ===================================================
echo   ATUALIZACAO CORRETIVA - SISTEMA DE INFORMATICA
echo ===================================================
echo.
echo Este script vai enviar as correcoes de cadastro e login para o servidor (Render).
echo.
echo 1. Adicionando arquivos modificados...
git add .

echo.
echo 2. Criando pacote de atualizacao (Commit)...
git commit -m "Fix: Correcao critica no cadastro de tecnico e redirecionamento de dashboard"

echo.
echo 3. Enviando para o servidor (Push)...
echo    Isso pode levar alguns segundos. Aguarde...
git push

echo.
echo ===================================================
echo   ENVIADO COM SUCESSO!
echo ===================================================
echo.
echo O Render vai iniciar o processo de "Build" automaticamente.
echo Isso costuma levar de 2 a 5 minutos.
echo.
echo Acompanhe o status no painel do Render ou aguarde alguns minutos
echo antes de testar novamente no site oficial.
echo.
pause
