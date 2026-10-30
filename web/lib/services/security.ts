import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';
import { downloadBlob } from '@/lib/services/api-helpers';

export type * from '@/lib/types/security';

import type {
  BillEntry,
  Chalan,
  CreateBillEntryRequest,
  CreateChalanRequest,
  CreateEmployeeOutPassRequest,
  CreateGatePassRequest,
  CreateGateRequest,
  CreateReturnableGatePassReturnRequest,
  CreateSecurityCheckRequest,
  CreateVehicleEntryRequest,
  CreateVehicleRequest,
  CreateVisitorEntryRequest,
  CreateVisitorRequest,
  DailyGateRegister,
  EmployeeOutPass,
  EmployeeOutPassReturnRequest,
  Gate,
  GatePass,
  Guid,
  MaterialInOutReport,
  ReportExportRequest,
  ReturnableGatePassReturn,
  ReturnablePending,
  SecurityCheckLog,
  SecurityReport,
  UpdateGateRequest,
  Vehicle,
  VehicleEntry,
  VehicleExitRequest,
  Visitor,
  VisitorEntry,
  CheckoutVisitorEntryRequest,
  ExportResult,
} from '@/lib/types/security';

function companyGuid(companyId?: Guid): Guid {
  if (companyId?.includes('-')) return companyId;
  const resolved = getActiveCompanyHeaderValue() ?? companyId ?? '';
  return resolved;
}

function params(companyId?: Guid, extra?: Record<string, string | undefined>): Record<string, string> {
  const cid = companyGuid(companyId);
  if (!cid || !cid.includes('-')) {
    throw new Error('Active company is required. Select a company from the header.');
  }
  const out: Record<string, string> = { companyId: cid };
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') out[k] = v;
    }
  }
  return out;
}

