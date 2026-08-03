# Ambiente LOCAL de desenvolvimento (hot reload) do site do Marcelinho.
# NUNCA toca a producao (lojamarcelinho.com). Ver DESENVOLVIMENTO.md.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not (Test-Path "node_modules")) {
  Write-Host "Instalando ferramental de desenvolvimento (primeira vez)..." -ForegroundColor Cyan
  npm install
}

$branch = (git branch --show-current)
if ($branch -ne "dev") {
  Write-Host "Aviso: voce esta na branch '$branch'. O desenvolvimento deve ocorrer na branch 'dev'." -ForegroundColor Yellow
  Write-Host "Use: git checkout dev" -ForegroundColor Yellow
}

Write-Host "Iniciando ambiente local em http://localhost:8099 (hot reload)..." -ForegroundColor Green
npm run dev
