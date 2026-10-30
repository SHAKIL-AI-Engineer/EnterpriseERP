"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconScissors,
  IconClipboardList,
  IconBoxSeam,
  IconTrash,
  IconArrowRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CuttingPageShell, CuttingCompanyGate } from "@/components/cutting";
import { cuttingService } from "@/lib/services/cutting";
import type { CuttingPlan } from "@/lib/types/cutting";

export default function CuttingDashboardPage() {
  return (
    <CuttingPageShell>
      <CuttingCompanyGate>
        {(companyId) => <DashboardContent companyId={companyId} />}
      </CuttingCompanyGate>
    </CuttingPageShell>
  );
}

function DashboardContent({ companyId }: { companyId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState<CuttingPlan[]>([]);
  const [outputQty, setOutputQty] = React.useState(0);
  const [wastageQty, setWastageQty] = React.useState(0);
  const [bundleCount, setBundleCount] = React.useState(0);
  const [transferQty, setTransferQty] = React.useState(0);
  const [activePlans, setActivePlans] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [planRows, outputRows, wastageRows, bundleRows, transferRows] =
          await Promise.all([
            cuttingService.getPlans(companyId),
            cuttingService.getOutputs(companyId),
            cuttingService.getWastages(companyId),
            cuttingService.getBundles(companyId),
            cuttingService.getPanelTransfers(companyId),
          ]);
        if (cancelled) return;
        setPlans(planRows);
        setOutputQty(outputRows.reduce((s, r) => s + r.outputQty, 0));
        setWastageQty(wastageRows.reduce((s, r) => s + r.wastageQty, 0));
        setBundleCount(bundleRows.length);
        setTransferQty(
          transferRows.reduce((s, r) => s + r.totalTransferQty, 0),
        );
        setActivePlans(
          planRows.filter(
            (p) =>
              p.status === "Approved" ||
              p.status === "Running" ||
              p.status === "Draft",
          ).length,
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load cutting dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const stats = [
    {
      title: "Active Plans",
      value: loading ? "—" : String(activePlans),
      icon: IconClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Cut Output",
      value: loading ? "—" : `${outputQty.toLocaleString()} Pcs`,
      icon: IconScissors,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Fabric Wastage",
      value: loading ? "—" : wastageQty.toLocaleString(),
      icon: IconTrash,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "Bundles",
      value: loading ? "—" : String(bundleCount),
      icon: IconBoxSeam,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Sent to Sewing",
      value: loading ? "—" : `${transferQty.toLocaleString()} Pcs`,
      icon: IconArrowRight,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Plan Target Qty",
      value: loading
        ? "—"
        : `${plans.reduce((s, p) => s + p.totalPlanQty, 0).toLocaleString()} Pcs`,
      icon: IconClipboardList,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const recentPlans = [...plans]
    .sort((a, b) => b.planDate.localeCompare(a.planDate))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cutting Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-none shadow-sm bg-card/60 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">Live from cutting API</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Cutting Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Loading plans…
              </p>
            ) : recentPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No cutting plans yet.{" "}
                <Link href="/cutting/planning" className="text-erp-accent hover:underline">
                  Create a plan
                </Link>
              </p>
            ) : (
              recentPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border border-muted-foreground/10 p-3"
                >
                  <div>
                    <Link
                      href={`/cutting/planning/${plan.id}`}
                      className="font-medium text-erp-accent hover:underline"
                    >
                      {plan.planNo}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.planDate}
                      {plan.colorName ? ` · ${plan.colorName}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{plan.status}</Badge>
                    <p className="text-xs font-mono mt-1">
                      {plan.totalPlanQty.toLocaleString()} pcs
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/cutting/planning", label: "Cutting Planning" },
              { href: "/cutting/marker-lay", label: "Marker & Lay" },
              { href: "/cutting/entry", label: "Cutting Entry" },
              { href: "/cutting/bundles", label: "Bundles" },
              { href: "/cutting/send-to-sewing", label: "Send to Sewing" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-erp-accent hover:underline px-2 py-1.5 rounded-md hover:bg-muted/30"
              >
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
