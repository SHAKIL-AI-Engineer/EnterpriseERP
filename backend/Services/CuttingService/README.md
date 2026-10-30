# CuttingService

Production-ready .NET 10 Web API for garments/textile ERP cutting operations. It manages cutting plans, size breakdowns, fabric issue to cutting, lays/markers, cutting output, wastage, cutting balances, panel transfer to production, and cutting reports.

## Architecture

```text
CuttingService
|-- CuttingService.API
|-- CuttingService.Application
|-- CuttingService.Contracts
|-- CuttingService.Domain
|-- CuttingService.Infrastructure
`-- CuttingService.Tests
```

## Run

```powershell
dotnet restore Services\CuttingService\CuttingService.slnx
dotnet ef database update --project Services\CuttingService\CuttingService.Infrastructure --startup-project Services\CuttingService\CuttingService.API --context CuttingDbContext
dotnet run --project Services\CuttingService\CuttingService.API
```

Swagger: `/swagger`

Health: `/health`

## Key Rules

- All APIs use `/api/v1`.
- Every business table has `CompanyId`.
- Cutting cannot start before order confirmation.
- Plan quantity must match size breakdown total before approval.
- Fabric issue must exist before cutting output.
- Cutting output cannot exceed plan/order quantity without overage approval.
- Lay size `CutQty = RatioQty * PlyQty`.
- Every cutting output updates `CuttingBalances`.
- Wastage requires reason.
- Completed cutting plan cannot be edited.
- Panel transfer cannot exceed cut balance.
- Confirmed panel transfer publishes `CuttingPanelTransferred`.
- Report Excel/PDF export is delegated to Go ImportExportService.

## Main Endpoints

- `POST /api/v1/cutting-plans`
- `GET /api/v1/cutting-plans?companyId=&orderId=&status=`
- `PATCH /api/v1/cutting-plans/{id}/approve`
- `PATCH /api/v1/cutting-plans/{id}/start`
- `PATCH /api/v1/cutting-plans/{id}/complete`
- `POST /api/v1/cutting-plans/{planId}/size-breakdowns`
- `POST /api/v1/fabric-issues-to-cutting`
- `POST /api/v1/cutting-lays`
- `POST /api/v1/cutting-outputs`
- `POST /api/v1/cutting-wastages`
- `GET /api/v1/cutting-balances?companyId=&orderId=`
- `POST /api/v1/cutting-panel-transfers`
- `PATCH /api/v1/cutting-panel-transfers/{id}/confirm`
- `GET /api/v1/cutting-reports?companyId=&orderId=&reportType=`
- `POST /api/v1/cutting-reports/export`
- `GET /api/v1/cutting-reports/cutting-plan/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/cutting-output/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/cutting-balance/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/cutting-wastage/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/lay/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/color-size-cutting/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/order-wise-summary/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/panel-transfer/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/daily-cutting-production/export.xlsx|export.pdf`
- `GET /api/v1/cutting-reports/monthly-cutting-summary/export.xlsx|export.pdf`

The CuttingService prepares report rows and delegates Excel/PDF generation to the Go Gin ImportExportService at `/api/v1/import-export/reports/cutting/export`. ImportExportService exposes the same module-aware route as `/api/v1/import-export/reports/{module}/export`, so other ERP services can reuse it.

## Example Plan Request

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "orderId": "40000000-0000-0000-0000-000000000001",
  "styleId": null,
  "planNo": "CP-0002",
  "planDate": "2026-05-17",
  "colorName": "Black",
  "totalPlanQty": 1200,
  "createdBy": null
}
```

## Example Output Request

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "cuttingPlanId": "41000000-0000-0000-0000-000000000001",
  "cuttingLayId": null,
  "orderId": "40000000-0000-0000-0000-000000000001",
  "outputDate": "2026-05-17",
  "colorName": "Black",
  "sizeName": "M",
  "outputQty": 500,
  "isOverageApproved": false,
  "createdBy": null
}
```

## Example Report Export Request

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "orderId": "40000000-0000-0000-0000-000000000001",
  "reportType": "Cutting Balance",
  "fromDate": "2026-05-01",
  "toDate": "2026-05-31",
  "format": "Excel"
}
```

## Tests

```powershell
dotnet test Services\CuttingService\CuttingService.Tests\CuttingService.Tests.csproj
```
