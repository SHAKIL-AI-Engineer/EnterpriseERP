"use client";

import * as React from "react";
import {
  IconTruck,
  IconPlus,
  IconRefresh,
  IconMapPin,
  IconPackage,
  IconEdit,
  IconDotsVertical,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, ShipmentPlan } from "@/lib/types/merchandising";

export default function ShipmentPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ShipmentPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function ShipmentPageContent({ companyId }: { companyId: string }) {
  const [plans, setPlans] = React.useState<ShipmentPlan[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [planDialog, setPlanDialog] = React.useState<"create" | "edit" | null>(null);
  const [activePlan, setActivePlan] = React.useState<ShipmentPlan | null>(null);
  const [execDialog, setExecDialog] = React.useState<ShipmentPlan | null>(null);
  const [packDialog, setPackDialog] = React.useState<string | null>(null);
  const [existingExecutionId, setExistingExecutionId] = React.useState<string | null>(null);
  const [planForm, setPlanForm] = React.useState({
    orderId: "",
    plannedShipmentDate: new Date().toISOString().slice(0, 10),
    plannedQty: "",
    shipmentMode: "Sea",
    destination: "",
  });
  const [execForm, setExecForm] = React.useState({
    actualShipmentDate: new Date().toISOString().slice(0, 10),
    shippedQty: "",
    status: "Shipped",
  });
  const [packForm, setPackForm] = React.useState({
    cartonCount: "1",
    grossWeightKg: "",
    netWeightKg: "",
    remarks: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [planRows, orderRows] = await Promise.all([
        merchandisingService.getShipmentPlans(companyId),
        merchandisingService.getOrders(companyId),
      ]);
      setPlans(planRows);
      setOrders(orderRows);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load shipment plans");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openExecutionDialog = async (plan: ShipmentPlan) => {
    setExecDialog(plan);
    setExistingExecutionId(null);
    setExecForm({
      actualShipmentDate: new Date().toISOString().slice(0, 10),
      shippedQty: String(plan.plannedQty),
      status: "Shipped",
    });
    try {
      const existing = await merchandisingService.getShipmentExecutionByPlan(companyId, plan.id);
      if (existing) {
        setExistingExecutionId(existing.id);
        setExecForm({
          actualShipmentDate: existing.actualShipmentDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          shippedQty: String(existing.shippedQty),
          status: existing.status,
        });
        toast.info("Existing shipment execution loaded");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const orderNo = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8);

  const openCreate = () => {
    setActivePlan(null);
    setPlanForm({
      orderId: orders[0]?.id ?? "",
      plannedShipmentDate: new Date().toISOString().slice(0, 10),
      plannedQty: "",
      shipmentMode: "Sea",
      destination: "",
    });
    setPlanDialog("create");
  };

  const openEdit = (plan: ShipmentPlan) => {
    setActivePlan(plan);
    setPlanForm({
      orderId: plan.orderId,
      plannedShipmentDate: plan.plannedShipmentDate.slice(0, 10),
      plannedQty: String(plan.plannedQty),
      shipmentMode: plan.shipmentMode ?? "Sea",
      destination: plan.destination ?? "",
    });
    setPlanDialog("edit");
  };

  const savePlan = async () => {
    if (!planForm.orderId || !planForm.plannedQty) {
      toast.error("Order and quantity are required");
      return;
    }
    try {
      if (planDialog === "edit" && activePlan) {
        await merchandisingService.updateShipmentPlan(activePlan.id, {
          plannedShipmentDate: planForm.plannedShipmentDate,
          plannedQty: Number(planForm.plannedQty),
          shipmentMode: planForm.shipmentMode,
          destination: planForm.destination || undefined,
          status: activePlan.status,
        });
        toast.success("Shipment plan updated");
      } else {
        await merchandisingService.createShipmentPlan({
          companyId,
          orderId: planForm.orderId,
          plannedShipmentDate: planForm.plannedShipmentDate,
          plannedQty: Number(planForm.plannedQty),
          shipmentMode: planForm.shipmentMode,
          destination: planForm.destination || undefined,
        });
        toast.success("Shipment plan created");
      }
      setPlanDialog(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save shipment plan");
    }
  };

  const saveExecution = async () => {
    if (!execDialog || !execForm.shippedQty) {
      toast.error("Shipped quantity is required");
      return;
    }
    try {
      if (existingExecutionId) {
        toast.success("Execution already exists — opening packing list");
        setExecDialog(null);
        setPackDialog(existingExecutionId);
        return;
      }
      const execution = await merchandisingService.createShipmentExecution({
        companyId,
        shipmentPlanId: execDialog.id,
        actualShipmentDate: execForm.actualShipmentDate,
        shippedQty: Number(execForm.shippedQty),
        status: execForm.status,
      });
      toast.success("Shipment execution recorded");
      setExecDialog(null);
      setPackDialog(execution.id);
    } catch (error) {
      console.error(error);
      toast.error("Failed to record execution");
    }
  };

  const savePackingList = async () => {
    if (!packDialog) return;
    try {
      await merchandisingService.createPackingList({
        companyId,
        shipmentExecutionId: packDialog,
        cartonCount: Number(packForm.cartonCount) || 1,
        grossWeightKg: Number(packForm.grossWeightKg) || 0,
        netWeightKg: Number(packForm.netWeightKg) || 0,
        remarks: packForm.remarks || undefined,
      });
      toast.success("Packing list created");
      setPackDialog(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create packing list");
    }
  };

  const columns: ColumnDef<ShipmentPlan>[] = [
    {
      id: "sl",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      id: "orderNo",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">{orderNo(row.original.orderId)}</span>
      ),
    },
    {
      accessorKey: "plannedShipmentDate",
      header: "Planned",
      cell: ({ row }) => format(new Date(row.original.plannedShipmentDate), "MMM dd, yyyy"),
    },
    {
      id: "destination",
      header: "Destination",
      cell: ({ row }) => (
        <span className="text-xs flex items-center gap-1">
          <IconMapPin className="size-3" />
          {row.original.destination ?? "TBD"}
        </span>
      ),
    },
    {
      accessorKey: "plannedQty",
      header: "Qty",
      cell: ({ row }) => row.original.plannedQty.toLocaleString(),
    },
    {
      accessorKey: "shipmentMode",
      header: "Mode",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px]">
          {row.original.shipmentMode ?? "Sea"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <IconEdit className="size-4 mr-2" />
              Edit plan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openExecutionDialog(row.original)}>
              <IconTruck className="size-4 mr-2" />
              Record execution
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalQty = plans.reduce((acc, p) => acc + p.plannedQty, 0);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTruck className="size-6" />}
        title="Shipment Sheet"
        description="Consignment planning, execution, and packing lists"
        actions={
          <>
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <IconRefresh className={loading ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button size="sm" onClick={openCreate}>
              <IconPlus className="size-4 mr-1" />
              New plan
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat title="Plans" value={plans.length} icon={IconTruck} />
        <Stat title="Planned qty" value={totalQty.toLocaleString()} icon={IconPackage} />
        <Stat
          title="Orders"
          value={new Set(plans.map((p) => p.orderId)).size}
          icon={IconMapPin}
        />
      </div>

      <MerchTableCard isLoading={loading}>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={plans}
            isLoading={loading}
            searchKey="status"
            showTabs={false}
            showActions={false}
            showColumnCustomizer
          />
        </div>
      </MerchTableCard>

      <Dialog open={!!planDialog} onOpenChange={(o) => !o && setPlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {planDialog === "edit" ? "Edit shipment plan" : "Create shipment plan"}
            </DialogTitle>
            <DialogDescription>Plan consignment for an order</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Order</Label>
              <NativeSelect
                value={planForm.orderId}
                onChange={(e) => setPlanForm((p) => ({ ...p, orderId: e.target.value }))}
                disabled={planDialog === "edit"}
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Planned date</Label>
              <Input
                type="date"
                value={planForm.plannedShipmentDate}
                onChange={(e) =>
                  setPlanForm((p) => ({ ...p, plannedShipmentDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Planned qty</Label>
              <Input
                type="number"
                value={planForm.plannedQty}
                onChange={(e) => setPlanForm((p) => ({ ...p, plannedQty: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <NativeSelect
                value={planForm.shipmentMode}
                onChange={(e) => setPlanForm((p) => ({ ...p, shipmentMode: e.target.value }))}
              >
                <option value="Sea">Sea</option>
                <option value="Air">Air</option>
                <option value="Road">Road</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={planForm.destination}
                onChange={(e) => setPlanForm((p) => ({ ...p, destination: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(null)}>
              Cancel
            </Button>
            <Button onClick={savePlan}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!execDialog} onOpenChange={(o) => !o && setExecDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shipment execution</DialogTitle>
            <DialogDescription>
              Plan: {execDialog ? orderNo(execDialog.orderId) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Actual shipment date</Label>
              <Input
                type="date"
                value={execForm.actualShipmentDate}
                onChange={(e) =>
                  setExecForm((p) => ({ ...p, actualShipmentDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Shipped qty</Label>
              <Input
                type="number"
                value={execForm.shippedQty}
                onChange={(e) => setExecForm((p) => ({ ...p, shippedQty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecDialog(null)}>
              Cancel
            </Button>
            <Button onClick={saveExecution}>Save execution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!packDialog} onOpenChange={(o) => !o && setPackDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create packing list</DialogTitle>
            <DialogDescription>Linked to shipment execution</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Carton count</Label>
              <Input
                type="number"
                value={packForm.cartonCount}
                onChange={(e) => setPackForm((p) => ({ ...p, cartonCount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gross weight (kg)</Label>
              <Input
                type="number"
                value={packForm.grossWeightKg}
                onChange={(e) => setPackForm((p) => ({ ...p, grossWeightKg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Net weight (kg)</Label>
              <Input
                type="number"
                value={packForm.netWeightKg}
                onChange={(e) => setPackForm((p) => ({ ...p, netWeightKg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={packForm.remarks}
                onChange={(e) => setPackForm((p) => ({ ...p, remarks: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackDialog(null)}>
              Skip
            </Button>
            <Button onClick={savePackingList}>Create packing list</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  );
}

function Stat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
