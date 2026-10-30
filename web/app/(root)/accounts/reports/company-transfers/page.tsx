"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { CompanyMoneyTransferDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function CompanyTransfersReportPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [rows, setRows] = useState<CompanyMoneyTransferDto[]>([]);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getCompanyTransferReport({ companyId, ...range })); }
    catch { toast.error("Failed to load report"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { if (companyId) run(); }, [companyId, range, run]);
  return (
    <AccountsListShell title="Company transfer report" description="Inter-company transfer history.">
      <DateRangeFilter value={range} onChange={setRange} />
      <Button size="sm" onClick={run} disabled={loading}>{loading ? "Loading…" : "Run report"}</Button>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/transfers/company/${r.id}`}>{r.transferNo}</Link></TableCell>
                  <TableCell>{r.transferDate}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/transfers/company/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
