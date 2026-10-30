"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-700 border-red-500/30",
  Cancelled: "bg-muted text-muted-foreground",
};

export function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", statusStyles[status] ?? "")}
    >
      {status}
    </Badge>
  );
}
