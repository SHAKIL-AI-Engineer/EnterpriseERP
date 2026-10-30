"use client"

import * as React from "react"
import { IconFileText, IconPlus, IconRefresh, IconExternalLink } from "@tabler/icons-react"
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
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchFilterField,
  MerchFilterCard,
  MerchTableCard,
} from "@/components/merchandising"
import { merchandisingService } from "@/lib/services/merchandising"
import type { Style, StyleDocument } from "@/lib/types/merchandising"
import { cn } from "@/lib/utils"

export default function TechPacksPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <TechPacksPageContent companyId={companyId} />}
    </MerchCompanyGate>
  )
}

function TechPacksPageContent({ companyId }: { companyId: string }) {
  const [styles, setStyles] = React.useState<Style[]>([])
  const [selectedStyleId, setSelectedStyleId] = React.useState("")
  const [documents, setDocuments] = React.useState<StyleDocument[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [docForm, setDocForm] = React.useState({
    documentType: "TechPack",
    fileName: "",
    fileUrl: "",
    version: "",
    remarks: "",
  })

  const fetchStyles = React.useCallback(async () => {
    try {
      const styleRows = await merchandisingService.getStyles(companyId)
      setStyles(styleRows)
      setSelectedStyleId((current) => current || styleRows[0]?.id || "")
    } catch (error) {
      console.error(error)
      toast.error("Failed to load styles")
    }
  }, [companyId])

  const fetchDocuments = React.useCallback(async () => {
    if (!selectedStyleId) {
      setDocuments([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const docs = await merchandisingService.getStyleDocuments(selectedStyleId, companyId)
      setDocuments(
        docs.filter(
          (d) =>
            d.documentType.toLowerCase().includes("tech") ||
            d.documentType === "TechPack",
        ),
      )
    } catch (error) {
      console.error(error)
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [companyId, selectedStyleId])

  React.useEffect(() => {
    fetchStyles()
  }, [fetchStyles])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const selectedStyle = styles.find((s) => s.id === selectedStyleId)

  const handleCreate = async () => {
    if (!selectedStyleId || !docForm.fileName.trim() || !docForm.fileUrl.trim()) {
      toast.error("Style, file name, and URL are required")
      return
    }
    try {
      await merchandisingService.createStyleDocument(selectedStyleId, {
        companyId,
        documentType: docForm.documentType,
        fileName: docForm.fileName.trim(),
        fileUrl: docForm.fileUrl.trim(),
        version: docForm.version || undefined,
        remarks: docForm.remarks || undefined,
      })
      toast.success("Tech pack document created")
      setIsCreateOpen(false)
      setDocForm({ documentType: "TechPack", fileName: "", fileUrl: "", version: "", remarks: "" })
      fetchDocuments()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create document")
    }
  }

  const columns = React.useMemo<ColumnDef<StyleDocument>[]>(
    () => [
      {
        accessorKey: "fileName",
        header: "Document",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.fileName}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{selectedStyle?.styleNo}</span>
          </div>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px] font-bold">
            {row.original.documentType}
          </Badge>
        ),
      },
      { accessorKey: "version", header: "Version", cell: ({ row }) => <span className="text-xs">{row.original.version ?? "—"}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={row.original.fileUrl} target="_blank" rel="noreferrer">
              <IconExternalLink className="size-4 text-erp-accent" />
            </a>
          </Button>
        ),
      },
    ],
    [selectedStyle],
  )

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileText className="size-6" />}
        title="Tech Packs"
        description="Style technical documents and revisions"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading}>
              <IconRefresh className={cn("size-4 mr-2", loading && "animate-spin")} />
              Sync
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)} disabled={!selectedStyleId}>
              <IconPlus className="size-4 mr-2" />
              Upload Record
            </Button>
          </>
        }
      />

      <MerchFilterCard recordCount={documents.length}>
        <MerchFilterField label="Style" className="sm:col-span-2">
          <NativeSelect value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)}>
            <option value="">Select style</option>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>{s.styleNo}</option>
            ))}
          </NativeSelect>
        </MerchFilterField>
      </MerchFilterCard>

      <MerchTableCard isLoading={loading}>
        <DataTable columns={columns} data={documents} searchKey="fileName" showTabs={false} showActions={false} />
      </MerchTableCard>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tech Pack</DialogTitle>
            <DialogDescription>Register a document URL for {selectedStyle?.styleNo}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">File Name</Label>
              <Input value={docForm.fileName} onChange={(e) => setDocForm((p) => ({ ...p, fileName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">File URL</Label>
              <Input value={docForm.fileUrl} onChange={(e) => setDocForm((p) => ({ ...p, fileUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Version</Label>
                <Input value={docForm.version} onChange={(e) => setDocForm((p) => ({ ...p, version: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Input value={docForm.documentType} onChange={(e) => setDocForm((p) => ({ ...p, documentType: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Remarks</Label>
              <Input value={docForm.remarks} onChange={(e) => setDocForm((p) => ({ ...p, remarks: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MerchPageShell>
  )
}
