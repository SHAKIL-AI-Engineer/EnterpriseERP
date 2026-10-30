"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconHierarchy2,
    IconPlus,
    IconRefresh,
    IconTrash,
    IconEdit,
    IconLayoutCards,
    IconBuildingFactory2,
    IconTag
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { productionAssignmentService, ProductionAssignment } from "@/lib/services/production-assignment"
import { productionLineService, ProductionLine } from "@/lib/services/production-line"
import { getProductionOrderOptions, type ProductionOrderOption } from "@/lib/services/production/orders"
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

export default function LineAssignPage() {
    return (
        <ProductionCompanyGate>
            {(companyId) => <LineAssignContent companyId={companyId} />}
        </ProductionCompanyGate>
    )
}

function LineAssignContent({ companyId }: { companyId: string }) {
    const [isLoading, setIsLoading] = React.useState(true)
    const [assignments, setAssignments] = React.useState<ProductionAssignment[]>([])
    const [lines, setLines] = React.useState<ProductionLine[]>([])
    const [orders, setOrders] = React.useState<ProductionOrderOption[]>([])

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [editingAssignment, setEditingAssignment] = React.useState<ProductionAssignment | null>(null)

    // Delete Alert state
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [assignData, linesData, orderOpts] = await Promise.all([
                productionAssignmentService.getAll(companyId),
                productionLineService.getAll(companyId),
                getProductionOrderOptions(companyId),
            ])
            setAssignments(assignData)
            setLines(linesData)
            setOrders(orderOpts)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load line assignments")
        } finally {
            setIsLoading(false)
        }
    }, [companyId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)

        const orderId = formData.get("orderId") as string
        const lineId = formData.get("lineId") as string
        const order = orders.find((o) => o.orderId === orderId)

        try {
            await productionAssignmentService.create({
                orderId,
                lineId,
                totalTarget: parseInt(formData.get("totalTarget") as string, 10),
                status: "Active",
                styleNo: order?.orderNo,
                buyerName: order?.buyerName,
            }, companyId)
            toast.success("Assignment created successfully")
            setIsCreateModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to assign line")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingAssignment) return
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)

        const orderId = formData.get("orderId") as string
        const lineId = formData.get("lineId") as string
        const order = orders.find((o) => o.orderId === orderId)

        try {
            await productionAssignmentService.update(editingAssignment.id, {
                orderId,
                lineId,
                totalTarget: parseInt(formData.get("totalTarget") as string, 10),
                status: formData.get("status") as string,
                styleNo: order?.orderNo,
                buyerName: order?.buyerName,
            }, companyId)
            toast.success("Assignment updated successfully")
            setIsUpdateModalOpen(false)
            setEditingAssignment(null)
            fetchData()
        } catch (error) {
            toast.error("Failed to update assignment")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await productionAssignmentService.delete(deleteId)
            toast.success("Assignment removed")
            fetchData()
            setDeleteId(null)
        } catch (error) {
            toast.error("Failed to remove assignment")
        }
    }

    const columns: ColumnDef<ProductionAssignment>[] = [
        {
            accessorKey: "lineName",
            header: "Line Name",
            cell: ({ row }) => <Badge variant="outline" className="font-semibold">{row.getValue("lineName")}</Badge>,
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => <div className="font-medium">{row.getValue("styleNo")}</div>,
        },
        {
            accessorKey: "buyer",
            header: "Buyer",
        },
        {
            accessorKey: "totalTarget",
            header: "Total Target",
            cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("totalTarget")}</div>,
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
        {
            accessorKey: "assignDate",
            header: "Assigned Date",
            cell: ({ row }) => <div>{new Date(row.getValue("assignDate")).toLocaleDateString()}</div>,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setEditingAssignment(row.original)
                            setIsUpdateModalOpen(true)
                        }}
                    >
                        <IconEdit size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(row.original.id)}
                    >
                        <IconTrash size={16} />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 p-6 font-sans bg-muted/30 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <IconHierarchy2 className="text-primary size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Line Assignments</h1>
                        <p className="text-sm text-muted-foreground">Allocate production styles to specific manufacturing lines</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconRefresh size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-sm">
                        <IconPlus size={18} /> New Assignment
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm">
                <DataTable
                    data={assignments}
                    columns={columns}
                    isLoading={isLoading}
                    showTabs={false}
                    searchKey="styleNo"
                />
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleCreate}>
                        <DialogHeader>
                            <DialogTitle>Assign Style to Line</DialogTitle>
                            <DialogDescription>
                                Link a style/order to a production line and set the target.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="orderId">Order</Label>
                                <NativeSelect name="orderId" id="orderId" required>
                                    <option value="">Select order</option>
                                    {orders.map((p) => (
                                        <option key={p.orderId} value={p.orderId}>{p.label}</option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lineId">Production Line</Label>
                                <NativeSelect name="lineId" id="lineId" required>
                                    <option value="">Select Line</option>
                                    {lines.map(l => (
                                        <option key={l.id} value={l.id}>{l.lineName}</option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="totalTarget">Total Target Quantity</Label>
                                <Input
                                    id="totalTarget"
                                    name="totalTarget"
                                    type="number"
                                    placeholder="Enter target quantity"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Assigning..." : "Assign"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Update Modal */}
            <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Update Assignment</DialogTitle>
                            <DialogDescription>
                                Modify existing style assignment or target.
                            </DialogDescription>
                        </DialogHeader>
                        {editingAssignment && (
                            <div className="grid gap-4 py-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-orderId">Order</Label>
                                    <NativeSelect
                                        name="orderId"
                                        id="edit-orderId"
                                        defaultValue={editingAssignment.orderId}
                                        required
                                    >
                                        <option value="">Select order</option>
                                        {orders.map((p) => (
                                            <option key={p.orderId} value={p.orderId}>{p.label}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-lineId">Production Line</Label>
                                    <NativeSelect
                                        name="lineId"
                                        id="edit-lineId"
                                        defaultValue={editingAssignment.lineId}
                                        required
                                    >
                                        <option value="">Select Line</option>
                                        {lines.map(l => (
                                            <option key={l.id} value={l.id}>{l.lineName}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-totalTarget">Total Target Quantity</Label>
                                    <Input
                                        id="edit-totalTarget"
                                        name="totalTarget"
                                        type="number"
                                        defaultValue={editingAssignment.totalTarget}
                                        placeholder="Enter target quantity"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <NativeSelect
                                        name="status"
                                        id="edit-status"
                                        defaultValue={editingAssignment.status}
                                        required
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Completed">Completed</option>
                                    </NativeSelect>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => {
                                setIsUpdateModalOpen(false)
                                setEditingAssignment(null)
                            }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Updating..." : "Update"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the assignment. Daily production records for this assignment may become inaccessible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
