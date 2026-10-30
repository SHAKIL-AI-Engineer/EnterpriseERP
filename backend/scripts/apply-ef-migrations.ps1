# Applies pending EF Core migrations for Platform Host services.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$contexts = @(
    @{ Project = "Services\CompanyService\CompanyService.Infrastructure\CompanyService.Infrastructure.csproj"; Startup = "Services\CompanyService\CompanyService.Api\CompanyService.Api.csproj"; Context = "CompanyDbContext" },
    @{ Project = "Services\HRService\HRService.Infrastructure\HRService.Infrastructure.csproj"; Startup = "Services\HRService\HRService.Api\HRService.Api.csproj"; Context = "HrDbContext" },
    @{ Project = "Services\AuthService\AuthService.Infrastructure\AuthService.Infrastructure.csproj"; Startup = "Services\AuthService\AuthService.Api\AuthService.Api.csproj"; Context = "AuthDbContext" },
    @{ Project = "Services\AttendanceService\AttendanceService.Infrastructure\AttendanceService.Infrastructure.csproj"; Startup = "Services\AttendanceService\AttendanceService.Api\AttendanceService.Api.csproj"; Context = "AttendanceDbContext" },
    @{ Project = "Services\LeaveService\LeaveService.Infrastructure\LeaveService.Infrastructure.csproj"; Startup = "Services\LeaveService\LeaveService.Api\LeaveService.Api.csproj"; Context = "LeaveDbContext" },
    @{ Project = "Services\ShiftService\ShiftService.Infrastructure\ShiftService.Infrastructure.csproj"; Startup = "Services\ShiftService\ShiftService.Api\ShiftService.Api.csproj"; Context = "ShiftDbContext" },
    @{ Project = "Services\PayrollService\PayrollService.Infrastructure\PayrollService.Infrastructure.csproj"; Startup = "Services\PayrollService\PayrollService.Api\PayrollService.Api.csproj"; Context = "PayrollDbContext" },
    @{ Project = "Services\NotificationService\NotificationService.Infrastructure\NotificationService.Infrastructure.csproj"; Startup = "Services\NotificationService\NotificationService.Api\NotificationService.Api.csproj"; Context = "NotificationDbContext" },
    @{ Project = "Services\FinishingService\FinishingService.Infrastructure\FinishingService.Infrastructure.csproj"; Startup = "Services\FinishingService\FinishingService.API\FinishingService.API.csproj"; Context = "FinishingDbContext" },
    @{ Project = "Services\QualityService\QualityService.Infrastructure\QualityService.Infrastructure.csproj"; Startup = "Services\QualityService\QualityService.API\QualityService.API.csproj"; Context = "QualityDbContext" },
    @{ Project = "Services\SecurityService\SecurityService.Infrastructure\SecurityService.Infrastructure.csproj"; Startup = "Services\SecurityService\SecurityService.API\SecurityService.API.csproj"; Context = "SecurityDbContext" },
    @{ Project = "Services\AccountsService\AccountsService.Infrastructure\AccountsService.Infrastructure.csproj"; Startup = "Services\AccountsService\AccountsService.API\AccountsService.API.csproj"; Context = "AccountsDbContext" }
)

Push-Location $root
try {
    foreach ($c in $contexts) {
        $proj = Join-Path $root $c.Project
        $startup = Join-Path $root $c.Startup
        if (-not (Test-Path $proj)) {
            Write-Warning "Skip $($c.Context): project not found"
            continue
        }
        if (-not (Test-Path $startup)) {
            Write-Warning "Skip $($c.Context): startup not found"
            continue
        }
        Write-Host "Migrating $($c.Context)..."
        dotnet ef database update --project $proj --startup-project $startup --context $c.Context
        if ($LASTEXITCODE -ne 0) { throw "Migration failed for $($c.Context)" }
    }
    Write-Host "All migrations applied."
}
finally {
    Pop-Location
}
