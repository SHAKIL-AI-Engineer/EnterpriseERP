"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { FinancialStatementTable } from "@/components/accounts/financial-statement-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { FinancialStatementDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MonthlyExpenseReportPage() {
  const { companyId } = useAccountsCompany();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<FinancialStatementDto | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setReport(await accountsService.getMonthlyExpenseReport({ companyId, year, month })); }
    catch { toast.error("Failed to load report"); setReport(null); }
    finally { setLoading(false); }
  }, [companyId, year, month]);
  useEffect(() => { if (companyId) run(); }, [companyId, year, month, run]);
  return (
    <AccountsListShell title="Monthly expense report" description="Expense summary for a calendar month.">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label className="text-xs">Year</Label>
          <Input type="number" className="h-9 w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
        <div className="space-y-1"><Label className="text-xs">Month</Label>
          <Input type="number" min={1} max={12} className="h-9 w-20" value={month} onChange={(e) => setMonth(Number(e.target.value))} /></div>
      </div>
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><FinancialStatementTable report={report} /></CardContent></Card>
    </AccountsListShell>
  );
}
