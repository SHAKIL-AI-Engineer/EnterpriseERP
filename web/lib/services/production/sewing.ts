import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';
import type {
  DailyProductionRecord,
  Guid,
  ProductionAssignment,
  ProductionTarget,
  SewingLine,
} from '@/lib/types/production';

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

export const sewingService = {
  async getLines(companyId?: Guid): Promise<SewingLine[]> {
    const res = await api.get('sewing-lines', { params: params(companyId) });
    return unwrapApiData<SewingLine[]>(res.data);
  },
  async createLine(body: Omit<SewingLine, 'id'>): Promise<SewingLine> {
    const res = await api.post('sewing-lines', { companyId: companyGuid(body.companyId), serialNo: body.serialNo, lineName: body.lineName, status: body.status });
    return unwrapApiData<SewingLine>(res.data);
  },
  async updateLine(id: Guid, body: Pick<SewingLine, 'serialNo' | 'lineName' | 'status'>): Promise<SewingLine> {
    const res = await api.put(`sewing-lines/${id}`, body);
    return unwrapApiData<SewingLine>(res.data);
  },
  async deleteLine(id: Guid): Promise<void> {
    await api.delete(`sewing-lines/${id}`);
  },

  async getAssignments(companyId?: Guid, orderId?: Guid): Promise<ProductionAssignment[]> {
    const res = await api.get('production-assignments', { params: params(companyId, { orderId }) });
    return unwrapApiData<ProductionAssignment[]>(res.data);
  },
  async createAssignment(body: {
    companyId: Guid;
    orderId: Guid;
    sewingLineId: Guid;
    totalTarget: number;
    assignDate: string;
    styleNo?: string;
    buyerName?: string;
    status?: string;
  }): Promise<ProductionAssignment> {
    const res = await api.post('production-assignments', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<ProductionAssignment>(res.data);
  },
  async updateAssignment(id: Guid, body: Record<string, unknown>): Promise<ProductionAssignment> {
    const res = await api.put(`production-assignments/${id}`, body);
    return unwrapApiData<ProductionAssignment>(res.data);
  },
  async deleteAssignment(id: Guid): Promise<void> {
    await api.delete(`production-assignments/${id}`);
  },

  async getTargets(companyId?: Guid, assignmentId?: Guid, date?: string): Promise<ProductionTarget[]> {
    const res = await api.get('production-targets', { params: params(companyId, { assignmentId, date }) });
    return unwrapApiData<ProductionTarget[]>(res.data);
  },
  async saveTarget(body: {
    companyId: Guid;
    assignmentId: Guid;
    targetDate: string;
    dailyTarget: number;
    hourlyTarget: number;
    remarks?: string;
  }): Promise<ProductionTarget> {
    const res = await api.post('production-targets', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<ProductionTarget>(res.data);
  },
  async deleteTarget(id: Guid): Promise<void> {
    await api.delete(`production-targets/${id}`);
  },

  async getDailyRecord(assignmentId: Guid, date: string): Promise<DailyProductionRecord | null> {
    const res = await api.get('production-assignments/daily-records', { params: { assignmentId, date } });
    return unwrapApiData<DailyProductionRecord | null>(res.data);
  },
  async saveDailyRecord(body: Record<string, unknown>): Promise<DailyProductionRecord> {
    const res = await api.post('production-assignments/daily-records', body);
    return unwrapApiData<DailyProductionRecord>(res.data);
  },

  async getBalances(companyId?: Guid, orderId?: Guid) {
    const res = await api.get('sewing-balances', { params: params(companyId, { orderId }) });
    return unwrapApiData<Array<{
      id: Guid;
      orderId: Guid;
      colorName?: string;
      sizeName: string;
      panelReceivedQty: number;
      sewnOutputQty: number;
      wipQty: number;
    }>>(res.data);
  },

  async getDailyReport(companyId?: Guid, date?: string, lineId?: Guid) {
    const res = await api.get('production-assignments/reports/daily', {
      params: params(companyId, { date, lineId }),
    });
    return unwrapApiData(res.data);
  },

  async getMonthlyReport(companyId?: Guid, year?: string, month?: string, lineId?: Guid) {
    const res = await api.get('production-assignments/reports/monthly', {
      params: params(companyId, { year, month, lineId }),
    });
    return unwrapApiData(res.data);
  },
};
