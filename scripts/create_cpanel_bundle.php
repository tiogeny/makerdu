<?php
$baseDir = realpath(__DIR__ . '/..');
$distDir = $baseDir . '/dist';

if (!is_dir($distDir)) {
    mkdir($distDir, 0777, true);
}

$zipPath = $distDir . '/makerdu_deploy_cpanel.zip';
if (file_exists($zipPath)) {
    unlink($zipPath);
}

$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    die("No se pudo crear el archivo ZIP.\n");
}

$excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    '.vscode',
    'tests',
    'scratch'
];

echo "Iniciando empaquetado de Makerdu v2.6 para cPanel...\n";

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

$fileCount = 0;
foreach ($iterator as $item) {
    $subPath = str_replace('\\', '/', substr($item->getPathname(), strlen($baseDir) + 1));

    // Excluir carpetas no deseadas
    $skip = false;
    foreach ($excludeDirs as $ex) {
        if (str_starts_with($subPath, $ex . '/') || $subPath === $ex) {
            $skip = true;
            break;
        }
    }

    if ($skip) {
        continue;
    }

    if ($item->isDir()) {
        $zip->addEmptyDir($subPath);
    } elseif ($item->isFile()) {
        $zip->addFile($item->getPathname(), $subPath);
        $fileCount++;
    }
}

$zip->close();
$sizeMb = round(filesize($zipPath) / (1024 * 1024), 2);

echo "\n===============================================================\n";
echo " 🎉 ¡PAQUETE PARA BANAHOSTING GENERADO CON ÉXITO!\n";
echo " Archivo: dist/makerdu_deploy_cpanel.zip ({$sizeMb} MB)\n";
echo " Archivos incluidos: {$fileCount} archivos\n";
echo "===============================================================\n";