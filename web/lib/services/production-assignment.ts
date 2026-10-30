import { ACTIVE_KEY } from "@/lib/active-company-storage";
import api from "@/lib/api";
import { unwrapApiData } from "@/lib/api-response";
import { sewingService } from "@/lib/services/production/sewing";
import type { Guid } from "@/lib/types/production";

export interface ProductionAssignment {
  id: Guid;
  orderId: Guid;
  productionId: Guid;
  styleNo: string;
  buyer: string;
  lineId: Guid;
  lineName: string;
  totalTarget: number;
  assignDate: string;
  status: string;
}

export interface CreateProductionAssignment {
  orderId: Guid;
  lineId: Guid;
  totalTarget: number;
  status: string;
  styleNo?: string;
  buyerName?: string;
}

export interface DailyReportItem {
  id?: string;
  assignmentId: Guid;
  lineName: string;
  styleNo: string;
  buyer: string;
  dailyTarget: number;
  hourlyTarget: number;
  completed: number;
  achievement: number;
}

export interface MonthlyReportItem {
  id?: string;
  month: string;
  year: number;
  lineName: string;
  totalTarget: number;
  totalCompleted: number;
  avgAchievement: number;
  workingDays: number;
  topStyle?: string;
}

export interface DailyProductionRecord {
  id?: Guid;
  assignmentId: Guid;
  date: string;
  dailyTarget: number;
  hourlyTarget: number;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  h7: number;
  h8: number;
  h9: number;
  h10: number;
  h11: number;
  h12: number;
  h13: number;
  h14: number;
  h15: number;
  h16: number;
  h17: number;
  h18: number;
  h19: number;
  totalCompleted: number;
}

function companyId(): Guid {
  return typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) ?? "" : "";
}

function mapDailyRows(rows: Record<string, unknown>[]): DailyReportItem[] {
  return rows.map((r) => ({
    id: String(r.assignmentId ?? ""),
    assignmentId: String(r.assignmentId ?? ""),
    lineName: String(r.lineName ?? ""),
    styleNo: String(r.styleNo ?? ""),
    buyer: String(r.buyerName ?? r.buyer ?? ""),
    dailyTarget: Number(r.dailyTarget ?? 0),
    hourlyTarget: Number(r.hourlyTarget ?? 0),
    completed: Number(r.completed ?? 0),
    achievement: Number(r.achievement ?? 0),
  }));
}

export const productionAssignmentService = {
  getAll: async (cid?: Guid) => {
    const rows = await sewingService.getAssignments(cid ?? companyId());
    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      productionId: r.orderId,
      styleNo: r.styleNo ?? "",
      buyer: r.buyerName ?? "",
      lineId: r.sewingLineId,
      lineName: r.lineName ?? "",
      totalTarget: r.totalTarget,
      assignDate: r.assignDate,
      status: r.status,
    }));
  },
  create: async (data: CreateProductionAssignment, cid?: Guid) => {
    const company = cid ?? companyId();
    const created = await sewingService.createAssignment({
      companyId: company,
      orderId: data.orderId,
      sewingLineId: data.lineId,
      totalTarget: data.totalTarget,
      assignDate: new Date().toISOString().slice(0, 10),
      status: data.status,
      styleNo: data.styleNo,
      buyerName: data.buyerName,
    });
    return {
      id: created.id,
      orderId: created.orderId,
      productionId: created.orderId,
      styleNo: created.styleNo ?? "",
      buyer: created.buyerName ?? "",
      lineId: created.sewingLineId,
      lineName: created.lineName ?? "",
      totalTarget: created.totalTarget,
      assignDate: created.assignDate,
      status: created.status,
    };
  },
  update: async (id: Guid, data: CreateProductionAssignment, cid?: Guid) => {
    await sewingService.updateAssignment(id, {
      sewingLineId: data.lineId,
      totalTarget: data.totalTarget,
      assignDate: new Date().toISOString().slice(0, 10),
      status: data.status,
      styleNo: data.styleNo,
      buyerName: data.buyerName,
    });
  },
  delete: async (id: Guid) => sewingService.deleteAssignment(id),
  getDailyRecord: async (assignmentId: Guid, date: string): Promise<DailyProductionRecord | null> => {
    const row = await sewingService.getDailyRecord(assignmentId, date);
    if (!row) return null;
    return {
      id: row.id,
      assignmentId,
      date: row.recordDate,
      dailyTarget: row.dailyTarget,
      hourlyTarget: row.hourlyTarget,
      h1: row.h1,
      h2: row.h2,
      h3: row.h3,
      h4: row.h4,
      h5: row.h5,
      h6: row.h6,
      h7: row.h7,
      h8: row.h8,
      h9: row.h9,
      h10: row.h10,
      h11: row.h11,
      h12: row.h12,
      h13: row.h13,
      h14: row.h14,
      h15: row.h15,
      h16: row.h16,
      h17: row.h17,
      h18: row.h18,
      h19: row.h19,
      totalCompleted: row.totalCompleted,
    };
  },
  saveDailyRecord: async (data: Record<string, unknown>, cid?: Guid) => {
    const company = cid ?? companyId();
    return sewingService.saveDailyRecord({
      ...data,
      companyId: company,
      assignmentId: String(data.assignmentId),
      recordDate: String(data.date ?? data.recordDate),
    });
  },
  deleteDailyRecord: async (_assignmentId: Guid, _date: string) => {},
  getDailyReport: async (params: Record<string, string | number | undefined>, cid?: Guid) => {
    const res = await api.get("production-assignments/reports/daily", {
      params: {
        companyId: cid ?? companyId(),
        date: params.date,
        lineId: params.lineId != null && params.lineId !== "" ? String(params.lineId) : undefined,
      },
    });
    return mapDailyRows(unwrapApiData<Record<string, unknown>[]>(res.data) ?? []);
  },
  exportExcel: async (_params?: Record<string, string | number | undefined>) => {},
  exportHourlyExcel: async (_params?: Record<string, string | number | undefined>) => {},
  exportPdf: async (_params?: Record<string, string | number | undefined>) => {},
  getMonthlyReport: async (params: Record<string, string>, cid?: Guid) => {
    const res = await api.get("production-assignments/reports/monthly", {
      params: { companyId: cid ?? companyId(), year: params.year, month: params.month, lineId: params.lineId },
    });
    const rows = unwrapApiData<MonthlyReportItem[]>(res.data);
    return (rows ?? []).map((r, i) => ({ ...r, id: r.id ?? `${r.lineName}-${r.month}-${i}` }));
  },
};
