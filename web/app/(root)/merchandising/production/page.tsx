"use client";

import * as React from "react";
import {
  IconBuildingFactory2,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
  MerchEmptyState,
  MerchComingSoonPage,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { OrderPipelineReportRow } from "@/lib/types/merchandising";

export default function ProductionPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ProductionPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function ProductionPageContent({ companyId }: { companyId: string }) {
  const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [useFallback, setUseFallback] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchandisingService.getOrderPipelineReport(companyId);
      setPipeline(data);
      setUseFallback(false);
    } catch (error) {
      console.error(error);
      setUseFallback(true);
      toast.error("Production API unavailable — showing placeholder");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (useFallback && !loading) {
    return (
      <MerchComingSoonPage
        icon={<IconBuildingFactory2 className="size-6" />}
        title="Production follow-up"
        description="Shop-floor cutting/sewing/finishing tracking will connect when the production service is available."
      />
    );
  }

  const totalQty = pipeline.reduce((acc, r) => acc + r.totalQuantity, 0);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconBuildingFactory2 className="size-6" />}
        title="Production follow-up"
        description="Order pipeline from merchandising API (production floor integration coming soon)"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Statuses</p>
          <p className="text-2xl font-bold">{pipeline.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total PCS</p>
          <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Source</p>
          <p className="text-sm font-medium mt-2">Order pipeline report</p>
        </div>
      </div>

      <MerchTableCard isLoading={loading}>
        {pipeline.length === 0 && !loading ? (
          <MerchEmptyState
            title="No pipeline data"
            description="Confirm orders exist for this company to see production pipeline buckets."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipeline.map((row) => (
                <TableRow key={row.orderStatus}>
                  <TableCell>
                    <Badge variant="outline">{row.orderStatus}</Badge>
                  </TableCell>
                  <TableCell>{row.orderCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.totalQuantity.toLocaleString()} PCS
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${row.totalValue.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </MerchTableCard>
    </MerchPageShell>
  );
}
