"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { ReportExportButtons } from "@/components/accounts/report-export-buttons";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { todayIso } from "@/lib/accounts-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function BalanceSheetReportPage() {
  const { companyId } = useAccountsCompany();
  const [asOfDate, setAsOfDate] = useState(todayIso());
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const params = companyId ? { companyId, asOfDate } : { companyId: "" };
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getBalanceSheet({ companyId, asOfDate })); }
    catch { toast.error("Failed to load balance sheet"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, asOfDate]);
  useEffect(() => { if (companyId) run(); }, [companyId, asOfDate, run]);
  return (
    <AccountsListShell title="Balance sheet" description="Assets, liabilities, and equity as of a date."
      actions={companyId ? <ReportExportButtons basePath="balance-sheet" params={params} filePrefix="balance-sheet" /> : undefined}>
      <div className="space-y-1"><Label className="text-xs">As of date</Label>
        <Input type="date" className="h-9 w-40" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} /></div>
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
