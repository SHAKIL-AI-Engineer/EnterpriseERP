"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { IconArrowLeft, IconPlus, IconRefresh, IconScissors } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  MerchTableCard,
  MerchEmptyState,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Style, StyleBomItem, StyleVersion } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function StyleDetailPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <StyleDetailContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function StyleDetailContent({ companyId }: { companyId: string }) {
  const params = useParams()
  const styleId = params.id as string

  const [style, setStyle] = React.useState<Style | null>(null)
  const [versions, setVersions] = React.useState<StyleVersion[]>([])
  const [bomItems, setBomItems] = React.useState<StyleBomItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [versionOpen, setVersionOpen] = React.useState(false)
  const [bomOpen, setBomOpen] = React.useState(false)
  const [versionForm, setVersionForm] = React.useState({
    versionNo: 1,
    description: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
  })
  const [bomForm, setBomForm] = React.useState({
    itemType: "Fabric",
    itemCode: "",
    itemName: "",
    unitName: "MTR",
    consumption: 0,
    wastagePercent: 0,
    unitPrice: 0,
  })

  const loadAll = React.useCallback(async () => {
    if (!styleId) return
    try {
      setLoading(true)
      const [styleRow, versionRows, bomRows] = await Promise.all([
        merchandisingService.getStyleById(styleId, companyId),
        merchandisingService.getStyleVersions(styleId),
        merchandisingService.getStyleBomItems(styleId),
      ])
      setStyle(styleRow)
      setVersions(versionRows)
      setBomItems(bomRows)
      setVersionForm((p) => ({
        ...p,
        versionNo: (versionRows.reduce((max, v) => Math.max(max, v.versionNo), 0) || 0) + 1,
      }))
    } catch (error) {
      console.error(error)
      toast.error("Failed to load style")
    } finally {
      setLoading(false)
    }
  }, [companyId, styleId])

  React.useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleCreateVersion = async () => {
    if (!style) return
    try {
      await merchandisingService.createStyleVersion({
        companyId,
        styleId: style.id,
        versionNo: versionForm.versionNo,
        description: versionForm.description || undefined,
        effectiveDate: versionForm.effectiveDate,
      })
      toast.success("Version created")
      setVersionOpen(false)
      loadAll()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create version")
    }
  }

  const handleCreateBom = async () => {
    if (!style || !bomForm.itemName.trim()) {
      toast.error("Item name is required")
      return
    }
    try {
      await merchandisingService.createStyleBomItem({
        companyId,
        styleId: style.id,
        itemType: bomForm.itemType,
        itemCode: bomForm.itemCode || undefined,
        itemName: bomForm.itemName.trim(),
        unitName: bomForm.unitName,
        consumption: bomForm.consumption,
        wastagePercent: bomForm.wastagePercent,
        unitPrice: bomForm.unitPrice,
      })
      toast.success("BOM item added")
      setBomOpen(false)
      setBomForm({
        itemType: "Fabric",
        itemCode: "",
        itemName: "",
        unitName: "MTR",
        consumption: 0,
        wastagePercent: 0,
        unitPrice: 0,
      })
      loadAll()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add BOM item")
    }
  }

  const versionColumns = React.useMemo<ColumnDef<StyleVersion>[]>(
    () => [
      { accessorKey: "versionNo", header: "Ver", cell: ({ row }) => <span className="font-mono font-bold">v{row.original.versionNo}</span> },
      {
        accessorKey: "effectiveDate",
        header: "Effective",
        cell: ({ row }) => format(new Date(row.original.effectiveDate), "MMM dd, yyyy"),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <span className="text-xs">{row.original.description || "—"}</span>,
      },
    ],
    [],
  )

  const bomColumns = React.useMemo<ColumnDef<StyleBomItem>[]>(
    () => [
      { accessorKey: "itemType", header: "Type" },
      { accessorKey: "itemName", header: "Item", cell: ({ row }) => <span className="font-medium">{row.original.itemName}</span> },
      { accessorKey: "consumption", header: "Cons.", cell: ({ row }) => <span className="text-xs font-mono">{row.original.consumption}</span> },
      { accessorKey: "unitName", header: "Unit" },
      {
        accessorKey: "unitPrice",
        header: "Price",
        cell: ({ row }) => <span className="text-xs font-mono">{row.original.unitPrice.toFixed(2)}</span>,
      },
    ],
    [],
  )

  if (!loading && !style) {
    return (
      <MerchPageShell>
        <MerchEmptyState variant="empty" title="Style not found" description="This style may have been removed." />
      </MerchPageShell>
    )
  }

  return (
    <MerchPageShell>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/merchandising/styles">
            <IconArrowLeft className="size-4 mr-2" />
            Back to styles
          </Link>
        </Button>
      </div>

      <MerchPageHeader
        icon={<IconScissors className="size-6" />}
        title={style?.styleNo ?? "Style"}
        description={style?.styleName ?? "Loading style profile..."}
        actions={
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {style ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{style.fabricDescription || "No fabric"}</Badge>
          {style.description ? <Badge variant="secondary">{style.description}</Badge> : null}
        </div>
      ) : null}

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
          <TabsTrigger value="bom">Style BOM ({bomItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setVersionOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              New Version
            </Button>
          </div>
          <MerchTableCard isLoading={loading}>
            <DataTable columns={versionColumns} data={versions} showTabs={false} showActions={false} />
          </MerchTableCard>
        </TabsContent>

        <TabsContent value="bom" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setBomOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              Add BOM Item
            </Button>
          </div>
          <MerchTableCard isLoading={loading}>
            <DataTable columns={bomColumns} data={bomItems} showTabs={false} showActions={false} />
          </MerchTableCard>
        </TabsContent>
      </Tabs>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Style Version</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Version No</Label>
              <Input
                type="number"
                value={versionForm.versionNo}
                onChange={(e) => setVersionForm((p) => ({ ...p, versionNo: parseInt(e.target.value, 10) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Effective Date</Label>
              <Input
                type="date"
                value={versionForm.effectiveDate}
                onChange={(e) => setVersionForm((p) => ({ ...p, effectiveDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input value={versionForm.description} onChange={(e) => setVersionForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVersion}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bomOpen} onOpenChange={setBomOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add BOM Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <NativeSelect value={bomForm.itemType} onChange={(e) => setBomForm((p) => ({ ...p, itemType: e.target.value }))}>
                  <option value="Fabric">Fabric</option>
                  <option value="Trims">Trims</option>
                  <option value="Accessory">Accessory</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit</Label>
                <Input value={bomForm.unitName} onChange={(e) => setBomForm((p) => ({ ...p, unitName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Item Name</Label>
              <Input value={bomForm.itemName} onChange={(e) => setBomForm((p) => ({ ...p, itemName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Consumption</Label>
                <Input
                  type="number"
                  value={bomForm.consumption}
                  onChange={(e) => setBomForm((p) => ({ ...p, consumption: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Wastage %</Label>
                <Input
                  type="number"
                  value={bomForm.wastagePercent}
                  onChange={(e) => setBomForm((p) => ({ ...p, wastagePercent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit Price</Label>
                <Input
                  type="number"
                  value={bomForm.unitPrice}
                  onChange={(e) => setBomForm((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBomOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBom}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
