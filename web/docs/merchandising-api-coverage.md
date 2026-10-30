# Merchandising API coverage matrix

Gateway prefix: `/api/v1/merchandising/*` (Platform.Host → MerchandisingService).

Client: `hrhub/lib/services/merchandising.ts` (`merchandisingService`).

Last updated: implementation of Merchandising API Completion plan.

## Smoke verification

### Automated

```bash
cd hrhub
set TEST_COMPANY_ID=<your-company-guid>
set MERCH_TEST_TOKEN=<jwt-from-login>
node scripts/merchandising-api-smoke.mjs
```

Optional nested GETs: `TEST_BUYER_ID`, `TEST_ORDER_ID`, `TEST_STYLE_ID`, `TEST_QUOTATION_ID`, `TEST_SHIPMENT_PLAN_ID`, `TEST_APPROVAL_ID`.

### Manual UI checklist

1. Sign in as Merchandiser (or Admin) and select active company.
2. Open DevTools → Network; filter `merchandising`.
3. Run priority flow:
   - **Buyer** → create/edit, contacts, payment terms, compliance (reload detail).
   - **Style** → add season/garment type, create style, open style detail (versions/BOM).
   - **Order** → create with color/size, confirm (+ optional requisition), copy BOM, calculate BOM.
   - **Booking** → create trims/fabric booking, auto-calculate, allocation.
   - **T&A** → generate calendar for order.
   - **Shipment** → plan → record execution (loads existing) → packing list.
   - **Reports** → preview + CSV export.
4. Expect: HTTP 2xx, `success: true` in JSON body, no console errors.

## Service methods — UI usage

| Method | UI surface | Notes |
|--------|------------|-------|
| `getBuyers`, `getBuyerById`, CRUD buyers | `buyers/page.tsx` | Detail uses `getBuyerById` |
| `getBuyerContacts`, `createBuyerContact` | `buyers/page.tsx` | |
| `getBuyerPaymentTerms`, `createBuyerPaymentTerm` | `buyers/page.tsx` | GET added backend Phase 4 |
| `getBuyerComplianceRules`, `createBuyerComplianceRule` | `buyers/page.tsx` | GET added backend Phase 4 |
| `getSeasons`, `createSeason` | `styles/page.tsx` | Add Season dialog |
| `getGarmentItems`, `createGarmentItem` | `styles/page.tsx` | Add Garment Type dialog |
| `getStyles`, `getStyleById`, CRUD style | `styles/page.tsx`, `styles/[id]/page.tsx` | |
| `getStyleVersions`, `createStyleVersion` | `styles/[id]/page.tsx` | |
| `getStyleBomItems`, `createStyleBomItem` | `styles/[id]/page.tsx`, `bom/page.tsx` | |
| `getMasterData*`, `create/update/delete` | `colors`, `brands`, `master/[resource]` | `getMasterDataById` on edit |
| `getOrders`, `getOrderById`, `getOrderDetails` | orders module | |
| `confirmOrder(id, createRequisition)` | `orders/details/[id]/page.tsx` | Checkbox on confirm |
| `updateBuyerPo` | `orders/details/[id]/page.tsx` | Inline edit Buyer PO tab |
| `getBuyerPos`, `createBuyerPo` | order details | |
| `getQuotations`, `getQuotationById`, `updateQuotation` | `quotations/*` | Edit dialog on detail |
| `getQuotationNegotiations`, `addQuotationNegotiation` | `quotations/[id]/page.tsx` | |
| `createApprovalRequest`, `getApprovalRequest` | `approvals/page.tsx` | Create + detail sheet |
| `getPendingApprovals`, `approveStep`, `rejectStep` | `approvals/page.tsx` | |
| `getShipmentExecutionByPlan` | `shipment/page.tsx` | On open execution dialog |
| `getOrderWorksheet` | `orders/worksheet`, `AccessoryProcurementMatrix` | Matrix on accessory details |

All other `merchandisingService` methods are wired to existing merchandising pages from the phased rebuild (bookings, requisitions, documents, reports, samples, TNA, etc.).

## Backend routes ↔ client (summary)

| Backend route | Client method | Primary page(s) | Smoke |
|---------------|---------------|-----------------|-------|
| `GET buyers` | `getBuyers` | buyers, filters | GET list |
| `GET buyers/{id}` | `getBuyerById` | buyers detail | optional ID |
| `GET buyers/{id}/contacts` | `getBuyerContacts` | buyers | optional ID |
| `GET buyers/{id}/payment-terms` | `getBuyerPaymentTerms` | buyers | optional ID |
| `GET buyers/{id}/compliance-rules` | `getBuyerComplianceRules` | buyers | optional ID |
| `POST buyers/payment-terms` | `createBuyerPaymentTerm` | buyers | manual |
| `POST buyers/compliance-rules` | `createBuyerComplianceRule` | buyers | manual |
| `GET seasons` | `getSeasons` | styles | GET list |
| `POST seasons` | `createSeason` | styles | manual |
| `GET garment-items` | `getGarmentItems` | styles | GET list |
| `POST garment-items` | `createGarmentItem` | styles | manual |
| `GET styles`, `GET styles/{id}` | `getStyles`, `getStyleById` | styles | GET list / optional ID |
| `GET master/{resource}` | `getMasterData` | colors, brands, master/* | GET list |
| `GET master/{resource}/{id}` | `getMasterDataById` | master edit | manual |
| `GET orders`, `GET orders/{id}/details` | `getOrders`, `getOrderDetails` | orders | GET list / optional ID |
| `PATCH orders/{id}/confirm?createRequisition=` | `confirmOrder` | order details | manual |
| `PUT buyer-pos/{id}` | `updateBuyerPo` | order details | manual |
| `GET quotations/{id}/negotiations` | `getQuotationNegotiations` | quotation detail | optional ID |
| `PUT quotations/{id}` | `updateQuotation` | quotation detail | manual |
| `GET approvals/pending` | `getPendingApprovals` | approvals | GET list |
| `GET approvals/{id}` | `getApprovalRequest` | approvals sheet | optional ID |
| `POST approvals` | `createApprovalRequest` | approvals | manual |
| `GET shipment-executions?shipmentPlanId=` | `getShipmentExecutionByPlan` | shipment | optional plan ID |
| `GET reports/*` | report getters | reports, dashboard | GET list |

Path alignment verified for documents (`styles/{id}/documents`, `orders/{id}/documents`), requisitions (`requisitions/from-order/{orderId}`), bookings subpaths (`fabric-details`, `trims-details`, `allocations`, `auto-calculate`).

## Intentionally unused / out of scope

- Knit & subcontract pages: `MerchComingSoonPage` (no MerchandisingService APIs).
- Production deep integration with external MES (pipeline report only).
- E2E Playwright (not in plan).

## Components

| Component | Status |
|-----------|--------|
| `AccessoryProcurementMatrix` | Integrated on `accessories/summary/details/[id]` with `companyId` |
| `MasterGrid` | Removed (unused); replaced by `MerchMasterResourcePage` |

## Type alignment notes

- `OrderDetails` includes `bomItems`, `colorSizeBreakdowns`, `shipmentPlans` from `GET orders/{id}/details`.
- `Quotation` lines from `getQuotationById`; negotiations via separate `getQuotationNegotiations`.
- `MaterialBooking.bookingType` filtered client-side when `itemType` query used on bookings page.
