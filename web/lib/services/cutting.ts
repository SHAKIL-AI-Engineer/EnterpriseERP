import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';
import { downloadBlob } from '@/lib/services/api-helpers';
import { buildPaginationParams } from '@/lib/pagination/params';
import type { LegacyPagedResult } from '@/lib/pagination/types';
import { unwrapPaginatedApiData } from '@/lib/pagination/unwrap';

export type * from '@/lib/types/cutting';

import type {
  AddCuttingPlanSizeBreakdownRequest,
  CreateCuttingBundleRequest,
  CreateCuttingLayRequest,
  CreateCuttingOutputRequest,
  CreateCuttingPlanRequest,
  CreateCuttingWastageRequest,
  CreateFabricIssueToCuttingRequest,
  CreatePanelTransferRequest,
  CuttingBalance,
  CuttingBundle,
  CuttingLay,
  CuttingOutput,
  CuttingPanelTransfer,
  CuttingPlan,
  CuttingPlanSizeBreakdown,
  CuttingReportExportRequest,
  CuttingReportRow,
  CuttingWastage,
  FabricIssueToCutting,
  Guid,
  UpdateBundleStatusRequest,
  UpdateCuttingBundleRequest,
  UpdateCuttingLayRequest,
  UpdateCuttingPlanRequest,
  UpdateCuttingPlanSizeBreakdownRequest,
} from '@/lib/types/cutting';

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

