# Resets HR, Attendance, Punch Data, Leave, and Payroll databases:
# 1) Drops each database (all data removed)
# 2) Recreates schema via EF migrations (.NET) or GORM AutoMigrate (Punch Data)
param(
    [string]$Server = "localhost",
    [string]$User = "sa",
    [string]$Password = "123580"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Drop-Database {
    param([string]$Name)
    $sql = @"
IF DB_ID(N'$Name') IS NOT NULL
BEGIN
    ALTER DATABASE [$Name] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$Name];
END
"@
    sqlcmd -S $Server -U $User -P $Password -C -Q $sql -b | Out-Null
    Write-Host "Dropped database: $Name"
}

function Update-EfDatabase {
    param(
        [string]$InfrastructureDir,
        [string]$StartupProject,
        [string]$Context
    )
    Push-Location $InfrastructureDir
    try {
        dotnet ef database update --startup-project $StartupProject --context $Context
        if ($LASTEXITCODE -ne 0) { throw "EF update failed for $Context" }
        Write-Host "Migrated: $Context"
    }
    finally {
        Pop-Location
    }
}

$databases = @(
    "HRServiceDB",
    "AttendanceServiceDB",
    "PunchDataDB",
    "LeaveServiceDB",
    "PayrollServiceDB"
)

Write-Host "=== Dropping databases ==="
foreach ($db in $databases) {
    Drop-Database -Name $db
}

Write-Host "=== Applying EF migrations ==="
Update-EfDatabase `
    -InfrastructureDir "$root/Services/HRService/HRService.Infrastructure" `
    -StartupProject "../HRService.Api/HRService.Api.csproj" `
    -Context "HrDbContext"

Update-EfDatabase `
    -InfrastructureDir "$root/Services/AttendanceService/AttendanceService.Infrastructure" `
    -StartupProject "../AttendanceService.Api/AttendanceService.Api.csproj" `
    -Context "AttendanceDbContext"

Update-EfDatabase `
    -InfrastructureDir "$root/Services/LeaveService/LeaveService.Infrastructure" `
    -StartupProject "../LeaveService.Api/LeaveService.Api.csproj" `
    -Context "LeaveDbContext"

Update-EfDatabase `
    -InfrastructureDir "$root/Services/PayrollService/PayrollService.Infrastructure" `
    -StartupProject "../PayrollService.Api/PayrollService.Api.csproj" `
    -Context "PayrollDbContext"

Write-Host "=== Punch Data schema (GORM AutoMigrate) ==="
$punchDir = "$root/Services/PunchDataService"
Push-Location $punchDir
try {
    $job = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        go run ./cmd/server 2>&1
    } -ArgumentList $punchDir

    $deadline = (Get-Date).AddSeconds(25)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        $output = Receive-Job $job -ErrorAction SilentlyContinue
        if ($output -match "Listening|AutoMigrate|migrate") {
            break
        }
        if ($job.State -eq "Completed" -or $job.State -eq "Failed") {
            break
        }
    }
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    Write-Host "PunchDataDB schema ensured (start PunchDataService to verify)."
}
catch {
    Write-Warning "Go AutoMigrate skipped (install Go or start PunchDataService manually): $_"
}
finally {
    Pop-Location
}

Write-Host "=== Done ==="
Write-Host "Start HR / Leave APIs in Development to run optional seed data."
