"use client"

import * as React from "react"
import { format } from "date-fns"
import { formatAttendanceDate, formatPunchTime } from "@/lib/format-attendance-time"
import {
    IconSearch,
    IconRefresh,
    IconLoader,
    IconClock
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"
import { attendanceApi, toAttendanceExportParams, type AttendanceQuery, type AttendanceRecord } from "@/lib/services/attendance-api"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function DailyInputPage() {
    const [data, setData] = React.useState<AttendanceRecord[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasSearched, setHasSearched] = React.useState(false)
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)

    const fetchReport = async (q: AttendanceQuery) => {
        setIsLoading(true)
        try {
            const result = await attendanceApi.getDailyReport(q)
            setData(result)
            setHasSearched(true)
        } catch (error) {
            console.error("Error fetching daily report:", error)
            toast.error("Failed to fetch daily attendance report")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFilterChange = ({ query }: { query: AttendanceQuery }) => {
        setActiveQuery(query)
        fetchReport(query)
    }

    const columns = React.useMemo<ColumnDef<AttendanceRecord>[]>(() => [
        {
            accessorKey: "employeeId",
            header: "Emp ID",
            cell: ({ row }) => <span className="font-bold tabular-nums">{row.original.employeeId}</span>,
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.employeeName}</span>,
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold">{row.original.department}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.section}</span>
                </div>
            )
        },
        {
            accessorKey: "inTime",
            header: "In Time",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className={cn("font-medium", !row.original.inTime && "text-red-500 font-bold")}>
                        {row.original.inTime ? formatPunchTime(row.original.inTime, row.original.date) : "MISSING"}
                    </span>
                    {row.original.inTime && (
                        <span className="text-[10px] text-muted-foreground">
                            {formatAttendanceDate(row.original.date).split(" ").slice(0, 2).join(" ")}
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "outTime",
            header: "Out Time",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className={cn("font-medium", !row.original.outTime && "text-red-500 font-bold")}>
                        {row.original.outTime ? formatPunchTime(row.original.outTime, row.original.date) : "--:--"}
                    </span>
                    {row.original.outTime && (
                        <span className="text-[10px] text-muted-foreground">
                            {formatAttendanceDate(row.original.date).split(" ").slice(0, 2).join(" ")}
                        </span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] uppercase font-black py-0 px-2",
                            status === "Present" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                            status === "Late" && "bg-amber-50 text-amber-700 border-amber-100",
                            status === "Absent" && "bg-red-50 text-red-700 border-red-100",
                            status === "Holiday" && "bg-blue-50 text-blue-700 border-blue-100",
                            status === "Off Day" && "bg-slate-50 text-slate-700 border-slate-100"
                        )}
                    >
                        {status}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "otHours",
            header: "OT",
            cell: ({ row }) => (
                <span className={cn("font-bold tabular-nums text-xs", row.original.otHours > 0 ? "text-primary" : "text-muted-foreground")}>
                    {row.original.otHours}
                </span>
            )
        }
    ], [])

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <IconClock className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground">Daily Input / Report</h1>
                            <p className="text-muted-foreground text-sm font-medium">Employee In Time and Out Time detailed audit</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold shadow-sm"
                        onClick={() => activeQuery && fetchReport(activeQuery)}
                        disabled={isLoading}
                    >
                        <IconRefresh size={18} className={cn("mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    {hasSearched && activeQuery && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/attendance/reports/daily-report"
                            params={toAttendanceExportParams(activeQuery)}
                            filePrefix={`daily-input-${activeQuery.date ?? activeQuery.fromDate}`}
                            disabled={isLoading || data.length === 0}
                        />
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm ring-1 ring-black/5">
                <CardContent className="p-6">
                    <AttendanceCompanyFilter
                        onFilterChange={handleFilterChange}
                        initialDate={format(new Date(), "yyyy-MM-dd")}
                        isLoading={isLoading}
                        showDate={true}
                        showDateRange={false}
                    />
                </CardContent>
            </Card>

            {/* Data Table Section */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="size-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <IconLoader className="size-8 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <h3 className="text-xl font-bold tracking-tight">Compiling Daily Data...</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">
                            We're analyzing movement logs and calculating attendance statuses.
                        </p>
                    </div>
                </div>
            ) : hasSearched ? (
                <Card className="border-none shadow-2xl overflow-hidden rounded-3xl ring-1 ring-black/5">
                    <CardHeader className="bg-gray-50/50 border-b py-5 px-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight">Daily Attendance Records</CardTitle>
                                <CardDescription className="font-medium">
                                    Records for {activeQuery?.date ? format(new Date(activeQuery.date), "dd MMMM yyyy") : "Selected Date"}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="font-bold px-3 py-1 rounded-full">
                                {data.length} Employees Found
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={data}
                            searchKey="employeeName"
                            showColumnCustomizer={true}
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-[2.5rem] bg-muted/5 text-muted-foreground">
                    <div className="size-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-6">
                        <IconSearch size={32} className="opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Awaiting Search Parameters</h3>
                    <p className="text-sm font-medium mt-1">Select filters above to generate the daily attendance report.</p>
                </div>
            )}
        </div>
    )
}
