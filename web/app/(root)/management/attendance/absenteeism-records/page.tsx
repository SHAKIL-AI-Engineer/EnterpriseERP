"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconUserX,
    IconSearch,
    IconRefresh,
    IconAlertTriangle,
    IconCalendarOff,
    IconActivity,
    IconArrowLeft,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { absenteeismService, type AbsenteeismRecord, type AbsenteeismSummary } from "@/lib/services/absenteeism"
import { type AttendanceQuery, toAttendanceExportParams } from "@/lib/services/attendance-api"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"

export default function AbsenteeismRecordsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)
    const [filteredData, setFilteredData] = React.useState<AbsenteeismRecord[]>([])
    const [summary, setSummary] = React.useState<AbsenteeismSummary | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)

    const columns: ColumnDef<AbsenteeismRecord>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{row.original.employeeName}</span>
                    <span className="text-xs text-gray-500">{row.original.employeeId}</span>
                </div>
            )
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => <span className="text-xs">{row.original.department}</span>
        },
        {
            accessorKey: "consecutiveDays",
            header: "Consecutive Days",
            cell: ({ row }) => (
                <Badge variant="outline" className={cn(
                    "font-medium",
                    row.original.consecutiveDays >= 3
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                        : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>
                    {row.original.consecutiveDays} Days
                </Badge>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant="outline" className={cn(
                    "font-medium",
                    row.original.status === "Absent"
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                        : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                )}>
                    {row.original.status}
                </Badge>
            )
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => <span className="text-xs text-gray-500 truncate max-w-[200px]">{row.original.remarks || "-"}</span>
        }
    ]

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            if (!activeQuery) return
            const data = await absenteeismService.getAbsenteeismRecords(activeQuery)
            setFilteredData(data.records)
            setSummary(data.summary)
            setHasSearched(true)
            toast.success("Absenteeism records synced")
        } catch (error: any) {
            toast.error("Failed to fetch records")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 font-sans animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-gray-800 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md border-gray-200 dark:border-gray-800">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Absenteeism Records</h1>
                        <p className="text-sm text-muted-foreground">Monitor and audit employee absences and attendance trends</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleSearch} className="h-9 px-4">
                        <IconRefresh size={18} className={cn("mr-2", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    {hasSearched && activeQuery && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/attendance/reports/absenteeism-records"
                            params={toAttendanceExportParams(activeQuery)}
                            filePrefix={`absenteeism-${activeQuery.fromDate}`}
                            disabled={isLoading || filteredData.length === 0}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none bg-linear-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-950 shadow-sm border border-red-100/50 dark:border-red-900/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <IconUserX className="text-red-600 dark:text-red-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Absent</p>
                                        <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{summary.totalAbsent}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-linear-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-950 shadow-sm border border-orange-100/50 dark:border-orange-900/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <IconAlertTriangle className="text-orange-600 dark:text-orange-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Without Leave</p>
                                        <h3 className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{summary.absentWithoutLeave}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-linear-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950 shadow-sm border border-blue-100/50 dark:border-blue-900/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <IconCalendarOff className="text-blue-600 dark:text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">On Leave</p>
                                        <h3 className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{summary.onLeave}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-linear-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-950 shadow-sm border border-purple-100/50 dark:border-purple-900/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <IconActivity className="text-purple-600 dark:text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Critical Cases</p>
                                        <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{summary.criticalCases}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-visible">
                    <CardHeader className="py-4 border-b dark:border-gray-800">
                        <CardTitle className="text-sm font-medium">Search Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <AttendanceCompanyFilter
                            showDate={false}
                            showDateRange
                            initialStartDate={format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")}
                            initialEndDate={format(new Date(), "yyyy-MM-dd")}
                            onFilterChange={({ query }) => setActiveQuery(query)}
                        />
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
                                <IconSearch className="mr-2 h-4 w-4" />
                                {isLoading ? "Searching..." : "Analyze Absenteeism"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Records Table */}
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/50 dark:bg-table-header border-b border-border py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <IconUserX size={18} className="text-red-500" />
                                <CardTitle className="text-base font-semibold">Absence List</CardTitle>
                            </div>
                            {hasSearched && (
                                <Badge variant="secondary" className="font-medium">
                                    {filteredData.length} Records Found
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            showColumnCustomizer={false}
                            searchKey="employeeName"
                            showActions={false}
                            showTabs={false}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
