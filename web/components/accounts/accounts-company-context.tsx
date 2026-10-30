"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { companyService, type Company } from "@/lib/services/company";

const STORAGE_KEY = "accounts.selectedCompanyId";

type AccountsCompanyContextValue = {
  companies: Company[];
  companyId: string | null;
  company: Company | null;
  loading: boolean;
  setCompanyId: (id: string | null) => void;
  refreshCompanies: () => Promise<void>;
};

const AccountsCompanyContext = createContext<AccountsCompanyContextValue | null>(null);

export function AccountsCompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCompanies = useCallback(async () => {
    const list = await companyService.getAll();
    setCompanies(list);
    return;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await companyService.getAll();
        if (cancelled) return;
        setCompanies(list);
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const valid =
          stored && list.some((c) => c.entityId === stored) ? stored : list[0]?.entityId ?? null;
        setCompanyIdState(valid);
        if (valid && typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, valid);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCompanyId = useCallback((id: string | null) => {
    setCompanyIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const company = useMemo(
    () => companies.find((c) => c.entityId === companyId) ?? null,
    [companies, companyId],
  );

  const value = useMemo(
    () => ({ companies, companyId, company, loading, setCompanyId, refreshCompanies }),
    [companies, companyId, company, loading, setCompanyId, refreshCompanies],
  );

  return <AccountsCompanyContext.Provider value={value}>{children}</AccountsCompanyContext.Provider>;
}

export function useAccountsCompany() {
  const ctx = useContext(AccountsCompanyContext);
  if (!ctx) throw new Error("useAccountsCompany must be used within AccountsCompanyProvider");
  return ctx;
}
