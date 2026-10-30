# PayrollService

Enterprise ERP payroll microservice for multi-company garments/textile payroll on .NET 10, SQL Server, EF Core, Clean Architecture, CQRS, MediatR, FluentValidation, JWT auth, Redis cache, RabbitMQ integration-event contracts, and Swagger.

## Projects

- `PayrollService.Api` - ASP.NET Core Web API, JWT, Swagger, controllers, exception middleware.
- `PayrollService.Application` - CQRS commands/queries, handlers, validators, payroll/OT/bonus/final-settlement services.
- `PayrollService.Contracts` - DTOs, response wrapper, integration-event payloads.
- `PayrollService.Domain` - entities and payroll enums/roles/permissions.
- `PayrollService.Infrastructure` - EF Core SQL Server persistence, migrations, repository implementation, Redis cache, RabbitMQ publisher/consumer adapters, external service clients.
- `PayrollService.Tests` - salary, OT, bonus, and payroll process tests.

## Run

```powershell
dotnet restore Services\PayrollService\PayrollService.slnx
dotnet ef database update --project Services\PayrollService\PayrollService.Infrastructure --startup-project Services\PayrollService\PayrollService.Api
dotnet run --project Services\PayrollService\PayrollService.Api
```

Swagger is available at `/swagger`.

## Seed Policies

The initial migration seeds active policies for:

- Unity: monthly, fixed 30 days, OT enabled, no tiffin/night bill.
- Ekushe: monthly, calendar days, OT, tiffin, attendance bonus.
- Dyeing: monthly, fixed 30 days, OT, tiffin, night bill.

## Example Requests

Create payroll policy:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "policyName": "Unity General Duty Monthly",
  "salaryCalculationType": "Monthly",
  "monthDayCalculationType": "FixedDays",
  "fixedMonthDays": 30,
  "allowOvertime": true,
  "overtimeCalculationType": "BasicSalaryBased",
  "overtimeMultiplier": 2,
  "overtimeDivisor": 208,
  "allowTiffinBill": false,
  "allowNightBill": false
}
```

Assign employee salary:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "employeeId": "30000000-0000-0000-0000-000000000001",
  "salaryStructureId": null,
  "grossSalary": 30000,
  "basicSalary": 15600,
  "houseRent": 9000,
  "medicalAllowance": 1500,
  "conveyanceAllowance": 1000,
  "foodAllowance": 2900,
  "effectiveFrom": "2026-05-01",
  "createdBy": null
}
```

Process payroll:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "yearNo": 2026,
  "monthNo": 5,
  "processedBy": "40000000-0000-0000-0000-000000000001",
  "forceReprocess": false
}
```

Typical response:

```json
{
  "success": true,
  "message": "Payroll processed.",
  "data": {
    "payrollPeriodId": "50000000-0000-0000-0000-000000000001",
    "totalEmployees": 1250,
    "grossSalary": 37500000,
    "totalEarnings": 39250000,
    "totalDeduction": 1250000,
    "netSalary": 38000000,
    "status": "Processed"
  },
  "errors": []
}
```

## Verification

```powershell
dotnet build Services\PayrollService\PayrollService.slnx
dotnet test Services\PayrollService\PayrollService.Tests\PayrollService.Tests.csproj
```
