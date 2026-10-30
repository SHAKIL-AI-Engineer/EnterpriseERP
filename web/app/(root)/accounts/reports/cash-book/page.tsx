"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { LedgerTable } from "@/components/accounts/ledger-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function CashBookReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [entries, setEntries] = useState<GeneralLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setEntries(await accountsService.getCashBook({ companyId, ...range })); }
    catch { toast.error("Failed to load cash book"); setEntries([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Cash book" description="All cash account movements.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><LedgerTable entries={entries} /></CardContent></Card>
    </AccountsListShell>
  );
}
