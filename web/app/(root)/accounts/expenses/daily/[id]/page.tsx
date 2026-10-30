"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AccountsPageHeader } from "@/components/accounts/accounts-page-header";
import { WorkflowStatusBadge } from "@/components/accounts/workflow-status-badge";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { accountsService } from "@/lib/services/accounts";
import type { DailyExpenseDto } from "@/lib/services/accounts-types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function DailyExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { companyId } = useAccountsCompany();
  const [row, setRow] = useState<DailyExpenseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setRow(await accountsService.getDailyExpense(id)); }
    catch { toast.error("Failed to load"); setRow(null); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<DailyExpenseDto>, msg: string) => {
    setActing(true);
    try { setRow(await fn()); toast.success(msg); }
    catch { toast.error("Action failed"); }
    finally { setActing(false); }
  };

  if (loading) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Loading…</p></div>;
  if (!row) return <div className="flex-1 p-8 pt-6"><p className="text-muted-foreground">Not found.</p></div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <AccountsPageHeader title={row.expenseNo} description={row.expenseDate}
        actions={<Button variant="outline" size="sm" asChild><Link href="/accounts/expenses/daily">Back</Link></Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Details</CardTitle><WorkflowStatusBadge status={row.status} />
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(row.amount)}</p>
          <p><span className="text-muted-foreground">Method:</span> {row.paymentMethod}</p>
          <p><span className="text-muted-foreground">Paid to:</span> {row.paidTo ?? "—"}</p>
          <p><span className="text-muted-foreground">Description:</span> {row.description ?? "—"}</p>
        </CardContent>
      </Card>
      {companyId && (
        <div className="flex flex-wrap gap-2">
          {row.status === "Pending" && <Button disabled={acting} onClick={() => act(() => accountsService.approveDailyExpense(id, userId), "Approved")}>Approve</Button>}
          {row.status === "Approved" && <Button disabled={acting} onClick={() => act(() => accountsService.payDailyExpense(id, userId), "Paid")}>Pay</Button>}
          {!["Paid", "Rejected"].includes(row.status) && (
            <Button variant="destructive" disabled={acting} onClick={() => act(() => accountsService.rejectDailyExpense(id, userId), "Rejected")}>Reject</Button>
          )}
        </div>
      )}
    </div>
  );
}
