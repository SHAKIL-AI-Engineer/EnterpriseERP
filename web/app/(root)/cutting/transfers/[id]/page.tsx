"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import type { CuttingPanelTransfer } from "@/lib/types/cutting";

export default function PanelTransferDetailPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {() => <TransferDetailContent />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function TransferDetailContent() {
  const params = useParams();
  const transferId = typeof params.id === "string" ? params.id : "";

  const [transfer, setTransfer] = React.useState<CuttingPanelTransfer | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    try {
      const row = await cuttingService.getPanelTransferById(transferId);
      setTransfer(row);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load transfer");
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await cuttingService.confirmPanelTransfer(transferId);
      setTransfer(updated);
      toast.success("Transfer confirmed");
    } catch (error) {
      console.error(error);
      toast.error("Confirm failed");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading transfer…</p>;
  }

  if (!transfer) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Transfer not found</p>
        <Button variant="outline" asChild>
          <Link href="/cutting/send-to-sewing">Back to send to sewing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cutting/send-to-sewing">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{transfer.transferNo}</h2>
            <p className="text-sm text-muted-foreground">
              {transfer.transferDate} · {transfer.toDepartment}
            </p>
          </div>
          <Badge variant="outline">{transfer.status}</Badge>
        </div>
        {transfer.status === "Draft" && (
          <Button
            className="bg-cyan-600 hover:bg-cyan-700"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Confirming…" : "Confirm Transfer"}
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Total qty: </span>
            <span className="font-bold font-mono">
              {transfer.totalTransferQty.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Line items: </span>
            <span className="font-bold">{transfer.items?.length ?? 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Transfer Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transfer.items ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No items
                  </TableCell>
                </TableRow>
              ) : (
                transfer.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.colorName ?? "—"}</TableCell>
                    <TableCell>{item.sizeName}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.transferQty.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
