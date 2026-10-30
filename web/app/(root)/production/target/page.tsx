"use client"

import * as React from "react"
import {
    IconTarget,
    IconCalendar,
    IconPlus,
    IconRefresh,
    IconTrash,
    IconEdit,
    IconTrendingUp,
    IconDeviceFloppy
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { productionTargetService, ProductionTarget } from "@/lib/services/production-target"
import { productionAssignmentService, ProductionAssignment } from "@/lib/services/production-assignment"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export default function TargetPage() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [targets, setTargets] = React.useState<ProductionTarget[]>([])
    const [assignments, setAssignments] = React.useState<ProductionAssignment[]>([])
    const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])

    // Modal states
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [editingItem, setEditingItem] = React.useState<ProductionTarget | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Delete Alert state (Removed redundant state to avoid double confirm dialog)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [targetData, assignData] = await Promise.all([
                productionTargetService.getAll(selectedDate),
                productionAssignmentService.getAll()
            ])
            setTargets(targetData)
            setAssignments(assignData.filter(a => a.status === "Active"))
        } catch (error) {
            console.error(error)
            toast.error("Failed to load targets")
        } finally {
            setIsLoading(false)
        }
    }, [selectedDate])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            assignmentId: formData.get("assignmentId") as string,
            targetDate: selectedDate,
            dailyTarget: parseInt(formData.get("dailyTarget") as string),
            hourlyTarget: parseInt(formData.get("hourlyTarget") as string),
            remarks: formData.get("remarks") as string || ""
        }

        try {
            await productionTargetService.save(data)
            toast.success("Target saved successfully")
            setIsModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save target")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await productionTargetService.delete(id)
            toast.success("Target deleted successfully")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete target")
        }
    }

    const columns: ColumnDef<ProductionTarget>[] = [
        {
            accessorKey: "lineName",
            header: "Line Name",
            cell: ({ row }) => <Badge variant="secondary" className="font-bold">{row.getValue("lineName")}</Badge>,
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("styleNo")}</div>,
        },
        {
            accessorKey: "buyer",
            header: "Buyer",
        },
        {
            accessorKey: "dailyTarget",
            header: "Daily Target",
            cell: ({ row }) => <div className="font-black text-lg">{row.getValue("dailyTarget")}</div>,
        },
        {
            accessorKey: "hourlyTarget",
            header: "Hourly Target",
            cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("hourlyTarget")}</div>,
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6 font-sans bg-muted/30 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <IconTarget className="text-primary size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Production Target Planning</h1>
                        <p className="text-sm text-muted-foreground">Set daily and hourly production goals for each line</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border">
                        <IconCalendar size={18} className="text-muted-foreground" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-sm focus:ring-0 font-medium text-foreground"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconRefresh size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="gap-2 shadow-sm">
                        <IconPlus size={18} /> Set New Target
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <Card className="bg-card border shadow-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <IconTrendingUp size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Total Planned Target</span>
                        </div>
                        <div className="text-3xl font-black">
                            {targets.reduce((sum, t) => sum + t.dailyTarget, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                <DataTable
                    data={targets}
                    columns={columns}
                    isLoading={isLoading}
                    onEditClick={(item) => { setEditingItem(item); setIsModalOpen(true); }}
                    onDelete={(item: any) => handleDelete(item.id)}
                    showTabs={false}
                    searchKey="styleNo"
                />
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <IconDeviceFloppy className="text-primary" />
                                {editingItem ? "Edit Target" : "Set Daily Target"}
                            </DialogTitle>
                            <DialogDescription>
                                Planning targets for {selectedDate}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="assignmentId">Active Assignment (Style & Line)</Label>
                                <NativeSelect
                                    name="assignmentId"
                                    id="assignmentId"
                                    defaultValue={editingItem?.assignmentId}
                                    required
                                >
                                    <option value="">Select Assignment</option>
                                    {assignments.map(a => (
                                        <option key={a.id} value={a.id}>{a.lineName} - {a.styleNo} ({a.buyer})</option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dailyTarget">Daily Target</Label>
                                    <Input
                                        id="dailyTarget"
                                        name="dailyTarget"
                                        type="number"
                                        placeholder="0"
                                        defaultValue={editingItem?.dailyTarget}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="hourlyTarget">Hourly Target</Label>
                                    <Input
                                        id="hourlyTarget"
                                        name="hourlyTarget"
                                        type="number"
                                        placeholder="0"
                                        defaultValue={editingItem?.hourlyTarget}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="remarks">Remarks (Optional)</Label>
                                <Input
                                    id="remarks"
                                    name="remarks"
                                    placeholder="e.g. Special order requirements"
                                    defaultValue={editingItem?.remarks}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingItem ? "Update Target" : "Save Target"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}
