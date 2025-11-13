# Script de backup simplificado
$dataAtual = Get-Date -Format "yyyy-MM-dd_HH-mm"
$nomeProjeto = "sistema-informatica"
$arquivoZip = "C:\backup_$nomeProjeto`_$dataAtual.zip"
$diretorioAtual = "C:\trea progrmas\sistema de informatica"

Write-Host "Iniciando backup do projeto: $nomeProjeto" -ForegroundColor Cyan
Write-Host "Origem: $diretorioAtual" -ForegroundColor Cyan
Write-Host "Destino: $arquivoZip" -ForegroundColor Cyan

# Criar arquivo ZIP diretamente (sem diretório temporário)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal

# Criar um novo arquivo ZIP
$zip = [System.IO.Compression.ZipFile]::Open($arquivoZip, [System.IO.Compression.ZipArchiveMode]::Create)

# Função para adicionar arquivos ao ZIP (excluindo node_modules e outros diretórios grandes)
function Add-FolderToZip {
    param (
        [string]$folderPath,
        [System.IO.Compression.ZipArchive]$zipArchive,
        [string]$baseFolderPath
    )
    
    $excludeDirs = @("node_modules", ".git", "build", "dist", "uploads")
    
    $files = Get-ChildItem -Path $folderPath -File -Force
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($baseFolderPath.Length + 1)
        Write-Host "  Adicionando: $relativePath" -ForegroundColor Gray
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $file.FullName, $relativePath, $compressionLevel) | Out-Null
    }
    
    $folders = Get-ChildItem -Path $folderPath -Directory -Force
    foreach ($folder in $folders) {
        if ($excludeDirs -contains $folder.Name) {
            Write-Host "  Ignorando diretório: $($folder.Name)" -ForegroundColor Yellow
            continue
        }
        
        Add-FolderToZip -folderPath $folder.FullName -zipArchive $zipArchive -baseFolderPath $baseFolderPath
    }
}

try {
    Write-Host "Compactando arquivos..." -ForegroundColor Cyan
    Add-FolderToZip -folderPath $diretorioAtual -zipArchive $zip -baseFolderPath $diretorioAtual
}
finally {
    # Fechar o arquivo ZIP
    $zip.Dispose()
}

# Verificar se o arquivo ZIP foi criado com sucesso
if (Test-Path $arquivoZip) {
    $tamanhoArquivo = (Get-Item $arquivoZip).Length / 1MB
    Write-Host "Backup concluído com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $arquivoZip" -ForegroundColor Green
    Write-Host "Tamanho: $([math]::Round($tamanhoArquivo, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "Erro ao criar o arquivo de backup!" -ForegroundColor Red
}