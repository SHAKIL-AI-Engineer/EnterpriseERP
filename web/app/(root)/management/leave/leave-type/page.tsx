"use client"

import * as React from "react"
import Link from "next/link"
import { IconSettings, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconBan } from "@tabler/icons-react"
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
import { getHttpErrorMessage } from "@/lib/api-response"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { leaveService } from "@/lib/services/leave"
import { mergeLeaveTypesWithPolicies, type LeaveTypeWithPolicy } from "@/lib/services/leave-helpers"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"

export default function LeaveTypePage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const [isLoading, setIsLoading] = React.useState(false)
    const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeWithPolicy[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingType, setEditingType] = React.useState<LeaveTypeWithPolicy | null>(null)
    const [formData, setFormData] = React.useState({
        name: "",
        code: "",
        yearlyLimit: 0,
        isCarryForward: false,
        description: "",
    })
    const [deleteTarget, setDeleteTarget] = React.useState<LeaveTypeWithPolicy | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const loadLeaveTypes = React.useCallback(async () => {
        if (!selectedCompanyId) return
        setIsLoading(true)
        try {
            const [types, policies] = await Promise.all([
                leaveService.listLeaveTypes(selectedCompanyId),
                leaveService.listLeavePolicies(selectedCompanyId),
            ])
            setLeaveTypes(mergeLeaveTypesWithPolicies(types, policies))
        } catch {
            toast.error("Failed to load leave types")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId])

    const handleFilterChange = React.useCallback((filters: LeaveFilterParams) => {
        setSelectedCompanyId(filters.companyEntityId)
    }, [])

    React.useEffect(() => {
        if (selectedCompanyId) loadLeaveTypes()
    }, [selectedCompanyId, loadLeaveTypes])

    const handleSubmit = async () => {
        if (!selectedCompanyId || !formData.name || !formData.code) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            if (editingType) {
                await leaveService.updateLeaveType(editingType.type.id, {
                    leaveName: formData.name,
                    isPaid: true,
                    isCarryForward: formData.isCarryForward,
                    maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
                    isEncashable: true,
                })
                if (editingType.policy) {
                    await leaveService.updateLeavePolicy(editingType.policy.id, {
                        yearlyEntitlement: formData.yearlyLimit,
                        monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
                        minServiceMonths: 0,
                        requiresApproval: true,
                        allowHalfDay: true,
                        allowNegativeBalance: false,
                        excludeHolidaysFromLeaveDays: true,
                        excludeWeeklyOffFromLeaveDays: true,
                        approvalLevelCount: 1,
                        isActive: true,
                    })
                }
                toast.success("Leave type updated")
            } else {
                const newType = await leaveService.createLeaveType({
                    companyId: selectedCompanyId,
                    leaveCode: formData.code,
                    leaveName: formData.name,
                    isPaid: true,
                    isCarryForward: formData.isCarryForward,
                    maxCarryForwardDays: formData.isCarryForward ? 10 : 0,
                    isEncashable: true,
                })
                await leaveService.createLeavePolicy({
                    companyId: selectedCompanyId,
                    leaveTypeId: newType.id,
                    yearlyEntitlement: formData.yearlyLimit,
                    monthlyAccrual: parseFloat((formData.yearlyLimit / 12).toFixed(2)),
                    minServiceMonths: 0,
                    requiresApproval: true,
                    allowHalfDay: true,
                    allowNegativeBalance: false,
                    excludeHolidaysFromLeaveDays: true,
                    excludeWeeklyOffFromLeaveDays: true,
                    approvalLevelCount: 1,
                })
                toast.success("Leave type created")
            }
            loadLeaveTypes()
            handleCloseSheet()
        } catch {
            toast.error("Failed to save leave type")
        }
    }

    const handleActivate = async (item: LeaveTypeWithPolicy) => {
        try {
            await leaveService.activateLeaveType(item.type.id)
            toast.success("Leave type activated")
            loadLeaveTypes()
        } catch {
            toast.error("Failed to activate")
        }
    }

    const handleDeactivate = async (item: LeaveTypeWithPolicy) => {
        try {
            await leaveService.deactivateLeaveType(item.type.id)
            toast.success("Leave type deactivated")
            loadLeaveTypes()
        } catch {
            toast.error("Failed to deactivate")
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await leaveService.deleteLeaveType(deleteTarget.type.id)
            toast.success("Leave type deleted permanently")
            setDeleteTarget(null)
            loadLeaveTypes()
        } catch (err) {
            toast.error(getHttpErrorMessage(err, "Failed to delete leave type"))
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEdit = (item: LeaveTypeWithPolicy) => {
        setEditingType(item)
        setFormData({
            name: item.type.leaveName,
            code: item.type.leaveCode,
            yearlyLimit: item.yearlyLimit,
            isCarryForward: item.type.isCarryForward,
            description: item.type.leaveName,
        })
        setIsSheetOpen(true)
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setEditingType(null)
        setFormData({ name: "", code: "", yearlyLimit: 0, isCarryForward: false, description: "" })
    }

    const columns: ColumnDef<LeaveTypeWithPolicy>[] = [
        {
            accessorKey: "type.leaveCode",
            header: "Code",
            cell: ({ row }) => <Badge variant="secondary" className="font-mono">{row.original.type.leaveCode}</Badge>,
        },
        {
            id: "leaveName",
            accessorFn: (row) => row.type.leaveName,
            header: "Name",
            cell: ({ row }) => <span className="font-semibold">{row.original.type.leaveName}</span>,
        },
        {
            accessorKey: "yearlyLimit",
            header: "Days/Year",
            cell: ({ row }) => <span className="font-medium">{row.original.yearlyLimit}</span>,
        },
        {
            id: "active",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.type.isActive ? "default" : "outline"}>
                    {row.original.type.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <LeavePermissionGate permission="LEAVE_TYPE_MANAGE">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                                <IconEdit className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            {row.original.type.isActive ? (
                                <DropdownMenuItem onClick={() => handleDeactivate(row.original)}>
                                    <IconBan className="mr-2 size-4" /> Deactivate
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => handleActivate(row.original)}>
                                    Activate
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget(row.original)}
                            >
                                <IconTrash className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                        </LeavePermissionGate>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <IconSettings className="size-7" /> Leave Configuration
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage leave types and policies</p>
                </div>
                <LeavePermissionGate permission="LEAVE_TYPE_MANAGE">
                    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
                    <Button className="gap-2" asChild>
                        <Link href="/management/leave/leave-type/create">
                            <IconPlus className="size-4" /> Create Leave Type
                        </Link>
                    </Button>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{editingType ? "Edit Leave Type" : "Create Leave Type"}</SheetTitle>
                                <SheetDescription>Define entitlement and rules.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 py-6">
                                <div className="space-y-2">
                                    <Label>Leave Name</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Code</Label>
                                        <Input value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))} disabled={!!editingType} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Days / Year</Label>
                                        <Input type="number" value={formData.yearlyLimit} onChange={(e) => setFormData((p) => ({ ...p, yearlyLimit: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={formData.isCarryForward} onCheckedChange={(v) => setFormData((p) => ({ ...p, isCarryForward: !!v }))} />
                                    <Label>Carry forward</Label>
                                </div>
                                <Button className="w-full" onClick={handleSubmit}>{editingType ? "Update" : "Create"}</Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </LeavePermissionGate>
            </div>
            <LeaveAdvancedFilter onFilterChange={handleFilterChange} isLoading={isLoading} />
            <Card>
                <CardHeader>
                    <CardTitle>Leave Types</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={leaveTypes} searchKey="leaveName" isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete leave type?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Permanently remove{" "}
                            <strong>{deleteTarget?.type.leaveName}</strong> ({deleteTarget?.type.leaveCode}).
                            This cannot be undone. If applications or balances exist, deletion will be blocked — use
                            Deactivate instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={(e) => {
                                e.preventDefault()
                                void handleDeleteConfirm()
                            }}
                        >
                            {isDeleting ? "Deleting…" : "Delete permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
