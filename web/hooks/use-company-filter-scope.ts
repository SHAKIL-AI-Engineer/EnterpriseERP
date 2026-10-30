"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCompanyContext } from "@/components/providers/company-context";
import {
  companyToFilterValue,
  pickDefaultCompany,
  type CompanyFilterValue,
} from "@/lib/company-filter-scope";
import type { Company } from "@/lib/services/company";

export function useCompanyFilterScope() {
  const { user } = useAuth();
  const {
    companies,
    loading,
    isCompanyLocked,
    lockedCompany,
    activeCompanyId,
    isSuperAdmin,
    resolveDefaultCompany,
  } = useCompanyContext();

  const defaultCompany = React.useMemo(
    () => resolveDefaultCompany(),
    [resolveDefaultCompany],
  );

  const defaultFilterValue = React.useMemo(
    () => companyToFilterValue(defaultCompany),
    [defaultCompany],
  );

  const applyDefaultToState = React.useCallback(
    <T extends { companyEntityId?: string; legacyCompanyId?: number; companyId?: number }>(
      setState: React.Dispatch<React.SetStateAction<T>>,
      extras?: Partial<T>,
    ) => {
      if (!defaultCompany) return;
      setState((prev) => ({
        ...prev,
        companyEntityId: defaultCompany.entityId,
        legacyCompanyId: defaultCompany.id,
        companyId: defaultCompany.id,
        ...extras,
      }));
    },
    [defaultCompany],
  );

  return {
    companies,
    loading,
    isCompanyLocked,
    lockedCompany,
    defaultCompany,
    defaultFilterValue,
    activeCompanyId,
    isSuperAdmin,
    userDefaultCompanyId: user?.defaultCompanyId ?? null,
    applyDefaultToState,
    pickDefault: () =>
      pickDefaultCompany(companies, {
        defaultCompanyId: user?.defaultCompanyId,
        activeCompanyId,
      }),
  };
}

export type { Company, CompanyFilterValue };
