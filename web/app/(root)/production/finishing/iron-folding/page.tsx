"use client";

import * as React from "react";
import { IconLoader2, IconShirt } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductionCompanyGate } from "@/components/production";
import { productionFinishingService, type IroningOutput } from "@/lib/services/production/finishing";

export default function IronFoldingPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <IronFoldingContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function IronFoldingContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<IroningOutput[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setRows(await productionFinishingService.getIroningOutputs(companyId));
      } catch {
        toast.error("Failed to load ironing outputs");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <IconShirt className="size-7 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold">Iron &amp; Folding</h1>
          <p className="text-muted-foreground text-sm">Ironing outputs from FinishingService.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ironing records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex justify-center items-center">
              <IconLoader2 className="size-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ironing outputs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Iron Qty</TableHead>
                  <TableHead>Re-iron</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.outputDate}</TableCell>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.sizeName}</TableCell>
                    <TableCell>{r.ironQty}</TableCell>
                    <TableCell>{r.reIronQty}</TableCell>
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
