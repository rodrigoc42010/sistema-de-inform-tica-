$ErrorActionPreference = 'Stop'

# Caminhos
$src = (Resolve-Path "$PSScriptRoot\..").Path
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$dstRoot = "C:\trea progrmas\backups"

# Preparar diretórios
if (!(Test-Path $dstRoot)) { New-Item -ItemType Directory -Path $dstRoot | Out-Null }
$projectName = Split-Path $src -Leaf
$dst = Join-Path $dstRoot ("$projectName" + "_" + $timestamp)
if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst | Out-Null }

Write-Host "[backup] Copiando de $src para $dst"

# Executar cópia (evita recursão e melhora robustez)
$robolog = Join-Path $dst "robocopy.log"
$null = robocopy $src $dst /E /Z /R:2 /W:2 /XD "$dstRoot" /NFL /NDL /NP /MT:8 /XJ /COPY:DAT /DCOPY:DAT | Tee-Object -FilePath $robolog
$code = $LASTEXITCODE

if ($code -ge 8) {
  Write-Error "[backup] Robocopy falhou com código $code"
  exit $code
} else {
  Write-Host "[backup] Concluído em: $dst"
  exit 0
}