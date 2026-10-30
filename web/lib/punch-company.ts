import type { Company } from "@/lib/services/company";

/**
 * Maps ERP company GUID → PunchData numeric companyId.
 * Keep in sync with Platform.Host appsettings.json → PunchData:CompanyIdByGuid.
 */
export const PUNCH_COMPANY_BY_GUID: Record<string, number> = {
  "BCC18DE7-7D50-43BD-96DA-6E3E8DEC3825": 1,
  "4131F399-11E9-4733-B52A-1E7853B0D306": 1,
};

export const PUNCH_DEFAULT_COMPANY_ID = 1;

export function resolvePunchCompanyIdFromGuid(entityId: string | undefined | null): number {
  if (!entityId?.trim()) return PUNCH_DEFAULT_COMPANY_ID;
  return PUNCH_COMPANY_BY_GUID[entityId.trim().toUpperCase()] ?? PUNCH_DEFAULT_COMPANY_ID;
}

export function resolvePunchCompanyId(company: Company | null | undefined): number {
  if (!company?.entityId) return PUNCH_DEFAULT_COMPANY_ID;
  return resolvePunchCompanyIdFromGuid(company.entityId);
}
