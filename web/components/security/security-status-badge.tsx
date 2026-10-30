"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Issued: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Returned: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  CheckedIn: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CheckedOut: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  In: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Out: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  Hold: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  SentToAccounts: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

type SecurityStatusBadgeProps = {
  status: string;
  className?: string;
};

export function SecurityStatusBadge({ status, className }: SecurityStatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", color, className)}>
      {status}
    </Badge>
  );
}
