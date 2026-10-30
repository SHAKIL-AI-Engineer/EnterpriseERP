"use client";

import * as React from "react";
import { IconLoader2, IconReportSearch } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ShipmentReportPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <ShipmentReportContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function ShipmentReportContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await productionShipmentService.getReports(companyId);
        setRows(Array.isArray(data) ? (data as Record<string, unknown>[]) : []);
      } catch {
        toast.error("Failed to load shipment report");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <IconReportSearch className="size-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipment Report</h1>
          <p className="text-muted-foreground">Aggregated shipment metrics from ShipmentService.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report rows</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No report data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{String(r.orderId ?? "—")}</TableCell>
                    <TableCell>{String(r.shippedQty ?? r.totalShipped ?? "—")}</TableCell>
                    <TableCell>{String(r.status ?? "—")}</TableCell>
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
