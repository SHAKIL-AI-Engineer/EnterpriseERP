"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  SecurityStatusBadge,
} from "@/components/security";
import { canApproveChalan, isViewerOnly } from "@/components/security/security-roles";
import { useAuth } from "@/components/providers/auth-provider";
import { securityService } from "@/lib/services/security";
import type { Chalan } from "@/lib/types/security";

export default function ChalanDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {() => <ChalanDetailContent />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function ChalanDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);
  const canApprove = canApproveChalan(roles);
  const [chalan, setChalan] = React.useState<Chalan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await securityService.getChalanById(id);
      setChalan(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chalan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const run = async (action: "approve" | "cancel", fn: () => Promise<Chalan>) => {
    setBusy(action);
    try {
      const updated = await fn();
      setChalan(updated);
      toast.success(`Chalan ${action === "approve" ? "approved" : "cancelled"}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} chalan`);
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

  if (!chalan) {
    return <p className="text-muted-foreground">Chalan not found.</p>;
  }

  const showActions =
    !readOnly && canApprove && (chalan.status === "Draft" || chalan.status === "Pending");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/chalans">
              <IconArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{chalan.chalanNo}</h1>
            <p className="text-sm text-muted-foreground">
              {chalan.chalanType} · {chalan.chalanDate}
            </p>
            <div className="mt-2">
              <SecurityStatusBadge status={chalan.status} />
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => run("approve", () => securityService.approveChalan(chalan.id))}
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!!busy}
              onClick={() => run("cancel", () => securityService.cancelChalan(chalan.id))}
            >
              {busy === "cancel" ? "Cancelling…" : "Cancel"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <span className="text-muted-foreground">Vehicle</span>
          <p className="font-medium">{chalan.vehicleNo || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Driver</span>
          <p className="font-medium">{chalan.driverName || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Remarks</span>
          <p className="font-medium">{chalan.remarks || "—"}</p>
        </div>
      </div>

      {chalan.gatePassId && (
        <p className="text-sm">
          Linked gate pass:{" "}
          <Link
            href={`/security/gate-passes/${chalan.gatePassId}`}
            className="text-erp-accent hover:underline"
          >
            View gate pass
          </Link>
        </p>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(chalan.items ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No line items
                </TableCell>
              </TableRow>
            ) : (
              chalan.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.unitName || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  <TableCell>{item.remarks || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
