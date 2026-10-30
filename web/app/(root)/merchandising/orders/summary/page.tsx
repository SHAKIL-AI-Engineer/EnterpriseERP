"use client";

import * as React from "react";
import {
  IconArrowLeft,
  IconChartBar,
  IconDownload,
  IconClipboardList,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, OrderPipelineReportRow, Buyer } from "@/lib/types/merchandising";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchCompanyGate,
} from "@/components/merchandising";

type SummaryFilters = {
  buyerId: string;
  status: string;
  search: string;
};

const defaultFilters = (): SummaryFilters => ({
  buyerId: "all",
  status: "all",
  search: "",
});

function OrderSummaryPageContent({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([]);
  const [buyers, setBuyers] = React.useState<Buyer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<SummaryFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = React.useState<SummaryFilters>(defaultFilters);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const status =
        appliedFilters.status === "all" ? undefined : appliedFilters.status;
      const buyerId =
        appliedFilters.buyerId === "all" ? undefined : appliedFilters.buyerId;
      const [orderList, pipelineRows, buyerList] = await Promise.all([
        merchandisingService.getOrderSummaryReport(companyId, buyerId, status),
        merchandisingService.getOrderPipelineReport(companyId),
        merchandisingService.getBuyers(companyId),
      ]);
      setOrders(orderList);
      setPipeline(pipelineRows);
      setBuyers(buyerList);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load order summary");
    } finally {
      setLoading(false);
    }
  }, [companyId, appliedFilters.status, appliedFilters.buyerId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApply = () => setAppliedFilters({ ...draftFilters });

  const handleReset = () => {
    const reset = defaultFilters();
    setDraftFilters(reset);
    setAppliedFilters(reset);
  };

  const handleExport = async () => {
    try {
      const status =
        appliedFilters.status === "all" ? undefined : appliedFilters.status;
      const buyerId =
        appliedFilters.buyerId === "all" ? undefined : appliedFilters.buyerId;
      await merchandisingService.exportOrderSummaryReport(companyId, buyerId, status);
      toast.success("Export started");
    } catch {
      toast.error("Export failed");
    }
  };

  const totalQty = orders.reduce((s, o) => s + o.totalOrderQty, 0);
  const totalValue = orders.reduce((s, o) => s + o.totalValue, 0);

  const filtered = orders.filter((o) =>
    o.orderNo.toLowerCase().includes(appliedFilters.search.toLowerCase()),
  );

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconChartBar className="size-6" />}
        title="Order Summary"
        description="Global order analytics and pipeline by status"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/merchandising/orders")}>
              <IconArrowLeft className="size-4 mr-2" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <IconDownload className="size-4 mr-2" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQty.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.length}</div>
          </CardContent>
        </Card>
      </div>

      <MerchFilterCard
        recordCount={filtered.length}
        recordLabel="Orders"
        isLoading={loading}
        onApply={handleApply}
        onReset={handleReset}
      >
        <MerchFilterField label="Search Order No">
          <Input
            placeholder="Filter by order no..."
            value={draftFilters.search}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, search: e.target.value }))
            }
          />
        </MerchFilterField>
        <MerchFilterField label="Buyer">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftFilters.buyerId}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, buyerId: e.target.value }))
            }
          >
            <option value="all">All Buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyerName}
              </option>
            ))}
          </select>
        </MerchFilterField>
        <MerchFilterField label="Status">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draftFilters.status}
            onChange={(e) =>
              setDraftFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </MerchFilterField>
      </MerchFilterCard>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <IconChartBar className="size-4" /> Order Pipeline
          </CardTitle>
          <CardDescription>Orders grouped by status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading pipeline...</p>
          ) : pipeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pipeline data.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Orders</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {pipeline.map((row) => (
                    <tr key={row.orderStatus} className="border-b">
                      <td className="px-3 py-2">
                        <Badge variant="outline">{row.orderStatus}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {row.orderCount}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.totalQuantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <IconClipboardList className="size-4" /> Order List
          </CardTitle>
          <CardDescription>Click an order for details</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Loading orders...</p>
          ) : (
            <div className="divide-y">
              {filtered.map((o) => (
                <Link
                  key={o.id}
                  href={`/merchandising/orders/details/${o.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{o.orderNo}</p>
                    <p className="text-xs text-muted-foreground">{o.orderStatus}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{o.totalOrderQty.toLocaleString()} pcs</p>
                    <p className="text-muted-foreground">
                      {o.currencyCode} {o.totalValue.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No orders match the current filters.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </MerchPageShell>
  );
}

export default function OrderSummaryPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <OrderSummaryPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}
