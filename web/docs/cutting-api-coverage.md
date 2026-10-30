# Cutting API coverage matrix

Gateway: resource-specific routes under `/api/v1/*` → CuttingService (:5044)

Client: `hrhub/lib/services/cutting.ts` (`cuttingService`)

Types: `hrhub/lib/types/cutting.ts`

## Smoke verification

```bash
cd hrhub
set TEST_COMPANY_ID=20000000-0000-0000-0000-000000000001
set CUTTING_TEST_TOKEN=<jwt>
node scripts/cutting-api-smoke.mjs
```

Optional: `TEST_PLAN_ID`, `TEST_ORDER_ID`

Recovery if gateway up but cutting 502:

```powershell
powershell -File backend/Infrastructure/Scripts/start-cutting.ps1
```

### Manual UI checklist

1. Sign in as Cutting / Admin; select active company.
2. Network filter: `cutting-plans`, `fabric-issues`, `cutting-lays`, etc.
3. Flow: plan → size breakdown → approve → fabric issue → lay → output → wastage → bundle → panel transfer → report.
4. Expect HTTP 2xx, `success: true`, no mock arrays on list pages.

## Backend routes ↔ client ↔ pages

| Backend route | Client method | Page(s) |
|---------------|---------------|---------|
| `GET/POST cutting-plans` | `getPlans`, `createPlan` | planning |
| `GET/PATCH cutting-plans/{id}/*` | `getPlanById`, `approvePlan`, etc. | planning/[id] |
| `GET/POST .../size-breakdowns` | `getSizeBreakdowns`, `addSizeBreakdown` | planning/[id] |
| `GET/POST fabric-issues-to-cutting` | `getFabricIssues`, `createFabricIssue` | fabric-booking |
| `GET/POST cutting-lays` | `getLays`, `createLay` | marker-lay |
| `GET/POST cutting-outputs` | `getOutputs`, `createOutput` | entry, dashboard |
| `GET/POST cutting-wastages` | `getWastages`, `createWastage` | wastage |
| `GET/POST/PATCH cutting-bundles` | `getBundles`, `createBundle`, `updateBundleStatus` | bundles, bundles/[id] |
| `GET/POST/PATCH cutting-panel-transfers` | `getPanelTransfers`, `createPanelTransfer`, `confirmPanelTransfer` | send-to-sewing, transfers/[id] |
| `GET cutting-balances` | `getBalances` | dashboard (optional) |
| `GET cutting-reports` | `getReport`, `exportReport` | reports |

## Redirects

| Old route | Target |
|-----------|--------|
| `/cutting/plan`, `/cutting/create-job` | `/cutting/planning` |
| `/cutting/markers`, `/cutting/spreading` | `/cutting/marker-lay` |
| `/cutting/production` | `/cutting/entry` |
| `/cutting/bundling` | `/cutting/bundles` |
| `/cutting/issue`, `/cutting/fabric-rolls` | `/cutting/fabric-booking` |

## Cross-module boundaries

| Concern | Owner |
|---------|--------|
| Program orders, color/size | MerchandisingService |
| Cutting plans, lays, outputs, bundles | CuttingService |
| Fabric issue to cutting floor | CuttingService `fabric-issues-to-cutting` |
| Panel handoff to sewing | CuttingService → ProductionService |

## Build verification

```bash
cd hrhub && yarn build
dotnet build backend/Services/CuttingService/CuttingService.API/CuttingService.API.csproj -c Release
dotnet ef database update --project backend/Services/CuttingService/CuttingService.Infrastructure --startup-project backend/Services/CuttingService/CuttingService.API --context CuttingDbContext
```
