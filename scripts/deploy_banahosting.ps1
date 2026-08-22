# ==============================================================================
# Script de Empaquetado y Deploy para BanaHosting (cPanel / LiteSpeed)
# Makerdu v2.6
# ==============================================================================

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO PREPARACIÓN DE DEPLOY PARA BANAHOSTING (cPanel)" -ForegroundColor Cyan
Write-Host "================================================================`n"

$baseDir = "C:\laragon\www\makerdu"
Set-Location $baseDir

# 1. Compilar Frontend en modo Producción
Write-Host "Paso 1: Compilando assets de producción con Vite (npm run build)..." -ForegroundColor Yellow
npm.cmd run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Falló la compilación de Vite." -ForegroundColor Red
    exit 1
}
Write-Host "  [✓] Assets compilados correctamente en public/build/`n" -ForegroundColor Green

# 2. Empaquetar con PHP ZipArchive
Write-Host "Paso 2: Generando archivo dist/makerdu_deploy_cpanel.zip..." -ForegroundColor Yellow
$env:Path = "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64;C:\laragon\bin\composer;" + $env:Path
php "$baseDir\scripts\create_cpanel_bundle.php"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  🎉 PAQUETE LISTO EN: C:\laragon\www\makerdu\dist\makerdu_deploy_cpanel.zip" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan