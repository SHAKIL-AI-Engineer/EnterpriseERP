import type { Company } from "@/lib/services/company";

export type CompanyFilterValue = {
  companyEntityId: string;
  legacyCompanyId?: number;
  companyNameEn?: string;
};

/** Default company: profile default, then active id, then first in list. */
export function pickDefaultCompany(
  companies: Company[],
  options?: { defaultCompanyId?: string | null; activeCompanyId?: string | null },
): Company | undefined {
  if (companies.length === 0) return undefined;
  const { defaultCompanyId, activeCompanyId } = options ?? {};
  if (defaultCompanyId) {
    const fromDefault = companies.find((c) => c.entityId === defaultCompanyId);
    if (fromDefault) return fromDefault;
  }
  if (activeCompanyId) {
    const fromActive = companies.find((c) => c.entityId === activeCompanyId);
    if (fromActive) return fromActive;
  }
  return companies[0];
}

export function isCompanyFilterLocked(
  companies: Company[],
  isSuperAdmin: boolean,
): boolean {
  return !isSuperAdmin && companies.length === 1;
}

export function companyToFilterValue(company: Company | undefined): CompanyFilterValue | null {
  if (!company?.entityId) return null;
  return {
    companyEntityId: company.entityId,
    legacyCompanyId: company.id,
    companyNameEn: company.companyNameEn,
  };
}

export function entityIdFromFilterValue(
  value: string,
  companies: Company[],
): string {
  if (!value || value === "all") return "";
  const byEntity = companies.find((c) => c.entityId === value);
  if (byEntity) return byEntity.entityId;
  const asNum = parseInt(value, 10);
  if (!Number.isNaN(asNum)) {
    const byLegacy = companies.find((c) => c.id === asNum);
    if (byLegacy) return byLegacy.entityId;
  }
  return value;
}