export const cuttingService = {
  /* ── Plans ── */
  async getPlans(companyId?: Guid, orderId?: Guid, status?: string): Promise<CuttingPlan[]> {
    const res = await api.get('cutting-plans', { params: params(companyId, { orderId, status }) });
    return unwrapApiData<CuttingPlan[]>(res.data);
  },

  async getPlanById(id: Guid): Promise<CuttingPlan> {
    const res = await api.get(`cutting-plans/${id}`);
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async createPlan(body: CreateCuttingPlanRequest): Promise<CuttingPlan> {
    const res = await api.post('cutting-plans', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async updatePlan(id: Guid, body: UpdateCuttingPlanRequest): Promise<CuttingPlan> {
    const res = await api.put(`cutting-plans/${id}`, body);
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async approvePlan(id: Guid, userId?: Guid): Promise<CuttingPlan> {
    const res = await api.patch(`cutting-plans/${id}/approve`, null, { params: userId ? { userId } : {} });
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async startPlan(id: Guid, userId?: Guid): Promise<CuttingPlan> {
    const res = await api.patch(`cutting-plans/${id}/start`, null, { params: userId ? { userId } : {} });
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async completePlan(id: Guid, userId?: Guid): Promise<CuttingPlan> {
    const res = await api.patch(`cutting-plans/${id}/complete`, null, { params: userId ? { userId } : {} });
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async cancelPlan(id: Guid, userId?: Guid): Promise<CuttingPlan> {
    const res = await api.patch(`cutting-plans/${id}/cancel`, null, { params: userId ? { userId } : {} });
    return unwrapApiData<CuttingPlan>(res.data);
  },

  async getSizeBreakdowns(planId: Guid): Promise<CuttingPlanSizeBreakdown[]> {
    const res = await api.get(`cutting-plans/${planId}/size-breakdowns`);
    return unwrapApiData<CuttingPlanSizeBreakdown[]>(res.data);
  },

  async addSizeBreakdown(planId: Guid, body: AddCuttingPlanSizeBreakdownRequest): Promise<CuttingPlanSizeBreakdown> {
    const res = await api.post(`cutting-plans/${planId}/size-breakdowns`, { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingPlanSizeBreakdown>(res.data);
  },

  async updateSizeBreakdown(id: Guid, body: UpdateCuttingPlanSizeBreakdownRequest): Promise<CuttingPlanSizeBreakdown> {
    const res = await api.put(`cutting-size-breakdowns/${id}`, body);
    return unwrapApiData<CuttingPlanSizeBreakdown>(res.data);
  },

  async deleteSizeBreakdown(id: Guid): Promise<void> {
    await api.delete(`cutting-size-breakdowns/${id}`);
  },

  /* ── Fabric issues ── */
  async getFabricIssues(companyId?: Guid, orderId?: Guid, planId?: Guid): Promise<FabricIssueToCutting[]> {
    const res = await api.get('fabric-issues-to-cutting', { params: params(companyId, { orderId, planId }) });
    return unwrapApiData<FabricIssueToCutting[]>(res.data);
  },

  async createFabricIssue(body: CreateFabricIssueToCuttingRequest): Promise<FabricIssueToCutting> {
    const res = await api.post('fabric-issues-to-cutting', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<FabricIssueToCutting>(res.data);
  },

  /* ── Lays ── */
  async getLays(companyId?: Guid, planId?: Guid): Promise<CuttingLay[]> {
    const res = await api.get('cutting-lays', { params: params(companyId, { planId }) });
    return unwrapApiData<CuttingLay[]>(res.data);
  },

  async getLayById(id: Guid): Promise<CuttingLay> {
    const res = await api.get(`cutting-lays/${id}`);
    return unwrapApiData<CuttingLay>(res.data);
  },

  async createLay(body: CreateCuttingLayRequest): Promise<CuttingLay> {
    const res = await api.post('cutting-lays', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingLay>(res.data);
  },

  async updateLay(id: Guid, body: UpdateCuttingLayRequest): Promise<CuttingLay> {
    const res = await api.put(`cutting-lays/${id}`, body);
    return unwrapApiData<CuttingLay>(res.data);
  },

  /* ── Outputs ── */
  async getOutputs(companyId?: Guid, orderId?: Guid, planId?: Guid): Promise<CuttingOutput[]> {
    const res = await api.get('cutting-outputs', { params: params(companyId, { orderId, planId }) });
    return unwrapApiData<CuttingOutput[]>(res.data);
  },

  async createOutput(body: CreateCuttingOutputRequest): Promise<CuttingOutput> {
    const res = await api.post('cutting-outputs', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingOutput>(res.data);
  },

  /* ── Wastage ── */
  async getWastages(companyId?: Guid, orderId?: Guid, planId?: Guid): Promise<CuttingWastage[]> {
    const res = await api.get('cutting-wastages', { params: params(companyId, { orderId, planId }) });
    return unwrapApiData<CuttingWastage[]>(res.data);
  },

  async createWastage(body: CreateCuttingWastageRequest): Promise<CuttingWastage> {
    const res = await api.post('cutting-wastages', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingWastage>(res.data);
  },

  /* ── Balances ── */
  async getBalances(companyId: Guid, orderId: Guid): Promise<CuttingBalance[]> {
    const res = await api.get('cutting-balances', { params: params(companyId, { orderId }) });
    return unwrapApiData<CuttingBalance[]>(res.data);
  },

  /* ── Bundles ── */
  async getBundlesPage(
    companyId?: Guid,
    options?: {
      orderId?: Guid;
      planId?: Guid;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<LegacyPagedResult<CuttingBundle>> {
    const res = await api.get('cutting-bundles', {
      params: {
        ...params(companyId, {
          orderId: options?.orderId,
          planId: options?.planId,
          status: options?.status,
        }),
        ...buildPaginationParams({
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 10,
          filters: options?.search ? { search: options.search } : undefined,
        }),
      },
    });
    const paginated = unwrapPaginatedApiData<CuttingBundle>(res.data);
    return {
      items: paginated.data,
      page: paginated.pagination.page,
      pageSize: paginated.pagination.pageSize,
      totalCount: paginated.pagination.totalCount,
      totalPages: paginated.pagination.totalPages,
      hasNextPage: paginated.pagination.hasNextPage,
      hasPreviousPage: paginated.pagination.hasPreviousPage,
      getAll: paginated.pagination.getAll,
    };
  },

  async getBundleSummary(
    companyId?: Guid,
    status?: string,
  ): Promise<{ bundleCount: number; totalPieces: number }> {
    const res = await api.get('cutting-bundles/summary', {
      params: params(companyId, { status }),
    });
    return unwrapApiData<{ bundleCount: number; totalPieces: number }>(res.data);
  },

  async getBundles(companyId?: Guid, orderId?: Guid, planId?: Guid, status?: string): Promise<CuttingBundle[]> {
    const res = await api.get('cutting-bundles', {
      params: {
        ...params(companyId, { orderId, planId, status }),
        ...buildPaginationParams({ getAll: true }),
      },
    });
    return unwrapPaginatedApiData<CuttingBundle>(res.data).data;
  },

  async getBundleById(id: Guid): Promise<CuttingBundle> {
    const res = await api.get(`cutting-bundles/${id}`);
    return unwrapApiData<CuttingBundle>(res.data);
  },

  async createBundle(body: CreateCuttingBundleRequest): Promise<CuttingBundle> {
    const res = await api.post('cutting-bundles', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingBundle>(res.data);
  },

  async updateBundle(id: Guid, body: UpdateCuttingBundleRequest): Promise<CuttingBundle> {
    const res = await api.put(`cutting-bundles/${id}`, body);
    return unwrapApiData<CuttingBundle>(res.data);
  },

  async updateBundleStatus(id: Guid, body: UpdateBundleStatusRequest): Promise<CuttingBundle> {
    const res = await api.patch(`cutting-bundles/${id}/status`, body);
    return unwrapApiData<CuttingBundle>(res.data);
  },

  /* ── Panel transfers ── */
  async getPanelTransfers(companyId?: Guid, orderId?: Guid): Promise<CuttingPanelTransfer[]> {
    const res = await api.get('cutting-panel-transfers', { params: params(companyId, { orderId }) });
    return unwrapApiData<CuttingPanelTransfer[]>(res.data);
  },

  async getPanelTransferById(id: Guid): Promise<CuttingPanelTransfer> {
    const res = await api.get(`cutting-panel-transfers/${id}`);
    return unwrapApiData<CuttingPanelTransfer>(res.data);
  },

  async createPanelTransfer(body: CreatePanelTransferRequest): Promise<CuttingPanelTransfer> {
    const res = await api.post('cutting-panel-transfers', { ...body, companyId: companyGuid(body.companyId) });
    return unwrapApiData<CuttingPanelTransfer>(res.data);
  },

  async confirmPanelTransfer(id: Guid): Promise<CuttingPanelTransfer> {
    const res = await api.patch(`cutting-panel-transfers/${id}/confirm`);
    return unwrapApiData<CuttingPanelTransfer>(res.data);
  },

  async cancelPanelTransfer(id: Guid): Promise<CuttingPanelTransfer> {
    const res = await api.patch(`cutting-panel-transfers/${id}/cancel`);
    return unwrapApiData<CuttingPanelTransfer>(res.data);
  },

  /* ── Reports ── */
  async getReport(
    reportType: string,
    companyId?: Guid,
    orderId?: Guid,
    fromDate?: string,
    toDate?: string,
  ): Promise<CuttingReportRow[]> {
    const res = await api.get('cutting-reports', {
      params: params(companyId, { reportType, orderId, fromDate, toDate }),
    });
    return unwrapApiData<CuttingReportRow[]>(res.data);
  },

  async exportReport(body: CuttingReportExportRequest, filename: string): Promise<void> {
    const res = await api.post('cutting-reports/export', body, { responseType: 'blob' });
    const ext = body.format.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx';
    downloadBlob(res.data, filename.endsWith(ext) ? filename : `${filename}.${ext}`, res.headers['content-type']);
  },
};

export default cuttingService;
