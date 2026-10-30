#!/usr/bin/env bash
# Reset all ERP SQL Server databases and re-apply EF Core migrations.
# Linux equivalent of reset-all-databases.ps1 — uses localhost SQL Server.

set -euo pipefail

BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
SQLSERVER="SHAKIL\\SQLEXPRESS"
SQLUSER="sa"
SQLPASS="shakil52814542A"
GO_JWT="dev_signing_key_at_least_32_chars_long_for_erp_local"
CONN_BASE="Server=${SQLSERVER};User Id=${SQLUSER};Password=${SQLPASS};Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true"

DATABASES=(
  AuthServiceDB CompanyServiceDB HRServiceDB AttendanceServiceDB LeaveServiceDB
  ShiftServiceDB PayrollServiceDB NotificationServiceDB PunchDataDB ImportExportDB
  QualityServiceDB FinishingServiceDB SecurityServiceDB AccountsServiceDB
  CuttingServiceDB MerchandisingServiceDB ProcurementServiceDB InventoryServiceDB
)

step() { echo -e "\n==> $*"; }

step "Stopping running ERP API / host processes"
pgrep -af 'dotnet.*(AuthService|Platform\.Host|CompanyService|HRService|AttendanceService|LeaveService|ShiftService|PayrollService|NotificationService|QualityService|FinishingService|SecurityService|AccountsService|CuttingService|MerchandisingService|ProcurementService|InventoryService)' 2>/dev/null | while read -r pid _; do
  echo "  Stopping dotnet PID $pid"
  kill "$pid" 2>/dev/null || true
done || true
pgrep -af 'go run.*(PunchDataService|ImportExportService)' 2>/dev/null | while read -r pid _; do
  echo "  Stopping go PID $pid"
  kill "$pid" 2>/dev/null || true
done || true
sleep 2

step "Dropping databases on ${SQLSERVER}"
for db in "${DATABASES[@]}"; do
  sqlcmd -C -S "$SQLSERVER" -U "$SQLUSER" -P "$SQLPASS" -Q "
IF DB_ID(N'$db') IS NOT NULL
BEGIN
    ALTER DATABASE [$db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [$db];
    PRINT 'Dropped $db';
END
ELSE
    PRINT 'Skip (not found): $db';
" 2>&1 | sed 's/^/  /'
done

step "Creating empty databases"
for db in "${DATABASES[@]}"; do
  sqlcmd -C -S "$SQLSERVER" -U "$SQLUSER" -P "$SQLPASS" -Q "IF DB_ID(N'$db') IS NULL CREATE DATABASE [$db];" >/dev/null 2>&1
  echo "  $db"
done

run_ef() {
  local name="$1" api="$2" project="$3" context="$4"
  local api_path="$BACKEND/$api"
  local proj_file
  proj_file="$(find "$BACKEND/$project" -maxdepth 1 -name '*.csproj' | head -1)"
  if [[ ! -d "$api_path" || -z "$proj_file" ]]; then
    echo "  SKIP $name: project not found"
    return 0
  fi
  echo "  $name ($context)..."
  (cd "$api_path" && dotnet ef database update --project "$proj_file" --context "$context")
}

step "Applying EF Core migrations"
run_ef Auth Services/AuthService/AuthService.Api Services/AuthService/AuthService.Infrastructure AuthDbContext
run_ef Company Services/CompanyService/CompanyService.Api Services/CompanyService/CompanyService.Infrastructure CompanyDbContext
run_ef HR Services/HRService/HRService.Api Services/HRService/HRService.Infrastructure HrDbContext
run_ef Attendance Services/AttendanceService/AttendanceService.Api Services/AttendanceService/AttendanceService.Infrastructure AttendanceDbContext
run_ef Leave Services/LeaveService/LeaveService.Api Services/LeaveService/LeaveService.Infrastructure LeaveDbContext
run_ef Shift Services/ShiftService/ShiftService.Api Services/ShiftService/ShiftService.Infrastructure ShiftDbContext
run_ef Payroll Services/PayrollService/PayrollService.Api Services/PayrollService/PayrollService.Infrastructure PayrollDbContext
run_ef Notification Services/NotificationService/NotificationService.Api Services/NotificationService/NotificationService.Infrastructure NotificationDbContext
run_ef Quality Services/QualityService/QualityService.API Services/QualityService/QualityService.Infrastructure QualityDbContext
run_ef Finishing Services/FinishingService/FinishingService.API Services/FinishingService/FinishingService.Infrastructure FinishingDbContext
run_ef Security Services/SecurityService/SecurityService.API Services/SecurityService/SecurityService.Infrastructure SecurityDbContext
run_ef Accounts Services/AccountsService/AccountsService.API Services/AccountsService/AccountsService.Infrastructure AccountsDbContext
run_ef Cutting Services/CuttingService/CuttingService.API Services/CuttingService/CuttingService.Infrastructure CuttingDbContext
run_ef Merchandising Services/MerchandisingService/MerchandisingService.API Services/MerchandisingService/MerchandisingService.Infrastructure MerchandisingDbContext
run_ef Procurement Services/ProcurementService/ProcurementService.API Services/ProcurementService/ProcurementService.Infrastructure ProcurementDbContext
run_ef Inventory Services/InventoryService/InventoryService.API Services/InventoryService/InventoryService.Infrastructure InventoryDbContext

run_go_migrate() {
  local name="$1" dir="$2" cmd="$3"
  shift 3
  echo "  $name..."
  cd "$BACKEND/$dir"
  export "$@"
  go run "$cmd" >"/tmp/erp-go-migrate-${name}.log" 2>&1 &
  local pid=$!
  for _ in $(seq 1 60); do
    if grep -qiE 'listening|AutoMigrate|started|ready|:5050|:8060' "/tmp/erp-go-migrate-${name}.log" 2>/dev/null; then
      sleep 3
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 0
    fi
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "    failed:"
      tail -20 "/tmp/erp-go-migrate-${name}.log" | sed 's/^/    /'
      return 1
    fi
    sleep 1
  done
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}

step "Go services: create schema (GORM AutoMigrate)"
run_go_migrate PunchData Services/PunchDataService ./cmd/server \
  PUNCHDATA_JWT_SIGNINGKEY="$GO_JWT" \
  PUNCHDATA_CONNECTIONSTRING="${CONN_BASE};Database=PunchDataDB"

run_go_migrate ImportExport Services/ImportExportService ./cmd/api \
  IMPORTEXPORT_JWT_SIGNINGKEY="$GO_JWT" \
  IMPORTEXPORT_CONNECTIONSTRING="${CONN_BASE};Database=ImportExportDB" \
  IMPORTEXPORT_COMPANY_CONNECTIONSTRING="${CONN_BASE};Database=CompanyServiceDB"

step "Optional: seed Auth + sample Company/HR via Platform.Host"
echo "  dotnet run --project Platform.Host/EnterpriseERP.Platform.Host.csproj"
echo "  (creates default company, EMP-0001 sample employee, admin user via AuthDataSeeder)"

step "Done. All databases dropped and migrations reapplied."
