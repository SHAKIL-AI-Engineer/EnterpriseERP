"use client";

import { useMerchCompany } from "@/hooks/use-merch-company";
import { MerchEmptyState } from "@/components/merchandising/merch-empty-state";

type StoreCompanyGateProps = {
  children: (companyId: string) => React.ReactNode;
};

export function StoreCompanyGate({ children }: StoreCompanyGateProps) {
  const { companyId, loading, ready } = useMerchCompany();

  if (loading) {
    return <MerchEmptyState variant="loading" />;
  }

  if (!ready || !companyId) {
    return (
      <MerchEmptyState
        variant="no-company"
        description="Choose an active company from the header to load store and inventory data."
      />
    );
  }

  return <>{children(companyId)}</>;
}
