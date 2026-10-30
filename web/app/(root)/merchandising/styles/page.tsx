"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconScissors,
  IconPlus,
  IconRefresh,
  IconPencil,
  IconExternalLink,
} from "@tabler/icons-react"
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
import type { Buyer, CreateStyleRequest, GarmentItem, MasterDataDto, Season, Style, UpdateStyleRequest } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

type StyleForm = {
  buyerId: string
  brandId: string
  seasonId: string
  garmentItemId: string
  styleNo: string
  styleName: string
  description: string
  fabricDescription: string
}

const emptyForm = (): StyleForm => ({
  buyerId: "",
  brandId: "",
  seasonId: "",
  garmentItemId: "",
  styleNo: "",
  styleName: "",
  description: "",
  fabricDescription: "",
})

type StyleFilters = { styleNo: string; buyerId: string; styleName: string; fabricDescription: string }

const emptyFilters = (): StyleFilters => ({
  styleNo: "",
  buyerId: "all",
  styleName: "",
  fabricDescription: "",
})

export default function StylesPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <StylesPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function StylesPageContent({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [styles, setStyles] = React.useState<Style[]>([])
  const [buyers, setBuyers] = React.useState<Buyer[]>([])
  const [brands, setBrands] = React.useState<MasterDataDto[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])
  const [garmentItems, setGarmentItems] = React.useState<GarmentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draftFilters, setDraftFilters] = React.useState<StyleFilters>(emptyFilters())
  const [appliedFilters, setAppliedFilters] = React.useState<StyleFilters>(emptyFilters())
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [newStyle, setNewStyle] = React.useState<StyleForm>(emptyForm())
  const [editForm, setEditForm] = React.useState<StyleForm>(emptyForm())
  const [editingStyle, setEditingStyle] = React.useState<Style | null>(null)
  const [seasonDialogOpen, setSeasonDialogOpen] = React.useState(false)
  const [garmentDialogOpen, setGarmentDialogOpen] = React.useState(false)
  const [seasonForm, setSeasonForm] = React.useState({ seasonCode: "", seasonName: "", yearNo: new Date().getFullYear() })
  const [garmentForm, setGarmentForm] = React.useState({ itemCode: "", itemName: "", category: "" })

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [buyersData, stylesData, seasonsData, garmentData] = await Promise.all([
        merchandisingService.getBuyers(companyId),
        merchandisingService.getStyles(companyId),
        merchandisingService.getSeasons(companyId),
        merchandisingService.getGarmentItems(companyId),
      ])
      setBuyers(buyersData)
      setStyles(stylesData)
      setSeasons(seasonsData)
      setGarmentItems(garmentData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load styles")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const loadBrandsForBuyer = async (buyerId: string) => {
    if (!buyerId) {
      setBrands([])
      return
    }
    const brandData = await merchandisingService.getBrandsByBuyer(buyerId, companyId)
    setBrands(brandData)
  }

  const buyerLabel = (buyerId: string) => buyers.find((b) => b.id === buyerId)?.buyerName ?? "—"

  const filteredStyles = React.useMemo(() => {
    return styles.filter((style) => {
      const styleNo = style.styleNo?.toLowerCase() ?? ""
      const styleName = style.styleName?.toLowerCase() ?? ""
      const fabric = style.fabricDescription?.toLowerCase() ?? ""
      return (
        (!appliedFilters.styleNo || styleNo.includes(appliedFilters.styleNo.toLowerCase())) &&
        (appliedFilters.buyerId === "all" || style.buyerId === appliedFilters.buyerId) &&
        (!appliedFilters.styleName || styleName.includes(appliedFilters.styleName.toLowerCase())) &&
        (!appliedFilters.fabricDescription || fabric.includes(appliedFilters.fabricDescription.toLowerCase()))
      )
    })
  }, [styles, appliedFilters])

  const handleCreate = async () => {
    if (!newStyle.buyerId || !newStyle.styleNo.trim()) {
      toast.error("Buyer and style number are required")
      return
    }
    try {
      const payload: CreateStyleRequest = {
        companyId,
        buyerId: newStyle.buyerId,
        brandId: newStyle.brandId || undefined,
        seasonId: newStyle.seasonId || undefined,
        garmentItemId: newStyle.garmentItemId || undefined,
        styleNo: newStyle.styleNo.trim(),
        styleName: newStyle.styleName.trim() || undefined,
        description: newStyle.description.trim() || undefined,
        fabricDescription: newStyle.fabricDescription.trim() || undefined,
      }
      const created = await merchandisingService.createStyle(payload)
      toast.success("Style created")
      setIsCreateOpen(false)
      setNewStyle(emptyForm())
      fetchData()
      router.push(`/merchandising/styles/${created.id}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create style")
    }
  }

  const openEdit = async (style: Style) => {
    setEditingStyle(style)
    setEditForm({
      buyerId: style.buyerId,
      brandId: style.brandId ?? "",
      seasonId: style.seasonId ?? "",
      garmentItemId: style.garmentItemId ?? "",
      styleNo: style.styleNo,
      styleName: style.styleName ?? "",
      description: style.description ?? "",
      fabricDescription: style.fabricDescription ?? "",
    })
    await loadBrandsForBuyer(style.buyerId)
    setIsEditOpen(true)
  }

  const handleCreateSeason = async () => {
    if (!seasonForm.seasonCode.trim() || !seasonForm.seasonName.trim()) {
      toast.error("Season code and name are required")
      return
    }
    try {
      await merchandisingService.createSeason({
        companyId,
        seasonCode: seasonForm.seasonCode.trim(),
        seasonName: seasonForm.seasonName.trim(),
        yearNo: seasonForm.yearNo,
      })
      toast.success("Season added")
      setSeasonDialogOpen(false)
      setSeasonForm({ seasonCode: "", seasonName: "", yearNo: new Date().getFullYear() })
      const seasonsData = await merchandisingService.getSeasons(companyId)
      setSeasons(seasonsData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to add season")
    }
  }

  const handleCreateGarment = async () => {
    if (!garmentForm.itemCode.trim() || !garmentForm.itemName.trim()) {
      toast.error("Garment code and name are required")
      return
    }
    try {
      await merchandisingService.createGarmentItem({
        companyId,
        itemCode: garmentForm.itemCode.trim(),
        itemName: garmentForm.itemName.trim(),
        category: garmentForm.category.trim() || undefined,
      })
      toast.success("Garment type added")
      setGarmentDialogOpen(false)
      setGarmentForm({ itemCode: "", itemName: "", category: "" })
      const garmentData = await merchandisingService.getGarmentItems(companyId)
      setGarmentItems(garmentData)
    } catch (error) {
      console.error(error)
      toast.error("Failed to add garment type")
    }
  }

  const handleUpdate = async () => {
    if (!editingStyle) return
    try {
      const payload: UpdateStyleRequest = {
        brandId: editForm.brandId || undefined,
        seasonId: editForm.seasonId || undefined,
        garmentItemId: editForm.garmentItemId || undefined,
        styleName: editForm.styleName.trim() || undefined,
        description: editForm.description.trim() || undefined,
        fabricDescription: editForm.fabricDescription.trim() || undefined,
      }
      await merchandisingService.updateStyle(editingStyle.id, payload)
      toast.success("Style updated")
      setIsEditOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update style")
    }
  }

  const styleFormFields = (
    form: StyleForm,
    setForm: React.Dispatch<React.SetStateAction<StyleForm>>,
    opts?: { lockStyleNo?: boolean; lockBuyer?: boolean },
  ) => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Buyer</Label>
          <NativeSelect
            value={form.buyerId}
            disabled={opts?.lockBuyer}
            onChange={async (e) => {
              const buyerId = e.target.value
              setForm((p) => ({ ...p, buyerId, brandId: "" }))
              await loadBrandsForBuyer(buyerId)
            }}
          >
            <option value="">Select buyer</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>{b.buyerName}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Brand</Label>
          <NativeSelect
            value={form.brandId}
            disabled={!form.buyerId}
            onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value }))}
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Season</Label>
          <NativeSelect
            value={form.seasonId}
            onChange={(e) => setForm((p) => ({ ...p, seasonId: e.target.value }))}
          >
            <option value="">Optional</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.seasonName}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Garment type</Label>
          <NativeSelect
            value={form.garmentItemId}
            onChange={(e) => setForm((p) => ({ ...p, garmentItemId: e.target.value }))}
          >
            <option value="">Optional</option>
            {garmentItems.map((g) => (
              <option key={g.id} value={g.id}>{g.itemName}</option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Style No</Label>
          <Input value={form.styleNo} readOnly={opts?.lockStyleNo} onChange={(e) => setForm((p) => ({ ...p, styleNo: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Style Name</Label>
          <Input value={form.styleName} onChange={(e) => setForm((p) => ({ ...p, styleName: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Fabric</Label>
        <Input value={form.fabricDescription} onChange={(e) => setForm((p) => ({ ...p, fabricDescription: e.target.value }))} />
      </div>
    </div>
  )

  const columns = React.useMemo<ColumnDef<Style>[]>(
    () => [
      {
        accessorKey: "styleNo",
        header: "Style",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link href={`/merchandising/styles/${row.original.id}`} className="font-bold text-erp-accent hover:underline">
              {row.original.styleNo}
            </Link>
            <span className="text-[10px] text-muted-foreground">{row.original.styleName || "—"}</span>
          </div>
        ),
      },
      {
        id: "buyer",
        header: "Buyer",
        cell: ({ row }) => <span className="text-xs">{buyerLabel(row.original.buyerId)}</span>,
      },
      {
        accessorKey: "fabricDescription",
        header: "Fabric",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
            {row.original.fabricDescription || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/merchandising/styles/${row.original.id}`}>
                <IconExternalLink className="size-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row.original)}>
              <IconPencil className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [buyers],
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconScissors className="size-6" />}
        title="Style Directory"
        description="Product technical specifications and BOM"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSeasonDialogOpen(true)}>
              Add Season
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGarmentDialogOpen(true)}>
              Add Garment Type
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              New Style
            </Button>
          </>
        }
      />

      <MerchFilterCard
        recordCount={filteredStyles.length}
        isLoading={loading}
        onApply={() => setAppliedFilters({ ...draftFilters })}
        onReset={() => {
          const next = emptyFilters()
          setDraftFilters(next)
          setAppliedFilters(next)
        }}
      >
        <MerchFilterField label="Style No">
          <Input value={draftFilters.styleNo} onChange={(e) => setDraftFilters((p) => ({ ...p, styleNo: e.target.value }))} />
        </MerchFilterField>
        <MerchFilterField label="Buyer">
          <NativeSelect value={draftFilters.buyerId} onChange={(e) => setDraftFilters((p) => ({ ...p, buyerId: e.target.value }))}>
            <option value="all">All buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>{b.buyerName}</option>
            ))}
          </NativeSelect>
        </MerchFilterField>
        <MerchFilterField label="Style Name">
          <Input value={draftFilters.styleName} onChange={(e) => setDraftFilters((p) => ({ ...p, styleName: e.target.value }))} />
        </MerchFilterField>
        <MerchFilterField label="Fabric">
          <Input value={draftFilters.fabricDescription} onChange={(e) => setDraftFilters((p) => ({ ...p, fabricDescription: e.target.value }))} />
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading}>
        <DataTable columns={columns} data={filteredStyles} searchKey="styleNo" showTabs={false} showActions={false} />
      </MerchTableCard>

      <Dialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Season</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Season Code</Label>
              <Input value={seasonForm.seasonCode} onChange={(e) => setSeasonForm((p) => ({ ...p, seasonCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Season Name</Label>
              <Input value={seasonForm.seasonName} onChange={(e) => setSeasonForm((p) => ({ ...p, seasonName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Year</Label>
              <Input type="number" value={seasonForm.yearNo} onChange={(e) => setSeasonForm((p) => ({ ...p, yearNo: parseInt(e.target.value, 10) || new Date().getFullYear() }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSeason}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={garmentDialogOpen} onOpenChange={setGarmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Garment Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Item Code</Label>
              <Input value={garmentForm.itemCode} onChange={(e) => setGarmentForm((p) => ({ ...p, itemCode: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Item Name</Label>
              <Input value={garmentForm.itemName} onChange={(e) => setGarmentForm((p) => ({ ...p, itemName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Input value={garmentForm.category} onChange={(e) => setGarmentForm((p) => ({ ...p, category: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGarmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGarment}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Register Style</DialogTitle>
          </DialogHeader>
          {styleFormFields(newStyle, setNewStyle)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Style</DialogTitle>
          </DialogHeader>
          {styleFormFields(editForm, setEditForm, { lockStyleNo: true, lockBuyer: true })}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
