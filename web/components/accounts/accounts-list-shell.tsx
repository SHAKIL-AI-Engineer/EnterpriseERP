"use client";

import { useAccountsCompany } from "./accounts-company-context";
import { AccountsPageHeader } from "./accounts-page-header";

export function AccountsListShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { companyId, loading } = useAccountsCompany();

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={title} description={description} actions={actions} />
      {loading ? (
        <p className="text-muted-foreground">Loading companies…</p>
      ) : !companyId ? (
        <p className="text-muted-foreground">Select a company to continue.</p>
      ) : (
        children
      )}
    </div>
  );
}
