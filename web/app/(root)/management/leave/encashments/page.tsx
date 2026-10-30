"use client"

import * as React from "react"
import { IconCash, IconPlus, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { leaveService, type LeaveEncashment } from "@/lib/services/leave"
import { mergeLeaveTypesWithPolicies } from "@/lib/services/leave-helpers"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import {
    EmployeeLeavePicker,
    type EmployeeLeaveSelection,
} from "@/components/leave/employee-leave-picker"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"

type EncashmentRow = LeaveEncashment & { employeeCode?: string; leaveTypeName?: string }

export default function LeaveEncashmentsPage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const { user } = useAuth()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [rows, setRows] = React.useState<EncashmentRow[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [employee, setEmployee] = React.useState<EmployeeLeaveSelection | null>(null)
    const [leaveTypeId, setLeaveTypeId] = React.useState("")
    const [leaveTypes, setLeaveTypes] = React.useState<{ id: string; name: string }[]>([])
    const [encashDays, setEncashDays] = React.useState("1")
    const [ratePerDay, setRatePerDay] = React.useState("0")

    const load = React.useCallback(async () => {
        if (!selectedCompanyId) return
        setIsLoading(true)
        try {
            const [list, employees, types, policies] = await Promise.all([
                leaveService.listLeaveEncashments({ companyId: selectedCompanyId, year }),
                employeeService.getEmployees(),
                leaveService.listLeaveTypes(selectedCompanyId),
                leaveService.listLeavePolicies(selectedCompanyId),
            ])
            const merged = mergeLeaveTypesWithPolicies(types, policies)
            setRows(
                list.map((e) => ({
                    ...e,
                    employeeCode: employees.find((emp) => emp.entityId === e.employeeId)?.employeeId,
                    leaveTypeName: merged.find((m) => m.type.id === e.leaveTypeId)?.type.leaveName,
                }))
            )
        } catch {
            toast.error("Failed to load encashments")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, year])

    React.useEffect(() => {
        if (!selectedCompanyId) return
        Promise.all([
            leaveService.listLeaveTypes(selectedCompanyId),
            leaveService.listLeavePolicies(selectedCompanyId),
        ]).then(([types, policies]) => {
            const merged = mergeLeaveTypesWithPolicies(types, policies)
            setLeaveTypes(merged.map((x) => ({ id: x.type.id, name: x.type.leaveName })))
            if (merged[0]) setLeaveTypeId(merged[0].type.id)
        })
    }, [selectedCompanyId])

    React.useEffect(() => {
        load()
    }, [load])

    const handleCreate = async () => {
        if (!selectedCompanyId || !employee?.entityId || !leaveTypeId) return
        try {
            await leaveService.createLeaveEncashment({
                companyId: selectedCompanyId,
                employeeId: employee.entityId,
                leaveTypeId,
                yearNo: year,
                encashDays: parseFloat(encashDays) || 0,
                ratePerDay: parseFloat(ratePerDay) || 0,
                requestedBy: user?.id ?? null,
            })
            toast.success("Encashment requested")
            load()
        } catch {
            toast.error("Create failed")
        }
    }

    const actorId = user?.id ?? ""

    const columns: ColumnDef<EncashmentRow>[] = [
        { accessorKey: "employeeCode", header: "Employee" },
        { accessorKey: "leaveTypeName", header: "Leave type" },
        { accessorKey: "encashDays", header: "Days" },
        { accessorKey: "totalAmount", header: "Amount" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <LeaveStatusBadge status={row.original.status} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-1">
                    <LeavePermissionGate permission="LEAVE_ENCASHMENT_APPROVE">
                        {row.original.status === "Pending" && (
                            <>
                                <Button size="sm" variant="outline" onClick={() => approve(row.original.id)}>
                                    <IconCheck className="size-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => reject(row.original.id)}>
                                    <IconX className="size-3" />
                                </Button>
                            </>
                        )}
                        {row.original.status === "Approved" && (
                            <Button size="sm" variant="outline" onClick={() => markPaid(row.original.id)}>
                                Paid
                            </Button>
                        )}
                    </LeavePermissionGate>
                </div>
            ),
        },
    ]

    const approve = async (id: string) => {
        if (!actorId) return
        try {
            await leaveService.approveLeaveEncashment(id, actorId)
            toast.success("Approved")
            load()
        } catch {
            toast.error("Approve failed")
        }
    }

    const reject = async (id: string) => {
        if (!actorId) return
        try {
            await leaveService.rejectLeaveEncashment(id, actorId)
            toast.success("Rejected")
            load()
        } catch {
            toast.error("Reject failed")
        }
    }

    const markPaid = async (id: string) => {
        try {
            await leaveService.markLeaveEncashmentPaid(id)
            toast.success("Marked paid")
            load()
        } catch {
            toast.error("Failed")
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconCash className="size-7" /> Leave Encashments
            </h1>
            {selectedCompanyId && (
                <HrReportExportButtons
                    exportUrl="/api/v1/leave/reports/encashments"
                    params={{ companyId: selectedCompanyId, year }}
                    filePrefix={`leave-encashments-${year}`}
                    disabled={isLoading || rows.length === 0}
                />
            )}
            <LeaveAdvancedFilter
                showYear
                onFilterChange={(filters: LeaveFilterParams) => {
                    setSelectedCompanyId(filters.companyEntityId)
                    if (filters.year) setYear(filters.year)
                }}
                isLoading={isLoading}
                initialYear={year}
            />
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconPlus className="size-4" /> New request
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <EmployeeLeavePicker value={employee} onChange={setEmployee} />
                    <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
                        <div className="space-y-1">
                            <Label>Leave type</Label>
                            <NativeSelect value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
                                {leaveTypes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1">
                            <Label>Days</Label>
                            <Input type="number" value={encashDays} onChange={(e) => setEncashDays(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Rate / day</Label>
                            <Input type="number" value={ratePerDay} onChange={(e) => setRatePerDay(e.target.value)} />
                        </div>
                    </div>
                    <Button onClick={handleCreate} disabled={!employee}>Submit request</Button>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <DataTable columns={columns} data={rows} isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
