"use client";

import * as React from "react";
import { IconClipboardList, IconLoader2, IconReload, IconSearch } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProductionCompanyGate } from "@/components/production";
import { getProductionOrderOptions, type ProductionOrderOption } from "@/lib/services/production/orders";

export default function OrderListPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <OrdersContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function OrdersContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<ProductionOrderOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getProductionOrderOptions(companyId));
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(search.toLowerCase())
  );

  type OrderRow = ProductionOrderOption & { id: string };
  const tableRows: OrderRow[] = filtered.map((r) => ({ ...r, id: r.orderId }));

  const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: "orderNo", header: "Order No", cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.orderNo}</span> },
    { accessorKey: "buyerName", header: "Buyer" },
    { accessorKey: "totalOrderQty", header: "Qty", cell: ({ row }) => <span className="tabular-nums">{row.original.totalOrderQty}</span> },
    {
      accessorKey: "orderStatus",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.orderStatus}</Badge>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconClipboardList className="size-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Production Orders</h1>
            <p className="text-muted-foreground text-sm">Confirmed merchandising orders available for line assignment.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <IconReload className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search order or buyer…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable data={tableRows} columns={columns} showTabs={false} searchKey="orderNo" />
      )}
    </div>
  );
}
