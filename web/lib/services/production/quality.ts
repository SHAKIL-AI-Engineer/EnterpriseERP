import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';
import type { Guid } from '@/lib/types/production';

function companyGuid(companyId?: Guid): Guid {
  return companyId?.includes('-') ? companyId : getActiveCompanyHeaderValue() ?? companyId ?? '';
}

export interface QualityInspection {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  checkpointId?: Guid;
  status: string;
  inspectedAt?: string;
}

export const productionQualityService = {
  async getInspections(companyId?: Guid, orderId?: Guid): Promise<QualityInspection[]> {
    const res = await api.get('quality-inspections', {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<QualityInspection[]>(res.data);
  },
  async getFinalInspections(companyId?: Guid, orderId?: Guid) {
    const res = await api.get('final-inspections', {
      params: { companyId: companyGuid(companyId), ...(orderId ? { orderId } : {}) },
    });
    return unwrapApiData<unknown[]>(res.data);
  },
};
