# Enterprise ERP - run Go services (PunchData, ImportExport) + Platform.Host + web (frontend) WITHOUT Docker.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File run-without-docker.ps1
#
# Options:
#   -SkipBuild        Do not build any project (use existing build)
#   -NoFrontend       Start only the backend (skip yarn / web)
#   -NoGoServices     Skip the Go services (PunchData / ImportExport)
#
# What it starts (each in its own PowerShell window):
#   ImportExportService (Go) -> http://127.0.0.1:8060  (/health)
#   PunchDataService    (Go) -> http://127.0.0.1:5050  (/health)
#   Platform.Host            -> http://127.0.0.1:5000  (swagger: /swagger)
#   web (yarn)               -> http://localhost:3000
#
# Prereqs: SQL Server on localhost (sa / 123580), .NET SDK 10, Go, Node.js, Yarn.
# DBs + EF migrations already applied via backend/Configuration/connectionstrings.json.
#
# Other satellites (Merchandising, Inventory, Store, Cutting, Production, Sewing,
# Shipment) are NOT started; those API paths return 502 until you start them.
# Auth/HR/Leave/Shift/Payroll/Accounts/etc. run in-process on Platform.Host.

param(
    [switch]$SkipBuild,
    [switch]$NoFrontend,
    [switch]$NoGoServices
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Root) { $Root = (Get-Location).Path }
$Backend   = Join-Path $Root "backend"
$web       = Join-Path $Root "web"
$Central   = Join-Path $Backend "Configuration\connectionstrings.json"
$HostProj  = Join-Path $Backend "Platform.Host\EnterpriseERP.Platform.Host.csproj"

# Go services read Jwt:SigningKey from their own appsettings.json (must match Platform.Host Jwt:SigningKey).
# Do NOT override the signing key here -- a mismatch makes Auth JWTs fail validation in the Go services.

if (-not (Test-Path $HostProj))  { Write-Error "Platform.Host project not found: $HostProj" }
if (-not (Test-Path $Central))   { Write-Error "connectionstrings.json not found: $Central" }
if (-not (Test-Path (Join-Path $web "package.json"))) { Write-Error "web not found: $web" }

function Stop-PortProcess {
    param([int]$Port)
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Stopping existing process on port $Port (PID $($_.OwningProcess))"
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

function Wait-HttpOk {
    param([string]$Url, [int]$MaxSeconds = 150)
    $deadline = (Get-Date).AddSeconds($MaxSeconds)
    Write-Host "Waiting for $Url ..."
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
                Write-Host "  OK: $Url"
                return $true
            }
        } catch { }
        Start-Sleep -Seconds 2
    }
    Write-Warning "  $Url did not respond within ${MaxSeconds}s."
    return $false
}

function Invoke-Native {
    # Run a command so native stderr cannot terminate the script ($ErrorActionPreference=Stop).
    param([string]$Command)
    cmd /c "$Command 2>&1"
    return $LASTEXITCODE
}

function Start-GoService {
    param(
        [string]$Label,
        [string]$ServiceDir,
        [string]$MainPackage,
        [int]$Port
    )
    $dir = Join-Path $Backend $ServiceDir
    if (-not (Test-Path (Join-Path $dir "go.mod"))) {
        Write-Warning "Go service not found: $dir (skipping $Label)"
        return $false
    }

    $existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "$Label already listening on port $Port (PID $($existing.OwningProcess))."
        return $true
    }

    if (-not $SkipBuild) {
        Write-Host "Building $Label (go build)..."
        Push-Location $dir
        try {
            if ((Invoke-Native "go build ./...") -ne 0) {
                Write-Warning "$Label build failed; starting anyway (may fall back to prebuilt binary)."
            }
        } finally { Pop-Location }
    }

    Write-Host "Starting $Label -> http://127.0.0.1:$Port ..."
    $cmd = "cd `"$dir`"; `$env:ERP_CONNECTIONSTRINGS = '$Central'; go run $MainPackage"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cmd) | Out-Null
    return (Wait-HttpOk -Url "http://127.0.0.1:$Port/health" -MaxSeconds 180)
}

Write-Host "=============================="
Write-Host " Enterprise ERP - no-Docker run"
Write-Host "=============================="
Write-Host "Backend : $Backend"
Write-Host "Frontend: $web"
Write-Host ""

# --- 1. Free ports used by the stack ---
Stop-PortProcess -Port 5000
if (-not $NoGoServices) {
    Stop-PortProcess -Port 5050
    Stop-PortProcess -Port 8060
}

# --- 2. Build Platform.Host (Debug) if requested ---
if (-not $SkipBuild) {
    Write-Host "Building Platform.Host (Debug)..."
    Set-Location $Backend
    dotnet build $HostProj
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# --- 3. Start Go services ---
if (-not $NoGoServices) {
    Start-GoService -Label "ImportExportService" -ServiceDir "Services\ImportExportService" -MainPackage "./cmd/api" -Port 8060
    Start-GoService -Label "PunchDataService"    -ServiceDir "Services\PunchDataService"    -MainPackage "./cmd/server" -Port 5050
}

# --- 4. Start Platform.Host in a new window ---
Write-Host "Starting Platform.Host -> http://127.0.0.1:5000 ..."
$backendCmd = "cd `"$Backend`"; `$env:ERP_CONNECTIONSTRINGS = '$Central'; dotnet run --project `"$HostProj`" --urls http://127.0.0.1:5000"
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $backendCmd) | Out-Null
if (-not (Wait-HttpOk -Url "http://127.0.0.1:5000/health" -MaxSeconds 180)) {
    Write-Warning "Platform.Host may still be starting; check the new PowerShell window."
}

# --- 5. Frontend with Yarn ---
if (-not $NoFrontend) {
    Write-Host "Installing frontend dependencies (yarn install)..."
    Push-Location $web
    try {
        # Run through cmd so Node/yarn stderr (warnings) can't terminate the script.
        cmd /c "yarn install --non-interactive 2>&1"
        if ($LASTEXITCODE -ne 0) { Write-Warning "yarn install failed; continuing anyway." }
    } finally { Pop-Location }

    Write-Host "Starting web (yarn dev) -> http://localhost:3000 ..."
    $feCmd = "cd `"$web`"; yarn dev"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $feCmd) | Out-Null
    Wait-HttpOk -Url "http://localhost:3000" -MaxSeconds 120 | Out-Null
}

Write-Host ""
Write-Host "====================================="
Write-Host " ImportExportService : http://127.0.0.1:8060"
Write-Host " PunchDataService    : http://127.0.0.1:5050"
Write-Host " Platform.Host       : http://127.0.0.1:5000"
Write-Host "   swagger           : http://127.0.0.1:5000/swagger"
Write-Host " web (frontend)      : http://localhost:3000"
Write-Host ""
Write-Host "DB: localhost / sa / 123580 (see backend/Configuration/connectionstrings.json)"
Write-Host "Other satellites (merchandising, store, cutting, production, sewing,"
Write-Host "shipment) return 502 until those services are started."
Write-Host "====================================="