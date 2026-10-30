"use client"

import * as React from "react"
import {
  IconClipboardList,
  IconPlus,
  IconRefresh,
  IconSend,
  IconShoppingCart,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Order, PurchaseRequisition } from "@/lib/types/merchandising"

export default function RequisitionsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <RequisitionsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function RequisitionsPageContent({ companyId }: { companyId: string }) {
  const [requisitions, setRequisitions] = React.useState<PurchaseRequisition[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draftOrderId, setDraftOrderId] = React.useState("")
  const [orderFilter, setOrderFilter] = React.useState<string | undefined>(undefined)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [fromOrderOpen, setFromOrderOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    requisitionNo: "",
    requestedDate: new Date().toISOString().slice(0, 10),
    orderId: "",
    itemType: "Fabric",
    itemName: "",
    requiredQty: "",
    unitName: "KG",
  })

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [reqRows, orderRows] = await Promise.all([
        merchandisingService.getRequisitions(companyId, orderFilter),
        merchandisingService.getOrders(companyId),
      ])
      setRequisitions(reqRows)
      setOrders(orderRows)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load requisitions")
    } finally {
      setLoading(false)
    }
  }, [companyId, orderFilter])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const applyFilters = () => {
    setOrderFilter(draftOrderId || undefined)
  }

  const orderLabel = (orderId?: string | null) => {
    if (!orderId) return "—"
    return orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8)
  }

  const handleCreate = async () => {
    if (!form.requisitionNo.trim()) {
      toast.error("Requisition number is required")
      return
    }
    try {
      setSaving(true)
      const lines = form.itemName.trim()
        ? [
            {
              itemType: form.itemType,
              itemName: form.itemName.trim(),
              requiredQty: Number(form.requiredQty || 0),
              unitName: form.unitName,
            },
          ]
        : undefined
      await merchandisingService.createRequisition({
        companyId,
        orderId: form.orderId || undefined,
        requisitionNo: form.requisitionNo.trim(),
        requestedDate: form.requestedDate,
        lines,
      })
      toast.success("Requisition created")
      setCreateOpen(false)
      setForm({
        requisitionNo: "",
        requestedDate: new Date().toISOString().slice(0, 10),
        orderId: "",
        itemType: "Fabric",
        itemName: "",
        requiredQty: "",
        unitName: "KG",
      })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create requisition")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFromOrder = async () => {
    if (!form.orderId || !form.requisitionNo.trim()) {
      toast.error("Order and requisition number are required")
      return
    }
    try {
      setSaving(true)
      await merchandisingService.createRequisitionFromOrder(form.orderId, {
        companyId,
        orderId: form.orderId,
        requisitionNo: form.requisitionNo.trim(),
        requestedDate: form.requestedDate,
      })
      toast.success("Requisition created from order BOM")
      setFromOrderOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create requisition from order")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (req: PurchaseRequisition) => {
    try {
      await merchandisingService.submitRequisition(req.id)
      toast.success("Requisition submitted")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Submit failed")
    }
  }

  const columns: ColumnDef<PurchaseRequisition>[] = [
    {
      accessorKey: "requisitionNo",
      header: "Requisition No",
      cell: ({ row }) => (
        <span className="font-bold text-sm text-primary">{row.original.requisitionNo}</span>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => (
        <span className="text-sm">{orderLabel(row.original.orderId)}</span>
      ),
    },
    {
      accessorKey: "requestedDate",
      header: "Requested",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.requestedDate), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      id: "lines",
      header: "Lines",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.lines?.length ?? 0}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.status === "Draft" ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={() => handleSubmit(row.original)}
          >
            <IconSend className="size-3.5" />
            Submit
          </Button>
        ) : null,
    },
  ]

  const RequisitionFormFields = (
    <>
      <div className="space-y-2">
        <Label className="text-xs">Requisition No</Label>
        <Input
          value={form.requisitionNo}
          onChange={(e) => setForm((p) => ({ ...p, requisitionNo: e.target.value }))}
          placeholder="REQ-2026-001"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Requested Date</Label>
        <Input
          type="date"
          value={form.requestedDate}
          onChange={(e) => setForm((p) => ({ ...p, requestedDate: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Order (optional)</Label>
        <NativeSelect
          value={form.orderId}
          onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}
        >
          <option value="">No linked order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.orderNo}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Line item type</Label>
          <NativeSelect
            value={form.itemType}
            onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value }))}
          >
            <option value="Fabric">Fabric</option>
            <option value="Trims">Trims</option>
            <option value="Accessories">Accessories</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Unit</Label>
          <Input
            value={form.unitName}
            onChange={(e) => setForm((p) => ({ ...p, unitName: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Line item name (optional)</Label>
        <Input
          value={form.itemName}
          onChange={(e) => setForm((p) => ({ ...p, itemName: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Required qty</Label>
        <Input
          type="number"
          value={form.requiredQty}
          onChange={(e) => setForm((p) => ({ ...p, requiredQty: e.target.value }))}
        />
      </div>
    </>
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconClipboardList className="size-6" />}
        title="Purchase Requisitions"
        description="Material purchase requests linked to orders and BOM"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={loading ? "animate-spin size-4" : "size-4"} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setFromOrderOpen(true)}
            >
              <IconShoppingCart className="size-4" />
              From Order
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <IconPlus className="size-4" />
              New Requisition
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={requisitions.length}
        isLoading={loading}
        onApply={applyFilters}
        onReset={() => {
          setDraftOrderId("")
          setOrderFilter(undefined)
        }}
      >
        <MerchFilterField label="Filter by order">
          <NativeSelect
            value={draftOrderId}
            onChange={(e) => setDraftOrderId(e.target.value)}
          >
            <option value="">All orders</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading} loadingMessage="Loading requisitions...">
        <DataTable columns={columns} data={requisitions} />
      </MerchTableCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New purchase requisition</DialogTitle>
            <DialogDescription>Create a manual requisition with optional line items</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">{RequisitionFormFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fromOrderOpen} onOpenChange={setFromOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from order</DialogTitle>
            <DialogDescription>
              Generates requisition lines from the order BOM and bookings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Order</Label>
              <NativeSelect
                value={form.orderId}
                onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}
              >
                <option value="">Select order</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Requisition No</Label>
              <Input
                value={form.requisitionNo}
                onChange={(e) => setForm((p) => ({ ...p, requisitionNo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Requested Date</Label>
              <Input
                type="date"
                value={form.requestedDate}
                onChange={(e) => setForm((p) => ({ ...p, requestedDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFromOrderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFromOrder} disabled={saving}>
              {saving ? "Creating..." : "Create from order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
