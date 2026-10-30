# Start CuttingService (:5044) without restarting Platform.Host.
# Usage: powershell -File backend/Infrastructure/Scripts/start-cutting.ps1

$ErrorActionPreference = "Stop"

function Wait-HttpOk {
    param([string]$Url, [int]$MaxSeconds = 90, [string]$Label = "service")
    $deadline = (Get-Date).AddSeconds($MaxSeconds)
    Write-Host "Waiting for $Label at $Url ..."
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
                Write-Host "  OK: $Label is up."
                return $true
            }
        }
        catch { }
        Start-Sleep -Seconds 2
    }
    Write-Warning "$Label did not respond at $Url within ${MaxSeconds}s."
    return $false
}

if (-not $PSScriptRoot) {
    $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"
$cuttingDir = Join-Path $BackendRoot "Services\CuttingService\CuttingService.API"
$cuttingProj = Join-Path $cuttingDir "CuttingService.API.csproj"

$existing = Get-NetTCPConnection -LocalPort 5044 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
    Write-Host "CuttingService already listening on port 5044 (PID $($existing.OwningProcess))."
}
else {
    Write-Host "Building CuttingService (Release)..."
    dotnet build $cuttingProj -c Release -v q
    Write-Host "Starting CuttingService on port 5044 ..."
    $cmd = "cd `"$cuttingDir`"; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'; dotnet run --project `"$cuttingProj`" -c Release --no-build"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cmd) | Out-Null
    Wait-HttpOk -Url "http://127.0.0.1:5044/health" -Label "CuttingService" | Out-Null
}

Write-Host "Gateway check (Platform.Host must be on :5000):"
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/v1/cutting-plans?companyId=20000000-0000-0000-0000-000000000001" -UseBasicParsing -TimeoutSec 10
    Write-Host "  cutting-plans -> HTTP $($r.StatusCode)"
}
catch {
    Write-Warning "  cutting-plans failed: $($_.Exception.Message)"
}
Write-Host "Done."
