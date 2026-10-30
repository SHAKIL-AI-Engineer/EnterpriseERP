import { sewingService } from "@/lib/services/production/sewing";
import { ACTIVE_KEY } from "@/lib/active-company-storage";
import type { Guid } from "@/lib/types/production";

export interface ProductionTarget {
  id: Guid;
  assignmentId: Guid;
  styleNo: string;
  lineName: string;
  buyer: string;
  targetDate: string;
  dailyTarget: number;
  hourlyTarget: number;
  remarks: string;
}

export interface CreateProductionTarget {
  assignmentId: Guid;
  targetDate: string;
  dailyTarget: number;
  hourlyTarget: number;
  remarks: string;
}

function companyId(): Guid {
  return typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) ?? "" : "";
}

export const productionTargetService = {
  getAll: async (date?: string, cid?: Guid) => {
    const rows = await sewingService.getTargets(cid ?? companyId(), undefined, date);
    return rows.map((t) => ({
      id: t.id,
      assignmentId: t.assignmentId,
      styleNo: "",
      lineName: "",
      buyer: "",
      targetDate: t.targetDate,
      dailyTarget: t.dailyTarget,
      hourlyTarget: t.hourlyTarget,
      remarks: t.remarks ?? "",
    }));
  },
  save: async (data: CreateProductionTarget, cid?: Guid) => {
    const saved = await sewingService.saveTarget({
      companyId: cid ?? companyId(),
      assignmentId: data.assignmentId,
      targetDate: data.targetDate,
      dailyTarget: data.dailyTarget,
      hourlyTarget: data.hourlyTarget,
      remarks: data.remarks,
    });
    return {
      id: saved.id,
      assignmentId: data.assignmentId,
      styleNo: "",
      lineName: "",
      buyer: "",
      targetDate: saved.targetDate,
      dailyTarget: saved.dailyTarget,
      hourlyTarget: saved.hourlyTarget,
      remarks: saved.remarks ?? "",
    };
  },
  delete: async (id: Guid) => sewingService.deleteTarget(id),
};
