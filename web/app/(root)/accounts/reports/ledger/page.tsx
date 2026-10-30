"use client";
import { useCallback, useEffect, useState } from "react";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { AccountPicker } from "@/components/accounts/account-picker";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { LedgerTable } from "@/components/accounts/ledger-table";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { GeneralLedgerEntryDto } from "@/lib/services/accounts-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LedgerReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [accountId, setAccountId] = useState("");
  const [entries, setEntries] = useState<GeneralLedgerEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId || !accountId) return;
    setLoading(true);
    try { setEntries(await accountsService.getLedger({ companyId, accountId, ...range })); }
    catch { toast.error("Failed to load ledger"); setEntries([]); }
    finally { setLoading(false); }
  }, [companyId, accountId, range]);
  useEffect(() => { if (companyId && accountId) run(); }, [companyId, accountId, range, run]);
  return (
    <AccountsListShell title="General ledger" description="Account-wise ledger entries.">
      <DateRangeFilter value={range} onChange={setRange} />
      <AccountPicker companyId={companyId} value={accountId} onChange={setAccountId} label="Account" required />
      <Button size="sm" onClick={run} disabled={loading || !accountId}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6"><LedgerTable entries={entries} /></CardContent></Card>
    </AccountsListShell>
  );
}
