"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import {
  SecurityPageShell,
  SecurityCompanyGate,
  InOutTimeDisplay,
  SecurityStatusBadge,
  canApproveOutPass,
  canGateOperations,
  isViewerOnly,
  SecurityDateTimePicker,
  nowDateTimeLocal,
} from "@/components/security";
import { securityService } from "@/lib/services/security";
import type { EmployeeOutPass, Gate } from "@/lib/types/security";

function toIso(value: string): string {
  return new Date(value).toISOString();
}

export default function EmployeeOutPassDetailPage() {
  return (
    <SecurityPageShell>
      <SecurityCompanyGate>
        {(companyId) => <EmployeeOutPassDetailContent companyId={companyId} />}
      </SecurityCompanyGate>
    </SecurityPageShell>
  );
}

function EmployeeOutPassDetailContent({ companyId }: { companyId: string }) {
  const params = useParams();
  const passId = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const readOnly = isViewerOnly(roles);

  const [pass, setPass] = React.useState<EmployeeOutPass | null>(null);
  const [gate, setGate] = React.useState<Gate | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [actualReturnTime, setActualReturnTime] = React.useState(() => nowDateTimeLocal());

  const load = React.useCallback(async () => {
    if (!passId) return;
    setLoading(true);
    try {
      const all = await securityService.getEmployeeOutPasses(companyId);
      const row = all.find((p) => p.id === passId) ?? null;
      if (!row) {
        setPass(null);
        return;
      }
      const gateRows = await securityService.getGates(companyId);
      setPass(row);
      setGate(gateRows.find((g) => g.id === row.gateId) ?? null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load out pass");
      setPass(null);
    } finally {
      setLoading(false);
    }
  }, [passId, companyId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const run = async (action: string, fn: () => Promise<EmployeeOutPass>) => {
    setBusy(action);
    try {
      const updated = await fn();
      setPass(updated);
      toast.success(`Out pass ${action}`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} out pass`);
    } finally {
      setBusy(null);
    }
  };

  const handleReturn = async () => {
    if (!pass) return;
    setBusy("return");
    try {
      const updated = await securityService.returnEmployeeOutPass(pass.id, {
        actualReturnTime: toIso(actualReturnTime),
      });
      setPass(updated);
      setReturnOpen(false);
      toast.success("Employee marked returned");
    } catch (error) {
      console.error(error);
      toast.error("Failed to record return");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-10 text-center">Loading out pass…</p>;
  }

  if (!pass) {
    return (
      <div className="text-center py-10 space-y-4">
        <p className="text-muted-foreground">Out pass not found</p>
        <Button variant="outline" asChild>
          <Link href="/security/employee-out-passes">Back to list</Link>
        </Button>
      </div>
    );
  }

  const { status } = pass;
  const canOps = canGateOperations(roles);
  const canApprove = canApproveOutPass(roles);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/security/employee-out-passes">
              <IconArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{pass.passNo}</h2>
            <p className="text-sm text-muted-foreground">{pass.passDate}</p>
          </div>
          <SecurityStatusBadge status={pass.status} />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/60">
        <CardHeader>
          <CardTitle>Out Pass Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Gate" value={gate ? `${gate.gateName} (${gate.gateCode})` : undefined} />
            <DetailRow label="Employee ID" value={pass.employeeId} />
            <DetailRow label="Approval" value={pass.approvalStatus} />
            <DetailRow
              label="Expected Return"
              value={
                pass.expectedReturnTime
                  ? new Date(pass.expectedReturnTime).toLocaleString()
                  : undefined
              }
            />
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Reason</p>
            <p>{pass.reason}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Out / Return Times</p>
            <InOutTimeDisplay inTime={pass.outTime} outTime={pass.actualReturnTime} />
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {status === "Pending" && canApprove && (
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => run("approved", () => securityService.approveEmployeeOutPass(pass.id))}
            >
              {busy === "approved" ? "Approving…" : "Approve"}
            </Button>
          )}
          {status === "Approved" && canOps && (
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => run("marked out", () => securityService.markEmployeeOut(pass.id))}
            >
              {busy === "marked out" ? "Marking…" : "Mark Out"}
            </Button>
          )}
          {status === "Out" && canOps && (
            <Button
              size="sm"
              disabled={!!busy}
              onClick={() => {
                setActualReturnTime(nowDateTimeLocal());
                setReturnOpen(true);
              }}
            >
              Record Return
            </Button>
          )}
          {(status === "Pending" || status === "Approved") && canOps && (
            <Button
              size="sm"
              variant="destructive"
              disabled={!!busy}
              onClick={() => run("cancelled", () => securityService.cancelEmployeeOutPass(pass.id))}
            >
              {busy === "cancelled" ? "Cancelling…" : "Cancel"}
            </Button>
          )}
        </div>
      )}

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Return</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Actual Return Time</Label>
            <SecurityDateTimePicker
              value={actualReturnTime}
              onChange={setActualReturnTime}
              placeholder="Return time"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturn} disabled={busy === "return"}>
              {busy === "return" ? "Saving…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium break-all">{value || "—"}</p>
    </div>
  );
}
