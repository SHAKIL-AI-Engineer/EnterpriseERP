"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Submitted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Approved: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Posted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Transferred: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  Cancelled: "bg-muted text-muted-foreground",
};

export function WorkflowStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", STATUS_STYLES[status] ?? "")}>
      {status}
    </Badge>
  );
}
