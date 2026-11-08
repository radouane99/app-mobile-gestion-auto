# Script de nettoyage automatique du projet AutoCarnet
Write-Host "Nettoyage des fichiers temporaires en cours..." -ForegroundColor Cyan

# 1. Dossiers de tests temporaires dans build
$testDirs = Get-ChildItem build -Directory -ErrorAction SilentlyContinue | Where-Object { 
    $_.Name -match '^(auto-backup|parking-backup|pocket-|resale-test|road-test|road-restored|safe-import|store-test)' 
}
if ($testDirs) {
    $testDirs | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Suppression de $($testDirs.Count) dossiers temporaires dans build/." -ForegroundColor Green
}

# 2. Fichiers caches et temporaires dans tmp
if (Test-Path tmp) {
    Get-ChildItem tmp -Filter "*.pyc" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
}

# 3. Cache __pycache__
Get-ChildItem -Filter "__pycache__" -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

Write-Host "Nettoyage terminé avec succès !" -ForegroundColor Green

