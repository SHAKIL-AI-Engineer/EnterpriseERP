import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';

export type * from '@/lib/types/store';

import type {
  BookingVsIssueLine,
  CreateGrnRequest,
  CreateItemCategoryRequest,
  CreateStoreBookingRequest,
  CreateStoreBuyerRequest,
  CreateStoreItemRequest,
  CreateStoreOrderRequest,
  CreateStoreUnitRequest,
  Grn,
  Guid,
  IssueBookingRequest,
  ItemCategory,
  OrderConsumptionLine,
  StockDashboardSummary,
  StockLedgerEntry,
  StockMovementRequest,
  StockTransaction,
  StoreBooking,
  StoreBuyer,
  StoreItem,
  StoreOrder,
  StoreUnit,
  UpdateGrnRequest,
  UpdateItemCategoryRequest,
  UpdateStoreBookingRequest,
  UpdateStoreBuyerRequest,
  UpdateStoreItemRequest,
  UpdateStoreOrderRequest,
  UpdateStoreUnitRequest,
} from '@/lib/types/store';

const BASE = 'store';

function companyGuid(companyId?: Guid): Guid {
  if (companyId?.includes('-')) return companyId;
  return getActiveCompanyHeaderValue() ?? companyId ?? '';
}

function params(companyId?: Guid, extra?: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = { companyId: companyGuid(companyId) };
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') out[k] = v;
    }
  }
  return out;
}

