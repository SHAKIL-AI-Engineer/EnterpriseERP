"use client"

import * as React from "react"
import { IconFileAnalytics, IconDownload, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { leaveService } from "@/lib/services/leave"
import { buildMonthlyLeaveReport, type MonthlyLeaveReportRow } from "@/lib/services/leave-helpers"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export default function MonthlyLeaveReportPage() {
    const [filterParams, setFilterParams] = React.useState<LeaveFilterParams>({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    })
    const selectedCompanyId = filterParams.companyEntityId
    const year = filterParams.year ?? new Date().getFullYear()
    const month = filterParams.month ?? new Date().getMonth() + 1
    const [isLoading, setIsLoading] = React.useState(false)
    const [reportData, setReportData] = React.useState<MonthlyLeaveReportRow[]>([])

    const loadReport = React.useCallback(async () => {
        if (!selectedCompanyId) return
        setIsLoading(true)
        try {
            const [apps, employees, types] = await Promise.all([
                leaveService.listLeaveApplications(selectedCompanyId),
                employeeService.getEmployees(
                    filterParams.companyId ? { companyId: filterParams.companyId } : undefined,
                ),
                leaveService.listLeaveTypes(selectedCompanyId),
            ])
            setReportData(buildMonthlyLeaveReport(apps, employees, types, { year, month }))
        } catch {
            toast.error("Failed to generate leave report")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, year, month, filterParams.companyId])

    const handleFilterChange = React.useCallback((filters: LeaveFilterParams) => {
        setFilterParams((prev) => ({ ...prev, ...filters }))
    }, [])

    React.useEffect(() => {
        if (selectedCompanyId) loadReport()
    }, [selectedCompanyId, year, month, loadReport])

    const columns: ColumnDef<MonthlyLeaveReportRow>[] = [
        { accessorKey: "employeeId", header: "ID" },
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
        { accessorKey: "sickLeave", header: "Sick" },
        { accessorKey: "casualLeave", header: "Casual" },
        { accessorKey: "earnedLeave", header: "Earned" },
        { accessorKey: "paternityLeave", header: "Paternity" },
        { accessorKey: "maternityLeave", header: "Maternity" },
        { accessorKey: "lwp", header: "LWP" },
        { accessorKey: "otherLeave", header: "Other" },
        {
            accessorKey: "totalDays",
            header: "Total",
            cell: ({ row }) => <Badge variant="secondary">{row.original.totalDays} Days</Badge>,
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <IconFileAnalytics className="size-7" /> Monthly Leave Report
                </h1>
                <p className="text-muted-foreground text-sm">Approved leave days by type</p>
            </div>
            <LeaveAdvancedFilter
                showYear
                showMonth
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
                initialYear={filterParams.year}
                initialMonth={filterParams.month}
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Report — {MONTHS[month - 1]} {year}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                        {selectedCompanyId && (
                            <HrReportExportButtons
                                exportUrl="/api/v1/leave/reports/monthly-report"
                                params={{ companyId: selectedCompanyId, year, month }}
                                filePrefix={`monthly-leave-${year}-${month}`}
                                disabled={isLoading || reportData.length === 0}
                            />
                        )}
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                            <IconDownload className="size-4" /> Print
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={reportData} isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
