# Security Gate API coverage matrix

Gateway: SecurityService hosted in **Platform.Host** (`:5000/api/v1/*`) — no YARP prefix.

Client: `hrhub/lib/services/security.ts` (`securityService`)

Types: `hrhub/lib/types/security.ts`

## Smoke verification

```bash
cd hrhub
set TEST_COMPANY_ID=20000000-0000-0000-0000-000000000001
set SECURITY_TEST_TOKEN=<jwt>
node scripts/security-api-smoke.mjs
```

### Manual UI checklist

1. Sign in as SecurityManager / GateOfficer / Admin; select active company.
2. Network filter: `gates`, `visitor-entries`, `gate-passes`, `chalans`, etc.
3. Flow: visitor check-in → checkout → gate pass (submit → approve → issue → complete) → chalan → bill → send to accounts → daily register → report export.
4. Expect HTTP 2xx, `success: true`, no mock arrays on list pages.

## Backend routes ↔ client ↔ pages

| Backend route | Client method | Page(s) |
|---------------|---------------|---------|
| `GET/POST gates` | `getGates`, `createGate`, `updateGate`, `activateGate`, `deactivateGate` | master/gates |
| `GET/POST visitors` | `getVisitors`, `createVisitor`, `blacklistVisitor` | master/visitors |
| `GET/POST visitor-entries` | `getVisitorEntries`, `createVisitorEntry`, `checkoutVisitorEntry`, `cancelVisitorEntry` | visitor-entries, visitor-entries/[id], dashboard |
| `GET/POST employee-out-passes` | `getEmployeeOutPasses`, `createEmployeeOutPass`, workflow patches | employee-out-passes, [id] |
| `GET/POST vehicles` | `getVehicles`, `createVehicle` | master/vehicles |
| `GET/POST vehicle-entries` | `getVehicleEntries`, `createVehicleEntry`, `exitVehicleEntry` | vehicle-entries, [id] |
| `GET/POST/PATCH gate-passes` | `getGatePasses`, `createGatePass`, workflow patches | gate-passes, [id] |
| `GET/POST returnable-gate-pass-returns` | `getReturnableReturns`, `createReturnableReturn` | returnable-returns |
| `GET/POST/PATCH chalans` | `getChalans`, `createChalan`, `approveChalan`, `cancelChalan` | chalans, [id] |
| `GET/POST/PATCH bill-entries` | `getBillEntries`, `createBillEntry`, approve/reject/sendToAccounts | bill-entries, [id] |
| `GET/POST security-checks` | `getSecurityChecks`, `createSecurityCheck` | checks |
| `GET gate-reports/*` | `getDailyRegister`, report getters, `exportReport` | daily-register, reports |

## Redirects

| Old route | Target |
|-----------|--------|
| `/production/shipment/gate-pass` | `/security/gate-passes` |

## Cross-module boundaries

| Concern | Owner |
|---------|--------|
| Employee picker (out pass, visitor meet) | HR `employeeService` |
| Order / buyer pickers (chalan, gate pass) | MerchandisingService |
| Store buyers (supplier-like refs) | StoreService |
| Bill sync to finance | SecurityService → Accounts (send-to-accounts) |

## Build verification

```bash
cd hrhub && yarn build
```

Platform.Host must be running on `:5000` for runtime smoke tests.

## Troubleshooting

If all security APIs return **HTTP 400** with message `The AuthorizationPolicy named: 'GATE_REPORT_VIEW' was not found`:

- Security controllers run **inside Platform.Host**, not the standalone SecurityService.API process.
- Authorization policies (`GATE_REPORT_VIEW`, `GATE_PASS_CREATE`, etc.) must be registered in [`backend/Platform.Host/Program.cs`](../../backend/Platform.Host/Program.cs) (same as SecurityService.API/Program.cs).
- **Restart Platform.Host** after backend changes (`dotnet build` + restart or `start-platform.ps1`).

Without auth you should get **401**; with valid JWT + company you should get **200** and `success: true`.