export const storeService = {
  /* ── Categories ── */
  async getCategories(companyId?: Guid): Promise<ItemCategory[]> {
    const res = await api.get(`${BASE}/categories`, { params: params(companyId) });
    return unwrapApiData<ItemCategory[]>(res.data);
  },

  async getCategoryById(id: Guid, companyId?: Guid): Promise<ItemCategory> {
    const res = await api.get(`${BASE}/categories/${id}`, { params: params(companyId) });
    return unwrapApiData<ItemCategory>(res.data);
  },

  async addCategory(body: CreateItemCategoryRequest): Promise<ItemCategory> {
    const res = await api.post(`${BASE}/categories`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<ItemCategory>(res.data);
  },

  async updateCategory(id: Guid, body: UpdateItemCategoryRequest, companyId?: Guid): Promise<ItemCategory> {
    const res = await api.put(`${BASE}/categories/${id}`, body, { params: params(companyId) });
    return unwrapApiData<ItemCategory>(res.data);
  },

  async deleteCategory(id: Guid, companyId?: Guid): Promise<void> {
    await api.delete(`${BASE}/categories/${id}`, { params: params(companyId) });
  },

  /* ── Units ── */
  async getUnits(companyId?: Guid): Promise<StoreUnit[]> {
    const res = await api.get(`${BASE}/units`, { params: params(companyId) });
    return unwrapApiData<StoreUnit[]>(res.data);
  },

  async getUnitById(id: Guid, companyId?: Guid): Promise<StoreUnit> {
    const res = await api.get(`${BASE}/units/${id}`, { params: params(companyId) });
    return unwrapApiData<StoreUnit>(res.data);
  },

  async addUnit(body: CreateStoreUnitRequest): Promise<StoreUnit> {
    const res = await api.post(`${BASE}/units`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StoreUnit>(res.data);
  },

  async updateUnit(id: Guid, body: UpdateStoreUnitRequest, companyId?: Guid): Promise<StoreUnit> {
    const res = await api.put(`${BASE}/units/${id}`, body, { params: params(companyId) });
    return unwrapApiData<StoreUnit>(res.data);
  },

  async deleteUnit(id: Guid, companyId?: Guid): Promise<void> {
    await api.delete(`${BASE}/units/${id}`, { params: params(companyId) });
  },

  /* ── Items ── */
  async getItems(companyId?: Guid): Promise<StoreItem[]> {
    const res = await api.get(`${BASE}/items`, { params: params(companyId) });
    return unwrapApiData<StoreItem[]>(res.data);
  },

  async getItemById(id: Guid, companyId?: Guid): Promise<StoreItem> {
    const res = await api.get(`${BASE}/items/${id}`, { params: params(companyId) });
    return unwrapApiData<StoreItem>(res.data);
  },

  async addItem(body: CreateStoreItemRequest): Promise<StoreItem> {
    const res = await api.post(`${BASE}/items`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StoreItem>(res.data);
  },

  async updateItem(id: Guid, body: UpdateStoreItemRequest, companyId?: Guid): Promise<StoreItem> {
    const res = await api.put(`${BASE}/items/${id}`, body, { params: params(companyId) });
    return unwrapApiData<StoreItem>(res.data);
  },

  async deleteItem(id: Guid, companyId?: Guid): Promise<void> {
    await api.delete(`${BASE}/items/${id}`, { params: params(companyId) });
  },

  /* ── Buyers ── */
  async getBuyers(companyId?: Guid): Promise<StoreBuyer[]> {
    const res = await api.get(`${BASE}/buyers`, { params: params(companyId) });
    return unwrapApiData<StoreBuyer[]>(res.data);
  },

  async getBuyerById(id: Guid, companyId?: Guid): Promise<StoreBuyer> {
    const res = await api.get(`${BASE}/buyers/${id}`, { params: params(companyId) });
    return unwrapApiData<StoreBuyer>(res.data);
  },

  async addBuyer(body: CreateStoreBuyerRequest): Promise<StoreBuyer> {
    const res = await api.post(`${BASE}/buyers`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StoreBuyer>(res.data);
  },

  async updateBuyer(id: Guid, body: UpdateStoreBuyerRequest, companyId?: Guid): Promise<StoreBuyer> {
    const res = await api.put(`${BASE}/buyers/${id}`, body, { params: params(companyId) });
    return unwrapApiData<StoreBuyer>(res.data);
  },

  /* ── Orders ── */
  async getOrders(companyId?: Guid): Promise<StoreOrder[]> {
    const res = await api.get(`${BASE}/orders`, { params: params(companyId) });
    return unwrapApiData<StoreOrder[]>(res.data);
  },

  async getOrderById(id: Guid, companyId?: Guid): Promise<StoreOrder> {
    const res = await api.get(`${BASE}/orders/${id}`, { params: params(companyId) });
    return unwrapApiData<StoreOrder>(res.data);
  },

  async addOrder(body: CreateStoreOrderRequest): Promise<StoreOrder> {
    const res = await api.post(`${BASE}/orders`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StoreOrder>(res.data);
  },

  async updateOrder(id: Guid, body: UpdateStoreOrderRequest, companyId?: Guid): Promise<StoreOrder> {
    const res = await api.put(`${BASE}/orders/${id}`, body, { params: params(companyId) });
    return unwrapApiData<StoreOrder>(res.data);
  },

  async deleteOrder(id: Guid, companyId?: Guid): Promise<void> {
    await api.delete(`${BASE}/orders/${id}`, { params: params(companyId) });
  },

  /* ── Bookings ── */
  async getBookings(companyId?: Guid, type?: string, orderId?: Guid): Promise<StoreBooking[]> {
    const res = await api.get(`${BASE}/bookings`, {
      params: params(companyId, { type, orderId }),
    });
    return unwrapApiData<StoreBooking[]>(res.data);
  },

  async getBookingById(id: Guid, companyId?: Guid): Promise<StoreBooking> {
    const res = await api.get(`${BASE}/bookings/${id}`, { params: params(companyId) });
    return unwrapApiData<StoreBooking>(res.data);
  },

  async addBooking(body: CreateStoreBookingRequest): Promise<StoreBooking> {
    const res = await api.post(`${BASE}/bookings`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StoreBooking>(res.data);
  },

  async updateBooking(id: Guid, body: UpdateStoreBookingRequest, companyId?: Guid): Promise<StoreBooking> {
    const res = await api.put(`${BASE}/bookings/${id}`, body, { params: params(companyId) });
    return unwrapApiData<StoreBooking>(res.data);
  },

  async issueBooking(id: Guid, body: IssueBookingRequest, companyId?: Guid): Promise<StoreBooking> {
    const res = await api.post(`${BASE}/bookings/${id}/issue`, body, { params: params(companyId) });
    return unwrapApiData<StoreBooking>(res.data);
  },

  /* ── Stock movements ── */
  async stockIn(body: StockMovementRequest): Promise<StockTransaction> {
    const res = await api.post(`${BASE}/stock-in`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StockTransaction>(res.data);
  },

  async stockOut(body: StockMovementRequest): Promise<StockTransaction> {
    const res = await api.post(`${BASE}/stock-out`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StockTransaction>(res.data);
  },

  async getTransactions(companyId?: Guid, itemId?: Guid): Promise<StockTransaction[]> {
    const res = await api.get(`${BASE}/transactions`, { params: params(companyId, { itemId }) });
    return unwrapApiData<StockTransaction[]>(res.data);
  },

  /* ── GRN ── */
  async getGrns(companyId?: Guid): Promise<Grn[]> {
    const res = await api.get(`${BASE}/grns`, { params: params(companyId) });
    return unwrapApiData<Grn[]>(res.data);
  },

  async getGrnById(id: Guid, companyId?: Guid): Promise<Grn> {
    const res = await api.get(`${BASE}/grns/${id}`, { params: params(companyId) });
    return unwrapApiData<Grn>(res.data);
  },

  async addGrn(body: CreateGrnRequest): Promise<Grn> {
    const res = await api.post(`${BASE}/grns`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<Grn>(res.data);
  },

  async updateGrn(id: Guid, body: UpdateGrnRequest, companyId?: Guid): Promise<Grn> {
    const res = await api.put(`${BASE}/grns/${id}`, body, { params: params(companyId) });
    return unwrapApiData<Grn>(res.data);
  },

  /* ── Dashboard & reports ── */
  async getDashboardSummary(companyId?: Guid): Promise<StockDashboardSummary> {
    const res = await api.get(`${BASE}/dashboard-summary`, { params: params(companyId) });
    return unwrapApiData<StockDashboardSummary>(res.data);
  },

  async getLowStock(companyId?: Guid): Promise<StoreItem[]> {
    const res = await api.get(`${BASE}/low-stock`, { params: params(companyId) });
    return unwrapApiData<StoreItem[]>(res.data);
  },

  async getShortageReport(companyId?: Guid): Promise<StoreBooking[]> {
    const res = await api.get(`${BASE}/shortage-report`, { params: params(companyId) });
    return unwrapApiData<StoreBooking[]>(res.data);
  },

  async getConsumptionReport(companyId?: Guid): Promise<OrderConsumptionLine[]> {
    const res = await api.get(`${BASE}/reports/consumption`, { params: params(companyId) });
    return unwrapApiData<OrderConsumptionLine[]>(res.data);
  },

  async getItemStockReport(companyId?: Guid): Promise<StoreItem[]> {
    const res = await api.get(`${BASE}/reports/item-stock`, { params: params(companyId) });
    return unwrapApiData<StoreItem[]>(res.data);
  },

  async getBookingVsIssueReport(companyId?: Guid, type?: string): Promise<BookingVsIssueLine[]> {
    const res = await api.get(`${BASE}/reports/booking-vs-issue`, { params: params(companyId, { type }) });
    return unwrapApiData<BookingVsIssueLine[]>(res.data);
  },

  async getLedger(companyId: Guid, itemId: Guid): Promise<StockLedgerEntry[]> {
    const res = await api.get(`${BASE}/ledger`, { params: params(companyId, { itemId }) });
    return unwrapApiData<StockLedgerEntry[]>(res.data);
  },
};

export default storeService;
