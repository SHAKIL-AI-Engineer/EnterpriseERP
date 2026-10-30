# Enable SQL Server Browser + TCP for Go services (ImportExport, PunchData).
# Run PowerShell as Administrator.
# Note: ImportExport also connects via the raw ADO connection string (Windows auth) when Browser/TCP are off.

$ErrorActionPreference = "Stop"

Write-Host "Setting SQL Server Browser to Manual + Starting..."
Set-Service SQLBrowser -StartupType Manual
Start-Service SQLBrowser

$regTcp = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp"
if (Test-Path $regTcp) {
    Set-ItemProperty -Path $regTcp -Name Enabled -Value 1
    Set-ItemProperty -Path "$regTcp\IPAll" -Name TcpDynamicPorts -Value ""
    Set-ItemProperty -Path "$regTcp\IPAll" -Name TcpPort -Value 1433
    Write-Host "TCP/IP enabled for SQLEXPRESS (port 1433). Restarting SQL Server..."
    Restart-Service "MSSQL`$SQLEXPRESS"
}

Write-Host "Done. Start ImportExport: cd backend\Services\ImportExportService; go run ./cmd/api"
