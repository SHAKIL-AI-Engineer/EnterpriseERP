# MerchandisingService

Production-ready ASP.NET Core `net10.0` Web API for garments/textile ERP merchandising: buyers, styles, orders, BOM, costing, samples, TNA, material bookings, requisitions, shipment planning, approvals, and merchandising reports.

## Architecture

```text
MerchandisingService
|-- MerchandisingService.API          Controllers, JWT auth, Swagger, health
|-- MerchandisingService.Application  CQRS (MediatR), validators, mapping, cache invalidation
|-- MerchandisingService.Contracts    DTOs, requests, integration events
|-- MerchandisingService.Domain       Entities, enums, business constants
|-- MerchandisingService.Infrastructure
|   |-- EF Core + SQL Server (MerchandisingDbContext)
|   |-- Repository / unit of work
|   |-- Redis cache (IRedisCacheService)
|   |-- RabbitMQ publisher + consumer hosted service
|   `-- HTTP clients (Company, Inventory, Procurement, Production, Shipment)
`-- MerchandisingService.Tests
```

All public APIs use the versioned prefix **`/api/v1/merchandising/`**. Responses wrap data in `ApiResponse<T>` from `Erp.BuildingBlocks.CommonResponses`.

## Domain modules

| Module | Purpose |
|--------|---------|
| **Buyers** | Buyer registry, contacts, payment terms, compliance rules |
| **Catalog** | Seasons, garment items, styles, style versions, style-level BOM |
| **Master data** | Colors, sizes, units, currencies, fabric/trims types, suppliers, brands, categories |
| **Orders** | Order lifecycle, buyer POs, color-size breakdown, order BOM, costing, import/export |
| **Quotations** | Pre-order quotes, negotiations, convert-to-order |
| **TNA** | Templates, per-order calendars, milestones, delay logs |
| **Bookings** | Fabric/trims material bookings, auto-calc from BOM, allocations |
| **Requisitions** | Purchase requisitions from orders, submit workflow |
| **Samples** | Development/fit/PP samples, costing, approve/reject/submit/revise |
| **Shipment** | Shipment plans, execution, packing lists |
| **Approvals** | Multi-step approval requests (e.g. costing) |
| **Documents** | Style and order document metadata |
| **Communications** | Buyer/style/order communication log |
| **Reports** | Order summary, pipeline, TNA delay, booking status (+ CSV export) |

## Run

```powershell
dotnet restore Services\MerchandisingService\MerchandisingService.slnx
dotnet ef database update --project Services\MerchandisingService\MerchandisingService.Infrastructure --startup-project Services\MerchandisingService\MerchandisingService.API --context MerchandisingDbContext
dotnet run --project Services\MerchandisingService\MerchandisingService.API
```

Swagger: `/swagger`  
Health: `/health`  
Default URL: `http://localhost:5288`

### Platform integration (hrhub)

Run **Platform.Host** on port **5000** and **MerchandisingService** on **5288**:

```bash
dotnet run --project Platform.Host/EnterpriseERP.Platform.Host.csproj
dotnet run --project Services/MerchandisingService/MerchandisingService.API
```

YARP proxies `/api/v1/merchandising/*` → `http://127.0.0.1:5288/`.  
hrhub: `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1` and client calls under `merchandising/*` (see `hrhub/lib/services/merchandising.ts`).

| Service | Port | Proxied path |
|---------|------|----------------|
| MerchandisingService | 5288 | `/api/v1/merchandising/*` |
| ProcurementService | 5060 | `/api/v1/procurement/*` |
| InventoryService | 5041 | `/api/v1/inventory/*` |

Bulk migrations (all services): `backend/scripts/update-all-databases.ps1`.  
Operational guide: [docs/build-run-and-services.md](../../../docs/build-run-and-services.md).

## Configuration

`MerchandisingService.API/appsettings.json` uses shared ERP connection config when `ERP_CONNECTIONSTRINGS` is set (see `AddEnterpriseErpConnectionConfiguration`).

| Section | Notes |
|---------|--------|
| `ConnectionStrings:MerchandisingDb` | SQL Server database `EnterpriseERP_Merchandising` (or from central `connectionstrings.json`) |
| `ConnectionStrings:Redis` | Buyer/style list cache, order details, BOM, costing |
| `Jwt` | Same issuer/audience as Platform.Host |
| `RabbitMQ` | Exchange `erp.events`, queue `merchandising-service` |
| `Services:*` | Optional HTTP bases for Company, Inventory, Procurement, Production, Shipment |
| `Security:EnforceTenant` | Company-scoped access via building-block tenant security |

