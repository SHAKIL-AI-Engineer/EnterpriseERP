"use client";

import * as React from "react";
import {
  IconChartBar,
  IconRefresh,
  IconCalendar,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, OrderPipelineReportRow, TnaCalendar } from "@/lib/types/merchandising";

export default function ProductionPlanningPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ProductionPlanningPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function ProductionPlanningPageContent({ companyId }: { companyId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [tna, setTna] = React.useState<TnaCalendar | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tnaLoading, setTnaLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [orderRows, pipelineRows] = await Promise.all([
        merchandisingService.getOrders(companyId),
        merchandisingService.getOrderPipelineReport(companyId),
      ]);
      setOrders(orderRows);
      setPipeline(pipelineRows);
      if (!selectedOrderId && orderRows.length > 0) {
        setSelectedOrderId(orderRows[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load production planning data");
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedOrderId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    if (!selectedOrderId) {
      setTna(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setTnaLoading(true);
        const data = await merchandisingService.getTnaByOrder(selectedOrderId);
        if (!cancelled) setTna(data);
      } catch {
        if (!cancelled) setTna(null);
      } finally {
        if (!cancelled) setTnaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  const totalQty = pipeline.reduce((acc, r) => acc + r.totalQuantity, 0);
  const confirmed = pipeline.find((r) => r.orderStatus === "Confirmed");

  const columns: ColumnDef<Order>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "orderNo",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.orderNo}</span>
      ),
    },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.orderStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "totalOrderQty",
      header: "Target qty",
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">
          {row.original.totalOrderQty.toLocaleString()} PCS
        </span>
      ),
    },
    {
      id: "shipment",
      header: "Shipment",
      cell: ({ row }) =>
        row.original.shipmentDate
          ? format(new Date(row.original.shipmentDate), "MMM dd, yyyy")
          : "—",
    },
  ];

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconChartBar className="size-6" />}
        title="Production Planning"
        description="Active orders, pipeline summary, and optional T&A for selected order"
        actions={
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat title="Pipeline statuses" value={pipeline.length.toString()} />
        <Stat title="Total PCS" value={totalQty.toLocaleString()} />
        <Stat
          title="Confirmed orders"
          value={(confirmed?.orderCount ?? 0).toString()}
        />
        <Stat
          title="Confirmed PCS"
          value={(confirmed?.totalQuantity ?? 0).toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MerchTableCard isLoading={loading}>
            <div className="p-4">
              <DataTable
                columns={columns}
                data={orders}
                isLoading={loading}
                searchKey="orderNo"
                showTabs={false}
                showActions={false}
                showColumnCustomizer={false}
              />
            </div>
          </MerchTableCard>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Order pipeline</h3>
            <div className="space-y-2">
              {pipeline.map((row) => (
                <div
                  key={row.orderStatus}
                  className="flex justify-between text-sm border-b pb-2 last:border-0"
                >
                  <Badge variant="outline">{row.orderStatus}</Badge>
                  <span className="text-muted-foreground">
                    {row.orderCount} · {row.totalQuantity.toLocaleString()} PCS
                  </span>
                </div>
              ))}
              {pipeline.length === 0 && (
                <p className="text-sm text-muted-foreground">No pipeline data</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <IconCalendar className="size-4" />
                T&A (optional)
              </h3>
            </div>
            <NativeSelect
              className="h-9 w-full mb-3"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo}
                </option>
              ))}
            </NativeSelect>
            {tnaLoading ? (
              <p className="text-sm text-muted-foreground">Loading T&A…</p>
            ) : !tna ? (
              <p className="text-sm text-muted-foreground">
                No T&A for {selectedOrder?.orderNo ?? "selected order"}.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {(tna.milestones ?? [])
                  .slice()
                  .sort((a, b) => a.sequenceNo - b.sequenceNo)
                  .map((m) => (
                    <li key={m.id} className="text-xs flex justify-between gap-2">
                      <span>{m.milestoneName}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {m.status}
                      </Badge>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MerchPageShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase">{title}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
