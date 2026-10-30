"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  IconLayersLinked,
  IconPlus,
  IconRefresh,
  IconCalculator,
  IconCopy,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterCard,
  MerchFilterField,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { BomCalculationResult, BomItem, Order } from "@/lib/types/merchandising"

type BomForm = {
  itemType: string
  itemCode: string
  itemName: string
  unitName: string
  consumption: string
  wastagePercent: string
  unitPrice: string
}

const emptyForm = (): BomForm => ({
  itemType: "Fabric",
  itemCode: "",
  itemName: "",
  unitName: "KG",
  consumption: "",
  wastagePercent: "5",
  unitPrice: "",
})

export default function BOMPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <BOMPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function BOMPageContent({ companyId }: { companyId: string }) {
  const searchParams = useSearchParams()
  const initialOrderId = searchParams.get("orderId") ?? ""

  const [orders, setOrders] = React.useState<Order[]>([])
  const [draftOrderId, setDraftOrderId] = React.useState(initialOrderId)
  const [selectedOrderId, setSelectedOrderId] = React.useState(initialOrderId)
  const [bomItems, setBomItems] = React.useState<BomItem[]>([])
  const [calcResult, setCalcResult] = React.useState<BomCalculationResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [bomLoading, setBomLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<BomItem | null>(null)
  const [form, setForm] = React.useState<BomForm>(emptyForm())

  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await merchandisingService.getOrders(companyId)
      setOrders(data)
      if (!selectedOrderId && data.length > 0) {
        const first = initialOrderId || data[0].id
        setDraftOrderId(first)
        setSelectedOrderId(first)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [companyId, initialOrderId, selectedOrderId])

  const fetchBom = React.useCallback(async (orderId: string) => {
    if (!orderId) {
      setBomItems([])
      setCalcResult(null)
      return
    }
    try {
      setBomLoading(true)
      const data = await merchandisingService.getBomItems(orderId)
      setBomItems(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load BOM items")
    } finally {
      setBomLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  React.useEffect(() => {
    if (selectedOrderId) fetchBom(selectedOrderId)
  }, [selectedOrderId, fetchBom])

  const applyOrder = () => setSelectedOrderId(draftOrderId)

  const resetFilters = () => {
    setDraftOrderId("")
    setSelectedOrderId("")
    setSearchQuery("")
    setBomItems([])
    setCalcResult(null)
  }

  const filteredItems = bomItems.filter(
    (item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemCode ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (item: BomItem) => {
    setEditing(item)
    setForm({
      itemType: item.itemType,
      itemCode: item.itemCode ?? "",
      itemName: item.itemName,
      unitName: item.unitName,
      consumption: String(item.consumption),
      wastagePercent: String(item.wastagePercent),
      unitPrice: String(item.unitPrice),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!selectedOrderId || !form.itemName.trim()) {
      toast.error("Item name is required")
      return
    }
    const payload = {
      companyId,
      itemType: form.itemType,
      itemCode: form.itemCode.trim() || undefined,
      itemName: form.itemName.trim(),
      unitName: form.unitName,
      consumption: Number(form.consumption || 0),
      wastagePercent: Number(form.wastagePercent || 0),
      unitPrice: Number(form.unitPrice || 0),
    }
    try {
      if (editing) {
        await merchandisingService.updateBomItem(editing.id, payload)
        toast.success("BOM item updated")
      } else {
        await merchandisingService.createBomItem(selectedOrderId, payload)
        toast.success("BOM item added")
      }
      setDialogOpen(false)
      fetchBom(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error(editing ? "Failed to update BOM item" : "Failed to add BOM item")
    }
  }

  const handleDelete = async (item: BomItem) => {
    if (!confirm(`Delete "${item.itemName}"?`)) return
    try {
      await merchandisingService.deleteBomItem(item.id)
      toast.success("BOM item deleted")
      fetchBom(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete BOM item")
    }
  }

  const handleCalculate = async () => {
    if (!selectedOrderId) return
    try {
      setBomLoading(true)
      const result = await merchandisingService.calculateBom(selectedOrderId)
      setCalcResult(result)
      toast.success("BOM quantities recalculated")
      fetchBom(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error("BOM calculation failed")
    } finally {
      setBomLoading(false)
    }
  }

  const handleCopyFromStyle = async () => {
    if (!selectedOrderId) return
    try {
      setBomLoading(true)
      await merchandisingService.copyStyleBomToOrder(selectedOrderId, companyId)
      toast.success("Style BOM copied to order")
      fetchBom(selectedOrderId)
    } catch (error) {
      console.error(error)
      toast.error("Failed to copy style BOM")
    } finally {
      setBomLoading(false)
    }
  }

  const columns: ColumnDef<BomItem>[] = [
    {
      accessorKey: "itemType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.original.itemType}
        </Badge>
      ),
    },
    {
      accessorKey: "itemName",
      header: "Item",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.itemName}</p>
          {row.original.itemCode ? (
            <p className="text-[10px] text-muted-foreground">{row.original.itemCode}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "consumption",
      header: () => <span className="block text-right">Consumption</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm">
          {row.original.consumption} {row.original.unitName}
        </span>
      ),
    },
    {
      accessorKey: "wastagePercent",
      header: () => <span className="block text-right">Wastage %</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm">{row.original.wastagePercent}%</span>
      ),
    },
    {
      accessorKey: "requiredQty",
      header: () => <span className="block text-right">Required</span>,
      cell: ({ row }) => (
        <span className="block text-right font-bold tabular-nums">
          {row.original.requiredQty.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: () => <span className="block text-right">Unit $</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm tabular-nums">
          ${row.original.unitPrice.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "totalCost",
      header: () => <span className="block text-right">Total $</span>,
      cell: ({ row }) => (
        <span className="block text-right font-bold tabular-nums">
          ${row.original.totalCost.toFixed(2)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <IconPencil className="size-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original)}
            >
              <IconTrash className="size-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconLayersLinked className="size-6" />}
        title="Bill of Materials"
        description="Define raw material requirements per order"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCopyFromStyle}
              disabled={!selectedOrderId || bomLoading}
            >
              <IconCopy className="size-4" />
              Copy Style BOM
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCalculate}
              disabled={!selectedOrderId || bomLoading}
            >
              <IconCalculator className="size-4" />
              Calculate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedOrderId && fetchBom(selectedOrderId)}
              disabled={bomLoading}
            >
              <IconRefresh className="size-4" />
            </Button>
            <Button size="sm" className="gap-2" onClick={openCreate} disabled={!selectedOrderId}>
              <IconPlus className="size-4" />
              Add Item
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={filteredItems.length}
        recordLabel="BOM Lines"
        isLoading={loading || bomLoading}
        onApply={applyOrder}
        onReset={resetFilters}
      >
        <MerchFilterField label="Order">
          <NativeSelect
            value={draftOrderId}
            onChange={(e) => setDraftOrderId(e.target.value)}
          >
            <option value="">Select order</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
        <MerchFilterField label="Search items">
          <Input
            placeholder="Filter by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </MerchFilterField>
      </MerchFilterCard>

      {calcResult ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CalcStat label="Line items" value={String(calcResult.totalRequiredItems)} />
          <CalcStat label="Total qty" value={calcResult.totalRequiredQuantity.toLocaleString()} />
          <CalcStat label="Total cost" value={`$${calcResult.totalCost.toFixed(2)}`} />
        </div>
      ) : null}

      <MerchTableCard isLoading={bomLoading && bomItems.length === 0} loadingMessage="Loading BOM...">
        <div className="px-4 py-3 border-b text-sm text-muted-foreground">
          {selectedOrder ? (
            <>
              Order <span className="font-semibold text-foreground">{selectedOrder.orderNo}</span>
              {" · "}
              {filteredItems.length} items
            </>
          ) : (
            "Select an order to view BOM"
          )}
        </div>
        <DataTable columns={columns} data={filteredItems} />
      </MerchTableCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit BOM Item" : "Add BOM Item"}</DialogTitle>
            <DialogDescription>Order: {selectedOrder?.orderNo ?? "—"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Item Type</Label>
              <NativeSelect
                value={form.itemType}
                onChange={(e) => setForm((p) => ({ ...p, itemType: e.target.value }))}
              >
                <option value="Fabric">Fabric</option>
                <option value="Trims">Trims</option>
                <option value="Accessories">Accessories</option>
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Item Code</Label>
                <Input
                  value={form.itemCode}
                  onChange={(e) => setForm((p) => ({ ...p, itemCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Item Name</Label>
                <Input
                  value={form.itemName}
                  onChange={(e) => setForm((p) => ({ ...p, itemName: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Unit</Label>
                <Input
                  value={form.unitName}
                  onChange={(e) => setForm((p) => ({ ...p, unitName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Consumption</Label>
                <Input
                  type="number"
                  value={form.consumption}
                  onChange={(e) => setForm((p) => ({ ...p, consumption: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Wastage %</Label>
                <Input
                  type="number"
                  value={form.wastagePercent}
                  onChange={(e) => setForm((p) => ({ ...p, wastagePercent: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit Price</Label>
                <Input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) => setForm((p) => ({ ...p, unitPrice: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}

function CalcStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3 shadow-sm">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}
