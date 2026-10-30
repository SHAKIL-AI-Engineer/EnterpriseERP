"use client"

import * as React from "react"
import {
    IconArrowsExchange,
    IconPlus,
    IconUser,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { HrPageHeader } from "@/components/hr/hr-page-header"
import { HrPageShell } from "@/components/hr/hr-page-shell"
import { HrTableCard } from "@/components/hr/hr-table-card"
import { HrCellText } from "@/components/hr/hr-table-cells"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { DatePicker } from "@/components/ui/date-picker"
import { transferService, type Transfer } from "@/lib/services/transfer"
import { organogramService } from "@/lib/services/organogram"
import { employeeService, type EmployeeSimple } from "@/lib/services/employee"
import { getHttpErrorMessage } from "@/lib/api-response"
import { toast } from "sonner"
import { format } from "date-fns"
import { useServerDataTable } from "@/hooks/use-server-data-table"

export default function MigrationTransferPage() {
    const [transfers, setTransfers] = React.useState<Transfer[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const serverTable = useServerDataTable()

    const [employees, setEmployees] = React.useState<EmployeeSimple[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [formData, setFormData] = React.useState({
        employeeId: "",
        departmentId: "",
        designationId: "",
        transferDate: format(new Date(), "yyyy-MM-dd"),
        reason: ""
    })

    const serverPagingKey = serverTable.getAll
        ? "all"
        : `${serverTable.pageIndex}-${serverTable.pageSize}`

    const fetchTransfers = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const page = await transferService.getTransfersPage({
                page: serverTable.getAll ? 1 : serverTable.pageIndex + 1,
                pageSize: serverTable.pageSize,
                getAll: serverTable.getAll,
            })
            setTransfers(page.items)
            serverTable.applyPaginationMeta({
                page: page.page,
                pageSize: page.pageSize,
                totalCount: page.totalCount,
                totalPages: page.totalPages,
                hasNextPage: page.hasNextPage ?? page.page < page.totalPages,
                hasPreviousPage: page.hasPreviousPage ?? page.page > 1,
                getAll: page.getAll ?? serverTable.getAll,
            })
        } catch (error) {
            toast.error(getHttpErrorMessage(error, "Failed to load transfers"))
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [serverTable.getAll, serverPagingKey])

    React.useEffect(() => {
        fetchTransfers()
    }, [fetchTransfers])

    React.useEffect(() => {
        organogramService.getDepartments().then(setDepartments)
        employeeService.getEmployeesSimple({ status: "Active" }).then(setEmployees)
    }, [])

    React.useEffect(() => {
        if (formData.departmentId) {
            organogramService
                .getDesignations({ departmentId: parseInt(formData.departmentId) })
                .then(setDesignations)
        } else {
            setDesignations([])
        }
    }, [formData.departmentId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const emp = employees.find(
            (e) =>
                String(e.id) === formData.employeeId ||
                e.entityId === formData.employeeId,
        )
        if (
            !emp?.entityId ||
            !formData.departmentId ||
            !formData.designationId ||
            !formData.transferDate
        ) {
            toast.error("Please fill all required fields")
            return
        }

        try {
            await transferService.createTransfer({
                employeeEntityId: emp.entityId,
                toDepartmentId: parseInt(formData.departmentId),
                toDesignationId: parseInt(formData.designationId),
                transferDate: formData.transferDate,
                reason: formData.reason,
                companyId: emp.companyId,
            })
            toast.success("Transfer recorded")
            setIsSheetOpen(false)
            serverTable.resetToFirstPage()
            fetchTransfers()
            setFormData({
                employeeId: "",
                departmentId: "",
                designationId: "",
                transferDate: format(new Date(), "yyyy-MM-dd"),
                reason: "",
            })
        } catch {
            toast.error("Failed to create request")
        }
    }

    const columns: ColumnDef<Transfer>[] = [
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-foreground">
                        {row.original.employeeName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                        {row.original.employeeCode}
                    </div>
                </div>
            ),
        },
        {
            header: "From",
            cell: ({ row }) => (
                <div className="text-sm">
                    <HrCellText className="font-medium text-muted-foreground">
                        {row.original.fromDepartmentName}
                    </HrCellText>
                    <div className="text-xs text-muted-foreground/70">
                        {row.original.fromDesignationName}
                    </div>
                </div>
            ),
        },
        {
            header: "To",
            cell: ({ row }) => (
                <div className="text-sm">
                    <HrCellText className="font-medium">
                        {row.original.toDepartmentName}
                    </HrCellText>
                    <div className="text-xs text-muted-foreground">
                        {row.original.toDesignationName}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "transferDate",
            header: "Date",
            cell: ({ row }) => (
                <HrCellText>
                    {format(new Date(row.original.transferDate), "dd MMM yyyy")}
                </HrCellText>
            ),
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground line-clamp-2">
                    {row.original.reason || "—"}
                </span>
            ),
        },
    ]

    const thisMonthCount = transfers.filter((t) => {
        const d = new Date(t.transferDate)
        const n = new Date()
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
    }).length

    const displayTotal =
        serverTable.rowCount > 0 ? serverTable.rowCount : transfers.length

    return (
        <HrPageShell>
            <HrPageHeader
                icon={<IconArrowsExchange className="size-7" />}
                iconClassName="bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                title="Migration & Transfers"
                description="Manage employee internal movements and role changes."
                actions={
                    <Button
                        className="gap-2 shadow-md rounded-xl"
                        onClick={() => setIsSheetOpen(true)}
                    >
                        <IconPlus className="size-4" />
                        New Transfer
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>This month</CardDescription>
                        <CardTitle className="text-2xl">{thisMonthCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>With reason noted</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {transfers.filter((t) => t.reason?.trim()).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total History</CardDescription>
                        <CardTitle className="text-2xl">{displayTotal}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <HrTableCard>
                <DataTable
                    data={transfers}
                    columns={columns}
                    showActions={false}
                    showTabs={false}
                    searchKey="employeeName"
                    isLoading={isLoading}
                    paginationMode="server"
                    pageIndex={serverTable.pageIndex}
                    pageSize={serverTable.pageSize}
                    getAll={serverTable.getAll}
                    pageCount={serverTable.pageCount}
                    rowCount={serverTable.rowCount}
                    onPaginationChange={serverTable.handlePaginationChange}
                    onSortingChange={serverTable.onSortParamsChange}
                />
            </HrTableCard>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-md">
                    <SheetHeader className="pb-6">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <IconArrowsExchange className="size-6" />
                        </div>
                        <SheetTitle>Initiate Transfer</SheetTitle>
                        <SheetDescription>
                            Create a new internal transfer request for an employee.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={formData.employeeId}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            employeeId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="" disabled>
                                        Select Employee
                                    </option>
                                    {employees.map((e) => (
                                        <option
                                            key={e.entityId ?? e.id}
                                            value={e.entityId ?? String(e.id)}
                                        >
                                            {e.fullNameEn} ({e.employeeId}) -{" "}
                                            {e.designationName}
                                        </option>
                                    ))}
                                </select>
                                <IconUser className="absolute right-3 top-3 size-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>To Department</Label>
                            <select
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.departmentId}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        departmentId: e.target.value,
                                        designationId: "",
                                    }))
                                }
                            >
                                <option value="" disabled>
                                    Select Department
                                </option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>To Designation</Label>
                            <select
                                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.designationId}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        designationId: e.target.value,
                                    }))
                                }
                                disabled={!formData.departmentId}
                            >
                                <option value="" disabled>
                                    Select Designation
                                </option>
                                {designations.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Effective Date</Label>
                            <DatePicker
                                date={
                                    formData.transferDate
                                        ? new Date(formData.transferDate)
                                        : undefined
                                }
                                setDate={(d) =>
                                    setFormData((p) => ({
                                        ...p,
                                        transferDate: d
                                            ? format(d, "yyyy-MM-dd")
                                            : p.transferDate,
                                    }))
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Reason for transfer..."
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        reason: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <SheetFooter className="pt-4">
                            <Button type="submit" className="w-full">
                                Submit Transfer
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </HrPageShell>
    )
}
