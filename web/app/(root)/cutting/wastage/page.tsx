"use client";

import * as React from "react";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { merchandisingService } from "@/lib/services/merchandising";
import type { CuttingPlan, CuttingWastage } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

export default function WastageTrackingPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <WastageContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function WastageContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<CuttingWastage[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    orderId: "",
    cuttingPlanId: "",
    wastageDate: new Date().toISOString().slice(0, 10),
    fabricItemId: "",
    wastageQty: "",
    wastageReason: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [wastageRows, orderRows, planRows] = await Promise.all([
        cuttingService.getWastages(companyId),
        merchandisingService.getOrders(companyId),
        cuttingService.getPlans(companyId),
      ]);
      setRows(wastageRows);
      setOrders(orderRows);
      setPlans(planRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load wastage records");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const orderLabel = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8);

  const totalWastage = rows.reduce((s, r) => s + r.wastageQty, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.cuttingPlanId || !form.wastageReason) {
      toast.error("Order, plan, and reason are required");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createWastage({
        companyId,
        orderId: form.orderId,
        cuttingPlanId: form.cuttingPlanId,
        wastageDate: form.wastageDate,
        fabricItemId: form.fabricItemId || undefined,
        wastageQty: Number(form.wastageQty) || 0,
        wastageReason: form.wastageReason,
      });
      toast.success("Wastage recorded");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to record wastage");
    } finally {
      setCreating(false);
    }
  };

  const plansForOrder = plans.filter((p) => p.orderId === form.orderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">
            Wastage Tracking
          </h2>
          <p className="text-muted-foreground">
            Monitor fabric loss and identify optimization opportunities
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white">
              <IconPlus className="h-4 w-4" />
              Record Wastage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New Wastage Entry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="grid gap-2">
                  <Label>Order</Label>
                  <NativeSelect
                    value={form.orderId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        orderId: e.target.value,
                        cuttingPlanId: "",
                      }))
                    }
                    required
                  >
                    <option value="">Select order</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNo}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label>Cutting Plan</Label>
                  <NativeSelect
                    value={form.cuttingPlanId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cuttingPlanId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select plan</option>
                    {plansForOrder.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.planNo}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.wastageDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wastageDate: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Wastage Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={form.wastageQty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wastageQty: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Reason</Label>
                  <Input
                    value={form.wastageReason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wastageReason: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Total Wastage Qty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-black text-rose-500 tracking-tighter">
            {loading ? "—" : totalWastage.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {rows.length} log entries
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrash className="h-5 w-5 text-rose-500" />
            Detailed Wastage Log
          </CardTitle>
          <CardDescription>All wastage records for the active company</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No wastage records
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.wastageDate}</TableCell>
                    <TableCell>{orderLabel(row.orderId)}</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">
                      {row.wastageQty.toLocaleString()}
                    </TableCell>
                    <TableCell>{row.wastageReason}</TableCell>
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
