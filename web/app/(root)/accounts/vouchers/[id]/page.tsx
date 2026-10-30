"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { VoucherDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function VoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<VoucherDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getVoucher(id)); }
    catch { toast.error("Failed to load voucher"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<VoucherDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></div>;
  if (!row) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Voucher not found.</p></div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.voucherNo} description={`${row.voucherType} · ${row.voucherDate}`}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/vouchers">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Summary</CardTitle>
          <WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Reference:</span> {row.referenceNo ?? "—"}</p>
          <p><span className="text-muted-foreground">Narration:</span> {row.narration ?? "—"}</p>
          <p><span className="text-muted-foreground">Total debit:</span> {formatCurrency(row.totalDebit)}</p>
          <p><span className="text-muted-foreground">Total credit:</span> {formatCurrency(row.totalCredit)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Lines</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead><TableHead>Description</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {row.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm">{l.accountId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.debitAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.creditAmount)}</TableCell>
                  <TableCell>{l.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {companyId && (
        <div className="flex flex-wrap gap-2">
          {row.status === "Draft" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.submitVoucher(id, userId), "Submitted")}>Submit</Button>
          )}
          {row.status === "Submitted" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.approveVoucher(id, userId), "Approved")}>Approve</Button>
          )}
          {row.status === "Approved" && (
            <Button disabled={acting} onClick={() => act(() => accountsService.postVoucher(id, userId), "Posted")}>Post</Button>
          )}
          {!["Posted", "Cancelled"].includes(row.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.cancelVoucher(id, userId), "Cancelled")}>Cancel</Button>
          )}
        </div>
      )}
    </div>
  );
}
