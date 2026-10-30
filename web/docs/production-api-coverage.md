# Production API coverage

Gateway: **Platform.Host** `http://localhost:5000/api/v1`

| Service | Port | Routes |
|---------|------|--------|
| Production Planning | 5043 | `/production/line-plans`, `/production/planning-balances` |
| Sewing | 5130 | `/sewing-lines`, `/production-assignments`, `/production-targets`, `/sewing-balances`, `/sewing-outputs` |
| Shipment | 5140 | `/shipments/*` |
| Finishing + Quality | in-process | `/finishing-*`, `/ironing-outputs`, `/folding-packings`, `/quality-inspections` |
| Merchandising orders | 5288 (via gateway) | `/merchandising/orders` |

## hrhub clients

| Client | Path |
|--------|------|
| `lib/services/production/sewing.ts` | Sewing CRUD + reports |
| `lib/services/production/planning.ts` | Line plans + balances |
| `lib/services/production/shipment.ts` | Executions + reports |
| `lib/services/production/finishing.ts` | Receives, ironing, folding, reports |
| `lib/services/production/quality.ts` | Inspections |
| `lib/services/production/orders.ts` | Merchandising order picker |
| Legacy adapters | `production-line.ts`, `production-assignment.ts`, `production-target.ts`, `production.ts` |

## Pages ↔ APIs

| Page | API |
|------|-----|
| `/production/dashboard` | Lines, assignments, daily report, balances, orders |
| `/production/production-list` | Merchandising orders (read-only) |
| `/production/production-line` | `sewing-lines` |
| `/production/line-assign` | `production-assignments` + merchandising orders |
| `/production/target` | `production-targets` |
| `/production/daily-input` | `daily-records` |
| `/production/daily-report` | `reports/daily` |
| `/production/monthly-report` | `reports/monthly` |
| `/production/profit-loss` | `planning-balances` |
| `/production/finishing/*` | Finishing + Quality |
| `/production/shipment/list`, `report` | Shipment executions + reports |
| `/production/shipment/gate-pass` | Redirect → `/security/gate-passes` |
| `/production/shipment/vehicle` | Redirect → `/security/vehicle-entries` |
| `/production/expense/*` | **Not in production API scope** (local/legacy forms) |

## Smoke

```bash
cd hrhub
set TEST_COMPANY_ID=<company-guid>
set PRODUCTION_TEST_TOKEN=<jwt>
node scripts/production-api-smoke.mjs
```

## Build

```bash
cd hrhub && yarn build
dotnet build backend/Platform.Host/EnterpriseERP.Platform.Host.csproj
backend/Infrastructure/Scripts/start-production.ps1
```

All production list pages use `ProductionCompanyGate` — select active company in the header first.
