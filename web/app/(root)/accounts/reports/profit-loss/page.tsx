"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfitLossReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, ...range } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getProfitLoss({ companyId, ...range })); }
    catch { toast.error("Failed to load P&L"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Profit & loss" description="Income and expense statement."
      actions={companyId ? <ReportExportButtons basePath="profit-loss" params={params} filePrefix="profit-loss" /> : undefined}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
