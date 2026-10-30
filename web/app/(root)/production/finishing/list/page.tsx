"use client";

import * as React from "react";
import { IconBoxSeam, IconLoader2, IconSearch } from "@tabler/icons-react";
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
import { productionFinishingService, type FinishingReceive } from "@/lib/services/production/finishing";

export default function FinishingListPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <FinishingListContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function FinishingListContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<FinishingReceive[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setRows(await productionFinishingService.getReceives(companyId));
    } catch {
      toast.error("Failed to load finishing receives");
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
    return r.receiveNo.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconBoxSeam className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finishing List</h1>
          <p className="text-muted-foreground">Finishing receives from Platform.Host Finishing API.</p>
        </div>
      </div>

      <Card className="border-none bg-accent/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent Finishing Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search receive no..."
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
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-xl bg-background/50">
              <p className="text-muted-foreground font-medium">No finishing records found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receive No</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.receiveNo}</TableCell>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.receiveDate ?? "—"}</TableCell>
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
