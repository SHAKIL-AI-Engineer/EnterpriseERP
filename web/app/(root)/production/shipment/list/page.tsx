"use client";

import * as React from "react";
import { IconLoader2, IconPackageExport, IconSearch, IconTruckDelivery } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductionCompanyGate } from "@/components/production";
import { productionShipmentService } from "@/lib/services/production/shipment";
import type { ShipmentExecution } from "@/lib/types/production";

export default function ShipmentListPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <ShipmentListContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function ShipmentListContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<ShipmentExecution[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await productionShipmentService.getExecutions(companyId));
    } catch {
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || (r.status ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <IconPackageExport className="size-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipment List</h1>
          <p className="text-muted-foreground">Executions from ShipmentService via gateway.</p>
        </div>
      </div>

      <Card className="border-none bg-accent/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Active Shipments</CardTitle>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search order or status..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-background/50 text-center p-6">
              <IconTruckDelivery className="size-10 text-blue-600 mb-3" />
              <p className="text-muted-foreground font-medium">No shipment executions yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Ship date</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.actualShipmentDate ?? "—"}</TableCell>
                    <TableCell>{r.shippedQty ?? 0}</TableCell>
                    <TableCell>{r.status ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
