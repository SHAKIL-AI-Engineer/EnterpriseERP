"use client"

import * as React from "react"
import {
    IconClock,
    IconSearch,
    IconDownload,
    IconChartBar,
    IconFileSpreadsheet,
    IconUsers,
    IconBuildingFactory2,
    IconLayoutList,
    IconFilter,
    IconLoader2,
    IconArrowRight
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { attendanceService, type DailyOTSheetRecord, type DailyOTSummaryRecord, type CommonFilterParams } from "@/lib/services/attendance"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { AdvancedFilter } from "@/components/attendance/advanced-filter"

export default function DailyOTSheetPage() {
    const [activeTab, setActiveTab] = React.useState("sheet")
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [sheetRecords, setSheetRecords] = React.useState<DailyOTSheetRecord[]>([])
    const [summaryRecords, setSummaryRecords] = React.useState<DailyOTSummaryRecord[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [totalStats, setTotalStats] = React.useState({
        totalOT: 0,
        totalEmployees: 0,
        avgOT: 0,
        departments: 0
    })

    const [filters, setFilters] = React.useState<CommonFilterParams>({
        date: format(new Date(), "yyyy-MM-dd"),
    })

    const fetchSheetData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await attendanceService.getDailyOTSheet(filters)
            setSheetRecords(data.records)
            setTotalStats(prev => ({
                ...prev,
                totalOT: data.totalOTHours,
                totalEmployees: data.totalEmployees
            }))
        } catch (error) {
            toast.error("Failed to fetch OT sheet data")
        } finally {
            setIsLoading(false)
        }
    }, [filters])

    const fetchSummaryData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await attendanceService.getDailyOTSummary(filters)
            setSummaryRecords(data.departmentSummaries)
            setTotalStats(prev => ({
                ...prev,
                totalOT: data.grandTotalOTHours,
                totalEmployees: data.totalEmployees,
                departments: data.departmentSummaries.length,
                avgOT: data.totalEmployees > 0 ? data.grandTotalOTHours / data.totalEmployees : 0
            }))
        } catch (error) {
            toast.error("Failed to fetch OT summary data")
        } finally {
            setIsLoading(false)
        }
    }, [filters])

    React.useEffect(() => {
        if (activeTab === "sheet") {
            fetchSheetData()
        } else {
            fetchSummaryData()
        }
    }, [activeTab, fetchSheetData, fetchSummaryData])

    const sheetColumns: ColumnDef<DailyOTSheetRecord>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs font-semibold text-muted-foreground uppercase">{(row.index + 1).toString().padStart(2, '0')}</span>,
            enableSorting: false,
        },
        {
            accessorKey: "employeeId",
            header: "EMP ID",
            cell: ({ row }) => <span className="font-bold text-xs tabular-nums text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee Details",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">{row.original.employeeName}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{row.original.designation}</span>
                </div>
            )
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => <span className="text-xs font-medium text-slate-600">{row.original.department}</span>
        },
        {
            accessorKey: "inTime",
            header: "In Time",
            cell: ({ row }) => {
                const val = row.original.inTime
                if (!val) return <span className="text-xs font-bold text-red-300">--:--</span>
                return <span className="text-xs font-bold tabular-nums">{format(new Date(val), "hh:mm aa")}</span>
            }
        },
        {
            accessorKey: "outTime",
            header: "Out Time",
            cell: ({ row }) => {
                const val = row.original.outTime
                if (!val) return <span className="text-xs font-bold text-red-300">--:--</span>
                return <span className="text-xs font-bold tabular-nums">{format(new Date(val), "hh:mm aa")}</span>
            }
        },
        {
            accessorKey: "otHours",
            header: "OT Hours",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-emerald-600 text-sm tabular-nums underline decoration-emerald-200 decoration-2 underline-offset-4">
                        {row.original.otHours}h
                    </span>
                </div>
            )
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => <span className="text-[10px] italic text-muted-foreground max-w-[150px] truncate block">{row.original.remarks || "—"}</span>
        }
    ]

    const summaryColumns: ColumnDef<DailyOTSummaryRecord>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="font-bold text-xs">{(row.index + 1)}</span>,
        },
        {
            accessorKey: "department",
            header: "Department Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <IconBuildingFactory2 className="size-4" />
                    </div>
                    <span className="font-bold text-slate-800">{row.original.department}</span>
                </div>
            )
        },
        {
            accessorKey: "employeeCount",
            header: "Emp Count",
            cell: ({ row }) => <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{row.original.employeeCount} Staff</Badge>
        },
        {
            accessorKey: "totalOTHours",
            header: "Total OT",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (row.original.totalOTHours / (row.original.employeeCount * 4)) * 100)}%` }}
                        />
                    </div>
                    <span className="font-black text-emerald-600 tabular-nums">{row.original.totalOTHours.toFixed(2)} Hrs</span>
                </div>
            )
        },
        {
            accessorKey: "averageOTPerEmployee",
            header: "Avg OT",
            cell: ({ row }) => <span className="font-bold text-indigo-600 text-xs">{row.original.averageOTPerEmployee.toFixed(2)}h / emp</span>
        }
    ]

    const handleExportSheet = async () => {
        try {
            await attendanceService.exportDailyOTSheetExcel(filters)
            toast.success("OT Sheet exported successfully")
        } catch (error) {
            toast.error("Failed to export OT sheet")
        }
    }

    const handleExportSummary = async () => {
        try {
            await attendanceService.exportDailyOTSummaryExcel(filters)
            toast.success("OT Summary exported successfully")
        } catch (error) {
            toast.error("Failed to export OT summary")
        }
    }

    return (
        <div className="flex flex-col gap-8 py-8 px-8 min-h-screen bg-muted/30 dark:bg-background animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider mb-2">
                        <IconClock className="size-3" />
                        Payroll & Overtime
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Daily OT Analysis</h1>
                    <p className="text-muted-foreground text-base max-w-2xl">Monitor and manage daily overtime disbursements across all business units.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 gap-2 shadow-sm font-semibold transition-all"
                        onClick={handleExportSheet}
                    >
                        <IconFileSpreadsheet className="size-5 text-emerald-600" />
                        Export Sheet
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 gap-2 shadow-sm font-semibold transition-all"
                        onClick={handleExportSummary}
                    >
                        <IconDownload className="size-5 text-indigo-500" />
                        Final Summary
                    </Button>
                </div>
            </div>

            {/* Quick Insights Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="OT Staff"
                    value={totalStats.totalEmployees}
                    subtitle="Recipients Today"
                    icon={IconUsers}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
                <StatCard
                    title="Total OT Volume"
                    value={`${totalStats.totalOT.toFixed(1)}h`}
                    subtitle="Aggregated Hours"
                    icon={IconClock}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    title="Intensity Index"
                    value={`${totalStats.avgOT.toFixed(2)}h`}
                    subtitle="Avg OT per head"
                    icon={IconChartBar}
                    color="text-amber-600"
                    bgColor="bg-amber-50"
                />
                <StatCard
                    title="Active Depts"
                    value={activeTab === "summary" ? summaryRecords.length : totalStats.departments || "..."}
                    subtitle="Involved Entities"
                    icon={IconBuildingFactory2}
                    color="text-rose-600"
                    bgColor="bg-rose-50"
                />
            </div>

            {/* Main Content Area */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <TabsTrigger value="sheet" className="rounded-lg px-6 py-2 content-center font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <IconLayoutList className="size-4 mr-2" />
                            Daily OT Sheet
                        </TabsTrigger>
                        <TabsTrigger value="summary" className="rounded-lg px-6 py-2 font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <IconChartBar className="size-4 mr-2" />
                            OT Summary
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-8 px-4 rounded-full bg-white font-black text-slate-500 border-slate-200">
                            DATE: {filters.date}
                        </Badge>
                    </div>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="h-1 bg-indigo-600 w-full" />
                    <CardHeader className="flex flex-row items-center gap-4 pb-0">
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <IconFilter className="size-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black">Dynamic Data Filter</CardTitle>
                            <CardDescription>Refine results by business unit, staff IDs, and spatial factors.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 pb-8">
                        <AdvancedFilter
                            onFilterChange={setFilters}
                            initialFilters={filters}
                        />
                    </CardContent>
                </Card>

                <TabsContent value="sheet" className="m-0 border-none animate-in fade-in-50 duration-500">
                    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="border-b bg-slate-50/50 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <IconLayoutList className="size-4" />
                                    Detailed Overtime Records
                                </CardTitle>
                                <span className="text-[10px] font-bold text-slate-400">Showing {sheetRecords.length} entries</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={sheetColumns}
                                data={sheetRecords}
                                isLoading={isLoading}
                                searchKey="employeeName"
                                showActions={false}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="m-0 border-none animate-in fade-in-50 duration-500">
                    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-2xl">
                        <CardHeader className="border-b bg-indigo-50/30 py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                                    <IconChartBar className="size-4" />
                                    Department-wise OT Concentration
                                </CardTitle>
                                <span className="text-[10px] font-bold text-indigo-400">Based on active workforce</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={summaryColumns}
                                data={summaryRecords}
                                isLoading={isLoading}
                                showActions={false}
                                searchKey="department"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border-none shadow-md bg-white hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                        <h3 className={cn("text-3xl font-black tabular-nums", color)}>{value}</h3>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <IconArrowRight className="size-3 opacity-50" />
                            {subtitle}
                        </p>
                    </div>
                    <div className={cn("p-4 rounded-2xl", bgColor)}>
                        <Icon className={cn("size-6", color)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
