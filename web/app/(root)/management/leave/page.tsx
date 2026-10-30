"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import {
    IconCalendarEvent,
    IconPlus,
    IconCheck,
    IconX,
    IconEye,
    IconLoader,
    IconHistory,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconFileDownload,
    IconFileTypeXls,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { leaveService } from "@/lib/services/leave"
import {
    mapLeaveApplicationListItems,
    exportApplicationsCsv,
    type LeaveApplicationView,
    type LeaveTypeWithPolicy,
    mergeLeaveTypesWithPolicies,
} from "@/lib/services/leave-helpers"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { useAuth } from "@/components/providers/auth-provider"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { Badge } from "@/components/ui/badge"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import {
    EmployeeLeavePicker,
    type EmployeeLeaveSelection,
} from "@/components/leave/employee-leave-picker"

export default function LeaveManagementPage() {
    const router = useRouter()
    const { user } = useAuth()

    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const [listFilters, setListFilters] = React.useState<LeaveFilterParams>({ status: "all" })
    const [isLoading, setIsLoading] = React.useState(false)
    const [isActionLoading, setIsActionLoading] = React.useState<string | null>(null)
    const [applications, setApplications] = React.useState<LeaveApplicationView[]>([])
    const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeWithPolicy[]>([])
    const [rawApps, setRawApps] = React.useState<
        import("@/lib/services/leave").BackendLeaveApplicationListItem[]
    >([])

    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [isApplying, setIsApplying] = React.useState(false)
    const [employee, setEmployee] = React.useState<EmployeeLeaveSelection | null>(null)
    const [formData, setFormData] = React.useState({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
        isHalfDay: false,
    })

    const loadData = React.useCallback(async () => {
        if (!selectedCompanyId) return
        setIsLoading(true)
        try {
            const companyId = selectedCompanyId
            const [apps, types, policies] = await Promise.all([
                leaveService.listLeaveApplications(companyId),
                leaveService.listLeaveTypes(companyId),
                leaveService.listLeavePolicies(companyId),
            ])
            setRawApps(apps)
            setLeaveTypes(mergeLeaveTypesWithPolicies(types, policies))
            setApplications(mapLeaveApplicationListItems(apps))
        } catch {
            toast.error("Failed to load leave applications")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId])

    const handleFilterChange = React.useCallback((filters: LeaveFilterParams) => {
        setSelectedCompanyId(filters.companyEntityId)
        setListFilters(filters)
        setEmployee(null)
    }, [])

    const activeLeaveTypes = React.useMemo(
        () => leaveTypes.filter((t) => t.type.isActive),
        [leaveTypes],
    )

    React.useEffect(() => {
        if (selectedCompanyId) loadData()
    }, [selectedCompanyId, loadData])

    const displayedApplications = React.useMemo(() => {
        let rows = applications
        const status = listFilters.status
        if (status && status !== "all") {
            rows = rows.filter((a) => a.status === status)
        }
        const term = listFilters.searchTerm?.trim().toLowerCase()
        if (term) {
            rows = rows.filter(
                (a) =>
                    a.employeeName.toLowerCase().includes(term) ||
                    a.employeeId.toLowerCase().includes(term),
            )
        }
        return rows
    }, [applications, listFilters.searchTerm, listFilters.status])

    const actorId = user?.id ?? ""

    const handleAction = async (id: string, status: "Approved" | "Rejected") => {
        if (!actorId) {
            toast.error("User session required")
            return
        }
        setIsActionLoading(id)
        try {
            if (status === "Approved") {
                await leaveService.approveLeaveApplication(id, {
                    approvedBy: actorId,
                    approverUserId: actorId,
                })
            } else {
                await leaveService.rejectLeaveApplication(id, {
                    rejectedBy: actorId,
                    remarks: "Rejected via UI",
                    approverUserId: actorId,
                })
            }
            toast.success(`Leave request ${status.toLowerCase()} successfully`)
            loadData()
        } catch {
            toast.error("Failed to process leave action")
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleSubmit = async () => {
        if (!employee || !formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Please fill all required fields")
            return
        }
        if (!actorId) {
            toast.error("User session required")
            return
        }

        if (!selectedCompanyId) {
            toast.error("Select a company in filters")
            return
        }

        if (
            employee.companyEntityId &&
            employee.companyEntityId !== selectedCompanyId
        ) {
            toast.error("Employee does not belong to the selected company")
            return
        }

        setIsApplying(true)
        try {
            const companyId = selectedCompanyId
            const fromDate = formData.startDate.split("T")[0]
            const toDate = formData.endDate.split("T")[0]

            if (editingId) {
                await leaveService.cancelLeaveApplication(editingId, actorId)
                await leaveService.applyLeaveApplication({
                    companyId,
                    employeeId: employee.entityId,
                    leaveTypeId: formData.leaveTypeId,
                    fromDate,
                    toDate,
                    isHalfDay: formData.isHalfDay,
                    halfDayType: formData.isHalfDay ? "FirstHalf" : null,
                    reason: formData.reason,
                    attachmentUrl: null,
                    appliedBy: actorId,
                    approvalSteps: null,
                })
                toast.success("Leave application re-submitted successfully")
            } else {
                await leaveService.applyLeaveApplication({
                    companyId,
                    employeeId: employee.entityId,
                    leaveTypeId: formData.leaveTypeId,
                    fromDate,
                    toDate,
                    isHalfDay: formData.isHalfDay,
                    halfDayType: formData.isHalfDay ? "FirstHalf" : null,
                    reason: formData.reason,
                    attachmentUrl: null,
                    appliedBy: actorId,
                    approvalSteps: null,
                })
                toast.success("Leave application submitted successfully")
            }
            loadData()
            handleSheetClose()
        } catch {
            toast.error(editingId ? "Failed to update leave application" : "Failed to submit leave application")
        } finally {
            setIsApplying(false)
        }
    }

    const handleSheetClose = () => {
        setIsSheetOpen(false)
        setEditingId(null)
        setEmployee(null)
        setFormData({ leaveTypeId: "", startDate: "", endDate: "", reason: "", isHalfDay: false })
    }

    const handleEdit = (application: LeaveApplicationView) => {
        if (application.status !== "Pending") {
            toast.error("Only pending applications can be edited")
            return
        }
        setEditingId(application.id)
        setEmployee({
            entityId: application.employeeEntityId,
            employeeCard: application.employeeCard,
            employeeId: application.employeeId,
            employeeName: application.employeeName,
            department: application.department,
            designation: application.designation,
        })
        setFormData({
            leaveTypeId: application.leaveTypeId,
            startDate: application.startDate,
            endDate: application.endDate,
            reason: application.reason,
            isHalfDay: application.isHalfDay,
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteId || !actorId) return
        try {
            await leaveService.cancelLeaveApplication(deleteId, actorId)
            toast.success("Leave application cancelled")
            loadData()
        } catch {
            toast.error("Failed to cancel leave application")
        } finally {
            setDeleteId(null)
        }
    }

    const columns: ColumnDef<LeaveApplicationView>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>,
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.department}</span>
                </div>
            ),
        },
        {
            accessorKey: "leaveTypeName",
            header: "Leave Type",
            cell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => router.push(`/management/leave/application/${row.original.id}`)}
                    className="font-medium hover:underline text-primary text-left"
                >
                    <Badge variant="secondary" className="font-normal">{row.original.leaveTypeName}</Badge>
                </button>
            ),
        },
        {
            accessorKey: "startDate",
            header: "Duration",
            cell: ({ row }) => (
                <div className="text-xs">
                    <div className="font-medium">
                        {format(new Date(row.original.startDate), "dd MMM")} -{" "}
                        {format(new Date(row.original.endDate), "dd MMM yyyy")}
                    </div>
                    <div className="text-muted-foreground">{row.original.totalDays} day(s)</div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/management/leave/application/${row.original.id}`)}>
                            <IconEye className="mr-2 size-4" /> View Details
                        </DropdownMenuItem>
                        <LeavePermissionGate permission="LEAVE_APPLY">
                            <DropdownMenuItem
                                onClick={() => handleEdit(row.original)}
                                disabled={row.original.status !== "Pending"}
                            >
                                <IconEdit className="mr-2 size-4" /> Re-submit
                            </DropdownMenuItem>
                        </LeavePermissionGate>
                        <LeavePermissionGate permission="LEAVE_CANCEL">
                            <DropdownMenuItem
                                className="text-rose-600"
                                onClick={() => setDeleteId(row.original.id)}
                                disabled={row.original.status !== "Pending"}
                            >
                                <IconTrash className="mr-2 size-4" /> Cancel
                            </DropdownMenuItem>
                        </LeavePermissionGate>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Approval</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <LeavePermissionGate permission="LEAVE_APPROVE">
                                        <DropdownMenuItem
                                            className="text-emerald-600"
                                            onClick={() => handleAction(row.original.id, "Approved")}
                                            disabled={row.original.status !== "Pending" || isActionLoading === row.original.id}
                                        >
                                            <IconCheck className="mr-2 size-4" /> Approve
                                        </DropdownMenuItem>
                                    </LeavePermissionGate>
                                    <LeavePermissionGate permission="LEAVE_REJECT">
                                        <DropdownMenuItem
                                            className="text-rose-600"
                                            onClick={() => handleAction(row.original.id, "Rejected")}
                                            disabled={row.original.status !== "Pending" || isActionLoading === row.original.id}
                                        >
                                            <IconX className="mr-2 size-4" /> Reject
                                        </DropdownMenuItem>
                                    </LeavePermissionGate>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <IconFileDownload className="mr-2 size-4" /> Export
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => router.push(`/management/leave/application/${row.original.id}/export`)}>
                                        <IconFileDownload className="mr-2 size-4" /> Print form
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportApplicationsCsv(rawApps)}>
                                        <IconFileTypeXls className="mr-2 size-4" /> CSV (all)
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 px-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
                        <p className="text-muted-foreground text-sm">Manage employee leave applications</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedCompanyId && (
                            <HrReportExportButtons
                                exportUrl="/api/v1/leave/reports/applications"
                                params={{
                                    companyId: selectedCompanyId,
                                    ...(listFilters.status && listFilters.status !== "all"
                                        ? { status: listFilters.status }
                                        : {}),
                                }}
                                filePrefix="leave-applications"
                                disabled={isLoading || displayedApplications.length === 0}
                            />
                        )}
                        <LeavePermissionGate permission="LEAVE_APPLY">
                            <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleSheetClose()}>
                            <SheetTrigger asChild>
                                <Button className="gap-2" onClick={() => setIsSheetOpen(true)}>
                                    <IconPlus className="size-4" /> New Application
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md">
                                <SheetHeader className="pb-4">
                                    <SheetTitle>{editingId ? "Re-submit Application" : "New Application"}</SheetTitle>
                                    <SheetDescription>
                                        {editingId
                                            ? "Cancels the pending request and creates a new one with updated details."
                                            : "Submit a new leave request for an employee."}
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 py-4">
                                    <EmployeeLeavePicker
                                        value={employee}
                                        onChange={setEmployee}
                                        companyEntityId={selectedCompanyId}
                                        disabled={!!editingId}
                                    />
                                    <div className="space-y-2">
                                        <Label>Leave Type</Label>
                                        <NativeSelect
                                            value={formData.leaveTypeId}
                                            onChange={(e) => setFormData((p) => ({ ...p, leaveTypeId: e.target.value }))}
                                        >
                                            <option value="">Select Type</option>
                                            {activeLeaveTypes.map((t) => (
                                                <option key={t.type.id} value={t.type.id}>
                                                    {t.type.leaveName} ({t.type.leaveCode})
                                                </option>
                                            ))}
                                        </NativeSelect>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <DatePicker
                                                date={formData.startDate ? new Date(formData.startDate) : undefined}
                                                setDate={(date) =>
                                                    setFormData((p) => ({ ...p, startDate: date ? date.toISOString() : "" }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <DatePicker
                                                date={formData.endDate ? new Date(formData.endDate) : undefined}
                                                setDate={(date) =>
                                                    setFormData((p) => ({ ...p, endDate: date ? date.toISOString() : "" }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Textarea
                                            className="min-h-[100px]"
                                            value={formData.reason}
                                            onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                                        />
                                    </div>
                                    <Button className="w-full" onClick={handleSubmit} disabled={isApplying}>
                                        {isApplying && <IconLoader className="mr-2 size-4 animate-spin" />}
                                        {editingId ? "Re-submit" : "Submit"}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                        </LeavePermissionGate>
                    </div>
                </div>
            </div>

            <div className="px-6">
                <LeaveAdvancedFilter
                    onFilterChange={handleFilterChange}
                    isLoading={isLoading}
                    showStatus
                    showSearch
                />
            </div>

            <div className="grid gap-4 md:grid-cols-3 px-6">
                <KPICard title="Pending" value={displayedApplications.filter((a) => a.status === "Pending").length.toString()} icon={IconHistory} />
                <KPICard title="Approved" value={displayedApplications.filter((a) => a.status === "Approved").length.toString()} icon={IconCheck} />
                <KPICard title="Total" value={displayedApplications.length.toString()} icon={IconCalendarEvent} />
            </div>

            <div className="px-6">
                <Card>
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base font-semibold">Application History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={columns} data={displayedApplications} isLoading={isLoading} showColumnCustomizer={false} />
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel application?</AlertDialogTitle>
                        <AlertDialogDescription>This will cancel the pending leave application.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={handleDelete}>
                            Cancel application
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function KPICard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
