"use client";

import * as React from "react";
import { IconBox, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductionCompanyGate } from "@/components/production";
import { productionFinishingService, type FoldingPacking } from "@/lib/services/production/finishing";

export default function PackagingPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <PackagingContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function PackagingContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<FoldingPacking[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setRows(await productionFinishingService.getFoldingPackings(companyId));
      } catch {
        toast.error("Failed to load folding / packing records");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <IconBox className="size-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Packaging</h1>
          <p className="text-muted-foreground text-sm">Folding and poly packing records.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Folding / packing</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex justify-center items-center">
              <IconLoader2 className="size-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No packing records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Packed Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.packingDate}</TableCell>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.sizeName}</TableCell>
                    <TableCell>{r.packedQty}</TableCell>
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
