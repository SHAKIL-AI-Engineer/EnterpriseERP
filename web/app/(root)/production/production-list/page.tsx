"use client";

import * as React from "react";
import Link from "next/link";
import { IconListCheck, IconLoader2, IconReload } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ProductionCompanyGate } from "@/components/production";
import { productionService, type ProductionItem } from "@/lib/services/production";

export default function ProductionListPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <ProductionListContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function ProductionListContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<ProductionItem[]>([]);
  const [report, setReport] = React.useState({ totalOrderQty: 0, totalRunning: 0, totalPending: 0, totalClose: 0 });
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, rep] = await Promise.all([
        productionService.getProductions(companyId),
        productionService.getReport(companyId),
      ]);
      setRows(list);
      setReport(rep);
    } catch {
      toast.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnDef<ProductionItem>[] = [
    { accessorKey: "programCode", header: "Order No" },
    { accessorKey: "buyer", header: "Buyer" },
    { accessorKey: "orderQty", header: "Order Qty" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconListCheck className="size-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Production List</h1>
            <p className="text-sm text-muted-foreground">
              Orders from Merchandising. Create or edit orders in{" "}
              <Link href="/merchandising/orders" className="text-primary underline">
                Merchandising → Orders
              </Link>
              .
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <IconReload className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total qty", value: report.totalOrderQty },
          { label: "Running", value: report.totalRunning },
          { label: "Pending", value: report.totalPending },
          { label: "Closed", value: report.totalClose },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {loading ? (
        <div className="h-48 flex justify-center items-center">
          <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable data={rows.map((r) => ({ ...r, id: r.id }))} columns={columns} showTabs={false} searchKey="programCode" />
      )}
    </div>
  );
}
