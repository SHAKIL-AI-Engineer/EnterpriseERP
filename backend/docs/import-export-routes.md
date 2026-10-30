# Import-Export API routes

Gateway: **Platform.Host** `http://127.0.0.1:5000/api/v1/import-export/*`  
Upstream: **ImportExportService (Go)** `http://127.0.0.1:8060`

## Startup

```powershell
# From repo root (starts Go :8060 + Platform.Host :5000)
powershell -File backend/Infrastructure/Scripts/start-platform.ps1

# Or Go only (requires ERP_CONNECTIONSTRINGS / appsettings)
cd backend/Services/ImportExportService
$env:ERP_CONNECTIONSTRINGS = "...\backend\Configuration\connectionstrings.json"
go run ./cmd/api
```

Go connects to SQL using the **raw ADO connection string** first (same as .NET), then alternate pipe/TCP DSNs.  
Optional (Admin): `backend/scripts/enable-sql-browser.ps1` for TCP port 1433.

## Route matrix (via :5000)

| Route | Handler | Smoke (2026-05-25) |
|-------|---------|-------------------|
| `GET /health` | Go (YARP) | 200 |
| `GET /templates/{module}/download` | Go | 200 (employee full profile) |
| `POST /export/employee` | Go → HR `GET /hr/Employees/export` | Live employee xlsx |
| `POST /import/{module}/preview` | Go | Requires file upload |
| `POST /import/{module}/confirm` | Go | Requires preview session |
| `GET /import-jobs`, `GET /import-jobs/{id}`, error-file | Go | Requires job id |
| `GET /company-organogram/demo-format` | Platform.Host fallback | 200 |
| `POST /company-organogram/import` | Platform.Host fallback | 200 |
| `GET /company-organogram/export` | Platform.Host fallback | 200 |
| `GET /address/demo-format` | Platform.Host fallback | 200 |
| `POST /address/import` | Platform.Host fallback | 200 |
| `POST /export/{module}` | Go | — |
| `POST /reports/{module}/export` | Go | Excel/PDF formatter for all HR modules |

## HR report exports (Platform.Host embedded services → Go formatter)

Each export runs the **same filtered query** as the on-screen report, then `POST /api/v1/import-export/reports/{module}/export`.

| Module | Report key | GET export (via :5000) | Formats |
|--------|------------|------------------------|---------|
| HR | employees | `GET /api/v1/hr/reports/employees/export.{xlsx\|pdf}` | xlsx, pdf |
| HR | employees/full | `GET /api/v1/hr/reports/employees/full/export.{xlsx\|pdf}` | xlsx, pdf |
| HR | manpower-list | `GET /api/v1/hr/reports/manpower-list/export.{xlsx\|pdf}` | xlsx, pdf |
| HR | manpower-summary | `GET /api/v1/hr/reports/manpower-summary/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | daily-report | `GET /api/v1/attendance/reports/daily-report/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | daily-summary | `GET /api/v1/attendance/reports/daily-summary/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | job-card | `GET /api/v1/attendance/reports/job-card/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | daily-ot-sheet | `GET /api/v1/attendance/reports/daily-ot-sheet/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | daily-ot-summary | `GET /api/v1/attendance/reports/daily-ot-summary/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | missing-entries | `GET /api/v1/attendance/reports/missing-entries/export.{xlsx\|pdf}` | xlsx, pdf |
| Attendance | absenteeism-records | `GET /api/v1/attendance/reports/absenteeism-records/export.{xlsx\|pdf}` | xlsx, pdf |
| Bills | night/tiffin/ifter/holiday | `GET /api/v1/{type}-bills/export.{xlsx\|pdf}` (+ CSV at `/export`) | csv, xlsx, pdf |
| Payroll | salary-sheet | `GET /api/v1/payroll/export/salary-sheet/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | summary | `GET /api/v1/payroll/export/summary/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | bank-sheet | `GET /api/v1/payroll/export/bank-sheet/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | daily-sheet | `GET /api/v1/payroll/export/daily-sheet/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | advance-sheet | `GET /api/v1/payroll/export/advance-sheet/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | advance-summary | `GET /api/v1/payroll/export/advance-summary/export.{xlsx\|pdf}` | xlsx, pdf |
| Payroll | bonuses | `GET /api/v1/payroll/export/bonuses/export.{xlsx\|pdf}` | csv, xlsx, pdf |
| Payroll | festival-bonus-bank | `GET /api/v1/payroll/export/festival-bonus-bank/export.{xlsx\|pdf}` | xlsx, pdf |
| Payroll | pay-slips | `GET /api/v1/payroll/export/pay-slips/export.{xlsx\|pdf}` | xlsx, pdf |
| Payroll | monthly-sheet | `GET /api/v1/payroll/export/monthly-sheet/export.{xlsx\|pdf}` | xlsx, pdf |
| Leave | applications | `GET /api/v1/leave/reports/applications/export.{xlsx\|pdf}` | xlsx, pdf |
| Leave | monthly-report | `GET /api/v1/leave/reports/monthly-report/export.{xlsx\|pdf}` | xlsx, pdf |
| Leave | balances | `GET /api/v1/leave/reports/balances/export.{xlsx\|pdf}` | xlsx, pdf |
| Leave | holidays | `GET /api/v1/leave/reports/holidays/export.{xlsx\|pdf}` | xlsx, pdf |
| Leave | encashments | `GET /api/v1/leave/reports/encashments/export.{xlsx\|pdf}` | xlsx, pdf |

Go formatter limits sync exports to **5000 rows** (`413` when exceeded). Response header `X-Export-Row-Count` is set on success.

Configure embedded services: `ImportExport:BaseUrl` = `http://127.0.0.1:8060` in `Platform.Host/appsettings.json`.

When Go is **not** running, proxied routes return **503** with a clear JSON message (not 502).  
Organogram and address routes under Platform.Host still work without Go.

## Employee import (full profile)

- **Template / export columns:** 70+ fields on sheet `Template` (identity, job names, salary components, family, addresses, bank, emergency contact, profile/signature URLs). See `EmployeeFullHeaders` in Go `employee_full_columns.go` and `EmployeeImportRowDto` in HRService.
- **Upsert key:** `EmployeeID` within the active company (`X-Company-Id`). Same ID in file → **update**; new ID → **create**.
- **Flow:** `POST /import/employee/preview` → `POST /import/employee/confirm` → Go batches to `POST /api/v1/hr/Employees/import-upsert`.
- **Inactive** rows are rejected at preview.
- **Prerequisites:** Company organogram imported (department/designation names match `NameEn` in CompanyServiceDB); ImportExport :8060 running.

## JWT

`ImportExportService/appsettings.json` and `Platform.Host/appsettings.json` must share the same `Jwt:SigningKey`, `Issuer`, and `Audience` as AuthService.
