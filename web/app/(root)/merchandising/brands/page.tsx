"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { IconTag, IconPlus, IconRefresh, IconPencil } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { firstApiErrorMessage } from "@/lib/api-response"
import type { Buyer, MasterDataDto } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

type BrandFilters = { search: string; buyerId: string }

const emptyFilters = (): BrandFilters => ({ search: "", buyerId: "all" })

export default function BrandsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <BrandsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function BrandsPageContent({ companyId }: { companyId: string }) {
  const searchParams = useSearchParams()
  const initialBuyerId = searchParams.get("buyerId") ?? "all"

  const [brands, setBrands] = React.useState<MasterDataDto[]>([])
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draftFilters, setDraftFilters] = React.useState<BrandFilters>({ ...emptyFilters(), buyerId: initialBuyerId })
  const [appliedFilters, setAppliedFilters] = React.useState<BrandFilters>({ ...emptyFilters(), buyerId: initialBuyerId })
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingBrand, setEditingBrand] = React.useState<MasterDataDto | null>(null)
  const [form, setForm] = React.useState({ code: "", name: "", buyerId: "" })
  const [editForm, setEditForm] = React.useState({ name: "", buyerId: "", isActive: true })

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [buyersData, brandsData] = await Promise.all([
        merchandisingService.getBuyers(companyId),
        merchandisingService.getMasterData("brands", companyId),
      ])
      setBuyers(buyersData)
      setBrands(brandsData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load brands")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const buyerName = (buyerId?: string | null) =>
    buyers.find((b) => b.id === buyerId)?.buyerName ?? "—"

  const filteredBrands = React.useMemo(() => {
    return brands.filter((b) => {
      const q = appliedFilters.search.toLowerCase()
      const matchesSearch =
        !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
      const matchesBuyer =
        appliedFilters.buyerId === "all" || b.extra === appliedFilters.buyerId
      return matchesSearch && matchesBuyer
    })
  }, [brands, appliedFilters])

  const applyFilters = () => setAppliedFilters({ ...draftFilters })
  const resetFilters = () => {
    const next = emptyFilters()
    setDraftFilters(next)
    setAppliedFilters(next)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.buyerId) {
      toast.error("Brand name and buyer are required")
      return
    }
    try {
      await merchandisingService.createMasterData("brands", {
        companyId,
        code: form.code.trim() || form.name.trim().slice(0, 8).toUpperCase(),
        name: form.name.trim(),
        extra: form.buyerId,
      })
      toast.success("Brand created")
      setIsCreateOpen(false)
      setForm({ code: "", name: "", buyerId: "" })
      fetchData()
    } catch (error) {
      console.error(error)
      const msg =
        (error as { response?: { data?: unknown } })?.response?.data != null
          ? firstApiErrorMessage((error as { response: { data: unknown } }).response.data)
          : undefined
      toast.error(msg || "Failed to create brand")
    }
  }

  const handleUpdate = async () => {
    if (!editingBrand) return
    if (!editForm.name.trim()) {
      toast.error("Brand name is required")
      return
    }
    try {
      await merchandisingService.updateMasterData("brands", editingBrand.id, {
        name: editForm.name.trim(),
        isActive: editForm.isActive,
        extra: editForm.buyerId || undefined,
      })
      toast.success("Brand updated")
      setIsEditOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update brand")
    }
  }

  const handleDelete = async (brand: MasterDataDto) => {
    try {
      await merchandisingService.deleteMasterData("brands", brand.id)
      toast.success("Brand deleted")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete brand")
    }
  }

  const columns = React.useMemo<ColumnDef<MasterDataDto>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
      { accessorKey: "name", header: "Brand", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
      {
        id: "buyer",
        header: "Buyer",
        cell: ({ row }) => <span className="text-xs">{buyerName(row.original.extra)}</span>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <span className={cn("text-[10px] font-bold uppercase", row.original.isActive ? "text-emerald-600" : "text-muted-foreground")}>
            {row.original.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingBrand(row.original)
              setEditForm({
                name: row.original.name,
                buyerId: row.original.extra ?? "",
                isActive: row.original.isActive,
              })
              setIsEditOpen(true)
            }}
          >
            <IconPencil className="size-4" />
          </Button>
        ),
      },
    ],
    [buyers],
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconTag className="size-6" />}
        title="Brands"
        description="Buyer subdivisions and production branding"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              Add Brand
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={filteredBrands.length}
        isLoading={loading}
        onApply={applyFilters}
        onReset={resetFilters}
      >
        <MerchFilterField label="Search">
          <Input
            placeholder="Name or code"
            value={draftFilters.search}
            onChange={(e) => setDraftFilters((p) => ({ ...p, search: e.target.value }))}
          />
        </MerchFilterField>
        <MerchFilterField label="Buyer">
          <NativeSelect
            value={draftFilters.buyerId}
            onChange={(e) => setDraftFilters((p) => ({ ...p, buyerId: e.target.value }))}
          >
            <option value="all">All buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyerName}
              </option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading}>
        <DataTable
          columns={columns}
          data={filteredBrands}
          searchKey="name"
          showTabs={false}
          onDelete={handleDelete}
        />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
            <DialogDescription>Link a brand to a buyer partner</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Buyer</Label>
              <NativeSelect value={form.buyerId} onChange={(e) => setForm((p) => ({ ...p, buyerId: e.target.value }))}>
                <option value="">Select buyer</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.buyerName}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Code</Label>
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Buyer</Label>
              <NativeSelect value={editForm.buyerId} onChange={(e) => setEditForm((p) => ({ ...p, buyerId: e.target.value }))}>
                <option value="">Select buyer</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.buyerName}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
