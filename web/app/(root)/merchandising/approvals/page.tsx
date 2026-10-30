"use client";

import * as React from "react";
import {
  IconClipboardCheck,
  IconRefresh,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
  MerchEmptyState,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { ApprovalRequest, ApprovalStep } from "@/lib/types/merchandising";
import { authService } from "@/lib/services/auth";

export default function ApprovalsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ApprovalsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function ApprovalsPageContent({ companyId }: { companyId: string }) {
  const [requests, setRequests] = React.useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionDialog, setActionDialog] = React.useState<{
    request: ApprovalRequest;
    step: ApprovalStep;
    mode: "approve" | "reject";
  } | null>(null);
  const [remarks, setRemarks] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailRequest, setDetailRequest] = React.useState<ApprovalRequest | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({
    entityType: "Order",
    entityId: "",
    requestType: "CostingApproval",
    requestedBy: "",
    approverUserId: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchandisingService.getPendingApprovals(companyId);
      setRequests(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getApproverUserId = (): string | null => {
    const user = authService.getCurrentUser() as { id?: string; userId?: string } | null;
    return user?.id ?? user?.userId ?? null;
  };

  const pendingStep = (request: ApprovalRequest): ApprovalStep | undefined =>
    request.steps?.find((s) => s.status === "Pending" || s.status === "InProgress");

  const openDetail = async (request: ApprovalRequest) => {
    try {
      setDetailLoading(true);
      const full = await merchandisingService.getApprovalRequest(request.id, companyId);
      setDetailRequest(full);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load approval details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    const user = authService.getCurrentUser() as { id?: string; userId?: string; name?: string; email?: string } | null;
    const requestedBy =
      createForm.requestedBy.trim() ||
      user?.name ||
      user?.email ||
      "Merchandiser";
    if (!createForm.entityId.trim()) {
      toast.error("Entity ID is required");
      return;
    }
    const approverUserId = createForm.approverUserId.trim() || user?.id || user?.userId;
    if (!approverUserId) {
      toast.error("Approver user ID is required (sign in or enter manually)");
      return;
    }
    try {
      await merchandisingService.createApprovalRequest({
        companyId,
        entityType: createForm.entityType,
        entityId: createForm.entityId.trim(),
        requestType: createForm.requestType,
        requestedBy,
        steps: [{ approvalLevel: 1, approverUserId }],
      });
      toast.success("Approval request created");
      setCreateOpen(false);
      setCreateForm({
        entityType: "Order",
        entityId: "",
        requestType: "CostingApproval",
        requestedBy: "",
        approverUserId: "",
      });
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create approval request");
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const approverUserId = getApproverUserId();
    if (!approverUserId) {
      toast.error("Sign in required to approve or reject");
      return;
    }
    const { request, step, mode } = actionDialog;
    try {
      if (mode === "approve") {
        await merchandisingService.approveStep(request.id, step.id, {
          approverUserId,
          remarks: remarks || undefined,
        });
        toast.success("Step approved");
      } else {
        await merchandisingService.rejectStep(request.id, step.id, {
          approverUserId,
          remarks: remarks || undefined,
        });
        toast.success("Step rejected");
      }
      setActionDialog(null);
      setRemarks("");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
    }
  };

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconClipboardCheck className="size-6" />}
        title="Approvals"
        description="Pending approval requests and workflow steps"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              New Request
            </Button>
          </>
        }
      />

      <MerchTableCard isLoading={loading}>
        {!loading && requests.length === 0 ? (
          <MerchEmptyState
            title="No pending approvals"
            description="All approval requests are complete or none have been submitted."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => {
                const step = pendingStep(req);
                return (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openDetail(req)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{req.requestType}</p>
                        <p className="text-[10px] text-muted-foreground">{req.entityType}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{req.entityId.slice(0, 8)}…</TableCell>
                    <TableCell>
                      <p className="text-sm">{req.requestedBy}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(req.requestedAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {step ? (
                        <span className="text-xs">
                          Level {step.approvalLevel} · {step.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {step ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-emerald-600"
                            onClick={() => {
                              setRemarks("");
                              setActionDialog({ request: req, step, mode: "approve" });
                            }}
                          >
                            <IconCheck className="size-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-rose-600"
                            onClick={() => {
                              setRemarks("");
                              setActionDialog({ request: req, step, mode: "reject" });
                            }}
                          >
                            <IconX className="size-4" />
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </MerchTableCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Approval Request</DialogTitle>
            <DialogDescription>Submit an entity for workflow approval</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Input
                value={createForm.entityType}
                onChange={(e) => setCreateForm((p) => ({ ...p, entityType: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Entity ID (GUID)</Label>
              <Input
                value={createForm.entityId}
                onChange={(e) => setCreateForm((p) => ({ ...p, entityId: e.target.value }))}
                placeholder="Order or costing entity GUID"
              />
            </div>
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Input
                value={createForm.requestType}
                onChange={(e) => setCreateForm((p) => ({ ...p, requestType: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Requested By</Label>
              <Input
                value={createForm.requestedBy}
                onChange={(e) => setCreateForm((p) => ({ ...p, requestedBy: e.target.value }))}
                placeholder="Defaults to current user"
              />
            </div>
            <div className="space-y-2">
              <Label>Approver User ID</Label>
              <Input
                value={createForm.approverUserId}
                onChange={(e) => setCreateForm((p) => ({ ...p, approverUserId: e.target.value }))}
                placeholder="Defaults to current user"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detailRequest} onOpenChange={(o) => !o && setDetailRequest(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Approval Request</SheetTitle>
            <SheetDescription>
              {detailRequest?.requestType} · {detailRequest?.status}
            </SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <p className="text-sm text-muted-foreground py-6">Loading...</p>
          ) : detailRequest ? (
            <div className="space-y-4 py-4 text-sm">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Entity</p>
                <p>{detailRequest.entityType}</p>
                <p className="font-mono text-xs break-all">{detailRequest.entityId}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Requested</p>
                <p>{detailRequest.requestedBy}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(detailRequest.requestedAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Steps</p>
                <ul className="space-y-2">
                  {detailRequest.steps?.map((step) => (
                    <li key={step.id} className="rounded-md border px-3 py-2">
                      <p>Level {step.approvalLevel} · {step.status}</p>
                      {step.remarks ? <p className="text-xs text-muted-foreground mt-1">{step.remarks}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.mode === "approve" ? "Approve step" : "Reject step"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.request.requestType} — level{" "}
              {actionDialog?.step.approvalLevel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional comments"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={actionDialog?.mode === "reject" ? "destructive" : "default"}
              onClick={handleAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  );
}
