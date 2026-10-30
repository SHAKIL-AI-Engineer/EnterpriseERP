# Microservice shells (strangler placeholders)

These **minimal ASP.NET Core** apps reserve **ports** and **URL prefixes** so the API Gateway can route traffic before real Clean Architecture services replace them.

Each host exposes:

- `GET /health` — health checks
- `GET /api/v1/<scope>` and `GET /api/v1/<scope>/**` — JSON stub identifying the service

| Project | Scope | Port |
|---------|-------|------|
| Erp.Shift.Shell | `shift` | 5036 |
| Erp.Attendance.Shell | `attendance` | 5037 |
| Erp.Leave.Shell | `leave` | 5038 |
| Erp.Payroll.Shell | `payroll` | 5039 |
| Erp.Accounts.Shell | `accounts` | 5040 |
| Erp.Inventory.Shell | `inventory` | 5041 |
| Erp.Production.Shell | `production` | 5042 |
| Erp.Merchandising.Shell | `merchandising` | 5043 |
| Erp.Cutting.Shell | `cutting` | 5044 |
| Erp.Bills.Shell | `bills` | 5045 |
| Erp.Report.Shell | `report` | 5046 |
| Erp.Notification.Shell | `notification` | 5047 |
| Erp.Audit.Shell | `audit` | 5048 |
| Erp.FileStorage.Shell | `filestorage` | 5049 |

Build the isolated solution:

```bash
cd EnterpriseERP/Services/MicroserviceShells
dotnet build MicroserviceShells.slnx
```

Integration event names for future consumers live in `Erp.BuildingBlocks.EventBus.EventTypes`.
