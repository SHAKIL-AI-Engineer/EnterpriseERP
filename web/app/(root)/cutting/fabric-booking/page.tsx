"use client";

import * as React from "react";
import { IconTexture, IconPlus, IconSearch } from "@tabler/icons-react";
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
import type { CuttingPlan, FabricIssueToCutting } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

export default function FabricBookingPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <FabricBookingContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function FabricBookingContent({ companyId }: { companyId: string }) {
  const [issues, setIssues] = React.useState<FabricIssueToCutting[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    orderId: "",
    cuttingPlanId: "",
    issueNo: "",
    issueDate: new Date().toISOString().slice(0, 10),
    fabricItemId: "",
    issueQty: "",
    unitName: "Yds",
    lotNo: "",
    batchNo: "",
    colorName: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [issueRows, orderRows, planRows] = await Promise.all([
        cuttingService.getFabricIssues(companyId),
        merchandisingService.getOrders(companyId),
        cuttingService.getPlans(companyId),
      ]);
      setIssues(issueRows);
      setOrders(orderRows);
      setPlans(planRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fabric issues");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const orderLabel = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8);

  const planLabel = (planId: string | null | undefined) =>
    planId ? plans.find((p) => p.id === planId)?.planNo ?? "—" : "—";

  const filtered = issues.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.issueNo.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q) ||
      orderLabel(row.orderId).toLowerCase().includes(q)
    );
  });

  const totalIssued = issues.reduce((s, r) => s + r.issueQty, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.issueNo || !form.fabricItemId) {
      toast.error("Order, issue no, and fabric item ID are required");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createFabricIssue({
        companyId,
        orderId: form.orderId,
        cuttingPlanId: form.cuttingPlanId || undefined,
        issueNo: form.issueNo,
        issueDate: form.issueDate,
        fabricItemId: form.fabricItemId,
        issueQty: Number(form.issueQty) || 0,
        unitName: form.unitName,
        lotNo: form.lotNo || undefined,
        batchNo: form.batchNo || undefined,
        colorName: form.colorName || undefined,
      });
      toast.success("Fabric issue recorded");
      setCreateOpen(false);
      load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create fabric issue");
    } finally {
      setCreating(false);
    }
  };

  const plansForOrder = plans.filter((p) => p.orderId === form.orderId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
            Fabric Booking
          </h2>
          <p className="text-muted-foreground">
            Fabric issues to cutting floor (cutting service)
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <IconPlus className="h-4 w-4" />
              New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Issue Fabric to Cutting</DialogTitle>
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
                  <Label>Cutting Plan (optional)</Label>
                  <NativeSelect
                    value={form.cuttingPlanId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cuttingPlanId: e.target.value }))
                    }
                  >
                    <option value="">None</option>
                    {plansForOrder.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.planNo}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Issue No</Label>
                    <Input
                      value={form.issueNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, issueNo: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, issueDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Fabric Item ID (Guid)</Label>
                  <Input
                    value={form.fabricItemId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fabricItemId: e.target.value }))
                    }
                    placeholder="Inventory / item Guid"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Issue Qty</Label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.issueQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, issueQty: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Input
                      value={form.unitName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unitName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Lot No</Label>
                    <Input
                      value={form.lotNo}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lotNo: e.target.value }))
                      }
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
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Saving…" : "Save Issue"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm bg-card/60">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Total Issues
            </p>
            <p className="text-2xl font-black mt-1 text-amber-600">
              {loading ? "—" : issues.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/60">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Total Issued Qty
            </p>
            <p className="text-2xl font-black mt-1 text-emerald-600">
              {loading ? "—" : totalIssued.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <IconTexture className="h-5 w-5 text-amber-500" />
              Fabric Issues to Cutting
            </CardTitle>
            <div className="relative w-64">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Issue No</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
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
                    No fabric issues
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.issueNo}</TableCell>
                    <TableCell>{orderLabel(row.orderId)}</TableCell>
                    <TableCell>{planLabel(row.cuttingPlanId)}</TableCell>
                    <TableCell>{row.issueDate}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.issueQty.toLocaleString()}
                    </TableCell>
                    <TableCell>{row.unitName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
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
