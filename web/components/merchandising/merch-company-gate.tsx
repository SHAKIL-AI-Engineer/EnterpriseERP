"use client";

import { useMerchCompany } from "@/hooks/use-merch-company";
import { MerchEmptyState } from "./merch-empty-state";

type MerchCompanyGateProps = {
  children: (companyId: string) => React.ReactNode;
};

export function MerchCompanyGate({ children }: MerchCompanyGateProps) {
  const { companyId, loading, ready } = useMerchCompany();

  if (loading) {
    return <MerchEmptyState variant="loading" />;
  }

  if (!ready || !companyId) {
    return <MerchEmptyState variant="no-company" />;
  }

  return <>{children(companyId)}</>;
}
