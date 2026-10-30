# Start Enterprise ERP backend on a single port (5000)
# Usage: powershell -File backend/Infrastructure/Scripts/start-platform.ps1
#
# Employee Excel import requires:
#   - Platform.Host     http://127.0.0.1:5000
#   - ImportExport      http://127.0.0.1:8060
# Punch / attendance also needs:
#   - PunchDataService  http://127.0.0.1:5050
# Merchandising UI (hrhub) also needs:
#   - MerchandisingService  http://127.0.0.1:5288
# Production UI also needs:
#   - ProductionPlanningService  http://127.0.0.1:5043
#   - SewingService               http://127.0.0.1:5130
#   - ShipmentService              http://127.0.0.1:5140
# Store / inventory UI also needs:
#   - InventoryService      http://127.0.0.1:5041
#   - StoreService          http://127.0.0.1:5042
# Cutting UI also needs:
#   - CuttingService        http://127.0.0.1:5044
# If Platform.Host is up but cutting returns 502, run:
#   powershell -File backend/Infrastructure/Scripts/start-cutting.ps1

param(
    [switch]$SkipBuild,
    [switch]$WithoutPunchData
)

$ErrorActionPreference = "Stop"

function Wait-HttpOk {
    param(
        [string]$Url,
        [int]$MaxSeconds = 60,
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
    Write-Warning "$Label did not respond at $Url within ${MaxSeconds}s. Platform may show 503 for that service."
    return $false
}

function Start-DotNetMicroservice {
    param(
        [string]$Label,
        [string]$ProjectDir,
        [string]$ProjectFile,
        [int]$Port,
        [string]$HealthPath = "/health",
        [switch]$SkipBuild
    )

    $existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "$Label already listening on port $Port (PID: $($existing.OwningProcess))."
        return
    }

    Write-Host "Starting $Label -- http://127.0.0.1:$Port ..."
    $cmd = "cd `"$ProjectDir`""
    $centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"
    if (Test-Path $centralConn) {
        $cmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
    }
    $runFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
    $cmd += "; dotnet run --project `"$ProjectFile`"$runFlags --urls http://127.0.0.1:$Port"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cmd) | Out-Null
    Wait-HttpOk -Url "http://127.0.0.1:$Port$HealthPath" -MaxSeconds 90 -Label $Label
}

# Use automatic PSScriptRoot if available
if (-not $PSScriptRoot) {
    $PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$BackendRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Sln = Join-Path $BackendRoot "EnterpriseERP.slnx"

if (-not (Test-Path $Sln)) {
    Write-Error "Could not find EnterpriseERP.slnx at $Sln"
}

Set-Location $BackendRoot

# Kill existing process if running on port 5000 (Platform.Host)
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Stopping existing process on port 5000 (PID: $($existing.OwningProcess))..."
    Stop-Process -Id $existing.OwningProcess -Force
}

# Kill existing Go process on port 5050 (PunchDataService)
$existingGo = Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue
if ($existingGo) {
    Write-Host "Stopping existing Go process on port 5050 (PID: $($existingGo.OwningProcess))..."
    Stop-Process -Id $existingGo.OwningProcess -Force
}

# Kill existing Go process on port 8060 (ImportExportService)
$existingImport = Get-NetTCPConnection -LocalPort 8060 -ErrorAction SilentlyContinue
if ($existingImport) {
    Write-Host "Stopping existing Go process on port 8060 (PID: $($existingImport.OwningProcess))..."
    Stop-Process -Id $existingImport.OwningProcess -Force
}

