"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyRequestDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function MoneyRequestsPage() {
  const { companyId } = useAccountsCompany();
  const [rows, setRows] = useState<MoneyRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getMoneyRequests({ companyId })); }
    catch { toast.error("Failed to load requests"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Money requests" description="Internal fund requisition workflow."
      actions={<Button size="sm" asChild><Link href="/accounts/requests/money/new">New request</Link></Button>}>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Purpose</TableHead>
              <TableHead className="text-right">Requested</TableHead><TableHead className="text-right">Approved</TableHead>
              <TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/requests/money/${r.id}`}>{r.requestNo}</Link></TableCell>
                  <TableCell>{r.requestDate}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.purpose}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.requestedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.approvedAmount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/requests/money/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