## Key business rules

- Buyer code is unique per company.
- Style number is unique per buyer.
- Order number is unique per company.
- Orders cannot be confirmed without color-size breakdown.
- Color-size breakdown total must match order quantity before confirmation.
- BOM required quantity includes wastage (`requiredQty = consumption × orderQty × (1 + wastage%)`).
- Shipment plan quantity cannot exceed remaining order quantity.
- Order status changes are stored in `OrderStatusHistories`.
- Business-table writes produce `MerchandisingAuditLogs`.
- Order confirm supports optional procurement requisition via `createRequisition=true` on confirm.

## Authorization

JWT + permission policies (`Permission:merchandising.*`). Legacy permission strings (e.g. `ORDER_CONFIRM`) are still accepted where configured in `PermissionAuthorizationHandler`.

| Policy | Permission |
|--------|------------|
| BuyerManage | `merchandising.buyer.manage` |
| StyleManage | `merchandising.style.manage` |
| OrderCreate / Update / Confirm / Cancel | `merchandising.order.*` |
| BomManage / CostingManage | `merchandising.bom.manage`, `merchandising.costing.manage` |
| SampleManage / ShipmentPlanManage | `merchandising.sample.manage`, `merchandising.shipment.manage` |
| QuotationManage / TnaManage / BookingManage | `merchandising.quotation.manage`, `merchandising.tna.manage`, `merchandising.booking.manage` |
| RequisitionManage / DocumentManage / CommunicationManage | matching `merchandising.*` keys |
| ApprovalManage / ShipmentExecutionManage / ReportView / MasterManage | matching `merchandising.*` keys |

Typical roles: `MerchandisingManager`, `Merchandiser`, `CostingOfficer`, `CompanyAdmin`, `Viewer` (read-only GETs with `[Authorize]`).

## Caching (Redis)

Company-scoped keys in `CacheKeys`:

| Key pattern | Invalidated on |
|-------------|----------------|
| `merch:buyers:{companyId}` | Buyer writes |
| `merch:styles:{companyId}:{buyerId\|all}` | Style create/update (both per-buyer and `all` keys) |
| `merch:order-details:{orderId}` | Order detail mutations |
| `merch:bom:{orderId}` | BOM changes |
| `merch:costing:{orderId}` | Costing changes |

## Reports and analytics

Merchandising analytics are **order and pipeline reports** in this service (not HR Workforce Analytics, which lives under `/api/v1/dashboard/*` in Platform.Host).

| Endpoint | Use |
|----------|-----|
| `GET .../reports/order-summary` | Filtered order list for summary screens |
| `GET .../reports/order-summary.csv` | CSV export |
| `GET .../reports/order-pipeline` | Counts and values grouped by `OrderStatus` |
| `GET .../reports/order-pipeline.csv` | Pipeline CSV |
| `GET .../reports/tna-delay` | Late milestones |
| `GET .../reports/tna-delay.csv` | TNA delay CSV |
| `GET .../reports/booking-status` | Material booking progress by order |
| `GET .../reports/booking-status.csv` | Booking status CSV |

**hrhub surfaces**

| UI route | API |
|----------|-----|
| `/merchandising/dashboard` | `order-pipeline` |
| `/merchandising/orders/summary` | `order-summary` + `order-pipeline` |
| `/merchandising/reports` | All report endpoints + CSV downloads |
| `/merchandising/production`, `/merchandising/production-plan` | `order-pipeline` |

## Main API endpoints

### Buyers — `/api/v1/merchandising/buyers`

- `POST /` — create
- `GET /?companyId=` — list (cached)
- `GET /{id}?companyId=` — by id
- `PUT /{id}` — update
- `PATCH /{id}/activate` | `/deactivate`
- `GET /{buyerId}/contacts` | `POST /contacts`
- `GET /{buyerId}/payment-terms` | `POST /payment-terms`
- `GET /{buyerId}/compliance-rules` | `POST /compliance-rules`

### Catalog — seasons, garment-items, styles

- `POST|GET /api/v1/merchandising/seasons`
- `POST|GET /api/v1/merchandising/garment-items`
- `POST|GET /api/v1/merchandising/styles?companyId=&buyerId=`
- `GET|PUT /api/v1/merchandising/styles/{id}`
- `GET /styles/{styleId}/versions` | `POST /styles/versions`
- `GET /styles/{styleId}/bom-items` | `POST /styles/bom-items`
- `POST|GET /api/v1/merchandising/styles/{styleId}/documents`

### Master data — `/api/v1/merchandising/master/{resource}`

