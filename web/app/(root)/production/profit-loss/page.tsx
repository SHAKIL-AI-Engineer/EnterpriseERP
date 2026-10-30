"use client";

import * as React from "react";
import { IconChartBar, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductionCompanyGate } from "@/components/production";
import { productionPlanningService, type PlanningBalance } from "@/lib/services/production/planning";

export default function ProfitLossPage() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <ProfitLossContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function ProfitLossContent({ companyId }: { companyId: string }) {
  const [rows, setRows] = React.useState<PlanningBalance[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setRows(await productionPlanningService.getPlanningBalances(companyId));
      } catch {
        toast.error("Failed to load planning balances");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <IconChartBar className="size-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Plan vs Actual</h1>
          <p className="text-muted-foreground text-sm">Planning balances from ProductionPlanningService (profit view uses merchandising costing separately).</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Planning balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-32 flex justify-center items-center">
              <IconLoader2 className="size-8 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No planning balance rows yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.orderId}</TableCell>
                    <TableCell>{r.plannedQty}</TableCell>
                    <TableCell>{r.assignedQty}</TableCell>
                    <TableCell>{r.actualQty}</TableCell>
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
