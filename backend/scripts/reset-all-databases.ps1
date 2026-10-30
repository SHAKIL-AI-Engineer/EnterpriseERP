# Reset all ERP SQL Server databases and re-apply EF Core migrations.
# Uses backend/Configuration/connectionstrings.json (via each API's AddEnterpriseErpConnectionConfiguration).
# Requires: dotnet ef, sqlcmd, SQL Server at localhost (see $SqlServer below).

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = $Root

$SqlServer = "localhost"
$SqlUser = "sa"
$SqlPassword = "123580"

function Test-SqlSaLogin {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    try {
        $null = sqlcmd -C -S $SqlServer -U $SqlUser -P $SqlPassword -Q "SET NOCOUNT ON" -b -h -1 2>$null
        return $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $prev
    }
}

function Get-DatabaseConnectionString([string]$DatabaseName) {
    if ($script:UseIntegratedSecurity) {
        return "Server=$SqlServer;Database=$DatabaseName;Trusted_Connection=True;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
    }
    return "Server=$SqlServer;Database=$DatabaseName;User Id=$SqlUser;Password=$SqlPassword;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"
}

$UseIntegratedSecurity = -not (Test-SqlSaLogin)
if ($UseIntegratedSecurity) {
    Write-Host "SQL login '$SqlUser' unavailable - using Windows Authentication ($($env:USERDOMAIN)\$($env:USERNAME))." -ForegroundColor Yellow
    $SqlCmdExtra = @("-E")
}
else {
    Write-Host "Using SQL authentication ($SqlUser)." -ForegroundColor Green
    $SqlCmdExtra = @("-U", $SqlUser, "-P", $SqlPassword)
}

$Databases = @(
    "AuthServiceDB",
    "CompanyServiceDB",
    "HRServiceDB",
    "AttendanceServiceDB",
    "LeaveServiceDB",
    "ShiftServiceDB",
    "PayrollServiceDB",
    "NotificationServiceDB",
    "PunchDataDB",
    "ImportExportDB",
    "QualityServiceDB",
    "FinishingServiceDB",
    "SecurityServiceDB",
    "AccountsServiceDB",
    "CuttingServiceDB",
    "MerchandisingServiceDB",
    "ProcurementServiceDB",
    "InventoryServiceDB",
    "StoreServiceDB"
)

