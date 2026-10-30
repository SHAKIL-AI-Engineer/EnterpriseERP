# Apply pending EF Core migrations (no drop).
# Uses each service API startup project + Infrastructure project.

$ErrorActionPreference = "Stop"
$Backend = Split-Path -Parent $PSScriptRoot

$EfServices = @(
    @{ Name = "Auth";        Api = "Services\AuthService\AuthService.Api";        Project = "Services\AuthService\AuthService.Infrastructure";        Context = "AuthDbContext" },
    @{ Name = "Company";     Api = "Services\CompanyService\CompanyService.Api";     Project = "Services\CompanyService\CompanyService.Infrastructure";     Context = "CompanyDbContext" },
    @{ Name = "HR";          Api = "Services\HRService\HRService.Api";               Project = "Services\HRService\HRService.Infrastructure";               Context = "HrDbContext" },
    @{ Name = "Attendance";  Api = "Services\AttendanceService\AttendanceService.Api"; Project = "Services\AttendanceService\AttendanceService.Infrastructure"; Context = "AttendanceDbContext" },
    @{ Name = "Leave";       Api = "Services\LeaveService\LeaveService.Api";         Project = "Services\LeaveService\LeaveService.Infrastructure";         Context = "LeaveDbContext" },
    @{ Name = "Shift";       Api = "Services\ShiftService\ShiftService.Api";         Project = "Services\ShiftService\ShiftService.Infrastructure";         Context = "ShiftDbContext" },
    @{ Name = "Payroll";     Api = "Services\PayrollService\PayrollService.Api";     Project = "Services\PayrollService\PayrollService.Infrastructure";     Context = "PayrollDbContext" },
    @{ Name = "Quality";     Api = "Services\QualityService\QualityService.API";     Project = "Services\QualityService\QualityService.Infrastructure";     Context = "QualityDbContext" },
    @{ Name = "Finishing";   Api = "Services\FinishingService\FinishingService.API";   Project = "Services\FinishingService\FinishingService.Infrastructure";   Context = "FinishingDbContext" },
    @{ Name = "Security";    Api = "Services\SecurityService\SecurityService.API";    Project = "Services\SecurityService\SecurityService.Infrastructure";    Context = "SecurityDbContext" },
    @{ Name = "Accounts";    Api = "Services\AccountsService\AccountsService.API";    Project = "Services\AccountsService\AccountsService.Infrastructure";    Context = "AccountsDbContext" },
    @{ Name = "Cutting";     Api = "Services\CuttingService\CuttingService.API";     Project = "Services\CuttingService\CuttingService.Infrastructure";     Context = "CuttingDbContext" },
    @{ Name = "Merchandising"; Api = "Services\MerchandisingService\MerchandisingService.API"; Project = "Services\MerchandisingService\MerchandisingService.Infrastructure"; Context = "MerchandisingDbContext" },
    @{ Name = "Procurement"; Api = "Services\ProcurementService\ProcurementService.API"; Project = "Services\ProcurementService\ProcurementService.Infrastructure"; Context = "ProcurementDbContext" },
    @{ Name = "Inventory"; Api = "Services\InventoryService\InventoryService.API"; Project = "Services\InventoryService\InventoryService.Infrastructure"; Context = "InventoryDbContext" },
    @{ Name = "Store"; Api = "Services\StoreService\StoreService.API"; Project = "Services\StoreService\StoreService.Infrastructure"; Context = "StoreDbContext" }
)

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Applying EF Core migrations"
foreach ($svc in $EfServices) {
    $apiPath = Join-Path $Backend $svc.Api
    $projPath = Join-Path $Backend $svc.Project
    if (-not (Test-Path $apiPath) -or -not (Test-Path $projPath)) {
        Write-Warning "Skip $($svc.Name): project path not found"
        continue
    }
    $projFile = Get-ChildItem -Path $projPath -Filter "*.csproj" | Select-Object -First 1
    $apiFile = Get-ChildItem -Path $apiPath -Filter "*.csproj" | Select-Object -First 1
    if (-not $projFile -or -not $apiFile) {
        Write-Warning "Skip $($svc.Name): project not found"
        continue
    }
    Write-Host "  $($svc.Name) ($($svc.Context))..." -ForegroundColor Yellow
    Push-Location $apiPath
    try {
        dotnet ef database update --project $projFile.FullName --context $svc.Context
        if ($LASTEXITCODE -ne 0) { throw "dotnet ef failed for $($svc.Name)" }
    }
    finally {
        Pop-Location
    }
}

Write-Step "Done. PunchData/ImportExport schema updates on service start (GORM AutoMigrate)."
