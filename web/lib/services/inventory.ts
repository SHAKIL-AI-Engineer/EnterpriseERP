import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';

export type * from '@/lib/types/inventory';

import type { Guid, IssueStockRequest, ReceiveStockRequest, StockItem, StockTransaction } from '@/lib/types/inventory';

const BASE = 'inventory';

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

export const inventoryService = {
  async getItems(companyId?: Guid, search?: string): Promise<StockItem[]> {
    const res = await api.get(`${BASE}/items`, { params: params(companyId, { search }) });
    return unwrapApiData<StockItem[]>(res.data);
  },

  async getItemById(id: Guid, companyId?: Guid): Promise<StockItem | null> {
    const res = await api.get(`${BASE}/items/${id}`, { params: params(companyId) });
    return unwrapApiData<StockItem | null>(res.data);
  },

  async getItemTransactions(itemId: Guid, companyId?: Guid): Promise<StockTransaction[]> {
    const res = await api.get(`${BASE}/items/${itemId}/transactions`, { params: params(companyId) });
    return unwrapApiData<StockTransaction[]>(res.data);
  },

  async getTransactions(companyId?: Guid, itemId?: Guid, limit = 50): Promise<StockTransaction[]> {
    const res = await api.get(`${BASE}/transactions`, {
      params: params(companyId, { itemId, limit: String(limit) }),
    });
    return unwrapApiData<StockTransaction[]>(res.data);
  },

  async receive(body: ReceiveStockRequest): Promise<StockItem> {
    const res = await api.post(`${BASE}/receive`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StockItem>(res.data);
  },

  async issue(itemId: Guid, body: IssueStockRequest): Promise<StockItem> {
    const res = await api.post(`${BASE}/items/${itemId}/issue`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<StockItem>(res.data);
  },

  async itemExists(itemId: Guid, companyId?: Guid): Promise<boolean> {
    const res = await api.get(`${BASE}/items/${itemId}/exists`, { params: params(companyId) });
    return unwrapApiData<boolean>(res.data);
  },

  async getStockBalance(itemId: Guid, companyId?: Guid): Promise<number> {
    const res = await api.get(`${BASE}/items/${itemId}/stock-balance`, { params: params(companyId) });
    return unwrapApiData<number>(res.data);
  },
};

export default inventoryService;
