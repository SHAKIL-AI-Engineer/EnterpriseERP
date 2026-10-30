"use client";

import * as React from "react";
import {
  IconLayoutDashboard,
  IconRefresh,
  IconPackage,
  IconArrowRight,
  IconCalendar,
  IconTruck,
  IconReport,
  IconClipboardCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { OrderPipelineReportRow } from "@/lib/types/merchandising";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { title: "Orders", href: "/merchandising/orders", icon: IconPackage },
  { title: "T&A Calendar", href: "/merchandising/ta-calendar", icon: IconCalendar },
  { title: "Order tracking", href: "/merchandising/order-tracking", icon: IconLayoutDashboard },
  { title: "Shipment", href: "/merchandising/shipment", icon: IconTruck },
  { title: "Reports", href: "/merchandising/reports", icon: IconReport },
  { title: "Approvals", href: "/merchandising/approvals", icon: IconClipboardCheck },
] as const;

export default function MerchandisingDashboard() {
  return (
    <MerchCompanyGate>
      {(companyId) => <MerchandisingDashboardContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function MerchandisingDashboardContent({ companyId }: { companyId: string }) {
  const [pipeline, setPipeline] = React.useState<OrderPipelineReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchandisingService.getOrderPipelineReport(companyId);
      setPipeline(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalOrders = pipeline.reduce((acc, row) => acc + row.orderCount, 0);
  const totalQty = pipeline.reduce((acc, row) => acc + row.totalQuantity, 0);
  const totalValue = pipeline.reduce((acc, row) => acc + row.totalValue, 0);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconLayoutDashboard className="size-6" />}
        title="Merchandising dashboard"
        description="Order pipeline by status and quick navigation"
        actions={
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total orders" value={totalOrders.toLocaleString()} hint="All statuses" />
        <StatCard title="Total quantity" value={totalQty.toLocaleString()} hint="PCS in pipeline" />
        <StatCard
          title="Pipeline value"
          value={`$${totalValue.toLocaleString()}`}
          hint="Combined order value"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors flex flex-col gap-2"
          >
            <link.icon className="size-5 text-primary" />
            <span className="text-xs font-semibold">{link.title}</span>
          </Link>
        ))}
      </div>

      <MerchTableCard isLoading={loading} loadingMessage="Loading pipeline…">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Order pipeline</h2>
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link href="/merchandising/orders">
              View orders <IconArrowRight className="size-3 ml-1 inline" />
            </Link>
          </Button>
        </div>
        {pipeline.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground italic">
            No pipeline data
          </p>
        ) : (
          <div className="divide-y">
            {pipeline.map((row) => (
              <div
                key={row.orderStatus}
                className="flex items-center justify-between p-4 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold text-xs uppercase">
                    {row.orderStatus}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {row.orderCount} orders
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{row.totalQuantity.toLocaleString()} PCS</p>
                  <p className="text-xs text-muted-foreground">
                    ${row.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </MerchTableCard>
    </MerchPageShell>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
      {hint ? <p className="text-[10px] text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}
