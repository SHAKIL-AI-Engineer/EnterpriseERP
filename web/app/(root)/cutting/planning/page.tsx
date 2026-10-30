"use client";

import * as React from "react";
import Link from "next/link";
import { IconClipboardList, IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import { merchandisingService } from "@/lib/services/merchandising";
import type { CuttingPlan } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

export default function CuttingPlanningPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <PlanningContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function PlanningContent({ companyId }: { companyId: string }) {
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    orderId: "",
    planNo: "",
    planDate: new Date().toISOString().slice(0, 10),
    colorName: "",
    totalPlanQty: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [planRows, orderRows] = await Promise.all([
        cuttingService.getPlans(companyId),
        merchandisingService.getOrders(companyId),
      ]);
      setPlans(planRows);
      setOrders(orderRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cutting plans");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const orderLabel = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8);

  const filtered = plans.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.planNo.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      (p.colorName?.toLowerCase().includes(q) ?? false) ||
      orderLabel(p.orderId).toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.planNo) {
      toast.error("Order and plan number are required");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createPlan({
        companyId,
        orderId: form.orderId,
        planNo: form.planNo,
        planDate: form.planDate,
        colorName: form.colorName || undefined,
        totalPlanQty: Number(form.totalPlanQty) || 0,
      });
      toast.success("Cutting plan created");
      setCreateOpen(false);
      setForm({
        orderId: "",
        planNo: "",
        planDate: new Date().toISOString().slice(0, 10),
        colorName: "",
        totalPlanQty: "",
      });
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create plan");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cutting Planning</h2>
          <p className="text-muted-foreground">
            Strategic scheduling of daily cutting batches and priorities
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New Cutting Plan</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Order</Label>
                  <NativeSelect
                    value={form.orderId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, orderId: e.target.value }))
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
                  <Label>Plan No</Label>
                  <Input
                    value={form.planNo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, planNo: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Plan Date</Label>
                  <Input
                    type="date"
                    value={form.planDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, planDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <Input
                    value={form.colorName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, colorName: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total Plan Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.totalPlanQty}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, totalPlanQty: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <IconClipboardList className="h-5 w-5 text-primary" />
              Active Plans
            </CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Plan No</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Plan Date</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.planNo}</TableCell>
                      <TableCell>{orderLabel(plan.orderId)}</TableCell>
                      <TableCell>{plan.planDate}</TableCell>
                      <TableCell>{plan.colorName ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {plan.totalPlanQty.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/cutting/planning/${plan.id}`}
                          className="text-sm text-erp-accent hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
