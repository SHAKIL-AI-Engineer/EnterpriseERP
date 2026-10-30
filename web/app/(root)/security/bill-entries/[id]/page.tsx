"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  SecurityStatusBadge,
} from "@/components/security";
import { canManageBill, isViewerOnly } from "@/components/security/security-roles";
import { useAuth } from "@/components/providers/auth-provider";
import { securityService } from "@/lib/services/security";
import type { BillEntry } from "@/lib/types/security";

export default function BillEntryDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {() => <BillEntryDetailContent />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function BillEntryDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);
  const canManage = canManageBill(roles);
  const [bill, setBill] = React.useState<BillEntry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await securityService.getBillEntryById(id);
      setBill(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bill entry");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const run = async (action: string, fn: () => Promise<BillEntry>) => {
    setBusy(action);
    try {
      const updated = await fn();
      setBill(updated);
      toast.success(`Bill ${action.replace(/-/g, " ")}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} bill`);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bill) {
    return <p className="text-muted-foreground">Bill entry not found.</p>;
  }

  const pending = bill.status === "Draft" || bill.status === "Pending";
  const approved = bill.status === "Approved";
  const showWorkflow = !readOnly && canManage && (pending || approved);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/bill-entries">
              <IconArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bill.billNo}</h1>
            <p className="text-sm text-muted-foreground">
              {bill.billType} · {bill.billDate}
            </p>
            <div className="mt-2">
              <SecurityStatusBadge status={bill.status} />
            </div>
          </div>
        </div>
        {showWorkflow && (
          <div className="flex flex-wrap gap-2">
            {pending && (
              <>
                <Button
                  size="sm"
                  disabled={!!busy}
                  onClick={() => run("approve", () => securityService.approveBillEntry(bill.id))}
                >
                  {busy === "approve" ? "Approving…" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!busy}
                  onClick={() => run("reject", () => securityService.rejectBillEntry(bill.id))}
                >
                  {busy === "reject" ? "Rejecting…" : "Reject"}
                </Button>
              </>
            )}
            {(pending || approved) && bill.status !== "SentToAccounts" && (
              <Button
                size="sm"
                variant="outline"
                disabled={!!busy}
                onClick={() =>
                  run("send-to-accounts", () => securityService.sendBillEntryToAccounts(bill.id))
                }
              >
                {busy === "send-to-accounts" ? "Sending…" : "Send to accounts"}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-medium font-mono">{bill.amount.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">VAT</span>
          <p className="font-medium font-mono">{bill.vatAmount.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Total</span>
          <p className="font-medium font-mono">{bill.totalAmount.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Description</span>
          <p className="font-medium">{bill.description || "—"}</p>
        </div>
      </div>
    </div>
  );
}
