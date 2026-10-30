"use client"

import * as React from "react"
import { IconDatabase, IconPlus, IconRefresh } from "@tabler/icons-react"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { MasterDataDto, MasterDataResource } from "@/lib/types/merchandising"

type RowForm = { id?: string; name: string; code: string; extra: string; isActive: boolean }

const emptyForm = (): RowForm => ({ name: "", code: "", extra: "", isActive: true })

export type MasterResourceMeta = {
  resource: MasterDataResource
  title: string
  description: string
  showExtra?: boolean
  extraLabel?: string
}

export function MerchMasterResourcePage({
  companyId,
  meta,
}: {
  companyId: string
  meta: MasterResourceMeta
}) {
  const [rows, setRows] = React.useState<MasterDataDto[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [form, setForm] = React.useState<RowForm>(emptyForm())

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await merchandisingService.getMasterData(meta.resource, companyId)
      setRows(data)
    } catch (error) {
      console.error(error)
      toast.error(`Failed to load ${meta.title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }, [companyId, meta.resource, meta.title])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    try {
      await merchandisingService.createMasterData(meta.resource, {
        companyId,
        code: form.code.trim() || form.name.trim().slice(0, 12).toUpperCase(),
        name: form.name.trim(),
        extra: form.extra.trim() || undefined,
      })
      toast.success("Record added")
      setIsCreateOpen(false)
      setForm(emptyForm())
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add record")
    }
  }

  const handleUpdate = async () => {
    if (!form.id || !form.name.trim()) {
      toast.error("Name is required")
      return
    }
    try {
      await merchandisingService.updateMasterData(meta.resource, form.id, {
        name: form.name.trim(),
        extra: form.extra.trim() || undefined,
        isActive: form.isActive,
      })
      toast.success("Record updated")
      setIsEditOpen(false)
      setForm(emptyForm())
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update record")
    }
  }

  const handleDelete = async (row: MasterDataDto) => {
    try {
      await merchandisingService.deleteMasterData(meta.resource, row.id)
      toast.success("Record deleted")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete record")
    }
  }

  const openEdit = async (row: MasterDataDto) => {
    try {
      const detail = await merchandisingService.getMasterDataById(meta.resource, row.id, companyId)
      setForm({
        id: detail.id,
        name: detail.name,
        code: detail.code,
        extra: detail.extra ?? "",
        isActive: detail.isActive,
      })
      setIsEditOpen(true)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load record")
    }
  }

  const columns = React.useMemo<ColumnDef<MasterDataDto>[]>(
    () => [
      { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
      { accessorKey: "name", header: "Name" },
      ...(meta.showExtra
        ? [
            {
              accessorKey: "extra",
              header: meta.extraLabel ?? "Extra",
              cell: ({ row }: { row: { original: MasterDataDto } }) => (
                <span className="text-xs text-muted-foreground">{row.original.extra ?? "—"}</span>
              ),
            } as ColumnDef<MasterDataDto>,
          ]
        : []),
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.isActive ? "Active" : "Inactive"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => openEdit(row.original)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(row.original)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta.showExtra, meta.extraLabel],
  )

  const formFields = (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label className="text-xs">Name</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Code</Label>
        <Input
          value={form.code}
          disabled={!!form.id}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
          placeholder="Auto-generated if empty"
        />
      </div>
      {meta.showExtra ? (
        <div className="space-y-2">
          <Label className="text-xs">{meta.extraLabel ?? "Extra"}</Label>
          <Input value={form.extra} onChange={(e) => setForm((p) => ({ ...p, extra: e.target.value }))} />
        </div>
      ) : null}
      {form.id ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id="active"
            checked={form.isActive}
            onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v === true }))}
          />
          <Label htmlFor="active" className="text-xs">
            Active
          </Label>
        </div>
      ) : null}
    </div>
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconDatabase className="size-6" />}
        title={meta.title}
        description={meta.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <IconRefresh className="size-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => { setForm(emptyForm()); setIsCreateOpen(true) }}>
              <IconPlus className="size-4 mr-2" />
              Add
            </Button>
          </>
        }
      />
      <MerchTableCard isLoading={loading}>
        <DataTable columns={columns} data={rows} />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {meta.title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {meta.title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