export const securityService = {
  /* ── Gates ── */
  async getGates(companyId?: Guid): Promise<Gate[]> {
    const res = await api.get('gates', { params: params(companyId) });
    return unwrapApiData<Gate[]>(res.data);
  },

  async createGate(body: CreateGateRequest): Promise<Gate> {
    const res = await api.post('gates', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<Gate>(res.data);
  },

  async updateGate(id: Guid, body: UpdateGateRequest, companyId?: Guid): Promise<Gate> {
    const res = await api.put(`gates/${id}`, body, { params: params(companyId) });
    return unwrapApiData<Gate>(res.data);
  },

  async activateGate(id: Guid, companyId?: Guid): Promise<Gate> {
    const res = await api.patch(`gates/${id}/activate`, null, { params: params(companyId) });
    return unwrapApiData<Gate>(res.data);
  },

  async deactivateGate(id: Guid, companyId?: Guid): Promise<Gate> {
    const res = await api.patch(`gates/${id}/deactivate`, null, { params: params(companyId) });
    return unwrapApiData<Gate>(res.data);
  },

  /* ── Visitors ── */
  async getVisitors(companyId?: Guid, phone?: string): Promise<Visitor[]> {
    const res = await api.get('visitors', { params: params(companyId, { phone }) });
    return unwrapApiData<Visitor[]>(res.data);
  },

  async getVisitorById(id: Guid): Promise<Visitor> {
    const res = await api.get(`visitors/${id}`);
    return unwrapApiData<Visitor>(res.data);
  },

  async createVisitor(body: CreateVisitorRequest): Promise<Visitor> {
    const res = await api.post('visitors', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<Visitor>(res.data);
  },

  async blacklistVisitor(id: Guid): Promise<Visitor> {
    const res = await api.patch(`visitors/${id}/blacklist`);
    return unwrapApiData<Visitor>(res.data);
  },

  /* ── Visitor entries ── */
  async getVisitorEntries(companyId?: Guid, date?: string): Promise<VisitorEntry[]> {
    const res = await api.get('visitor-entries', { params: params(companyId, { date }) });
    return unwrapApiData<VisitorEntry[]>(res.data);
  },

  async getVisitorEntryById(id: Guid): Promise<VisitorEntry> {
    const res = await api.get(`visitor-entries/${id}`);
    return unwrapApiData<VisitorEntry>(res.data);
  },

  async createVisitorEntry(body: CreateVisitorEntryRequest): Promise<VisitorEntry> {
    const res = await api.post('visitor-entries', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<VisitorEntry>(res.data);
  },

  async checkoutVisitorEntry(id: Guid, body: CheckoutVisitorEntryRequest): Promise<VisitorEntry> {
    const res = await api.patch(`visitor-entries/${id}/checkout`, body);
    return unwrapApiData<VisitorEntry>(res.data);
  },

  async cancelVisitorEntry(id: Guid): Promise<VisitorEntry> {
    const res = await api.patch(`visitor-entries/${id}/cancel`);
    return unwrapApiData<VisitorEntry>(res.data);
  },

  /* ── Employee out passes ── */
  async getEmployeeOutPasses(
    companyId?: Guid,
    employeeId?: Guid,
    date?: string,
  ): Promise<EmployeeOutPass[]> {
    const res = await api.get('employee-out-passes', {
      params: params(companyId, { employeeId, date }),
    });
    return unwrapApiData<EmployeeOutPass[]>(res.data);
  },

  async createEmployeeOutPass(body: CreateEmployeeOutPassRequest): Promise<EmployeeOutPass> {
    const res = await api.post('employee-out-passes', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<EmployeeOutPass>(res.data);
  },

  async approveEmployeeOutPass(id: Guid): Promise<EmployeeOutPass> {
    const res = await api.patch(`employee-out-passes/${id}/approve`);
    return unwrapApiData<EmployeeOutPass>(res.data);
  },

  async markEmployeeOut(id: Guid): Promise<EmployeeOutPass> {
    const res = await api.patch(`employee-out-passes/${id}/out`);
    return unwrapApiData<EmployeeOutPass>(res.data);
  },

  async returnEmployeeOutPass(id: Guid, body: EmployeeOutPassReturnRequest): Promise<EmployeeOutPass> {
    const res = await api.patch(`employee-out-passes/${id}/return`, body);
    return unwrapApiData<EmployeeOutPass>(res.data);
  },

  async cancelEmployeeOutPass(id: Guid): Promise<EmployeeOutPass> {
    const res = await api.patch(`employee-out-passes/${id}/cancel`);
    return unwrapApiData<EmployeeOutPass>(res.data);
  },

  /* ── Vehicles ── */
  async getVehicles(companyId?: Guid): Promise<Vehicle[]> {
    const res = await api.get('vehicles', { params: params(companyId) });
    return unwrapApiData<Vehicle[]>(res.data);
  },

  async createVehicle(body: CreateVehicleRequest): Promise<Vehicle> {
    const res = await api.post('vehicles', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<Vehicle>(res.data);
  },

  /* ── Vehicle entries ── */
  async getVehicleEntries(companyId?: Guid, date?: string): Promise<VehicleEntry[]> {
    const res = await api.get('vehicle-entries', { params: params(companyId, { date }) });
    return unwrapApiData<VehicleEntry[]>(res.data);
  },

  async createVehicleEntry(body: CreateVehicleEntryRequest): Promise<VehicleEntry> {
    const res = await api.post('vehicle-entries', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<VehicleEntry>(res.data);
  },

  async exitVehicleEntry(id: Guid, body: VehicleExitRequest): Promise<VehicleEntry> {
    const res = await api.patch(`vehicle-entries/${id}/exit`, body);
    return unwrapApiData<VehicleEntry>(res.data);
  },

  /* ── Gate passes ── */
  async getGatePasses(
    companyId?: Guid,
    type?: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<GatePass[]> {
    const res = await api.get('gate-passes', {
      params: params(companyId, { type, status, fromDate, toDate }),
    });
    return unwrapApiData<GatePass[]>(res.data);
  },

  async getGatePassById(id: Guid): Promise<GatePass> {
    const res = await api.get(`gate-passes/${id}`);
    return unwrapApiData<GatePass>(res.data);
  },

  async createGatePass(body: CreateGatePassRequest): Promise<GatePass> {
    const res = await api.post('gate-passes', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<GatePass>(res.data);
  },

  async submitGatePass(id: Guid): Promise<GatePass> {
    const res = await api.patch(`gate-passes/${id}/submit`);
    return unwrapApiData<GatePass>(res.data);
  },

  async approveGatePass(id: Guid): Promise<GatePass> {
    const res = await api.patch(`gate-passes/${id}/approve`);
    return unwrapApiData<GatePass>(res.data);
  },

  async issueGatePass(id: Guid): Promise<GatePass> {
    const res = await api.patch(`gate-passes/${id}/issue`);
    return unwrapApiData<GatePass>(res.data);
  },

  async completeGatePass(id: Guid): Promise<GatePass> {
    const res = await api.patch(`gate-passes/${id}/complete`);
    return unwrapApiData<GatePass>(res.data);
  },

  async cancelGatePass(id: Guid): Promise<GatePass> {
    const res = await api.patch(`gate-passes/${id}/cancel`);
    return unwrapApiData<GatePass>(res.data);
  },

  /* ── Returnable returns ── */
  async getReturnableReturns(companyId?: Guid, gatePassId?: Guid): Promise<ReturnableGatePassReturn[]> {
    const res = await api.get('returnable-gate-pass-returns', {
      params: params(companyId, { gatePassId }),
    });
    return unwrapApiData<ReturnableGatePassReturn[]>(res.data);
  },

  async createReturnableReturn(body: CreateReturnableGatePassReturnRequest): Promise<ReturnableGatePassReturn> {
    const res = await api.post('returnable-gate-pass-returns', {
      ...body,
      companyId: companyGuid(body.companyId),
    });
    return unwrapApiData<ReturnableGatePassReturn>(res.data);
  },

  /* ── Chalans ── */
  async getChalans(
    companyId?: Guid,
    type?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Chalan[]> {
    const res = await api.get('chalans', { params: params(companyId, { type, fromDate, toDate }) });
    return unwrapApiData<Chalan[]>(res.data);
  },

  async getChalanById(id: Guid): Promise<Chalan> {
    const res = await api.get(`chalans/${id}`);
    return unwrapApiData<Chalan>(res.data);
  },

  async createChalan(body: CreateChalanRequest): Promise<Chalan> {
    const res = await api.post('chalans', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<Chalan>(res.data);
  },

  async approveChalan(id: Guid): Promise<Chalan> {
    const res = await api.patch(`chalans/${id}/approve`);
    return unwrapApiData<Chalan>(res.data);
  },

  async cancelChalan(id: Guid): Promise<Chalan> {
    const res = await api.patch(`chalans/${id}/cancel`);
    return unwrapApiData<Chalan>(res.data);
  },

  /* ── Bill entries ── */
  async getBillEntries(companyId?: Guid, fromDate?: string, toDate?: string): Promise<BillEntry[]> {
    const res = await api.get('bill-entries', { params: params(companyId, { fromDate, toDate }) });
    return unwrapApiData<BillEntry[]>(res.data);
  },

  async getBillEntryById(id: Guid): Promise<BillEntry> {
    const res = await api.get(`bill-entries/${id}`);
    return unwrapApiData<BillEntry>(res.data);
  },

  async createBillEntry(body: CreateBillEntryRequest): Promise<BillEntry> {
    const res = await api.post('bill-entries', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<BillEntry>(res.data);
  },

  async approveBillEntry(id: Guid): Promise<BillEntry> {
    const res = await api.patch(`bill-entries/${id}/approve`);
    return unwrapApiData<BillEntry>(res.data);
  },

  async rejectBillEntry(id: Guid): Promise<BillEntry> {
    const res = await api.patch(`bill-entries/${id}/reject`);
    return unwrapApiData<BillEntry>(res.data);
  },

  async sendBillEntryToAccounts(id: Guid): Promise<BillEntry> {
    const res = await api.patch(`bill-entries/${id}/send-to-accounts`);
    return unwrapApiData<BillEntry>(res.data);
  },

  /* ── Security checks ── */
  async getSecurityChecks(
    companyId?: Guid,
    referenceType?: string,
    referenceId?: Guid,
  ): Promise<SecurityCheckLog[]> {
    const res = await api.get('security-checks', {
      params: params(companyId, { referenceType, referenceId }),
    });
    return unwrapApiData<SecurityCheckLog[]>(res.data);
  },

  async createSecurityCheck(body: CreateSecurityCheckRequest): Promise<SecurityCheckLog> {
    const res = await api.post('security-checks', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<SecurityCheckLog>(res.data);
  },

  /* ── Reports ── */
  async getDailyRegister(companyId: Guid, date: string): Promise<DailyGateRegister> {
    const res = await api.get('gate-reports/daily-register', { params: params(companyId, { date }) });
    return unwrapApiData<DailyGateRegister>(res.data);
  },

  async getVisitorReport(companyId: Guid, fromDate: string, toDate: string): Promise<SecurityReport> {
    const res = await api.get('gate-reports/visitor-report', {
      params: params(companyId, { fromDate, toDate }),
    });
    return unwrapApiData<SecurityReport>(res.data);
  },

  async getMaterialInOutReport(companyId: Guid, fromDate: string, toDate: string): Promise<MaterialInOutReport> {
    const res = await api.get('gate-reports/material-in-out', {
      params: params(companyId, { fromDate, toDate }),
    });
    return unwrapApiData<MaterialInOutReport>(res.data);
  },

  async getVehicleReport(companyId: Guid, fromDate: string, toDate: string): Promise<SecurityReport> {
    const res = await api.get('gate-reports/vehicle-report', {
      params: params(companyId, { fromDate, toDate }),
    });
    return unwrapApiData<SecurityReport>(res.data);
  },

  async getReturnablePending(companyId?: Guid): Promise<ReturnablePending[]> {
    const res = await api.get('gate-reports/returnable-pending', { params: params(companyId) });
    return unwrapApiData<ReturnablePending[]>(res.data);
  },

  async exportReport(body: ReportExportRequest, filename: string): Promise<void> {
    const res = await api.post('gate-reports/export', {
      ...body,
      companyId: companyGuid(body.companyId),
    });
    const data = unwrapApiData<ExportResult>(res.data);
    if (data?.downloadUrl) {
      window.open(data.downloadUrl, '_blank');
      return;
    }
    const ext = body.format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
    downloadBlob(res.data, filename.endsWith(ext) ? filename : `${filename}.${ext}`, res.headers['content-type']);
  },
};

export default securityService;
