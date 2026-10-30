"use client";

import * as React from "react";
import Link from "next/link";
import { IconBoxSeam, IconChevronLeft, IconChevronRight, IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { CuttingBundle, CuttingPlan } from "@/lib/types/cutting";
import type { Order } from "@/lib/types/merchandising";

const BUNDLE_STATUSES = ["Ready", "Sent", "Review", "Cancelled"];
const PAGE_SIZE = 10;

export default function BundleSystemPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <BundlesContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function BundlesContent({ companyId }: { companyId: string }) {
  const [bundles, setBundles] = React.useState<CuttingBundle[]>([]);
  const [summary, setSummary] = React.useState({ bundleCount: 0, totalPieces: 0 });
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    orderId: "",
    cuttingPlanId: "",
    bundleTag: "",
    sizeName: "",
    pieceCount: "",
    currentLocation: "",
    styleName: "",
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pageResult, summaryResult] = await Promise.all([
        cuttingService.getBundlesPage(companyId, {
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
          page,
          pageSize: PAGE_SIZE,
        }),
        cuttingService.getBundleSummary(companyId, statusFilter || undefined),
      ]);
      setBundles(pageResult.items);
      setTotalPages(Math.max(1, pageResult.totalPages));
      setSummary(summaryResult);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, debouncedSearch, page]);

  React.useEffect(() => {
    loadList();
  }, [loadList]);

  const loadCreateOptions = React.useCallback(async () => {
    if (orders.length > 0 && plans.length > 0) return;
    try {
      const [orderRows, planRows] = await Promise.all([
        merchandisingService.getOrders(companyId),
        cuttingService.getPlans(companyId),
      ]);
      setOrders(orderRows);
      setPlans(planRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load order/plan options");
    }
  }, [companyId, orders.length, plans.length]);

  React.useEffect(() => {
    if (createOpen) {
      void loadCreateOptions();
    }
  }, [createOpen, loadCreateOptions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.cuttingPlanId || !form.bundleTag || !form.sizeName) {
      toast.error("Order, plan, tag, and size are required");
      return;
    }
    setCreating(true);
    try {
      await cuttingService.createBundle({
        companyId,
        orderId: form.orderId,
        cuttingPlanId: form.cuttingPlanId,
        bundleTag: form.bundleTag,
        sizeName: form.sizeName,
        pieceCount: Number(form.pieceCount) || 0,
        currentLocation: form.currentLocation || undefined,
        styleName: form.styleName || undefined,
      });
      toast.success("Bundle created");
      setCreateOpen(false);
      setPage(1);
      await loadList();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create bundle");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await cuttingService.updateBundleStatus(id, { status });
      setBundles((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success("Bundle status updated");
      void cuttingService.getBundleSummary(companyId, statusFilter || undefined).then(setSummary);
    } catch (error) {
      console.error(error);
      toast.error("Status update failed");
    }
  };

  const plansForOrder = React.useMemo(
    () => plans.filter((p) => p.orderId === form.orderId),
    [plans, form.orderId],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-500">
            Bundle Management
          </h2>
          <p className="text-muted-foreground">
            Serialization and tracking for cut components
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <IconPlus className="h-4 w-4" />
              New Bundle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Bundle</DialogTitle>
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
                <div className="grid gap-2">
                  <Label>Bundle Tag</Label>
                  <Input
                    value={form.bundleTag}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bundleTag: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Size</Label>
                    <Input
                      value={form.sizeName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sizeName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Piece Count</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.pieceCount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pieceCount: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-card/60">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Active Bundles
            </p>
            <p className="text-2xl font-black mt-1 text-indigo-500">
              {loading ? "—" : summary.bundleCount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/60">
          <CardContent className="pt-6">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Total Pieces
            </p>
            <p className="text-2xl font-black mt-1">
              {loading ? "—" : summary.totalPieces.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/60">
          <CardContent className="pt-6 flex gap-2 items-end">
            <div className="flex-1 grid gap-1">
              <Label className="text-[10px] uppercase">Status filter</Label>
              <NativeSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                {BUNDLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBoxSeam className="h-5 w-5 text-indigo-500" />
            Bundle Directory
          </CardTitle>
          <div className="relative mt-2 max-w-md">
            <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bundle tag or size..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-10 text-muted-foreground">Loading…</p>
          ) : bundles.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No bundles</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="p-4 rounded-2xl border bg-muted/20 relative overflow-hidden"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${
                        bundle.status === "Sent" ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                    />
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/cutting/bundles/${bundle.id}`}
                        className="text-[10px] font-black font-mono text-erp-accent hover:underline"
                      >
                        {bundle.bundleTag}
                      </Link>
                      <Badge variant="outline" className="text-[9px] uppercase h-4">
                        {bundle.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold leading-none">
                      {bundle.styleName ?? bundle.planNo ?? "—"}
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-muted-foreground/10 text-[10px] font-bold">
                      <span className="uppercase text-muted-foreground">
                        Size: {bundle.sizeName}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        Qty: {bundle.pieceCount}
                      </span>
                    </div>
                    {bundle.status === "Ready" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full text-[10px]"
                        onClick={() => handleQuickStatus(bundle.id, "Sent")}
                      >
                        Mark Sent
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
