# Script de backup simples
$dataAtual = Get-Date -Format "yyyy-MM-dd_HH-mm"
$arquivoZip = "C:\backup_sistema_informatica_$dataAtual.zip"

Write-Host "Iniciando backup do sistema de informatica..."
Write-Host "Destino: $arquivoZip"

# Criar o arquivo ZIP
try {
    Compress-Archive -Path "C:\trea progrmas\sistema de informatica\*" -DestinationPath $arquivoZip -Force
    
    if (Test-Path $arquivoZip) {
        $tamanhoArquivo = (Get-Item $arquivoZip).Length / 1MB
        Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
        Write-Host "Arquivo: $arquivoZip" -ForegroundColor Green
        Write-Host "Tamanho: $([math]::Round($tamanhoArquivo, 2)) MB" -ForegroundColor Green
    } else {
        Write-Host "Erro ao criar o backup!" -ForegroundColor Red
    }
}
catch {
    Write-Host "Erro: $_" -ForegroundColor Red
}