"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  IconStack,
  IconSearch,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconCalculator,
  IconDotsVertical,
  IconPalette,
  IconScissors,
  IconArrowsSplit,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { NativeSelect } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { MaterialBooking, Order } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

type BookingTab = "fabric" | "trims"

function resolveTab(typeParam: string | null): BookingTab {
  return typeParam?.toLowerCase() === "trims" ? "trims" : "fabric"
}

function bookingTypeForTab(tab: BookingTab): string {
  return tab === "fabric" ? "Fabric" : "Trims"
}

export default function BookingsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <BookingsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function BookingsPageContent({ companyId }: { companyId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTab = resolveTab(searchParams.get("type"))
  const urlOrderId = searchParams.get("orderId") ?? ""
  const urlSubType = searchParams.get("subType") ?? searchParams.get("trimsSubType") ?? ""

  const [activeTab, setActiveTab] = React.useState<BookingTab>(initialTab)
  const [trimsSubType, setTrimsSubType] = React.useState(urlSubType)
  const [bookings, setBookings] = React.useState<MaterialBooking[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [draftOrderFilter, setDraftOrderFilter] = React.useState(urlOrderId)
  const [orderFilter, setOrderFilter] = React.useState(urlOrderId)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [newBooking, setNewBooking] = React.useState({ orderId: "", bookingNo: "" })

  const [activeBooking, setActiveBooking] = React.useState<MaterialBooking | null>(null)
  const [fabricOpen, setFabricOpen] = React.useState(false)
  const [trimsOpen, setTrimsOpen] = React.useState(false)
  const [allocOpen, setAllocOpen] = React.useState(false)
  const [fabricForm, setFabricForm] = React.useState({
    colorName: "",
    requiredQty: "",
    fabricTypeId: "",
    supplierId: "",
  })
  const [trimsForm, setTrimsForm] = React.useState({
    itemName: "",
    requiredQty: "",
    trimsTypeId: "",
    supplierId: "",
  })
  const [allocForm, setAllocForm] = React.useState({
    detailId: "",
    detailType: "Fabric",
    allocatedQty: "",
    allocationDate: new Date().toISOString().slice(0, 10),
  })

  React.useEffect(() => {
    setActiveTab(resolveTab(searchParams.get("type")))
    setTrimsSubType(searchParams.get("subType") ?? searchParams.get("trimsSubType") ?? "")
    const oid = searchParams.get("orderId") ?? ""
    if (oid) {
      setDraftOrderFilter(oid)
      setOrderFilter(oid)
    }
  }, [searchParams])

  const syncUrl = React.useCallback(
    (tab: BookingTab, orderId?: string, subType?: string) => {
      const params = new URLSearchParams()
      params.set("type", tab)
      if (orderId) params.set("orderId", orderId)
      if (tab === "trims" && subType) params.set("subType", subType)
      router.replace(`/merchandising/bookings?${params.toString()}`, { scroll: false })
    },
    [router],
  )

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [bookingRows, orderRows] = await Promise.all([
        merchandisingService.getMaterialBookings(
          companyId,
          orderFilter || undefined,
          bookingTypeForTab(activeTab),
        ),
        merchandisingService.getOrders(companyId),
      ])
      setBookings(bookingRows)
      setOrders(orderRows)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load material bookings")
    } finally {
      setLoading(false)
    }
  }, [companyId, activeTab, orderFilter])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredBookings = React.useMemo(() => {
    let rows = bookings
    if (activeTab === "trims" && trimsSubType.trim()) {
      const needle = trimsSubType.trim().toLowerCase()
      rows = rows.filter(
        (b) =>
          b.bookingNo.toLowerCase().includes(needle) ||
          b.bookingType.toLowerCase().includes(needle),
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      rows = rows.filter(
        (b) =>
          b.bookingNo.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          orders.find((o) => o.id === b.orderId)?.orderNo.toLowerCase().includes(q),
      )
    }
    return rows
  }, [bookings, activeTab, trimsSubType, searchQuery, orders])

  const applyFilters = () => {
    setOrderFilter(draftOrderFilter)
    syncUrl(activeTab, draftOrderFilter || undefined, trimsSubType || undefined)
  }

  const handleTabChange = (value: string) => {
    const tab = value as BookingTab
    setActiveTab(tab)
    syncUrl(tab, orderFilter || undefined, tab === "trims" ? trimsSubType : undefined)
  }

  const handleCreate = async () => {
    if (!newBooking.orderId || !newBooking.bookingNo.trim()) {
      toast.error("Order and booking number are required")
      return
    }
    try {
      setCreating(true)
      const prefix = activeTab === "trims" && trimsSubType ? `${trimsSubType}-` : ""
      await merchandisingService.createMaterialBooking({
        companyId,
        orderId: newBooking.orderId,
        bookingNo: `${prefix}${newBooking.bookingNo.trim()}`,
        bookingType: bookingTypeForTab(activeTab),
      })
      toast.success("Material booking created")
      setCreateOpen(false)
      setNewBooking({ orderId: "", bookingNo: "" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create booking")
    } finally {
      setCreating(false)
    }
  }

  const handleAutoCalculate = async (booking: MaterialBooking) => {
    try {
      await merchandisingService.autoCalculateBooking(booking.id, companyId)
      toast.success("Booking quantities auto-calculated")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Auto-calculate failed")
    }
  }

  const handleFabricDetail = async () => {
    if (!activeBooking || !fabricForm.colorName.trim()) {
      toast.error("Color name is required")
      return
    }
    try {
      await merchandisingService.addFabricBookingDetail(activeBooking.id, {
        companyId,
        colorName: fabricForm.colorName.trim(),
        requiredQty: Number(fabricForm.requiredQty || 0),
        fabricTypeId: fabricForm.fabricTypeId || undefined,
        supplierId: fabricForm.supplierId || undefined,
      })
      toast.success("Fabric detail added")
      setFabricOpen(false)
      setFabricForm({ colorName: "", requiredQty: "", fabricTypeId: "", supplierId: "" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add fabric detail")
    }
  }

  const handleTrimsDetail = async () => {
    if (!activeBooking || !trimsForm.itemName.trim()) {
      toast.error("Item name is required")
      return
    }
    try {
      await merchandisingService.addTrimsBookingDetail(activeBooking.id, {
        companyId,
        itemName: trimsForm.itemName.trim(),
        requiredQty: Number(trimsForm.requiredQty || 0),
        trimsTypeId: trimsForm.trimsTypeId || undefined,
        supplierId: trimsForm.supplierId || undefined,
      })
      toast.success("Trims detail added")
      setTrimsOpen(false)
      setTrimsForm({ itemName: "", requiredQty: "", trimsTypeId: "", supplierId: "" })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add trims detail")
    }
  }

  const handleAllocation = async () => {
    if (!activeBooking || !allocForm.detailId.trim()) {
      toast.error("Detail ID is required")
      return
    }
    try {
      await merchandisingService.addBookingAllocation(activeBooking.id, {
        companyId,
        detailId: allocForm.detailId.trim(),
        detailType: allocForm.detailType,
        allocatedQty: Number(allocForm.allocatedQty || 0),
        allocationDate: allocForm.allocationDate,
      })
      toast.success("Allocation recorded")
      setAllocOpen(false)
      setAllocForm({
        detailId: "",
        detailType: activeTab === "fabric" ? "Fabric" : "Trims",
        allocatedQty: "",
        allocationDate: new Date().toISOString().slice(0, 10),
      })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add allocation")
    }
  }

  const handleExport = async () => {
    try {
      await merchandisingService.exportBookingStatusReport(
        companyId,
        orderFilter || undefined,
      )
      toast.success("Report downloaded")
    } catch (error) {
      console.error(error)
      toast.error("Export failed")
    }
  }

  const orderLabel = (orderId: string) =>
    orders.find((o) => o.id === orderId)?.orderNo ?? orderId.slice(0, 8)

  const openFabricDialog = (booking: MaterialBooking) => {
    setActiveBooking(booking)
    setFabricOpen(true)
  }

  const openTrimsDialog = (booking: MaterialBooking) => {
    setActiveBooking(booking)
    setTrimsOpen(true)
  }

  const openAllocDialog = (booking: MaterialBooking) => {
    setActiveBooking(booking)
    setAllocForm((p) => ({
      ...p,
      detailType: activeTab === "fabric" ? "Fabric" : "Trims",
    }))
    setAllocOpen(true)
  }

  const columns: ColumnDef<MaterialBooking>[] = [
    {
      accessorKey: "bookingNo",
      header: "Booking No",
      cell: ({ row }) => (
        <span className="font-bold text-xs text-primary">{row.original.bookingNo}</span>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => (
        <span className="text-xs font-semibold">{orderLabel(row.original.orderId)}</span>
      ),
    },
    {
      accessorKey: "bookingType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase">
          {row.original.bookingType}
        </Badge>
      ),
    },
    {
      accessorKey: "totalQty",
      header: () => <span className="block text-right">Total Qty</span>,
      cell: ({ row }) => (
        <span className="block text-right text-xs font-bold tabular-nums">
          {row.original.totalQty.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] uppercase font-bold",
            row.original.status === "FullyAllocated" || row.original.status === "Confirmed"
              ? "text-emerald-600 border-emerald-200"
              : "text-amber-600 border-amber-200",
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <IconDotsVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAutoCalculate(row.original)}>
              <IconCalculator className="size-4 mr-2" /> Auto-calculate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {activeTab === "fabric" ? (
              <DropdownMenuItem onClick={() => openFabricDialog(row.original)}>
                <IconPalette className="size-4 mr-2" /> Fabric detail
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => openTrimsDialog(row.original)}>
                <IconScissors className="size-4 mr-2" /> Trims detail
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openAllocDialog(row.original)}>
              <IconArrowsSplit className="size-4 mr-2" /> Allocation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const pendingCount = filteredBookings.filter(
    (b) => b.status === "Draft" || b.status === "Pending",
  ).length

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconStack className="size-6" />}
        title="Material Booking"
        description="Fabric, trims, and accessories scheduling"
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <IconDownload className="size-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4", loading && "animate-spin")} />
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <IconPlus className="size-4" />
                  New Booking
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Material Booking</DialogTitle>
                  <DialogDescription>
                    {bookingTypeForTab(activeTab)} booking
                    {activeTab === "trims" && trimsSubType ? ` — ${trimsSubType}` : ""}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Order</Label>
                    <NativeSelect
                      value={newBooking.orderId}
                      onChange={(e) => setNewBooking((p) => ({ ...p, orderId: e.target.value }))}
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
                    <Label className="text-xs">Booking Number</Label>
                    <Input
                      placeholder="e.g. BKG-2026-001"
                      value={newBooking.bookingNo}
                      onChange={(e) => setNewBooking((p) => ({ ...p, bookingNo: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="fabric" className="font-bold text-xs uppercase">
              Fabric
            </TabsTrigger>
            <TabsTrigger value="trims" className="font-bold text-xs uppercase">
              Trims
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-3 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{filteredBookings.length}</strong> bookings
          </span>
          <span className="text-muted-foreground">
            <strong className="text-amber-600">{pendingCount}</strong> pending
          </span>
        </div>
      </div>

      <MerchFilterCard
        recordCount={filteredBookings.length}
        isLoading={loading}
        onApply={applyFilters}
        onReset={() => {
          setDraftOrderFilter("")
          setOrderFilter("")
          setSearchQuery("")
          setTrimsSubType("")
          syncUrl(activeTab)
        }}
      >
        <MerchFilterField label="Order">
          <NativeSelect
            value={draftOrderFilter}
            onChange={(e) => setDraftOrderFilter(e.target.value)}
          >
            <option value="">All orders</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
        {activeTab === "trims" ? (
          <MerchFilterField label="Trims sub-type">
            <Input
              placeholder="e.g. Zipper, Button"
              value={trimsSubType}
              onChange={(e) => setTrimsSubType(e.target.value)}
            />
          </MerchFilterField>
        ) : null}
        <MerchFilterField label="Search">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Booking no or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading} loadingMessage="Loading bookings...">
        <DataTable columns={columns} data={filteredBookings} />
      </MerchTableCard>

      <Dialog open={fabricOpen} onOpenChange={setFabricOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fabric booking detail</DialogTitle>
            <DialogDescription>{activeBooking?.bookingNo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Color name</Label>
              <Input
                value={fabricForm.colorName}
                onChange={(e) => setFabricForm((p) => ({ ...p, colorName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Required qty</Label>
              <Input
                type="number"
                value={fabricForm.requiredQty}
                onChange={(e) => setFabricForm((p) => ({ ...p, requiredQty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFabricOpen(false)}>Cancel</Button>
            <Button onClick={handleFabricDetail}>Add detail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={trimsOpen} onOpenChange={setTrimsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trims booking detail</DialogTitle>
            <DialogDescription>{activeBooking?.bookingNo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Item name</Label>
              <Input
                value={trimsForm.itemName}
                onChange={(e) => setTrimsForm((p) => ({ ...p, itemName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Required qty</Label>
              <Input
                type="number"
                value={trimsForm.requiredQty}
                onChange={(e) => setTrimsForm((p) => ({ ...p, requiredQty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrimsOpen(false)}>Cancel</Button>
            <Button onClick={handleTrimsDetail}>Add detail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking allocation</DialogTitle>
            <DialogDescription>{activeBooking?.bookingNo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Detail ID</Label>
              <Input
                placeholder="GUID from fabric/trims detail"
                value={allocForm.detailId}
                onChange={(e) => setAllocForm((p) => ({ ...p, detailId: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Detail type</Label>
              <NativeSelect
                value={allocForm.detailType}
                onChange={(e) => setAllocForm((p) => ({ ...p, detailType: e.target.value }))}
              >
                <option value="Fabric">Fabric</option>
                <option value="Trims">Trims</option>
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Allocated qty</Label>
              <Input
                type="number"
                value={allocForm.allocatedQty}
                onChange={(e) => setAllocForm((p) => ({ ...p, allocatedQty: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Allocation date</Label>
              <Input
                type="date"
                value={allocForm.allocationDate}
                onChange={(e) => setAllocForm((p) => ({ ...p, allocationDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocOpen(false)}>Cancel</Button>
            <Button onClick={handleAllocation}>Save allocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
