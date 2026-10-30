"use client"

import * as React from "react"
import { IconCalendar, IconUser } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { leaveService } from "@/lib/services/leave"
import {
    mapLeaveApplicationListItems,
    mapBalanceSummary,
    type LeaveApplicationView,
} from "@/lib/services/leave-helpers"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeaveBalanceTable } from "@/components/leave/leave-balance-table"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import {
    EmployeeLeavePicker,
    type EmployeeLeaveSelection,
} from "@/components/leave/employee-leave-picker"
import { toast } from "sonner"
import { format } from "date-fns"

export default function LeaveDetailsPage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [employee, setEmployee] = React.useState<EmployeeLeaveSelection | null>(null)
    const [balances, setBalances] = React.useState<Awaited<ReturnType<typeof leaveService.getEmployeeBalances>>>([])
    const [history, setHistory] = React.useState<LeaveApplicationView[]>([])
    const [isLoading, setIsLoading] = React.useState(false)

    const loadEmployeeData = React.useCallback(async () => {
        if (!selectedCompanyId || !employee?.entityId) {
            setBalances([])
            setHistory([])
            return
        }
        setIsLoading(true)
        try {
            const [bal, apps] = await Promise.all([
                leaveService.getEmployeeBalances(employee.entityId, { companyId: selectedCompanyId, year }),
                leaveService.listLeaveApplications(selectedCompanyId),
            ])
            setBalances(bal)
            setHistory(
                mapLeaveApplicationListItems(apps)
                    .filter((a) => a.employeeEntityId === employee.entityId)
                    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
            )
        } catch {
            toast.error("Failed to load employee leave details")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, employee, year])

    const handleFilterChange = React.useCallback((filters: LeaveFilterParams) => {
        setSelectedCompanyId(filters.companyEntityId)
        if (filters.year) setYear(filters.year)
    }, [])

    React.useEffect(() => {
        loadEmployeeData()
    }, [loadEmployeeData])

    const summary = mapBalanceSummary(balances)

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Leave Details</h1>
                <p className="text-muted-foreground text-sm">Employee leave balance and history</p>
            </div>
            <LeaveAdvancedFilter
                showYear
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
                initialYear={year}
            />
            <Card>
                <CardContent className="pt-6">
                    <EmployeeLeavePicker value={employee} onChange={setEmployee} />
                </CardContent>
            </Card>

            {employee && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <IconUser className="size-4" /> Employee
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="font-semibold">{employee.employeeName}</p>
                            <p className="text-muted-foreground">{employee.employeeId}</p>
                            <p className="text-muted-foreground">{employee.department}</p>
                            <p className="text-muted-foreground">{employee.designation}</p>
                        </CardContent>
                    </Card>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard title="Entitled" value={`${summary.totalEntitled} Days`} />
                            <StatCard title="Used" value={`${summary.totalUsed} Days`} />
                            <StatCard title="Balance" value={`${summary.totalBalance} Days`} />
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Balances ({year})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <LeaveBalanceTable balances={balances} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <IconCalendar className="size-4" /> Leave History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {history.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No applications found.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="rounded-md border p-3 flex justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-sm">{item.leaveTypeName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(item.startDate), "dd MMM yyyy")} —{" "}
                                                    {format(new Date(item.endDate), "dd MMM yyyy")} ({item.totalDays} days)
                                                </p>
                                            </div>
                                            <LeaveStatusBadge status={item.status} />
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{value}</p>
            </CardContent>
        </Card>
    )
}
