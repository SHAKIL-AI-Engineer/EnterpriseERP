# Stop Enterprise ERP local dev processes (frontend + backend services).
# Usage: powershell -File backend/Infrastructure/Scripts/stop-platform.ps1

$ErrorActionPreference = "SilentlyContinue"

$ports = @(
    3000   # hrhub (Next.js)
    5000   # Platform.Host
    5011   # Legacy API (if running)
    5012   # AuthService (if running standalone)
    5041   # InventoryService
    5042   # StoreService
    5043   # ProductionPlanningService
    5044   # CuttingService
    5047   # NotificationService
    5050   # PunchDataService
    5130   # SewingService
    5140   # ShipmentService
    5288   # MerchandisingService
    8060   # ImportExportService
)

$stopped = @()

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $procIds) {
        if (-not $procId -or $procId -le 0) { continue }
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Stop-Process -Id $procId -Force -ErrorAction Stop
            $stopped += "Port ${port}: $($proc.ProcessName) (PID $procId)"
        }
        catch {
            # already exited
        }
    }
}

if ($stopped.Count -eq 0) {
    Write-Host "No listening processes found on ERP dev ports."
}
else {
    Write-Host "Stopped $($stopped.Count) process(es):"
    $stopped | ForEach-Object { Write-Host "  $_" }
}
