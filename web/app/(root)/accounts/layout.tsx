"use client";

import { RouteGuard } from "@/components/auth/route-guard";
import { AccountsCompanyProvider } from "@/components/accounts/accounts-company-context";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={["SuperAdmin", "Admin", "Accounts", "Accountant", "Account Officer"]}>
      <AccountsCompanyProvider>{children}</AccountsCompanyProvider>
    </RouteGuard>
  );
}
