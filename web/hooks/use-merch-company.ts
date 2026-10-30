"use client";

import { useCompanyContext } from "@/components/providers/company-context";

/** Active company GUID for merchandising API calls. */
export function useMerchCompany() {
  const { activeCompanyId, loading } = useCompanyContext();
  const ready = !loading && !!activeCompanyId;
  return {
    companyId: activeCompanyId ?? undefined,
    loading,
    ready,
  };
}
