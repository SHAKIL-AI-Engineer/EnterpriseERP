import api from "@/lib/api";
import { unwrapApiData } from "@/lib/api-response";
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage";
import type { Guid, ShipmentExecution } from "@/lib/types/production";

function companyGuid(companyId?: Guid): Guid {
  return companyId?.includes("-") ? companyId : getActiveCompanyHeaderValue() ?? companyId ?? "";
}

export const productionShipmentService = {
  async getExecutions(companyId?: Guid, orderId?: Guid): Promise<ShipmentExecution[]> {
    const res = await api.get("shipments/executions", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<ShipmentExecution[]>(res.data);
  },

  async createExecution(body: {
    companyId: Guid;
    orderId: Guid;
    merchandisingShipmentPlanId?: Guid;
    actualShipmentDate: string;
    shippedQty: number;
    status?: string;
    destination?: string;
  }): Promise<ShipmentExecution> {
    const res = await api.post("shipments/executions", { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<ShipmentExecution>(res.data);
  },

  async getReports(companyId?: Guid, orderId?: Guid) {
    const res = await api.get("shipments/reports", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<unknown[]>(res.data);
  },

  async getStatus(companyId?: Guid, orderId?: Guid): Promise<string> {
    const res = await api.get("shipments/status", {
      params: { companyId: companyGuid(companyId), orderId },
    });
    const data = unwrapApiData<string>(res.data);
    return typeof data === "string" ? data : String(data ?? "");
  },

  async getPlan(companyId?: Guid, orderId?: Guid) {
    const res = await api.get("shipments/plans", {
      params: { companyId: companyGuid(companyId), orderId },
    });
    return unwrapApiData<unknown>(res.data);
  },
};
