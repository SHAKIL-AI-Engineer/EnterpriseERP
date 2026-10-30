"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconHierarchy2,
    IconPlus,
    IconRefresh,
    IconTrash,
    IconEdit
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { productionLineService, ProductionLine } from "@/lib/services/production-line"
import { ProductionCompanyGate } from "@/components/production"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProductionLinePage() {
    return (
        <ProductionCompanyGate>
            {(companyId) => <ProductionLineContent companyId={companyId} />}
        </ProductionCompanyGate>
    )
}

function ProductionLineContent({ companyId }: { companyId: string }) {
    const [isLoading, setIsLoading] = React.useState(true)
    const [lines, setLines] = React.useState<ProductionLine[]>([])

    // Modal states
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<ProductionLine | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Delete Alert state (Removed redundant state to avoid double confirm dialog)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await productionLineService.getAll(companyId)
            setLines(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load production lines")
        } finally {
            setIsLoading(false)
        }
    }, [companyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            sl: parseInt(formData.get("sl") as string),
            lineName: formData.get("lineName") as string,
            status: formData.get("status") as string
        }

        try {
            if (editingItem) {
                await productionLineService.update(editingItem.id, data)
                toast.success("Line updated successfully")
            } else {
                await productionLineService.create(data, companyId)
                toast.success("Line created successfully")
            }
            setIsModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save production line")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await productionLineService.delete(id)
            toast.success("Line deleted successfully")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete line")
        }
    }

    const columns: ColumnDef<ProductionLine>[] = [
        {
            accessorKey: "sl",
            header: "SL",
        },
        {
            accessorKey: "lineName",
            header: "Line Name",
            cell: ({ row }) => <div className="font-medium">{row.getValue("lineName")}</div>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={status === "Active" ? "default" : "secondary"}>
                        {status}
                    </Badge>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6 font-sans bg-muted/30 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <IconHierarchy2 className="text-primary size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Production Lines</h1>
                        <p className="text-sm text-muted-foreground">Manage and configure production lines for manufacturing</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconRefresh size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2 shadow-sm">
                        <IconPlus size={18} /> Add New Line
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <DataTable
                    data={lines}
                    columns={columns}
                    isLoading={isLoading}
                    onEditClick={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                    onDelete={(item: any) => handleDelete(item.id)}
                    showTabs={false}
                    searchKey="lineName"
                />
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Production Line" : "Add Production Line"}</DialogTitle>
                            <DialogDescription>
                                Fill in the details for the production line.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="sl">SL (Serial Number)</Label>
                                <Input
                                    id="sl"
                                    name="sl"
                                    type="number"
                                    defaultValue={editingItem?.sl || lines.length + 1}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lineName">Line Name</Label>
                                <Input
                                    id="lineName"
                                    name="lineName"
                                    placeholder="e.g. Line 01"
                                    defaultValue={editingItem?.lineName}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <NativeSelect name="status" id="status" defaultValue={editingItem?.status || "Active"}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </NativeSelect>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingItem ? "Update Line" : "Create Line"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}
