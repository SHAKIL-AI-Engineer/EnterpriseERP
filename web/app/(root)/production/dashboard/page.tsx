"use client";

import * as React from "react";
import Link from "next/link";
import { IconActivity, IconArrowRight, IconBuildingFactory2, IconLoader2 } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductionCompanyGate } from "@/components/production";
import { productionLineService } from "@/lib/services/production-line";
import { productionAssignmentService } from "@/lib/services/production-assignment";
import { sewingService } from "@/lib/services/production/sewing";
import { productionService } from "@/lib/services/production";

export default function ProductionDashboard() {
  return (
    <ProductionCompanyGate>
      {(companyId) => <DashboardContent companyId={companyId} />}
    </ProductionCompanyGate>
  );
}

function DashboardContent({ companyId }: { companyId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    activeLines: 0,
    totalLines: 0,
    assignments: 0,
    todayOutput: 0,
    orderCount: 0,
    wipUnits: 0,
  });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [lines, assignments, report, daily, balances, orders] = await Promise.all([
          productionLineService.getAll(companyId),
          productionAssignmentService.getAll(companyId),
          productionService.getReport(companyId),
          productionAssignmentService.getDailyReport({ date: today }, companyId),
          sewingService.getBalances(companyId),
          productionService.getProductions(companyId),
        ]);
        const activeLines = lines.filter((l) => l.status === "Active").length;
        const todayOutput = (daily as { completed?: number }[]).reduce((s, r) => s + Number(r.completed ?? 0), 0);
        const wipUnits = balances.reduce((s, b) => s + (b.wipQty ?? 0), 0);
        setStats({
          activeLines,
          totalLines: lines.length,
          assignments: assignments.length,
          todayOutput,
          orderCount: orders.length,
          wipUnits,
        });
        void report;
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <IconBuildingFactory2 className="size-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground text-sm">Live metrics from SewingService and Merchandising orders.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active lines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeLines}/{stats.totalLines}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Line assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOutput}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sewing WIP (units)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wipUnits}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="size-5" />
            Quick links
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            { href: "/production/daily-input", label: "Daily input" },
            { href: "/production/line-assign", label: "Line assign" },
            { href: "/production/daily-report", label: "Daily report" },
            { href: "/production/finishing/list", label: "Finishing" },
            { href: "/production/shipment/list", label: "Shipments" },
          ].map((link) => (
            <Button key={link.href} variant="outline" size="sm" asChild>
              <Link href={link.href}>
                {link.label}
                <IconArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
