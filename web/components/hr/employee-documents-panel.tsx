"use client"

import * as React from "react"
import { IconLoader, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { employeeFormFieldsCn } from "@/components/hr/employee-form-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { employeeService } from "@/lib/services/employee"
import type { HrEmployeeDocument } from "@/lib/services/hr-types"
import { toast } from "sonner"

type Props = {
  employeeEntityId: string
  documents: HrEmployeeDocument[]
  onChanged: () => void
}

export function EmployeeDocumentsPanel({
  employeeEntityId,
  documents,
  onChanged,
}: Props) {
  const [docType, setDocType] = React.useState("")
  const [fileUrl, setFileUrl] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const handleAdd = async () => {
    if (!docType.trim() || !fileUrl.trim()) {
      toast.error("Document type and file URL are required")
      return
    }
    setBusy(true)
    try {
      await employeeService.addDocument(employeeEntityId, {
        documentType: docType.trim(),
        fileUrl: fileUrl.trim(),
      })
      setDocType("")
      setFileUrl("")
      toast.success("Document added")
      onChanged()
    } catch {
      toast.error("Failed to add document")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      await employeeService.deleteDocument(id)
      toast.success("Document removed")
      onChanged()
    } catch {
      toast.error("Failed to delete document")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={employeeFormFieldsCn("space-y-6")}>
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="grid gap-2">
          <Label>Document type</Label>
          <Input
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            placeholder="e.g. NID, Contract"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label>File URL</Label>
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button type="button" onClick={handleAdd} disabled={busy} className="w-fit gap-2">
          {busy ? <IconLoader className="size-4 animate-spin" /> : <IconPlus className="size-4" />}
          Add document
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents on file.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-4 p-3 text-sm"
            >
              <div>
                <p className="font-medium">{d.documentType}</p>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-xs hover:underline break-all"
                >
                  {d.fileUrl}
                </a>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(d.uploadedAt).toLocaleString()}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                onClick={() => handleDelete(d.id)}
              >
                <IconTrash className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
