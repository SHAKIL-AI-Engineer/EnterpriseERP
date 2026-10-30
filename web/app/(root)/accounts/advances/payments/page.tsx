"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { DateRangeFilter, defaultMonthRange } from "@/components/accounts/date-range-filter";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvancePaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdvancePaymentsPage() {
  const { companyId } = useAccountsCompany();
  const [range, setRange] = useState(defaultMonthRange());
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState<AdvancePaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getAdvancePayments({ companyId, ...range })); }
    catch { toast.error("Failed to load"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId, range]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => tab === "contractual" ? rows.filter((r) => r.advanceType === "ProjectAdvance") : rows, [rows, tab]);

  const table = (
    <Table>
      <TableHeader><TableRow>
        <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
        <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
      </TableRow></TableHeader>
      <TableBody>
        {filtered.map((r) => (
          <TableRow key={r.id}>
            <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/advances/payments/${r.id}`}>{r.advanceNo}</Link></TableCell>
            <TableCell>{r.advanceDate}</TableCell>
            <TableCell>{r.advanceType}</TableCell>
            <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
            <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
            <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/advances/payments/${r.id}`}>Open</Link></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <AccountsListShell title="Advance payments" description="Employee, supplier, and project advances."
      actions={<Button size="sm" asChild><Link href="/accounts/advances/payments/new">New advance</Link></Button>}>
      <DateRangeFilter value={range} onChange={setRange} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="contractual">Contractual</TabsTrigger></TabsList>
        <TabsContent value="all">
          <Card><CardContent className="pt-6">{loading ? <p className="text-sm text-muted-foreground">Loading…</p> : table}</CardContent></Card>
        </TabsContent>
        <TabsContent value="contractual">
          <Card><CardContent className="pt-6">{loading ? <p className="text-sm text-muted-foreground">Loading…</p> : table}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </AccountsListShell>
  );
}
