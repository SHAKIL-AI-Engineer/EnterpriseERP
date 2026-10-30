"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { merchandisingService } from "@/lib/services/merchandising";
import type { CuttingPlan, CuttingPlanSizeBreakdown } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

export default function CuttingPlanDetailPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <PlanDetailContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function PlanDetailContent({ companyId }: { companyId: string }) {
  const params = useParams();
  const router = useRouter();
  const planId = typeof params.id === "string" ? params.id : "";

  const [plan, setPlan] = React.useState<CuttingPlan | null>(null);
  const [sizes, setSizes] = React.useState<CuttingPlanSizeBreakdown[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [sizeForm, setSizeForm] = React.useState({ sizeName: "", planQty: "" });
  const [editId, setEditId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const [planRow, sizeRows, orderRows] = await Promise.all([
        cuttingService.getPlanById(planId),
        cuttingService.getSizeBreakdowns(planId),
        merchandisingService.getOrders(companyId),
      ]);
      setPlan(planRow);
      setSizes(sizeRows);
      setOrders(orderRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [companyId, planId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const orderNo =
    plan && orders.find((o) => o.id === plan.orderId)?.orderNo;

  const runAction = async (
    fn: () => Promise<CuttingPlan>,
    success: string,
  ) => {
    setActionLoading(true);
    try {
      const updated = await fn();
      setPlan(updated);
      toast.success(success);
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddOrUpdateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeForm.sizeName) {
      toast.error("Size name is required");
      return;
    }
    try {
      if (editId) {
        await cuttingService.updateSizeBreakdown(editId, {
          sizeName: sizeForm.sizeName,
          planQty: Number(sizeForm.planQty) || 0,
        });
        toast.success("Size breakdown updated");
      } else {
        await cuttingService.addSizeBreakdown(planId, {
          companyId,
          sizeName: sizeForm.sizeName,
          planQty: Number(sizeForm.planQty) || 0,
        });
        toast.success("Size breakdown added");
      }
      setSizeForm({ sizeName: "", planQty: "" });
      setEditId(null);
      const sizeRows = await cuttingService.getSizeBreakdowns(planId);
      setSizes(sizeRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save size breakdown");
    }
  };

  const handleDeleteSize = async (id: string) => {
    try {
      await cuttingService.deleteSizeBreakdown(id);
      toast.success("Size breakdown removed");
      setSizes((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete size breakdown");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading plan…</p>;
  }

  if (!plan) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Plan not found</p>
        <Button variant="outline" onClick={() => router.push("/cutting/planning")}>
          Back to planning
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cutting/planning">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{plan.planNo}</h2>
            <p className="text-sm text-muted-foreground">
              Order: {orderNo ?? plan.orderId} · {plan.planDate}
              {plan.colorName ? ` · ${plan.colorName}` : ""}
            </p>
          </div>
          <Badge variant="outline">{plan.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.status === "Draft" && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                runAction(() => cuttingService.approvePlan(planId), "Plan approved")
              }
            >
              Approve
            </Button>
          )}
          {plan.status === "Approved" && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                runAction(() => cuttingService.startPlan(planId), "Plan started")
              }
            >
              Start
            </Button>
          )}
          {plan.status === "Running" && (
            <Button
              disabled={actionLoading}
              onClick={() =>
                runAction(
                  () => cuttingService.completePlan(planId),
                  "Plan completed",
                )
              }
            >
              Complete
            </Button>
          )}
          {plan.status !== "Completed" && plan.status !== "Cancelled" && (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() =>
                runAction(() => cuttingService.cancelPlan(planId), "Plan cancelled")
              }
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Plan Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Total plan qty</p>
            <p className="text-xl font-bold font-mono">
              {plan.totalPlanQty.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Size breakdown total</p>
            <p className="text-xl font-bold font-mono">
              {sizes.reduce((s, x) => s + x.planQty, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Breakdown lines</p>
            <p className="text-xl font-bold">{sizes.length}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Size Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleAddOrUpdateSize}
            className="flex flex-wrap gap-3 items-end"
          >
            <div className="grid gap-1">
              <Label>Size</Label>
              <Input
                value={sizeForm.sizeName}
                onChange={(e) =>
                  setSizeForm((f) => ({ ...f, sizeName: e.target.value }))
                }
                className="w-28"
              />
            </div>
            <div className="grid gap-1">
              <Label>Plan Qty</Label>
              <Input
                type="number"
                min={0}
                value={sizeForm.planQty}
                onChange={(e) =>
                  setSizeForm((f) => ({ ...f, planQty: e.target.value }))
                }
                className="w-28"
              />
            </div>
            <Button type="submit" className="gap-1">
              <IconPlus className="h-4 w-4" />
              {editId ? "Update" : "Add"} Size
            </Button>
            {editId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditId(null);
                  setSizeForm({ sizeName: "", planQty: "" });
                }}
              >
                Cancel edit
              </Button>
            )}
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Plan Qty</TableHead>
                <TableHead className="text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No size breakdowns yet
                  </TableCell>
                </TableRow>
              ) : (
                sizes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.sizeName}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.planQty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditId(row.id);
                          setSizeForm({
                            sizeName: row.sizeName,
                            planQty: String(row.planQty),
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSize(row.id)}
                      >
                        <IconTrash className="h-4 w-4 text-rose-500" />
                      </Button>
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
