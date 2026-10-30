"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft, IconLoader2, IconTruckDelivery } from "@tabler/icons-react";
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
  GatePassWorkflowActions,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { Chalan, GatePass } from "@/lib/types/security";

export default function GatePassDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <GatePassDetailContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function GatePassDetailContent({ companyId }: { companyId: string }) {
  const params = useParams();
  const id = params.id as string;
  const [gatePass, setGatePass] = React.useState<GatePass | null>(null);
  const [linkedChalan, setLinkedChalan] = React.useState<Chalan | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const gp = await securityService.getGatePassById(id);
      setGatePass(gp);
      const chalans = await securityService.getChalans(companyId);
      const match = chalans.find((c) => c.gatePassId === gp.id);
      setLinkedChalan(match ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gate pass");
    } finally {
      setLoading(false);
    }
  }, [id, companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!gatePass) {
    return <p className="text-muted-foreground">Gate pass not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/gate-passes">
              <IconArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{gatePass.gatePassNo}</h1>
            <p className="text-sm text-muted-foreground">
              {gatePass.gatePassType} · {gatePass.direction} · {gatePass.gatePassDate}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <SecurityStatusBadge status={gatePass.status} />
              <SecurityStatusBadge status={gatePass.approvalStatus} />
            </div>
          </div>
        </div>
        <GatePassWorkflowActions gatePass={gatePass} onUpdated={setGatePass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <span className="text-muted-foreground">Vehicle</span>
          <p className="font-medium">{gatePass.vehicleNo || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Driver</span>
          <p className="font-medium">{gatePass.driverName || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Purpose</span>
          <p className="font-medium">{gatePass.purpose || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Returnable</span>
          <p className="font-medium">
            {gatePass.isReturnable
              ? `Yes${gatePass.expectedReturnDate ? ` (by ${gatePass.expectedReturnDate})` : ""}`
              : "No"}
          </p>
        </div>
      </div>

      {linkedChalan && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
          <IconTruckDelivery className="size-5 text-muted-foreground" />
          <span className="text-sm">Linked chalan:</span>
          <Link
            href={`/security/chalans/${linkedChalan.id}`}
            className="text-sm font-medium text-erp-accent hover:underline"
          >
            {linkedChalan.chalanNo}
          </Link>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Returned</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(gatePass.items ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No line items
                </TableCell>
              </TableRow>
            ) : (
              gatePass.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.itemDescription || "—"}</TableCell>
                  <TableCell>{item.unitName || "—"}</TableCell>
                  <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono">{item.returnedQty}</TableCell>
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
