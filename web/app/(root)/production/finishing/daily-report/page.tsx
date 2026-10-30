"use client";

import * as React from "react";
import { IconLoader2, IconReportAnalytics } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductionCompanyGate } from "@/components/production";
import { productionFinishingService, type FinishingReportRow } from "@/lib/services/production/finishing";

export default function FinishingDailyReportPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <FinishingReportContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function FinishingReportContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<FinishingReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const monthStart = today.slice(0, 8) + "01";
        setRows(await productionFinishingService.getReport(companyId, "Finishing Receive", monthStart, today));
      } catch {
        toast.error("Failed to load finishing report");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <IconReportAnalytics className="size-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Daily Finishing Report</h1>
          <p className="text-muted-foreground text-sm">Finishing receive activity (current month).</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Report rows</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex justify-center items-center">
              <IconLoader2 className="size-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No finishing report data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.referenceNo ?? "—"}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
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
