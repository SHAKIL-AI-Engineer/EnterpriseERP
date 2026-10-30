"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconChartBar,
    IconActivity,
    IconClock,
    IconArrowLeft,
    IconUsers,
    IconBuildingCommunity,
    IconBox,
    IconLayoutList,
    IconLoader2
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { overtimeService, type DailyOtSummaryRow } from "@/lib/services/overtime"
import { type AttendanceQuery, toAttendanceExportParams } from "@/lib/services/attendance-api"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"

export default function DailyOTSummaryPage() {
    const router = useRouter()
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [isLoading, setIsLoading] = React.useState(false)
    const [rows, setRows] = React.useState<DailyOtSummaryRow[]>([])
    const [hasSearched, setHasSearched] = React.useState(false)

    const fetchData = React.useCallback(async (q: AttendanceQuery) => {
        setIsLoading(true)
        try {
            const res = await overtimeService.getDailyOTSummary(q)
            setRows(res)
            setHasSearched(true)
        } catch {
            toast.error("Analysis failed")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const grandTotal = rows.reduce((s, r) => s + r.totalOtHours, 0)

    const getColumns = (title: string): ColumnDef<DailyOtSummaryRow>[] => [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "name",
            header: title,
            cell: ({ row }) => (
                <div className="font-semibold text-sm text-foreground">{row.original.name}</div>
            )
        },
        {
            accessorKey: "employeeCount",
            header: "Staff Count",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-medium bg-muted/50 text-muted-foreground border-transparent">
                    {row.original.employeeCount} Personnel
                </Badge>
            )
        },
        {
            accessorKey: "totalOtHours",
            header: "Total OT Hours",
            cell: ({ row }) => {
                const percent = grandTotal > 0 ? (row.original.totalOtHours / grandTotal) * 100 : 0
                return (
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">
                                {row.original.totalOtHours} <span className="text-xs font-normal text-muted-foreground">hrs</span>
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                                {percent.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={percent} className="h-1.5 bg-muted" />
                    </div>
                )
            }
        },
    ]

    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)
    const totalEmployees = rows.reduce((s, r) => s + r.employeeCount, 0)

    const avgOTPerEmployee = totalEmployees > 0 ? (grandTotal / totalEmployees).toFixed(2) : "0.00"

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily OT Summary</h1>
                        <p className="text-sm text-muted-foreground">Detailed overtime distribution across different organizational levels</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {hasSearched && activeQuery && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/attendance/reports/daily-ot-summary"
                            params={toAttendanceExportParams(activeQuery)}
                            filePrefix={`daily-ot-summary-${activeQuery.date ?? activeQuery.fromDate}`}
                            disabled={isLoading || rows.length === 0}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* Filters */}
                <div className="px-6">
                    <AttendanceCompanyFilter
                        onFilterChange={({ query }) => {
                            setActiveQuery(query)
                            if (query.date) setDate(new Date(query.date + "T00:00:00"))
                            fetchData(query)
                        }}
                        initialDate={date ? format(date, "yyyy-MM-dd") : undefined}
                    />
                </div>

                {hasSearched && rows.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6">
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Grand Total OT</p>
                                <h3 className="text-2xl font-bold mt-1 text-primary">{grandTotal.toFixed(1)} hrs</h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Employees</p>
                                <h3 className="text-2xl font-bold mt-1">{totalEmployees}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg OT / Person</p>
                                <h3 className="text-2xl font-bold mt-1">{avgOTPerEmployee} hrs</h3>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <IconLoader2 className="size-10 animate-spin text-primary opacity-20" />
                        <p className="mt-4 text-sm text-muted-foreground font-medium">Generating OT Analytics...</p>
                    </div>
                ) : hasSearched && rows.length > 0 ? (
                    
                    <div className="px-6">
                        <Card className="border shadow-none overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b py-4">
                                <CardTitle className="text-base font-semibold">Department OT Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <DataTable columns={getColumns("Department")} data={rows} showColumnCustomizer={false} showActions={false} showTabs={false} />
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="mx-6 flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-muted/20 text-muted-foreground outline-none">
                        <IconChartBar size={48} stroke={1.5} className="opacity-20" />
                        <p className="mt-4 font-medium">Select a date to view OT analytics</p>
                    </div>
                )}
            </div>
        </div>
    )
}
