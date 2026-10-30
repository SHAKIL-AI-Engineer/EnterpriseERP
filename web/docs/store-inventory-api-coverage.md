# Store & Inventory API coverage matrix

Gateway prefixes:

- `/api/v1/store/*` → StoreService (:5042)
- `/api/v1/inventory/*` → InventoryService (:5041)

Clients:

- `hrhub/lib/services/store.ts` (`storeService`)
- `hrhub/lib/services/inventory.ts` (`inventoryService`)

Types: `hrhub/lib/types/store.ts`, `hrhub/lib/types/inventory.ts`

## Smoke verification

### Automated

```bash
cd hrhub
set TEST_COMPANY_ID=<your-company-guid>
set STORE_TEST_TOKEN=<jwt-from-login>
node scripts/store-api-smoke.mjs

set INVENTORY_TEST_TOKEN=<jwt>
node scripts/inventory-api-smoke.mjs
```

Optional nested GETs: `TEST_ITEM_ID`, `TEST_ORDER_ID`, `TEST_GRN_ID`, `TEST_CATEGORY_ID`.

### Manual UI checklist

1. Sign in as Store / StoreKeeper (or Admin) and select active company.
2. Open DevTools → Network; filter `store` and `inventory`.
3. Run priority flow:
   - **Master** → category → unit → item → buyer
   - **Order** → create order with lines → view order detail
   - **Booking** → create accessories booking → issue partial qty
   - **Stock** → stock in → stock out → current stock → reorder alert
   - **GRN** → create GRN → open GRN detail
   - **Reports** → consumption, item stock, booking vs issue, shortage
   - **Ledger** → pick item → view running balance
   - **Inventory** → list warehouse stock (store items or inventory service)
4. Expect: HTTP 2xx, `success: true` in JSON body, no console errors, no mock arrays on list pages.

## Store routes ↔ client ↔ pages

| Backend route | Client method | Primary page(s) | Smoke |
|---------------|---------------|-----------------|-------|
| `GET categories` | `getCategories` | master/item-category | GET list |
| `GET/POST/PUT/DELETE categories/{id}` | CRUD | item-category | optional ID |
| `GET units` | `getUnits` | master/unit-setup | GET list |
| `GET items` | `getItems` | master/item-setup, current-stock, inventory | GET list |
| `GET buyers` | `getBuyers` | master/buyer-setup, orders/create | GET list |
| `GET orders` | `getOrders` | orders/list | GET list |
| `GET orders/{id}` | `getOrderById` | orders/[id] | optional ID |
| `POST orders` | `addOrder` | orders/create | manual |
| `GET bookings?type=` | `getBookings` | booking/* | GET list |
| `POST bookings` | `addBooking` | booking-manager | manual |
| `POST bookings/{id}/issue` | `issueBooking` | booking-manager | manual |
| `POST stock-in` | `stockIn` | management/stock-in | manual |
| `POST stock-out` | `stockOut` | management/stock-out | manual |
| `GET transactions` | `getTransactions` | dashboard | GET list |
| `GET dashboard-summary` | `getDashboardSummary` | dashboard | GET |
| `GET low-stock` | `getLowStock` | dashboard, reorder-alert | GET |
| `GET grns` | `getGrns` | grn | GET list |
| `GET grns/{id}` | `getGrnById` | grns/[id] | optional ID |
| `POST grns` | `addGrn` | grn | manual |
| `GET ledger?itemId=` | `getLedger` | ledger | optional itemId |
| `GET shortage-report` | `getShortageReport` | reports/shortage | GET |
| `GET reports/consumption` | `getConsumptionReport` | reports/consumption | GET |
| `GET reports/item-stock` | `getItemStockReport` | reports/item-stock | GET |
| `GET reports/booking-vs-issue` | `getBookingVsIssueReport` | reports/booking-vs-issue | GET |

## Inventory routes ↔ client ↔ pages

| Backend route | Client method | Primary page(s) | Smoke |
|---------------|---------------|-----------------|-------|
| `GET items` | `getItems` | inventory (cross-check) | GET list |
| `GET items/{id}` | `getItemById` | — | optional ID |
| `GET items/{id}/transactions` | `getItemTransactions` | ledger (alt) | optional ID |
| `GET transactions` | `getTransactions` | dashboard (alt) | GET list |
| `POST receive` | `receive` | (via Store stock-in sync) | manual |
| `POST items/{id}/issue` | `issue` | (via Store stock-out sync) | manual |
| `GET items/{id}/stock-balance` | `getStockBalance` | — | optional ID |

## Redirects / consolidated routes

| Old route | Action |
|-----------|--------|
| `/store/items` | Redirect → `/store/master/item-setup` |
| `/store/issue`, `/store/material-issue` | Redirect → `/store/management/stock-out` |
| `/store/material-receive` | Redirect → `/store/management/stock-in` |

## Cross-module boundaries

| Concern | Owner |
|---------|-------|
| Program orders, BOM, merch material bookings | MerchandisingService |
| Warehouse SKU, GRN, store bookings, store orders | StoreService |
| Physical stock balance / ledger | InventoryService |

StoreService calls InventoryService on stock-in/out by item code (`InventorySyncClient`).

## Build verification

```bash
cd hrhub && yarn build
dotnet build backend/Services/StoreService/StoreService.API/StoreService.API.csproj -c Release
dotnet build backend/Services/InventoryService/InventoryService.API/InventoryService.API.csproj -c Release
```
