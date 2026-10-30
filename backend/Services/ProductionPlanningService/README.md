# ProductionPlanningService

Line capacity planning and planning balances. Port **5043** (avoids Platform store proxy on 5042).

```powershell
dotnet run --project Services\ProductionPlanningService\ProductionPlanningService.API --urls http://0.0.0.0:5043
```

Gateway: `/api/v1/production/line-plans`, `/api/v1/production/planning-balances`.
