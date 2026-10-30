# SecurityService

Production-oriented .NET 10 Web API for garments/textile factory gate security operations. The service is built with Clean Architecture, CQRS/MediatR, EF Core Code First for SQL Server 2022, repository/unit of work, FluentValidation, AutoMapper, JWT authentication, role/permission authorization, RabbitMQ integration events, Redis cache, Swagger, API versioning under `/api/v1`, global exception handling, seed data, migrations, and tests.

## Projects

- `SecurityService.Domain` - gate-operation entities, workflow constants, roles, permissions.
- `SecurityService.Contracts` - DTOs, API requests/responses, integration events.
- `SecurityService.Application` - commands, queries, handlers, validators, business services, report builders, abstractions.
- `SecurityService.Infrastructure` - EF Core `SecurityDbContext`, repository/unit of work, SQL Server migrations, Redis, RabbitMQ, external service clients.
- `SecurityService.API` - controllers, JWT, authorization policies, Swagger, API versioning, exception middleware.
- `SecurityService.Tests` - unit and integration tests for gate business rules and API startup.

## Main API

All routes are versioned with `/api/v1`.

- Gates: `POST /api/v1/gates`, `GET /api/v1/gates?companyId=...`, `PUT /api/v1/gates/{id}`, `PATCH /api/v1/gates/{id}/activate`, `PATCH /api/v1/gates/{id}/deactivate`
- Visitors: `POST /api/v1/visitors`, `GET /api/v1/visitors`, `GET /api/v1/visitors/{id}`, `PATCH /api/v1/visitors/{id}/blacklist`
- Visitor entry: `POST /api/v1/visitor-entries`, `PATCH /api/v1/visitor-entries/{id}/checkout`, `PATCH /api/v1/visitor-entries/{id}/cancel`
- Employee out pass: `POST /api/v1/employee-out-passes`, approval/out/return/cancel workflow endpoints
- Vehicle: `POST /api/v1/vehicles`, `POST /api/v1/vehicle-entries`, `PATCH /api/v1/vehicle-entries/{id}/exit`
- Gate pass: `POST /api/v1/gate-passes`, submit/approve/issue/complete/cancel workflow endpoints
- Returnable returns: `POST /api/v1/returnable-gate-pass-returns`
- Chalan: `POST /api/v1/chalans`, approve/cancel endpoints
- Bill entry: `POST /api/v1/bill-entries`, approve/reject/send-to-accounts endpoints
- Security checks: `POST /api/v1/security-checks`
- Reports: `GET /api/v1/gate-reports/*`, `POST /api/v1/gate-reports/export`

## Configuration

Set `ConnectionStrings:SecurityDb` for SQL Server and `ConnectionStrings:Redis` for Redis. RabbitMQ defaults to `erp.events` with a `security-service` queue. External clients are configured under `Services`.

```json
{
  "ConnectionStrings": {
    "SecurityDb": "Server=.;Database=SecurityServiceDB;Trusted_Connection=True;TrustServerCertificate=True",
    "Redis": "localhost:6379"
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "UserName": "erp",
    "Password": "erp_dev_password",
    "Exchange": "erp.events"
  }
}
```

## Example Requests

Create a material-out gate pass:

```http
POST /api/v1/gate-passes
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "gateId": "31000000-0000-0000-0000-000000000001",
  "gatePassNo": "GP-2026-0001",
  "gatePassDate": "2026-05-17",
  "gatePassType": "MaterialOut",
  "direction": "OUT",
  "supplierId": "41000000-0000-0000-0000-000000000001",
  "vehicleNo": "DHAKA-METRO-11-0001",
  "driverName": "Rahim",
  "purpose": "Subcontract washing",
  "isReturnable": true,
  "expectedReturnDate": "2026-05-24",
  "items": [
    {
      "itemName": "Fabric Roll",
      "unitName": "Roll",
      "quantity": 12,
      "remarks": "Return after process"
    }
  ]
}
```

Example response:

```json
{
  "success": true,
  "message": "Gate pass created.",
  "data": {
    "gatePassNo": "GP-2026-0001",
    "gatePassType": "MaterialOut",
    "direction": "OUT",
    "approvalStatus": "Pending",
    "status": "Draft"
  }
}
```

Send an approved bill to AccountsService:

```http
PATCH /api/v1/bill-entries/{id}/send-to-accounts
Authorization: Bearer {token}
```

Published RabbitMQ payload:

```json
{
  "eventName": "BillEntrySentToAccounts",
  "companyId": "20000000-0000-0000-0000-000000000001",
  "billEntryId": "d1a7a8f1-1d33-4d8a-a637-25c979ff71dc",
  "billNo": "BILL-001",
  "supplierId": "41000000-0000-0000-0000-000000000001",
  "amount": 10000,
  "totalAmount": 11500,
  "billDate": "2026-05-17"
}
```

## Run

```powershell
dotnet ef database update --project Services\SecurityService\SecurityService.Infrastructure --startup-project Services\SecurityService\SecurityService.API
dotnet run --project Services\SecurityService\SecurityService.API
dotnet test Services\SecurityService\SecurityService.slnx
```
