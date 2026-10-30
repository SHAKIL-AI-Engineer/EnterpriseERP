import type { Company } from "@/lib/services/company";
import { pickDefaultCompany } from "@/lib/company-filter-scope";

export interface LeaveFilterParams {
  companyEntityId?: string;
  companyId?: number;
  year?: number;
  month?: number;
  status?: string;
  searchTerm?: string;
}

/** Default company from profile / active context (see pickDefaultCompany). */
export function pickDefaultLeaveCompany(
  companies: Company[],
  defaultCompanyId?: string | null,
): Company | undefined {
  return pickDefaultCompany(companies, { defaultCompanyId });
}

export function leaveFiltersFromCompany(
  company: Company | undefined,
  extras?: Partial<LeaveFilterParams>,
): LeaveFilterParams {
  if (!company) return { ...extras };
  return {
    companyEntityId: company.entityId,
    companyId: company.id,
    ...extras,
  };
}