Resources: `colors`, `sizes`, `size-ratios`, `units`, `currencies`, `fabric-types`, `trims-types`, `suppliers`, `brands`, `garment-categories`.

- `POST|GET|GET/{id}|PUT/{id}|DELETE/{id}`

Color CSV import:

- `GET /api/v1/merchandising/master/colors/template`
- `POST /api/v1/merchandising/master/colors/import?companyId=`

### Orders — `/api/v1/merchandising/orders`

- `POST|GET|GET/{id}|PUT/{id}`
- `GET /template` | `POST /import/preview` | `POST /import`
- `GET /{id}/export` | `GET /{id}/details` | `GET /{id}/worksheet`
- `PATCH /{id}/confirm?createRequisition=` | `PATCH /{id}/cancel`
- Nested: `buyer-pos`, `color-size-breakdown`, `bom-items`, `bom-calculate`, `costing`, `copy-style-bom`, `assignment`, `commercial-terms`, `costing/submit-approval`
- `POST|GET /api/v1/merchandising/orders/{orderId}/documents`

Standalone resources:

- `PUT /api/v1/merchandising/buyer-pos/{id}`
- `PUT|DELETE /api/v1/merchandising/color-size-breakdown/{id}`
- `PUT|DELETE /api/v1/merchandising/bom-items/{id}`

### Extended workflows

- **Quotations** `/quotations` — CRUD, negotiations, `POST /{id}/convert-to-order`
- **TNA** `/tna` — templates, `POST /orders/{orderId}/generate`, milestones, delay logs
- **Bookings** `/bookings` — create, auto-calculate, fabric/trims details, allocations
- **Requisitions** `/requisitions` — create, list, submit, `POST /from-order/{orderId}`

### Samples, shipment, approvals

- `/samples` — create, list, approve/reject/submit/revise, costing
- `/shipment-plans` — create, list, update
- `/shipment-executions` — create, get by plan, packing lists
- `/approvals` — create, pending list, approve/reject step

### Other

- `/communications` — log and list by style/order
- `/reports/*` — see [Reports and analytics](#reports-and-analytics)

## Integration events

**Published** (RabbitMQ topic, routing key = event name):  
`BuyerCreated`, `StyleCreated`, `OrderConfirmed`, `OrderCancelled`, `BomCreated`, `CostingCreated`, `CostingSubmitted`, `SampleSubmitted`, `SampleApproved`, `ShipmentPlanCreated`, `QuotationCreated`, `QuotationConverted`, `MaterialBookingCreated`, `RequisitionCreated`, `RequisitionSubmitted`, `TnaGenerated`.

**Consumed** (updates order tracking):  
`CuttingStarted`, `ProductionStarted`, `ProductionCompleted`, `ShipmentCompleted`.

## Cross-service HTTP clients

| Client | Used for |
|--------|----------|
| InventoryService | Item exists / stock balance checks |
| ProcurementService | Requisition from BOM on confirm; PO from requisition |
| ProductionService / ShipmentService | Order production/shipment status (best-effort) |
| CompanyService | Company snapshot for validations |

Clients degrade gracefully when satellites are offline (local dev).

## Example requests

Create buyer:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "buyerCode": "ZARA",
  "buyerName": "Zara",
  "country": "Spain",
  "contactPerson": "Maria Lopez",
  "email": "maria@example.com",
  "phone": "+34-000-000",
  "address": "Arteixo, Spain"
}
```

Create order:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "buyerId": "30000000-0000-0000-0000-000000000001",
  "styleId": "33000000-0000-0000-0000-000000000001",
  "orderNo": "ORD-001",
  "orderDate": "2026-05-16",
  "shipmentDate": "2026-07-30",
  "totalOrderQty": 50000,
  "unitPrice": 4.25,
  "currencyCode": "USD"
}
```

Create BOM item:

```json
{
  "companyId": "20000000-0000-0000-0000-000000000001",
  "itemType": "Fabric",
  "itemCode": "FAB-SJ-160",
  "itemName": "160 GSM Single Jersey",
  "unitName": "Kg",
  "consumption": 0.18,
  "wastagePercent": 3,
  "unitPrice": 5.2
}
```

Standard success envelope:

```json
{
  "success": true,
  "message": "BOM item created.",
  "data": { },
  "errors": null
}
```

## Tests

```powershell
dotnet test Services\MerchandisingService\MerchandisingService.Tests\MerchandisingService.Tests.csproj
```

Coverage includes validators, BOM calculations, order/color import, handler behavior, and API integration smoke (`GET /api/v1/merchandising/buyers`).
