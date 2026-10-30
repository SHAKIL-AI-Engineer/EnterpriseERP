"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { MoneyRequestDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function MoneyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<MoneyRequestDto | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await accountsService.getMoneyRequest(id);
      setRow(data);
      setApprovedAmount(String(data.requestedAmount));
    } catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<MoneyRequestDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></div>;
  if (!row) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.requestNo} description={row.requestDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/requests/money">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Purpose:</span> {row.purpose}</p>
          <p><span className="text-muted-foreground">Requested:</span> {formatCurrency(row.requestedAmount)}</p>
          <p><span className="text-muted-foreground">Approved:</span> {formatCurrency(row.approvedAmount)}</p>
          <p><span className="text-muted-foreground">Paid:</span> {formatCurrency(row.paidAmount)}</p>
        </CardContent>
      </Card>
      {companyId && row.status === "Pending" && (
        <Card><CardContent className="pt-6 flex flex-wrap items-end gap-3">
          <div className="space-y-1"><Label>Approved amount</Label>
            <Input type="number" min={0} step="0.01" className="w-40" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} /></div>
          <Button disabled={acting || !user?.id} onClick={() => act(() => accountsService.approveMoneyRequest(id, { approvedBy: user!.id, approvedAmount: Number(approvedAmount) }), "Approved")}>Approve</Button>
          <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.rejectMoneyRequest(id, user?.id), "Rejected")}>Reject</Button>
        </CardContent></Card>
      )}
      {companyId && row.status === "Approved" && (
        <Button disabled={acting} onClick={() => act(() => accountsService.payMoneyRequest(id, user?.id), "Paid")}>Pay</Button>
      )}
    </div>
  );
}
