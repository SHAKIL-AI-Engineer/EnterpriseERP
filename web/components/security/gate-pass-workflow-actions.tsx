"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { securityService } from "@/lib/services/security";
import type { GatePass } from "@/lib/types/security";
import {
  canApproveGatePass,
  canCreateGatePass,
  canIssueGatePass,
  isViewerOnly,
} from "@/components/security/security-roles";

type GatePassWorkflowActionsProps = {
  gatePass: GatePass;
  onUpdated: (gp: GatePass) => void;
};

export function GatePassWorkflowActions({ gatePass, onUpdated }: GatePassWorkflowActionsProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const [busy, setBusy] = React.useState<string | null>(null);
  const readOnly = isViewerOnly(roles);

  const run = async (action: string, fn: () => Promise<GatePass>) => {
    setBusy(action);
    try {
      const updated = await fn();
      onUpdated(updated);
      toast.success(`Gate pass ${action}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} gate pass`);
    } finally {
      setBusy(null);
    }
  };

  if (readOnly) return null;

  const { status } = gatePass;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "Draft" && canCreateGatePass(roles) && (
        <>
          <Button
            size="sm"
            disabled={!!busy}
            onClick={() => run("submit", () => securityService.submitGatePass(gatePass.id))}
          >
            {busy === "submit" ? "Submitting…" : "Submit"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!!busy}
            onClick={() => run("cancel", () => securityService.cancelGatePass(gatePass.id))}
          >
            Cancel
          </Button>
        </>
      )}
      {status === "Submitted" && canApproveGatePass(roles) && (
        <Button
          size="sm"
          disabled={!!busy}
          onClick={() => run("approve", () => securityService.approveGatePass(gatePass.id))}
        >
          Approve
        </Button>
      )}
      {status === "Approved" && canIssueGatePass(roles) && (
        <Button
          size="sm"
          disabled={!!busy}
          onClick={() => run("issue", () => securityService.issueGatePass(gatePass.id))}
        >
          Issue at gate
        </Button>
      )}
      {status === "Issued" && canIssueGatePass(roles) && (
        <Button
          size="sm"
          disabled={!!busy}
          onClick={() => run("complete", () => securityService.completeGatePass(gatePass.id))}
        >
          Complete
        </Button>
      )}
      {(status === "Submitted" || status === "Draft") && canCreateGatePass(roles) && status !== "Draft" && (
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => run("cancel", () => securityService.cancelGatePass(gatePass.id))}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
