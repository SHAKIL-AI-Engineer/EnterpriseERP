"use client";

import type { LeaveApprovalStep } from "@/lib/services/leave";
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge";
import { format } from "date-fns";

export function LeaveApprovalSteps({ steps }: { steps: LeaveApprovalStep[] }) {
  if (!steps?.length) {
    return (
      <p className="text-sm text-muted-foreground">No approval steps recorded.</p>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div
          key={step.id}
          className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div>
            <p className="text-sm font-medium">Level {step.approvalLevel}</p>
            {step.remarks && (
              <p className="text-xs text-muted-foreground mt-1">{step.remarks}</p>
            )}
            {step.actionAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(step.actionAt), "dd MMM yyyy HH:mm")}
              </p>
            )}
          </div>
          <LeaveStatusBadge status={step.status} />
        </div>
      ))}
    </div>
  );
}
