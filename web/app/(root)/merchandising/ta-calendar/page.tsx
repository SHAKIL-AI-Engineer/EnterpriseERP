"use client";

import * as React from "react";
import {
  IconCalendar,
  IconPlus,
  IconRefresh,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconEdit,
  IconHistory,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
  MerchEmptyState,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, TnaCalendar, TnaMilestone } from "@/lib/types/merchandising";
import { cn } from "@/lib/utils";

export default function TACalendarPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <TACalendarPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function TACalendarPageContent({ companyId }: { companyId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [calendar, setCalendar] = React.useState<TnaCalendar | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [templateOpen, setTemplateOpen] = React.useState(false);
  const [milestoneDialog, setMilestoneDialog] = React.useState<{
    mode: "update" | "delay";
    milestone: TnaMilestone;
  } | null>(null);
  const [templateForm, setTemplateForm] = React.useState({
    templateName: "",
    description: "",
    isDefault: false,
    milestones: "Sample Approval,30\nBulk Fabric,45\nShipment,90",
  });
  const [milestoneForm, setMilestoneForm] = React.useState({
    actualDate: "",
    status: "InProgress",
    delayDays: "1",
    reason: "",
  });

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await merchandisingService.getOrders(companyId);
      setOrders(data);
      if (!selectedOrderId && data.length > 0) {
        setSelectedOrderId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedOrderId]);

  const fetchTna = React.useCallback(
    async (orderId: string) => {
      if (!orderId) {
        setCalendar(null);
        return;
      }
      try {
        setLoading(true);
        const data = await merchandisingService.getTnaByOrder(orderId);
        setCalendar(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load T&A calendar");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    if (selectedOrderId) fetchTna(selectedOrderId);
  }, [selectedOrderId, fetchTna]);

  const handleGenerate = async () => {
    if (!selectedOrderId) return;
    try {
      setGenerating(true);
      const data = await merchandisingService.generateTnaForOrder(selectedOrderId);
      setCalendar(data);
      toast.success("T&A calendar generated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate T&A");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    try {
      const milestones = templateForm.milestones
        .split("\n")
        .map((line, idx) => {
          const [name, daysStr] = line.split(",").map((s) => s.trim());
          if (!name) return null;
          return {
            milestoneName: name,
            sequenceNo: idx + 1,
            daysFromStart: Number(daysStr) || 0,
          };
        })
        .filter(Boolean) as Array<{
        milestoneName: string;
        sequenceNo: number;
        daysFromStart: number;
      }>;

      await merchandisingService.createTnaTemplate({
        companyId,
        templateName: templateForm.templateName.trim(),
        description: templateForm.description || undefined,
        isDefault: templateForm.isDefault,
        milestones,
      });
      toast.success("T&A template created");
      setTemplateOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create template");
    }
  };

  const handleMilestoneAction = async () => {
    if (!milestoneDialog) return;
    const { milestone, mode } = milestoneDialog;
    try {
      if (mode === "update") {
        await merchandisingService.updateTnaMilestone(milestone.id, {
          status: milestoneForm.status,
          actualDate: milestoneForm.actualDate || undefined,
        });
        toast.success("Milestone updated");
      } else {
        await merchandisingService.logTnaDelay(milestone.id, {
          companyId,
          delayDays: Number(milestoneForm.delayDays) || 0,
          reason: milestoneForm.reason.trim() || "Delay logged",
        });
        toast.success("Delay logged");
      }
      setMilestoneDialog(null);
      if (selectedOrderId) fetchTna(selectedOrderId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save milestone");
    }
  };

  const milestones = calendar?.milestones ?? [];
  const completed = milestones.filter((m) => m.status === "Completed").length;
  const delayed = milestones.filter((m) => m.status === "Delayed").length;
  const pending = milestones.length - completed - delayed;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconCalendar className="size-6" />}
        title="T&A Calendar"
        description="Order milestones and production timeline"
        actions={
          <>
            <NativeSelect
              className="h-9 w-52"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo}
                </option>
              ))}
            </NativeSelect>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => fetchTna(selectedOrderId)}
              disabled={!selectedOrderId}
            >
              <IconRefresh className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
              <IconPlus className="size-4 mr-1" />
              Template
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={!selectedOrderId || generating}
            >
              {generating ? "Generating…" : "Generate T&A"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi title="Completed" value={completed} icon={IconCircleCheck} className="text-emerald-600" />
        <Kpi title="Delayed" value={delayed} icon={IconAlertCircle} className="text-rose-600" />
        <Kpi title="Pending" value={pending} icon={IconClock} className="text-blue-600" />
        <Kpi
          title="Calendar"
          value={calendar?.status ?? "None"}
          icon={IconCalendar}
          className="text-indigo-600"
          isText
        />
      </div>

      <MerchTableCard isLoading={loading && !calendar}>
        {!calendar && !loading ? (
          <MerchEmptyState
            title="No T&A calendar"
            description={`No calendar for ${selectedOrder?.orderNo ?? "this order"}. Generate T&A to create milestones.`}
          />
        ) : (
          <div className="divide-y">
            <div className="px-4 py-3 border-b bg-muted/20">
              <p className="text-sm font-semibold">
                Milestones — {selectedOrder?.orderNo ?? "Select an order"}
              </p>
            </div>
            {milestones
              .slice()
              .sort((a, b) => a.sequenceNo - b.sequenceNo)
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-8">
                      {m.sequenceNo}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{m.milestoneName}</p>
                      <p className="text-xs text-muted-foreground">
                        Planned: {format(new Date(m.plannedDate), "MMM dd, yyyy")}
                        {m.actualDate &&
                          ` · Actual: ${format(new Date(m.actualDate), "MMM dd, yyyy")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        m.status === "Completed" && "text-emerald-600 border-emerald-200",
                        m.status === "Delayed" && "text-rose-600 border-rose-200",
                        m.status === "InProgress" && "text-blue-600 border-blue-200",
                      )}
                    >
                      {m.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setMilestoneForm({
                          actualDate: m.actualDate?.slice(0, 10) ?? "",
                          status: m.status,
                          delayDays: "1",
                          reason: "",
                        });
                        setMilestoneDialog({ mode: "update", milestone: m });
                      }}
                    >
                      <IconEdit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setMilestoneForm({
                          actualDate: "",
                          status: m.status,
                          delayDays: "1",
                          reason: "",
                        });
                        setMilestoneDialog({ mode: "delay", milestone: m });
                      }}
                    >
                      <IconHistory className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </MerchTableCard>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create T&A Template</DialogTitle>
            <DialogDescription>
              One milestone per line: Name, days from start (e.g. Sample Approval,30)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Template name</Label>
              <Input
                value={templateForm.templateName}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, templateName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Milestones</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateForm.milestones}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, milestones: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={templateForm.isDefault}
                onChange={(e) =>
                  setTemplateForm((p) => ({ ...p, isDefault: e.target.checked }))
                }
              />
              Set as default template
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!milestoneDialog}
        onOpenChange={(open) => !open && setMilestoneDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {milestoneDialog?.mode === "delay" ? "Log delay" : "Update milestone"}
            </DialogTitle>
            <DialogDescription>{milestoneDialog?.milestone.milestoneName}</DialogDescription>
          </DialogHeader>
          {milestoneDialog?.mode === "update" ? (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <NativeSelect
                  value={milestoneForm.status}
                  onChange={(e) =>
                    setMilestoneForm((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label>Actual date</Label>
                <Input
                  type="date"
                  value={milestoneForm.actualDate}
                  onChange={(e) =>
                    setMilestoneForm((p) => ({ ...p, actualDate: e.target.value }))
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Delay days</Label>
                <Input
                  type="number"
                  min={0}
                  value={milestoneForm.delayDays}
                  onChange={(e) =>
                    setMilestoneForm((p) => ({ ...p, delayDays: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={milestoneForm.reason}
                  onChange={(e) =>
                    setMilestoneForm((p) => ({ ...p, reason: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleMilestoneAction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
  className,
  isText,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={cn("h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center", className)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </p>
        <p className={cn("font-bold", isText ? "text-sm" : "text-lg")}>{value}</p>
      </div>
    </div>
  );
}
