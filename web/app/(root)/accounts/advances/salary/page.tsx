"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { AdvanceSalaryPaymentDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdvanceSalaryPage() {
  const { companyId } = useAccountsCompany();
  const [rows, setRows] = useState<AdvanceSalaryPaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try { setRows(await accountsService.getAdvanceSalaryPayments({ companyId })); }
    catch { toast.error("Failed to load"); setRows([]); }
    finally { setLoading(false); }
  }, [companyId]);
  useEffect(() => { load(); }, [load]);
  return (
    <AccountsListShell title="Advance salary" description="Salary advance payments with installment recovery."
      actions={<Button size="sm" asChild><Link href="/accounts/advances/salary/new">New advance</Link></Button>}>
      <Card><CardContent className="pt-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>No</TableHead><TableHead>Date</TableHead><TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="text-primary hover:underline font-mono text-sm" href={`/accounts/advances/salary/${r.id}`}>{r.advanceSalaryNo}</Link></TableCell>
                  <TableCell>{r.advanceDate}</TableCell>
                  <TableCell className="font-mono text-sm">{r.employeeId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                  <TableCell><WorkflowStatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/accounts/advances/salary/${r.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </AccountsListShell>
  );
}
