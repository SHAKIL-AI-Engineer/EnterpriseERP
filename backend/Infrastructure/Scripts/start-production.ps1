# Starts production microservices behind Platform.Host (YARP on :5000).
# Usage: powershell -File backend/Infrastructure/Scripts/start-production.ps1
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Wait-HttpOk {
    param(
        [string]$Url,
        [int]$MaxSeconds = 90,
        [string]$Label = "service"
    )
    $deadline = (Get-Date).AddSeconds($MaxSeconds)
    Write-Host "Waiting for $Label at $Url (up to ${MaxSeconds}s)..."
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
                Write-Host "  OK: $Label is up."
                return $true
            }
        }
        catch {
            # still starting
        }
        Start-Sleep -Seconds 2
    }
    Write-Warning "$Label did not respond at $Url within ${MaxSeconds}s."
    return $false
}

if (-not $PSScriptRoot) {
    $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Sln = Join-Path $BackendRoot "EnterpriseERP.slnx"
$centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"

Set-Location $BackendRoot

if (-not $SkipBuild) {
    Write-Host "Building production services (Release)..."
    dotnet build $Sln -c Release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Start-ProductionService {
    param(
        [string]$Label,
        [string]$ProjectDir,
        [string]$ProjectFile,
        [int]$Port
    )

    $existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "$Label already listening on port $Port (PID: $($existing.OwningProcess))."
        return
    }

    Write-Host "Starting $Label on http://127.0.0.1:$Port ..."
    $cmd = "cd `"$ProjectDir`""
    if (Test-Path $centralConn) {
        $cmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
    }
    $runFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
    $cmd += "; dotnet run --project `"$ProjectFile`"$runFlags --urls http://127.0.0.1:$Port"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cmd) | Out-Null
    Wait-HttpOk -Url "http://127.0.0.1:$Port/health" -MaxSeconds 90 -Label $Label
}

Start-ProductionService `
    -Label "ProductionPlanningService" `
    -ProjectDir (Join-Path $BackendRoot "Services\ProductionPlanningService\ProductionPlanningService.API") `
    -ProjectFile (Join-Path $BackendRoot "Services\ProductionPlanningService\ProductionPlanningService.API\ProductionPlanningService.API.csproj") `
    -Port 5043

Start-ProductionService `
    -Label "SewingService" `
    -ProjectDir (Join-Path $BackendRoot "Services\SewingService\SewingService.API") `
    -ProjectFile (Join-Path $BackendRoot "Services\SewingService\SewingService.API\SewingService.API.csproj") `
    -Port 5130

Start-ProductionService `
    -Label "ShipmentService" `
    -ProjectDir (Join-Path $BackendRoot "Services\ShipmentService\ShipmentService.API") `
    -ProjectFile (Join-Path $BackendRoot "Services\ShipmentService\ShipmentService.API\ShipmentService.API.csproj") `
    -Port 5140

Write-Host "Production services are running on localhost only. Use Platform.Host http://127.0.0.1:5000 as the public API port."
