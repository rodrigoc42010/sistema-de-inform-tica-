@echo off
echo Iniciando backup do sistema de informatica...

set DATA=%date:~6,4%-%date:~3,2%-%date:~0,2%
set HORA=%time:~0,2%-%time:~3,2%
set NOME_BACKUP=backup_sistema_informatica_%DATA%_%HORA%.zip
set DESTINO=C:\%NOME_BACKUP%

echo Criando backup em: %DESTINO%

powershell -Command "Compress-Archive -Path 'c:\trea progrmas\sistema de informatica\*' -DestinationPath '%DESTINO%' -Force"

if exist "%DESTINO%" (
    echo Backup concluido com sucesso!
    echo Arquivo: %DESTINO%
) else (
    echo Erro ao criar o backup!
)

pause