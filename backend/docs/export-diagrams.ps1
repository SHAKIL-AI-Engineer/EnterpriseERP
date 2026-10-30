# Zip all diagram files for download/share.
# Usage: powershell -File backend\docs\export-diagrams.ps1

$ErrorActionPreference = "Stop"
$Docs = $PSScriptRoot
$OutZip = Join-Path $Docs "EnterpriseERP-Diagrams.zip"

$Files = @(
    (Join-Path $Docs "enterprise-erp-diagrams.md"),
    (Join-Path $Docs "diagrams-viewer.html"),
    (Join-Path $Docs "export-diagrams.ps1")
) + (Get-ChildItem (Join-Path $Docs "diagrams") -Filter "*.mmd" | ForEach-Object { $_.FullName })

if (Test-Path $OutZip) { Remove-Item $OutZip -Force }

Compress-Archive -Path $Files -DestinationPath $OutZip -CompressionLevel Optimal
Write-Host "Created: $OutZip"
Write-Host "Open diagrams-viewer.html in a browser, then Print -> Save as PDF for all charts."
