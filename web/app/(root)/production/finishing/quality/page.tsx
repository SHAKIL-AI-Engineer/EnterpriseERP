"use client";

import * as React from "react";
import { IconLoader2, IconShieldCheck } from "@tabler/icons-react";
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
import { productionQualityService, type QualityInspection } from "@/lib/services/production/quality";

export default function FinishingQualityPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <QualityContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function QualityContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<QualityInspection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setRows(await productionQualityService.getInspections(companyId));
      } catch {
        toast.error("Failed to load quality inspections");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-lg">
          <IconShieldCheck className="size-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quality Check</h1>
          <p className="text-muted-foreground">Inline and line quality inspections.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No inspections recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.inspectedAt ?? "—"}</TableCell>
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