$EfServices = @(
    @{ Name = "Auth";        ConnKey = "AuthDb";        Api = "Services\AuthService\AuthService.Api";        Project = "Services\AuthService\AuthService.Infrastructure";        Context = "AuthDbContext";        Db = "AuthServiceDB" },
    @{ Name = "Company";     ConnKey = "CompanyDb";     Api = "Services\CompanyService\CompanyService.Api";     Project = "Services\CompanyService\CompanyService.Infrastructure";     Context = "CompanyDbContext";     Db = "CompanyServiceDB" },
    @{ Name = "HR";          ConnKey = "HrDb";          Api = "Services\HRService\HRService.Api";               Project = "Services\HRService\HRService.Infrastructure";               Context = "HrDbContext";          Db = "HRServiceDB" },
    @{ Name = "Attendance";  ConnKey = "AttendanceDb";  Api = "Services\AttendanceService\AttendanceService.Api"; Project = "Services\AttendanceService\AttendanceService.Infrastructure"; Context = "AttendanceDbContext";  Db = "AttendanceServiceDB" },
    @{ Name = "Leave";       ConnKey = "LeaveDb";       Api = "Services\LeaveService\LeaveService.Api";         Project = "Services\LeaveService\LeaveService.Infrastructure";         Context = "LeaveDbContext";       Db = "LeaveServiceDB" },
    @{ Name = "Shift";       ConnKey = "ShiftDb";       Api = "Services\ShiftService\ShiftService.Api";         Project = "Services\ShiftService\ShiftService.Infrastructure";         Context = "ShiftDbContext";       Db = "ShiftServiceDB" },
    @{ Name = "Payroll";     ConnKey = "PayrollDb";     Api = "Services\PayrollService\PayrollService.Api";     Project = "Services\PayrollService\PayrollService.Infrastructure";     Context = "PayrollDbContext";     Db = "PayrollServiceDB" },
    @{ Name = "Notification"; ConnKey = "NotificationDb"; Api = "Services\NotificationService\NotificationService.Api"; Project = "Services\NotificationService\NotificationService.Infrastructure"; Context = "NotificationDbContext"; Db = "NotificationServiceDB" },
    @{ Name = "Quality";     ConnKey = "QualityDb";     Api = "Services\QualityService\QualityService.API";     Project = "Services\QualityService\QualityService.Infrastructure";     Context = "QualityDbContext";     Db = "QualityServiceDB" },
    @{ Name = "Finishing";   ConnKey = "FinishingDb";   Api = "Services\FinishingService\FinishingService.API";   Project = "Services\FinishingService\FinishingService.Infrastructure";   Context = "FinishingDbContext";   Db = "FinishingServiceDB" },
    @{ Name = "Security";    ConnKey = "SecurityDb";    Api = "Services\SecurityService\SecurityService.API";    Project = "Services\SecurityService\SecurityService.Infrastructure";    Context = "SecurityDbContext";    Db = "SecurityServiceDB" },
    @{ Name = "Accounts";    ConnKey = "AccountsDb";    Api = "Services\AccountsService\AccountsService.API";    Project = "Services\AccountsService\AccountsService.Infrastructure";    Context = "AccountsDbContext";    Db = "AccountsServiceDB" },
    @{ Name = "Cutting";     ConnKey = "CuttingDb";     Api = "Services\CuttingService\CuttingService.API";     Project = "Services\CuttingService\CuttingService.Infrastructure";     Context = "CuttingDbContext";     Db = "CuttingServiceDB" },
    @{ Name = "Merchandising"; ConnKey = "MerchandisingDb"; Api = "Services\MerchandisingService\MerchandisingService.API"; Project = "Services\MerchandisingService\MerchandisingService.Infrastructure"; Context = "MerchandisingDbContext"; Db = "MerchandisingServiceDB" },
    @{ Name = "Procurement"; ConnKey = "ProcurementDb"; Api = "Services\ProcurementService\ProcurementService.API"; Project = "Services\ProcurementService\ProcurementService.Infrastructure"; Context = "ProcurementDbContext"; Db = "ProcurementServiceDB" },
    @{ Name = "Inventory"; ConnKey = "InventoryDb"; Api = "Services\InventoryService\InventoryService.API"; Project = "Services\InventoryService\InventoryService.Infrastructure"; Context = "InventoryDbContext"; Db = "InventoryServiceDB" },
    @{ Name = "Store"; ConnKey = "StoreDb"; Api = "Services\StoreService\StoreService.API"; Project = "Services\StoreService\StoreService.Infrastructure"; Context = "StoreDbContext"; Db = "StoreServiceDB" }
)

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Stopping running ERP API / host processes"
Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -match 'AuthService|AttendanceService|HRService|CompanyService|Platform\.Host|EnterpriseERP|PunchData|ImportExport|CuttingService|FinishingService|QualityService|SecurityService|AccountsService|MerchandisingService|ProcurementService|InventoryService|StoreService|LeaveService|ShiftService|PayrollService|NotificationService'
} | ForEach-Object {
    Write-Host "  Stopping $($_.ProcessName) ($($_.Id))"
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

Write-Step "Dropping databases on $SqlServer"
foreach ($db in $Databases) {
    $sql = @"
IF DB_ID(N'$db') IS NOT NULL
BEGIN
    ALTER DATABASE [$db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$db];
    PRINT 'Dropped $db';
END
ELSE
    PRINT 'Skip (not found): $db';
"@
    sqlcmd -C -S $SqlServer @SqlCmdExtra -Q $sql 2>&1 | ForEach-Object { Write-Host "  $_" }
}

Write-Step "Creating empty databases"
foreach ($db in $Databases) {
    sqlcmd -C -S $SqlServer @SqlCmdExtra -Q "IF DB_ID(N'$db') IS NULL CREATE DATABASE [$db];" 2>&1 | Out-Null
    Write-Host "  $db"
}

Write-Step "Applying EF Core migrations"
foreach ($svc in $EfServices) {
    $apiPath = Join-Path $Backend $svc.Api
    $projPath = Join-Path $Backend $svc.Project
    $projFile = Get-ChildItem -Path $projPath -Filter "*.csproj" | Select-Object -First 1
    $apiFile = Get-ChildItem -Path $apiPath -Filter "*.csproj" | Select-Object -First 1
    if (-not $projFile -or -not $apiFile) {
        Write-Warning "Skip $($svc.Name): project not found"
        continue
    }
    Write-Host "  $($svc.Name) ($($svc.Context))..." -ForegroundColor Yellow
    Push-Location $apiPath
    try {
        $conn = Get-DatabaseConnectionString $svc.Db
        $envKey = "ConnectionStrings__$($svc.ConnKey)"
        Set-Item -Path "Env:$envKey" -Value $conn
        dotnet ef database update --project $projFile.FullName --context $svc.Context 2>&1 | ForEach-Object { Write-Host "    $_" }
        if ($LASTEXITCODE -ne 0) { throw "dotnet ef failed for $($svc.Name)" }
    }
    finally {
        Remove-Item "Env:ConnectionStrings__$($svc.ConnKey)" -ErrorAction SilentlyContinue
        Pop-Location
    }
}

Write-Step "Go services: create schema (GORM AutoMigrate)"
$goJwt = "dev_signing_key_at_least_32_chars_long_for_erp_local"
$connJson = Join-Path $Backend "Configuration\connectionstrings.json"

function Invoke-GoMigrate($serviceDir, $envPrefix) {
    $dir = Join-Path $Backend $serviceDir
    if (-not (Test-Path $dir)) { return }
    Write-Host "  $serviceDir..." -ForegroundColor Yellow
    Push-Location $dir
    try {
        $punchConn = Get-DatabaseConnectionString "PunchDataDB"
        $job = Start-Job -ScriptBlock {
            param($d, $jwt, $conn)
            Set-Location $d
            $env:PUNCHDATA_JWT_SIGNINGKEY = $jwt
            $env:PUNCHDATA_CONNECTIONSTRING = $conn
            & go run ./cmd/server 2>&1
        } -ArgumentList $dir, $goJwt, $punchConn
        Wait-Job $job -Timeout 45 | Out-Null
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue
    }
    finally { Pop-Location }
}

# PunchData uses cmd/server; ImportExport uses cmd/api
Invoke-GoMigrate "Services\PunchDataService" "PUNCHDATA"
Push-Location (Join-Path $Backend "Services\ImportExportService")
try {
    $importConn = Get-DatabaseConnectionString "ImportExportDB"
    $companyConn = Get-DatabaseConnectionString "CompanyServiceDB"
    $job = Start-Job -ScriptBlock {
        param($d, $jwt, $importConn, $companyConn)
        Set-Location $d
        $env:IMPORTEXPORT_JWT_SIGNINGKEY = $jwt
        $env:IMPORTEXPORT_CONNECTIONSTRING = $importConn
        $env:IMPORTEXPORT_COMPANY_CONNECTIONSTRING = $companyConn
        & go run ./cmd/api 2>&1
    } -ArgumentList (Get-Location).Path, $goJwt, $importConn, $companyConn
    Wait-Job $job -Timeout 45 | Out-Null
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
}
finally { Pop-Location }

Write-Step "Seeding Auth + default Company/HR via Platform.Host"
$hostProj = Join-Path $Backend "Platform.Host\EnterpriseERP.Platform.Host.csproj"
$connOverrides = @{}
foreach ($svc in $EfServices) { $connOverrides[$svc.ConnKey] = Get-DatabaseConnectionString $svc.Db }
$connOverrides["PunchDataDb"] = Get-DatabaseConnectionString "PunchDataDB"
$connOverrides["ImportExportDb"] = Get-DatabaseConnectionString "ImportExportDB"
$hostJob = Start-Job -ScriptBlock {
    param($backend, $proj, $overrides)
    Set-Location $backend
    foreach ($key in $overrides.Keys) {
        Set-Item -Path "Env:ConnectionStrings__$key" -Value $overrides[$key]
    }
    dotnet run --project $proj -c Release --no-build 2>&1
} -ArgumentList $Backend, $hostProj, $connOverrides
Wait-Job $hostJob -Timeout 120 | Out-Null
Stop-Job $hostJob -ErrorAction SilentlyContinue
Remove-Job $hostJob -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-ChildItem Env:ConnectionStrings__* -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Step "Done. All databases dropped and migrations reapplied."
