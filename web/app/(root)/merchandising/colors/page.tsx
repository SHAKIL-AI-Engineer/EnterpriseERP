"use client"

import * as React from "react"
import {
  IconPalette,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconX,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { MasterDataDto } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

type ColorForm = { id?: string; name: string; code: string; isActive: boolean }

export default function ColorsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ColorsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function ColorsPageContent({ companyId }: { companyId: string }) {
  const [colors, setColors] = React.useState<MasterDataDto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [currentColor, setCurrentColor] = React.useState<ColorForm>({ name: "", code: "", isActive: true })
  const [importing, setImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const colorInputRef = React.useRef<HTMLInputElement>(null)
  const editColorInputRef = React.useRef<HTMLInputElement>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await merchandisingService.getMasterData("colors", companyId)
      setColors(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load color library")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateColor = async () => {
    if (!currentColor.name.trim()) {
      toast.error("Color name is required")
      return
    }
    try {
      await merchandisingService.createMasterData("colors", {
        companyId,
        code: currentColor.code.trim() || currentColor.name.trim().slice(0, 12).toUpperCase(),
        name: currentColor.name.trim(),
        extra: currentColor.code.trim() || undefined,
      })
      toast.success("Color added")
      setIsCreateOpen(false)
      setCurrentColor({ name: "", code: "", isActive: true })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add color")
    }
  }

  const handleUpdateColor = async () => {
    if (!currentColor.id || !currentColor.name.trim()) {
      toast.error("Color name is required")
      return
    }
    try {
      await merchandisingService.updateMasterData("colors", currentColor.id, {
        name: currentColor.name.trim(),
        isActive: currentColor.isActive,
        extra: currentColor.code.trim() || undefined,
      })
      toast.success("Color updated")
      setIsEditOpen(false)
      setCurrentColor({ name: "", code: "", isActive: true })
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update color")
    }
  }

  const handleDelete = async (color: MasterDataDto) => {
    try {
      await merchandisingService.deleteMasterData("colors", color.id)
      toast.success("Color deleted")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete color")
    }
  }

  const handleBulkDelete = async (selectedRows: MasterDataDto[]) => {
    try {
      const loadingToast = toast.loading(`Deleting ${selectedRows.length} colors...`)
      await Promise.all(selectedRows.map((row) => merchandisingService.deleteMasterData("colors", row.id)))
      toast.dismiss(loadingToast)
      toast.success(`${selectedRows.length} colors deleted`)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Bulk delete failed")
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await merchandisingService.downloadColorImportTemplate()
      toast.success("Template downloaded")
    } catch (error) {
      console.error(error)
      toast.error("Failed to download template")
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImporting(true)
      const result = await merchandisingService.importColors(file, companyId)
      toast.success(`Imported ${result.createdCount} colors (${result.updatedCount} updated)`)
      if (result.errors.length > 0) {
        toast.warning(`${result.skippedCount} rows skipped`)
        console.warn("Color import errors:", result.errors)
      }
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Color import failed")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const columns = React.useMemo<ColumnDef<MasterDataDto>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <span className="text-[10px] font-mono text-muted-foreground">{row.original.code}</span>,
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Color Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: row.original.extra?.startsWith("#") ? row.original.extra : "#eee" }}
            />
            <span className="font-semibold text-foreground">{row.getValue("name")}</span>
          </div>
        ),
      },
      {
        id: "hex",
        header: "Pantone / Hex",
        cell: ({ row }) => (
          <code className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono">{row.original.extra || "N/A"}</code>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              row.original.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-muted text-muted-foreground",
            )}
          >
            {row.original.isActive ? <IconCheck className="size-3" /> : <IconX className="size-3" />}
            {row.original.isActive ? "Active" : "Inactive"}
          </div>
        ),
      },
    ],
    [],
  )

  const colorFields = (form: ColorForm, setForm: (f: ColorForm) => void, pickerRef: React.RefObject<HTMLInputElement | null>) => (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label>Color Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Pantone or Hex</Label>
        <div className="flex gap-2">
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="font-mono" />
          <input
            type="color"
            ref={pickerRef}
            className="hidden"
            value={form.code?.startsWith("#") && form.code.length === 7 ? form.code : "#ffffff"}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <button
            type="button"
            className="size-10 rounded-lg border shrink-0"
            style={{ backgroundColor: form.code || "#eee" }}
            onClick={() => pickerRef.current?.click()}
          />
        </div>
      </div>
      {form.id ? (
        <div className="flex items-center gap-2">
          <Checkbox checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: !!c })} id="colorActive" />
          <Label htmlFor="colorActive">Active for production</Label>
        </div>
      ) : null}
    </div>
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconPalette className="size-6" />}
        title="Color Library"
        description="Fabric colors and Pantone specifications"
        actions={
          <>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <IconDownload className="size-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <IconUpload className={cn("size-4 mr-2", importing && "animate-spin")} />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <IconPlus className="size-4 mr-2" />
              Add Color
            </Button>
          </>
        }
      />

      <MerchTableCard isLoading={loading}>
        <DataTable
          data={colors}
          columns={columns}
          searchKey="name"
          enableSelection
          onEditClick={(row: MasterDataDto) => {
            setCurrentColor({ id: row.id, name: row.name, code: row.extra || "", isActive: row.isActive })
            setIsEditOpen(true)
          }}
          onDelete={handleDelete}
          onDeleteSelected={handleBulkDelete}
        />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Color</DialogTitle>
            <DialogDescription>Register a color for the style library</DialogDescription>
          </DialogHeader>
          {colorFields(currentColor, setCurrentColor, colorInputRef)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateColor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Color</DialogTitle>
          </DialogHeader>
          {colorFields(currentColor, setCurrentColor, editColorInputRef)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateColor}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