if (-not $SkipBuild) {
    Write-Host "Building EnterpriseERP.slnx (Release)..."
    dotnet build $Sln -c Release
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$centralConn = Join-Path $BackendRoot "Configuration\connectionstrings.json"

$importDir = Join-Path $BackendRoot "Services\ImportExportService"
if (Test-Path (Join-Path $importDir "go.mod")) {
    Write-Host "Starting ImportExportService (Go) -- http://127.0.0.1:8060 ..."
    $importCmd = "cd `"$importDir`""
    if (Test-Path $centralConn) {
        $importCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
    }
    $importCmd += "; go run ./cmd/api"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $importCmd) | Out-Null
    Wait-HttpOk -Url "http://127.0.0.1:8060/health" -MaxSeconds 60 -Label "ImportExportService"
}

$notifDir = Join-Path $BackendRoot "Services\NotificationService"
if (Test-Path (Join-Path $notifDir "go.mod")) {
    $existingNotif = Get-NetTCPConnection -LocalPort 5047 -ErrorAction SilentlyContinue
    if ($existingNotif) {
        Write-Host "NotificationService already listening on port 5047 (PID: $($existingNotif.OwningProcess))."
    }
    else {
        Write-Host "Starting NotificationService (Go/Gin) -- http://127.0.0.1:5047 ..."
        $notifCmd = "cd `"$notifDir`""
        if (Test-Path $centralConn) {
            $notifCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $notifCmd += "; go run ./cmd/server"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $notifCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5047/health" -MaxSeconds 90 -Label "NotificationService"
    }
}

$merchDir = Join-Path $BackendRoot "Services\MerchandisingService\MerchandisingService.API"
$merchProj = Join-Path $merchDir "MerchandisingService.API.csproj"
if (Test-Path $merchProj) {
    $existingMerch = Get-NetTCPConnection -LocalPort 5288 -ErrorAction SilentlyContinue
    if ($existingMerch) {
        Write-Host "MerchandisingService already listening on port 5288 (PID: $($existingMerch.OwningProcess))."
    }
    else {
        Write-Host "Starting MerchandisingService -- http://127.0.0.1:5288 ..."
        $merchCmd = "cd `"$merchDir`""
        if (Test-Path $centralConn) {
            $merchCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $merchRunFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
        $merchCmd += "; dotnet run --project `"$merchProj`"$merchRunFlags"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $merchCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5288/health" -MaxSeconds 90 -Label "MerchandisingService"
    }
}

$inventoryDir = Join-Path $BackendRoot "Services\InventoryService\InventoryService.API"
$inventoryProj = Join-Path $inventoryDir "InventoryService.API.csproj"
if (Test-Path $inventoryProj) {
    $existingInv = Get-NetTCPConnection -LocalPort 5041 -ErrorAction SilentlyContinue
    if ($existingInv) {
        Write-Host "InventoryService already listening on port 5041 (PID: $($existingInv.OwningProcess))."
    }
    else {
        Write-Host "Starting InventoryService -- http://127.0.0.1:5041 ..."
        $invCmd = "cd `"$inventoryDir`""
        if (Test-Path $centralConn) {
            $invCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $invRunFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
        $invCmd += "; dotnet run --project `"$inventoryProj`"$invRunFlags"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $invCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5041/health" -MaxSeconds 90 -Label "InventoryService"
    }
}

$storeDir = Join-Path $BackendRoot "Services\StoreService\StoreService.API"
$storeProj = Join-Path $storeDir "StoreService.API.csproj"
if (Test-Path $storeProj) {
    $existingStore = Get-NetTCPConnection -LocalPort 5042 -ErrorAction SilentlyContinue
    if ($existingStore) {
        Write-Host "StoreService already listening on port 5042 (PID: $($existingStore.OwningProcess))."
    }
    else {
        Write-Host "Starting StoreService -- http://127.0.0.1:5042 ..."
        $storeCmd = "cd `"$storeDir`""
        if (Test-Path $centralConn) {
            $storeCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $storeRunFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
        $storeCmd += "; dotnet run --project `"$storeProj`"$storeRunFlags"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $storeCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5042/health" -MaxSeconds 90 -Label "StoreService"
    }
}

$cuttingDir = Join-Path $BackendRoot "Services\CuttingService\CuttingService.API"
$cuttingProj = Join-Path $cuttingDir "CuttingService.API.csproj"
if (Test-Path $cuttingProj) {
    $existingCut = Get-NetTCPConnection -LocalPort 5044 -ErrorAction SilentlyContinue
    if ($existingCut) {
        Write-Host "CuttingService already listening on port 5044 (PID: $($existingCut.OwningProcess))."
    }
    else {
        Write-Host "Starting CuttingService -- http://127.0.0.1:5044 ..."
        $cutCmd = "cd `"$cuttingDir`""
        if (Test-Path $centralConn) {
            $cutCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $cutRunFlags = if ($SkipBuild) { " -c Release --no-build" } else { " -c Release" }
        $cutCmd += "; dotnet run --project `"$cuttingProj`"$cutRunFlags"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cutCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5044/health" -MaxSeconds 90 -Label "CuttingService"
    }
}

$planningDir = Join-Path $BackendRoot "Services\ProductionPlanningService\ProductionPlanningService.API"
$planningProj = Join-Path $planningDir "ProductionPlanningService.API.csproj"
if (Test-Path $planningProj) {
    Start-DotNetMicroservice -Label "ProductionPlanningService" -ProjectDir $planningDir -ProjectFile $planningProj -Port 5043 -SkipBuild:$SkipBuild
}

$sewingDir = Join-Path $BackendRoot "Services\SewingService\SewingService.API"
$sewingProj = Join-Path $sewingDir "SewingService.API.csproj"
if (Test-Path $sewingProj) {
    Start-DotNetMicroservice -Label "SewingService" -ProjectDir $sewingDir -ProjectFile $sewingProj -Port 5130 -SkipBuild:$SkipBuild
}

$shipmentDir = Join-Path $BackendRoot "Services\ShipmentService\ShipmentService.API"
$shipmentProj = Join-Path $shipmentDir "ShipmentService.API.csproj"
if (Test-Path $shipmentProj) {
    Start-DotNetMicroservice -Label "ShipmentService" -ProjectDir $shipmentDir -ProjectFile $shipmentProj -Port 5140 -SkipBuild:$SkipBuild
}

if (-not $WithoutPunchData) {
    $punchDir = Join-Path $BackendRoot "Services\PunchDataService"
    if (Test-Path (Join-Path $punchDir "go.mod")) {
        Write-Host "Starting PunchDataService (Go) -- http://127.0.0.1:5050 ..."
        $punchCmd = "cd `"$punchDir`""
        if (Test-Path $centralConn) {
            $punchCmd += "; `$env:ERP_CONNECTIONSTRINGS = '$centralConn'"
        }
        $punchCmd += "; go run ./cmd/server"
        Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $punchCmd) | Out-Null
        Wait-HttpOk -Url "http://127.0.0.1:5050/health" -MaxSeconds 120 -Label "PunchDataService"
    }
}

$hostProj = Join-Path $BackendRoot "Platform.Host\EnterpriseERP.Platform.Host.csproj"
Write-Host "Starting Platform.Host -- http://127.0.0.1:5000 ..."
dotnet run --project $hostProj -c Release --no-build
