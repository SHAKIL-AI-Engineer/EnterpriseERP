"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconUsers,
  IconCar,
  IconFileDescription,
  IconDoorExit,
  IconPackage,
  IconArrowRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  SecurityStatusBadge,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type {
  EmployeeOutPass,
  GatePass,
  ReturnablePending,
  VehicleEntry,
  VisitorEntry,
} from "@/lib/types/security";

const today = new Date().toISOString().slice(0, 10);

export default function SecurityDashboardPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <DashboardContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function DashboardContent({ companyId }: { companyId: string }) {
  const [loading, setLoading] = React.useState(true);
  const [visitorEntries, setVisitorEntries] = React.useState<VisitorEntry[]>([]);
  const [vehicleEntries, setVehicleEntries] = React.useState<VehicleEntry[]>([]);
  const [gatePasses, setGatePasses] = React.useState<GatePass[]>([]);
  const [outPasses, setOutPasses] = React.useState<EmployeeOutPass[]>([]);
  const [returnablePending, setReturnablePending] = React.useState<ReturnablePending[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [visitors, vehicles, passes, outPassRows, returnableRows] =
          await Promise.all([
            securityService.getVisitorEntries(companyId, today),
            securityService.getVehicleEntries(companyId, today),
            securityService.getGatePasses(companyId, undefined, "Submitted"),
            securityService.getEmployeeOutPasses(companyId),
            securityService.getReturnablePending(companyId),
          ]);
        if (cancelled) return;
        setVisitorEntries(visitors);
        setVehicleEntries(vehicles);
        setGatePasses(passes);
        setOutPasses(outPassRows);
        setReturnablePending(returnableRows);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load security dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const visitorsInside = visitorEntries.filter((v) => v.status === "CheckedIn").length;
  const vehiclesInside = vehicleEntries.filter((v) => v.status === "In").length;
  const pendingOutPasses = outPasses.filter(
    (p) => p.status === "Pending" || p.approvalStatus === "Pending",
  );

  const stats = [
    {
      title: "Visitors Inside",
      value: visitorsInside,
      icon: IconUsers,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Vehicles Inside",
      value: vehiclesInside,
      icon: IconCar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Gate Passes",
      value: gatePasses.length,
      icon: IconFileDescription,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Pending Out Passes",
      value: pendingOutPasses.length,
      icon: IconDoorExit,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Returnable Pending",
      value: returnablePending.length,
      icon: IconPackage,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  const recentVisitors = visitorEntries.slice(0, 5);
  const recentVehicles = vehicleEntries.slice(0, 5);
  const recentGatePasses = gatePasses.slice(0, 5);
  const recentOutPasses = pendingOutPasses.slice(0, 5);
  const recentReturnable = returnablePending.slice(0, 5);

  const quickLinks = [
    { href: "/security/master/gates", label: "Gate Setup" },
    { href: "/security/master/visitors", label: "Visitor Registry" },
    { href: "/security/master/vehicles", label: "Vehicle Registry" },
    { href: "/security/visitor-entries", label: "Visitor Check-In/Out" },
    { href: "/security/employee-out-passes", label: "Employee Out Pass" },
    { href: "/security/vehicle-entries", label: "Vehicle In/Out" },
    { href: "/security/gate-passes", label: "Gate Pass" },
    { href: "/security/returnable-returns", label: "Returnable Returns" },
    { href: "/security/daily-register", label: "Daily Register" },
    { href: "/security/reports", label: "Gate Reports" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gate Control Center</h2>
        <p className="text-muted-foreground">
          Live gate activity for {today}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 sm:grid-cols-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-erp-accent hover:underline px-2 py-1.5 rounded-md hover:bg-muted/30"
              >
                <IconArrowRight className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Returnable Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Pass No</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReturnable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No pending returnables
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentReturnable.map((row, idx) => (
                      <TableRow key={`${row.gatePassId}-${idx}`}>
                        <TableCell className="font-medium">{row.gatePassNo}</TableCell>
                        <TableCell>{row.itemName}</TableCell>
                        <TableCell className="text-right font-mono">{row.pendingQty}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentTable
          title="Recent Visitor Entries"
          linkHref="/security/visitor-entries"
          emptyMessage="No visitor entries today"
          headers={["Entry No", "In Time", "Status"]}
          rows={recentVisitors.map((v) => ({
            key: v.id,
            cells: [v.entryNo, v.inTime, <SecurityStatusBadge key="s" status={v.status} />],
          }))}
        />
        <RecentTable
          title="Recent Vehicle Entries"
          linkHref="/security/vehicle-entries"
          emptyMessage="No vehicle entries today"
          headers={["Entry No", "In Time", "Status"]}
          rows={recentVehicles.map((v) => ({
            key: v.id,
            cells: [v.entryNo, v.inTime, <SecurityStatusBadge key="s" status={v.status} />],
          }))}
        />
        <RecentTable
          title="Pending Gate Passes"
          linkHref="/security/gate-passes"
          emptyMessage="No submitted gate passes"
          headers={["Pass No", "Type", "Status"]}
          rows={recentGatePasses.map((g) => ({
            key: g.id,
            cells: [
              g.gatePassNo,
              g.gatePassType,
              <SecurityStatusBadge key="s" status={g.status} />,
            ],
          }))}
        />
        <RecentTable
          title="Pending Out Passes"
          linkHref="/security/employee-out-passes"
          emptyMessage="No pending out passes"
          headers={["Pass No", "Reason", "Status"]}
          rows={recentOutPasses.map((p) => ({
            key: p.id,
            cells: [
              p.passNo,
              p.reason.length > 30 ? `${p.reason.slice(0, 30)}…` : p.reason,
              <SecurityStatusBadge key="s" status={p.status} />,
            ],
          }))}
        />
      </div>
    </div>
  );
}

function RecentTable({
  title,
  linkHref,
  emptyMessage,
  headers,
  rows,
}: {
  title: string;
  linkHref: string;
  emptyMessage: string;
  headers: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  return (
    <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Link href={linkHref} className="text-sm text-erp-accent hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-muted-foreground/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={headers.length}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.key}>
                    {row.cells.map((cell, i) => (
                      <TableCell key={i}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
