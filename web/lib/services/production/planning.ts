import api from "@/lib/api";
import { unwrapApiData } from "@/lib/api-response";
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage";
import type { Guid, LineCapacityPlan } from "@/lib/types/production";

function companyGuid(companyId?: Guid): Guid {
  return companyId?.includes("-") ? companyId : getActiveCompanyHeaderValue() ?? companyId ?? "";
}

export interface PlanningBalance {
  id: Guid;
  orderId: Guid;
  plannedQty: number;
  assignedQty: number;
  actualQty: number;
}

export const productionPlanningService = {
  async getLinePlans(companyId?: Guid, orderId?: Guid): Promise<LineCapacityPlan[]> {
    const res = await api.get("production/line-plans", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<LineCapacityPlan[]>(res.data);
  },

  async createLinePlan(body: Omit<LineCapacityPlan, "id" | "status"> & { status?: string }): Promise<LineCapacityPlan> {
    const res = await api.post("production/line-plans", { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<LineCapacityPlan>(res.data);
  },

  async approveLinePlan(id: Guid): Promise<LineCapacityPlan> {
    const res = await api.patch(`production/line-plans/${id}/approve`);
    return unwrapApiData<LineCapacityPlan>(res.data);
  },

  async cancelLinePlan(id: Guid): Promise<LineCapacityPlan> {
    const res = await api.patch(`production/line-plans/${id}/cancel`);
    return unwrapApiData<LineCapacityPlan>(res.data);
  },

  async getPlanningBalances(companyId?: Guid, orderId?: Guid): Promise<PlanningBalance[]> {
    const res = await api.get("production/planning-balances", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<PlanningBalance[]>(res.data);
  },
};
