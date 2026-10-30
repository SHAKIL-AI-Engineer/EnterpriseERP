# LeaveService

Production-oriented leave microservice for EnterpriseERP: leave types, policies, balances, applications with multi-step approval, holidays, weekly offs, earn leave, encashment, and day-type resolution for Attendance.

## Stack

- .NET 10, ASP.NET Core Web API
- SQL Server 2022, EF Core (code-first)
- Clean Architecture: `LeaveService.Api`, `LeaveService.Application`, `LeaveService.Domain`, `LeaveService.Infrastructure`, `LeaveService.Contracts`
- CQRS with MediatR, FluentValidation, AutoMapper
- JWT bearer auth; permission policies `Permission:{CODE}` (claims: `permission`)
- Redis (`IDistributedCache`) or in-memory cache when `ConnectionStrings:Redis` is empty
- RabbitMQ publisher (`erp.events` topic exchange)
- Swagger at `/swagger`

## Run locally

```bash
cd Services/LeaveService/LeaveService.Api
dotnet ef database update --project ../LeaveService.Infrastructure --startup-project .
dotnet run
```

Development applies migrations and seeds demo company `11111111-1111-1111-1111-111111111111` with sample leave types and a balance row for employee `22222222-2222-2222-2222-222222222222`.

## Configuration

See [appsettings.json](LeaveService.Api/appsettings.json): `ConnectionStrings:DefaultConnection`, optional `Redis`, `RabbitMq`, `Services:Hr|Attendance|Payroll` base URLs for HTTP integration clients, `Jwt` issuer/audience/signing key (must match AuthService token).

## API surface

All responses use `Erp.BuildingBlocks.CommonResponses.ApiResponse<T>` with `traceId`.

| Area | Routes |
|------|--------|
| Leave types | `POST/GET/PUT/PATCH ... /api/leave-types` |
| Policies | `POST/GET/PUT /api/leave-policies` |
| Balances | `POST .../generate-yearly`, `POST .../accrue-monthly`, `GET .../{employeeId}`, `POST .../adjust` |
| Applications | `POST /api/leaves/apply`, `GET /api/leaves/applications`, `PATCH .../approve|reject|cancel` |
| Holidays | CRUD under `/api/holidays` |
| Weekly off | `/api/weekly-offs` |
| Earn leave | `POST /api/earn-leaves/generate`, `GET /api/earn-leaves/{employeeId}` |
| Encashment | `/api/leave-encashments` + approve/reject/paid |
| Day type | `GET /api/day-types?companyId=&employeeId=&date=` |

### Example: apply leave (request)

```json
POST /api/leaves/apply
{
  "companyId": "11111111-1111-1111-1111-111111111111",
  "employeeId": "22222222-2222-2222-2222-222222222222",
  "leaveTypeId": "<guid-of-CL>",
  "fromDate": "2026-05-20",
  "toDate": "2026-05-22",
  "isHalfDay": false,
  "halfDayType": null,
  "reason": "Family",
  "attachmentUrl": null,
  "appliedBy": "22222222-2222-2222-2222-222222222222",
  "approvalSteps": [
    { "approvalLevel": 1, "approverUserId": null, "approverEmployeeId": null },
    { "approvalLevel": 2, "approverUserId": null, "approverEmployeeId": null }
  ]
}
```

### Example: wrapped success

```json
{
  "success": true,
  "traceId": "00-...",
  "data": { "id": "...", "status": "Pending", "totalDays": 3, "...": "..." },
  "errors": null
}
```

## Gateway (YARP)

Existing route `/api/v1/leave` targets this service. New routes are under `/api/leave-*` and `/api/leaves`, `/api/holidays`, etc. Add matching YARP routes to the same leave cluster (port 5038) or align clients to `/api/v1/leave/...` via path rewrite.

## Integration events

Published routing keys are defined in [EventTypes.cs](../../BuildingBlocks/Erp.BuildingBlocks.EventBus/EventTypes.cs) (`LeaveApplied`, `LeaveApproved`, …). `LeaveIntegrationConsumer` is a stub; replace with durable consumers and typed payloads for `PayrollLocked`, `EmployeeCreated`, etc.

## Security notes

- AutoMapper 12.x reports a known advisory; plan upgrade when a patched Extensions package is published, or replace mapping with explicit DTO construction.
- JWT `permission` claims must be issued by AuthService to match policies (`LEAVE_TYPE_MANAGE`, `LEAVE_APPLY`, …).
