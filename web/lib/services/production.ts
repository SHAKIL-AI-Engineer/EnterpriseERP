/**
 * Legacy production list adapter — backed by Merchandising orders.
 * Prefer `lib/services/production/orders.ts` for new code.
 */
import { getProductionOrderOptions } from "@/lib/services/production/orders";
import { ACTIVE_KEY } from "@/lib/active-company-storage";
import type { Guid } from "@/lib/types/production";

export interface ProductionColor {
  id?: string;
  colorName: string;
  quantity: number;
}

export interface ProductionItem {
  id: string;
  programCode: string;
  buyer: string;
  orderQty: number;
  styleNo: string;
  item: string;
  unitPrice: number;
  status: string;
  colors: ProductionColor[];
}

export interface ProductionReport {
  totalOrderQty: number;
  totalComplete: number;
  totalRunning: number;
  totalPending: number;
  totalClose: number;
}

export const productionService = {
  getProductions: async (companyId?: Guid): Promise<ProductionItem[]> => {
    const cid = companyId ?? (typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) ?? "" : "");
    if (!cid) return [];
    const options = await getProductionOrderOptions(cid);
    return options.map((o) => ({
      id: o.orderId,
      programCode: o.orderNo,
      buyer: o.buyerName,
      orderQty: o.totalOrderQty,
      styleNo: o.orderNo,
      item: o.orderNo,
      unitPrice: 0,
      status: o.orderStatus,
      colors: [],
    }));
  },

  getProduction: async (id: string, companyId?: Guid) => {
    const list = await productionService.getProductions(companyId);
    const found = list.find((p) => p.id === id);
    if (!found) throw new Error("Order not found");
    return found;
  },

  getReport: async (companyId?: Guid): Promise<ProductionReport> => {
    const list = await productionService.getProductions(companyId);
    const totalOrderQty = list.reduce((s, p) => s + p.orderQty, 0);
    const totalRunning = list.filter((p) => /progress|active|confirmed/i.test(p.status)).length;
    const totalClose = list.filter((p) => /close|complete|shipped/i.test(p.status)).length;
    const totalPending = list.length - totalRunning - totalClose;
    return {
      totalOrderQty,
      totalComplete: totalClose,
      totalRunning,
      totalPending: Math.max(0, totalPending),
      totalClose,
    };
  },

  createProduction: async () => {
    throw new Error("Create orders in Merchandising module.");
  },
  updateProduction: async () => {
    throw new Error("Update orders in Merchandising module.");
  },
  deleteProduction: async () => {
    throw new Error("Delete orders in Merchandising module.");
  },
};
