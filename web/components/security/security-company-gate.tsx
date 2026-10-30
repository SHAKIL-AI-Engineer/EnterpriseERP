"use client";

import { useMerchCompany } from "@/hooks/use-merch-company";
import { MerchEmptyState } from "@/components/merchandising/merch-empty-state";

type SecurityCompanyGateProps = {
  children: (companyId: string) => React.ReactNode;
};

export function SecurityCompanyGate({ children }: SecurityCompanyGateProps) {
  const { companyId, loading, ready } = useMerchCompany();

  if (loading) {
    return <MerchEmptyState variant="loading" />;
  }

  if (!ready || !companyId) {
    return (
      <MerchEmptyState
        variant="no-company"
        description="Choose an active company from the header to load security gate data."
      />
    );
  }

  return <>{children(companyId)}</>;
}
