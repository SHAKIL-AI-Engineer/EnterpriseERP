"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowUpRight,
  IconBug,
  IconClipboardCheck,
  IconDatabase,
  IconFileText,
  IconLock,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, type RoleDetails, type User } from "@/lib/services/auth";
import { administratorService, type AdministratorOverview } from "@/lib/services/administrator";
import { useAuth } from "@/components/providers/auth-provider";

const adminServices = [
  {
    title: "User management",
    description: "Create accounts, assign roles, manage company access, and review sign-in history.",
    href: "/administrator/users",
    icon: IconUsers,
    label: "Identity",
    tone: "text-blue-500 bg-blue-500/10",
  },
  {
    title: "Roles & permissions",
    description: "Configure role membership and the permissions available to each role.",
    href: "/administrator/permissions",
    icon: IconLock,
    label: "Access control",
    tone: "text-violet-500 bg-violet-500/10",
  },
  {
    title: "Approval system",
    description: "Review pending approval requests and make decisions with an audit trail.",
    href: "/administrator/approvals",
    icon: IconClipboardCheck,
    label: "Workflow",
    tone: "text-amber-600 bg-amber-500/10",
  },
  {
    title: "System logs",
    description: "Search persistent API audit events by level, request path, trace ID, and user.",
    href: "/administrator/logs",
    icon: IconFileText,
    label: "Observability",
    tone: "text-cyan-600 bg-cyan-500/10",
  },
  {
    title: "Error handling",
    description: "Investigate failed requests, record resolution notes, and reopen incidents.",
    href: "/administrator/errors",
    icon: IconAlertTriangle,
    label: "Reliability",
    tone: "text-orange-600 bg-orange-500/10",
  },
  {
    title: "System bugs",
    description: "Report problems, assign priorities, and track investigation and resolution.",
    href: "/administrator/bugs",
    icon: IconBug,
    label: "Issue tracking",
    tone: "text-rose-600 bg-rose-500/10",
  },
];

export default function AdministratorDashboardPage() {
  const { hasAnyRole } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<RoleDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [overview, setOverview] = React.useState<AdministratorOverview | null>(null);

  React.useEffect(() => {
    let current = true;
    Promise.all([authService.getUsers(), authService.getRoles(), administratorService.getOverview()])
      .then(([userRows, roleRows, operationTotals]) => {
        if (!current) return;
        setUsers(userRows);
        setRoles(roleRows);
        setOverview(operationTotals);
      })
      .catch(() => {
        if (current) setLoadError(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, []);

  const activeUsers = users.filter((user) => user.isActive).length;
  const stats = [
    { title: "Total users", value: users.length, detail: `${activeUsers} active accounts`, icon: IconUsers },
    { title: "Roles", value: roles.length, detail: "Configured access groups", icon: IconShieldCheck },
    { title: "Locked accounts", value: users.filter((user) => user.isLocked).length, detail: "Require administrator review", icon: IconLock },
  ];

  return (
    <div className="space-y-7">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Identity overview">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {loading || loadError ? <span className="text-muted-foreground">—</span> : stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{loadError ? "Totals unavailable" : stat.detail}</p>
                </div>
                <span className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-300"><Icon className="size-5" /></span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {loadError && (
        <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          User and role totals could not be loaded. Open the relevant section to retry.
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Administration services</h2>
            <p className="text-sm text-muted-foreground">Choose a service to continue.</p>
          </div>
          <Badge variant="outline" className="hidden gap-1 sm:inline-flex"><IconActivity className="size-3.5" /> 6 services</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminServices.map((service) => {
            const Icon = service.icon;
            return (
              <Link key={service.href} href={service.href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-xl p-2.5 ${service.tone}`}><Icon className="size-5" /></span>
                      <Badge variant="secondary" className="font-normal">{service.label}</Badge>
                    </div>
                    <CardTitle className="flex items-center gap-2 pt-2 text-base">
                      {service.title}<IconArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </CardTitle>
                    <CardDescription className="min-h-10">{service.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System configuration</CardTitle>
            <CardDescription>Administrator-only configuration tools.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {hasAnyRole(["SuperAdmin"]) && <Link href="/administrator/payroll-policies" className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <IconShieldCheck className="size-5 text-muted-foreground" />
              <span className="min-w-0"><span className="block text-sm font-medium">Payroll policies</span><span className="text-xs text-muted-foreground">SuperAdmin access</span></span>
            </Link>}
            <Link href="/administrator/database" className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
              <IconDatabase className="size-5 text-muted-foreground" />
              <span className="min-w-0"><span className="block text-sm font-medium">Database management</span><span className="text-xs text-muted-foreground">Inspect system data</span></span>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Operational status</CardTitle>
            <CardDescription>Live totals from the Administrator service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex justify-between gap-2"><span>Recorded requests in 24 hours</span><strong>{overview?.requestsLast24Hours.toLocaleString() ?? "—"}</strong></p>
            <p className="flex justify-between gap-2"><span>Unresolved request errors</span><strong>{overview?.unresolvedErrors.toLocaleString() ?? "—"}</strong></p>
            <p className="flex justify-between gap-2"><span>Open bug reports</span><strong>{overview?.openBugs.toLocaleString() ?? "—"}</strong></p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
