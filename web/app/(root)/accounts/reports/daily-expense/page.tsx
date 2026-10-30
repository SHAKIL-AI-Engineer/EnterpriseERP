"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function DailyExpenseReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getDailyExpenseReport({ companyId, ...range })); }
    catch { toast.error("Failed to load report"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Daily expense report" description="Expense summary by category for a date range.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
