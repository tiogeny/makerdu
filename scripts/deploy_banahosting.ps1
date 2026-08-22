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

# 2. Crear carpeta dist para el paquete
$distDir = "$baseDir\dist"
if (!(Test-Path $distDir)) {
    New-Item -ItemType Directory -Force -Path $distDir | Out-Null
}

$zipOutput = "$distDir\makerdu_deploy_cpanel.zip"
if (Test-Path $zipOutput) {
    Remove-Item -Force $zipOutput
}

# 3. Empaquetar archivos necesarios (excluyendo node_modules y .git)
Write-Host "Paso 2: Empaquetando código para cPanel en $zipOutput..." -ForegroundColor Yellow

$excludePatterns = @(
    "node_modules",
    ".git",
    "dist",
    "storage\app\public\batches\*.zip",
    "storage\app\public\batches\*.pdf"
)

# Usar PowerShell Compress-Archive o ZipArchive
Add-Type -AssemblyName System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal

$zip = [System.IO.Compression.ZipFile]::Open($zipOutput, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $baseDir -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($baseDir.Length + 1)
    $skip = $false
    foreach ($ex in $excludePatterns) {
        if ($rel -like "$ex*" -or $rel -like "*\$ex*") {
            $skip = $true
            break
        }
    }
    !$skip
}

$count = 0
foreach ($file in $files) {
    $relPath = $file.FullName.Substring($baseDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relPath, $compressionLevel) | Out-Null
    $count++
}
$zip.Dispose()

Write-Host "  [✓] $count archivos empaquetados en makerdu_deploy_cpanel.zip`n" -ForegroundColor Green

# 4. Generar instrucciones claras
$instructions = @"
==============================================================================
   INSTRUCCIONES DE INSTALACIÓN EN BANAHOSTING (cPanel)
==============================================================================

1. Subir makerdu_deploy_cpanel.zip a tu cPanel (Administrador de Archivos).
2. Descomprimir en una carpeta (ej: /home/tu_usuario/makerdu/).
3. Configurar tu dominio / subdominio para que apunte a la carpeta 'public':
   Document Root: /home/tu_usuario/makerdu/public
4. En cPanel -> MySQL Database:
   - Crear una base de datos y usuario MySQL.
   - Copiar el archivo .env.example como .env y colocar tus credenciales MySQL y tu GEMINI_API_KEY.
5. En cPanel -> Terminal (o vía SSH):
   cd /home/tu_usuario/makerdu
   php artisan key:generate
   php artisan migrate --force --seed
   php artisan storage:link
6. ¡Listo! Tu plataforma Makerdu v2.6 estará 100% online y operativa en tu dominio.
==============================================================================
"@

[System.IO.File]::WriteAllText("$distDir\INSTRUCCIONES_BANAHOSTING.txt", $instructions, [System.Text.UTF8Encoding]::new($false))

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🎉 DEPLOY LISTO: $zipOutput" -ForegroundColor Green
Write-Host "  Lee dist\INSTRUCCIONES_BANAHOSTING.txt para subirlo a tu cPanel." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
