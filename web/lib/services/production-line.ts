import { sewingService } from "@/lib/services/production/sewing";
import { ACTIVE_KEY } from "@/lib/active-company-storage";
import type { Guid } from "@/lib/types/production";

export interface ProductionLine {
  id: Guid;
  sl: number;
  lineName: string;
  status: string;
}

export type CreateProductionLine = { serialNo?: number; sl?: number; lineName: string; status: string };

export const productionLineService = {
  getAll: async (companyId?: Guid): Promise<ProductionLine[]> => {
    const lines = await sewingService.getLines(companyId);
    return lines.map((l) => ({ id: l.id, sl: l.serialNo, lineName: l.lineName, status: l.status }));
  },
  create: async (data: CreateProductionLine, companyId?: Guid) => {
    const cid = companyId ?? (typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) ?? "" : "");
    const serialNo = data.sl ?? data.serialNo ?? 0;
    const created = await sewingService.createLine({ companyId: cid, serialNo, lineName: data.lineName, status: data.status });
    return { id: created.id, sl: created.serialNo, lineName: created.lineName, status: created.status };
  },
  update: async (id: Guid, data: CreateProductionLine & { sl?: number }) => {
    await sewingService.updateLine(id, { serialNo: data.sl ?? data.serialNo ?? 0, lineName: data.lineName, status: data.status });
  },
  delete: async (id: Guid) => {
    await sewingService.deleteLine(id);
  },
};
