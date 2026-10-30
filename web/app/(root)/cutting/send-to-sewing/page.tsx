"use client";

import * as React from "react";
import Link from "next/link";
import { IconSend, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { CreatePanelTransferItemRequest, CuttingPanelTransfer, CuttingPlan } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

export default function SendToSewingPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <SendToSewingContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function SendToSewingContent({ companyId }: { companyId: string }) {
  const [transfers, setTransfers] = React.useState<CuttingPanelTransfer[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    orderId: "",
    cuttingPlanId: "",
    transferNo: "",
    transferDate: new Date().toISOString().slice(0, 10),
    toDepartment: "Sewing",
  });
  const [items, setItems] = React.useState<CreatePanelTransferItemRequest[]>([
    { sizeName: "M", transferQty: 0 },
  ]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [transferRows, orderRows, planRows] = await Promise.all([
        cuttingService.getPanelTransfers(companyId),
        merchandisingService.getOrders(companyId),
        cuttingService.getPlans(companyId),
      ]);
      setTransfers(transferRows);
      setOrders(orderRows);
      setPlans(planRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load panel transfers");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const orderLabel = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.cuttingPlanId || !form.transferNo) {
      toast.error("Order, plan, and transfer number are required");
      return;
    }
    const validItems = items.filter(
      (i) => i.sizeName.trim() && i.transferQty > 0,
    );
    if (validItems.length === 0) {
      toast.error("Add at least one transfer line");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createPanelTransfer({
        companyId,
        orderId: form.orderId,
        cuttingPlanId: form.cuttingPlanId,
        transferNo: form.transferNo,
        transferDate: form.transferDate,
        toDepartment: form.toDepartment,
        items: validItems,
      });
      toast.success("Panel transfer created");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create transfer");
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await cuttingService.confirmPanelTransfer(id);
      toast.success("Transfer confirmed");
      load();
    } catch (error) {
      console.error(error);
      toast.error("Confirm failed");
    }
  };

  const plansForOrder = plans.filter((p) => p.orderId === form.orderId);
  const totalSentToday = transfers.reduce((s, t) => s + t.totalTransferQty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-cyan-600 dark:text-cyan-500">
            Send to Sewing
          </h2>
          <p className="text-muted-foreground">
            Panel transfers from cutting floor to sewing
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
              <IconPlus className="h-4 w-4" />
              New Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New Panel Transfer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4 max-h-[70vh] overflow-y-auto">
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
                  <Label>Plan</Label>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Transfer No</Label>
                    <Input
                      value={form.transferNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, transferNo: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.transferDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, transferDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>To Department</Label>
                  <Input
                    value={form.toDepartment}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, toDepartment: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Items</Label>
                  {items.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Size"
                        value={line.sizeName}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = { ...next[i], sizeName: e.target.value };
                          setItems(next);
                        }}
                        className="w-24"
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Qty"
                        value={line.transferQty || ""}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = {
                            ...next[i],
                            transferQty: Number(e.target.value) || 0,
                          };
                          setItems(next);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={items.length === 1}
                        onClick={() =>
                          setItems(items.filter((_, idx) => idx !== i))
                        }
                      >
                        <IconTrash className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems([...items, { sizeName: "", transferQty: 0 }])
                    }
                  >
                    Add line
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Transit Manifest</CardTitle>
              <CardDescription>Panel transfers to sewing department</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-cyan-500/5">
                  <TableRow>
                    <TableHead>Transfer No</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total Pcs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transfers
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-bold">
                          <Link
                            href={`/cutting/transfers/${item.id}`}
                            className="text-erp-accent hover:underline"
                          >
                            {item.transferNo}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs">
                          {orderLabel(item.orderId)}
                        </TableCell>
                        <TableCell className="text-xs">{item.toDepartment}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.totalTransferQty.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Link
                            href={`/cutting/transfers/${item.id}`}
                            className="text-xs text-erp-accent hover:underline"
                          >
                            View
                          </Link>
                          {item.status === "Draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleConfirm(item.id)}
                            >
                              Confirm
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-2xl bg-cyan-600 text-white">
          <p className="text-[10px] font-bold uppercase opacity-80">Total Transfer Qty</p>
          <p className="text-4xl font-black mt-1">
            {loading ? "—" : totalSentToday.toLocaleString()}
          </p>
          <p className="text-[10px] mt-4 font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded inline-block">
            {transfers.length} transfers
          </p>
        </div>
      </div>
    </div>
  );
}
