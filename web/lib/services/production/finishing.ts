import api from "@/lib/api";
import { unwrapApiData } from "@/lib/api-response";
import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage";
import type { Guid } from "@/lib/types/production";

function companyGuid(companyId?: Guid): Guid {
  return companyId?.includes("-") ? companyId : getActiveCompanyHeaderValue() ?? companyId ?? "";
}

export interface FinishingReceive {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  receiveNo: string;
  receiveDate?: string;
  status: string;
  totalReceiveQty?: number;
}

export interface IroningOutput {
  id: Guid;
  orderId: Guid;
  outputDate: string;
  colorName?: string;
  sizeName: string;
  ironQty: number;
  reIronQty: number;
}

export interface FoldingPacking {
  id: Guid;
  orderId: Guid;
  packingDate: string;
  colorName?: string;
  sizeName: string;
  packedQty: number;
  status?: string;
}

export interface FinishingReportRow {
  reportType: string;
  orderId: Guid;
  referenceNo?: string;
  date: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  status?: string;
}

export const productionFinishingService = {
  async getReceives(companyId?: Guid, orderId?: Guid, status?: string): Promise<FinishingReceive[]> {
    const res = await api.get("finishing-receives", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}), ...(status ? { status } : {}) },
    });
    const rows = unwrapApiData<Array<Record<string, unknown>>>(res.data);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      companyId: String(r.companyId),
      orderId: String(r.orderId),
      receiveNo: String(r.receiveNo ?? ""),
      receiveDate: String(r.receiveDate ?? ""),
      status: String(r.status ?? ""),
      totalReceiveQty: Number(r.totalReceiveQty ?? 0),
    }));
  },

  async getIroningOutputs(companyId?: Guid, orderId?: Guid): Promise<IroningOutput[]> {
    const res = await api.get("ironing-outputs", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    const rows = unwrapApiData<Array<Record<string, unknown>>>(res.data);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      orderId: String(r.orderId),
      outputDate: String(r.outputDate ?? ""),
      colorName: r.colorName ? String(r.colorName) : undefined,
      sizeName: String(r.sizeName ?? ""),
      ironQty: Number(r.ironQty ?? 0),
      reIronQty: Number(r.reIronQty ?? 0),
    }));
  },

  async getFoldingPackings(companyId?: Guid, orderId?: Guid): Promise<FoldingPacking[]> {
    const res = await api.get("folding-packings", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    const rows = unwrapApiData<Array<Record<string, unknown>>>(res.data);
    return (rows ?? []).map((r) => ({
      id: String(r.id),
      orderId: String(r.orderId),
      packingDate: String(r.packingDate ?? r.foldDate ?? ""),
      colorName: r.colorName ? String(r.colorName) : undefined,
      sizeName: String(r.sizeName ?? ""),
      packedQty: Number(r.packedQty ?? r.foldQty ?? 0),
      status: r.status ? String(r.status) : undefined,
    }));
  },

  async getReport(
    companyId?: Guid,
    reportType = "Finishing Receive",
    fromDate?: string,
    toDate?: string,
    orderId?: Guid
  ): Promise<FinishingReportRow[]> {
    const res = await api.get("finishing-reports", {
      params: {
        companyId: companyGuid(companyId),
        reportType,
        fromDate,
        toDate,
        ...(orderId ? { orderId } : {}),
      },
    });
    const rows = unwrapApiData<Array<Record<string, unknown>>>(res.data);
    return (rows ?? []).map((r) => ({
      reportType: String(r.reportType ?? reportType),
      orderId: String(r.orderId),
      referenceNo: r.referenceNo ? String(r.referenceNo) : undefined,
      date: String(r.date ?? ""),
      colorName: r.colorName ? String(r.colorName) : undefined,
      sizeName: r.sizeName ? String(r.sizeName) : undefined,
      quantity: Number(r.quantity ?? 0),
      status: r.status ? String(r.status) : undefined,
    }));
  },

  async getBalances(companyId?: Guid, orderId?: Guid) {
    const res = await api.get("finishing-reports/balances", {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<unknown[]>(res.data);
  },
};
