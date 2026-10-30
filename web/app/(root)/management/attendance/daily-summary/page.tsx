"use client"

import * as React from "react"
import {
    IconListCheck,
    IconUsers,
    IconUserCheck,
    IconUserOff,
    IconClock,
    IconCalendarEvent,
    IconLoader,
    IconLoader2,
    IconDownload,
    IconFilter,
    IconBuildingCommunity,
    IconBox,
    IconIdBadge2,
    IconLayoutList,
    IconUsersGroup,
    IconChevronDown,
    IconFileTypePdf,
    IconFileTypeXls
} from "@tabler/icons-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { SummaryCard } from "@/components/summary-card"
import { attendanceApi, type AttendanceQuery, type DailySummaryResponse } from "@/lib/services/attendance-api"
import { organogramService } from "@/lib/services/organogram"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"

const chartData = [
    { value: 40 }, { value: 45 }, { value: 42 }, { value: 48 },
    { value: 46 }, { value: 50 }, { value: 48 }, { value: 52 }
]

export default function DailySummaryPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [summaryData, setSummaryData] = React.useState<DailySummaryResponse | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasLoaded, setHasLoaded] = React.useState(false)
    const [isExportingExcel, setIsExportingExcel] = React.useState(false)
    const [isExportingPdf, setIsExportingPdf] = React.useState(false)
    const [departments, setDepartments] = React.useState<any[]>([])
    const [deptFilter, setDeptFilter] = React.useState("all")
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)

    const fetchData = React.useCallback(async (q: AttendanceQuery) => {
        setIsLoading(true)
        try {
            const data = await attendanceApi.getDailySummary(q)
            setSummaryData(data)
            setHasLoaded(true)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch daily summary data")
            setSummaryData(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        organogramService.getDepartments().then(setDepartments)
    }, [])

    const handleExportExcel = async () => {
        setIsExportingExcel(true)
        try {
            if (activeQuery) {
                await attendanceApi.exportReport(
                    "daily-summary",
                    activeQuery,
                    "xlsx",
                    `daily-summary-${activeQuery.fromDate}`,
                )
            }
            toast.success("Excel exported successfully")
        } catch {
            toast.error("Failed to export Excel")
        } finally {
            setIsExportingExcel(false)
        }
    }

    const handleExportPdf = async () => {
        setIsExportingPdf(true)
        try {
            if (activeQuery) {
                await attendanceApi.exportReport(
                    "daily-summary",
                    activeQuery,
                    "pdf",
                    `daily-summary-${activeQuery.fromDate}`,
                )
            }
            toast.success("PDF exported successfully")
        } catch {
            toast.error("Failed to export PDF")
        } finally {
            setIsExportingPdf(false)
        }
    }

    const handleExportExcelAll = async () => {
        if (!date) return
        try {
            if (activeQuery) {
                await attendanceApi.exportReport(
                    "daily-summary",
                    activeQuery,
                    "xlsx",
                    `daily-summary-all-${activeQuery.fromDate}`,
                )
            }
            toast.success("Full Excel exported successfully")
        } catch {
            toast.error("Failed to export full Excel")
        }
    }

    const getColumns = (title: string, accessorKey: string): ColumnDef<any>[] => [
        {
            accessorKey: accessorKey,
            header: title,
            cell: ({ row }) => <span className="font-bold text-sm text-foreground">{row.original[accessorKey]}</span>
        },
        {
            accessorKey: "totalEmployees",
            header: "Total",
            cell: ({ row }) => <span className="font-bold text-sm text-muted-foreground">{row.original.totalEmployees}</span>
        },
        {
            accessorKey: "present",
            header: "Present",
            cell: ({ row }) => <span className="text-primary font-bold text-sm">{row.original.present}</span>
        },
        {
            accessorKey: "absent",
            header: "Absent",
            cell: ({ row }) => <span className="text-destructive font-bold text-sm">{row.original.absent}</span>
        },
        {
            accessorKey: "late",
            header: "Late",
            cell: ({ row }) => <span className="text-amber-600 font-bold text-sm">{row.original.late}</span>
        },
        {
            accessorKey: "onLeave",
            header: "Leave",
            cell: ({ row }) => <span className="text-blue-600 font-bold text-sm">{row.original.onLeave}</span>
        },
        {
            accessorKey: "attendanceRate",
            header: "Rate (%)",
            cell: ({ row }) => {
                const rate = row.original.attendanceRate
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all rounded-full",
                                    rate >= 90 ? "bg-primary" :
                                        rate >= 75 ? "bg-amber-500" :
                                            "bg-destructive"
                                )}
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-muted-foreground">{rate}%</span>
                    </div>
                )
            }
        }
    ]

    const columns = getColumns("Department", "departmentName")

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconListCheck className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily Summary</h1>
                        <p className="text-muted-foreground text-sm">Attendance breakdown for {date ? format(date, "PPP") : "today"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="gap-2 h-9"
                                disabled={isExportingExcel || isExportingPdf}
                            >
                                {isExportingExcel || isExportingPdf ? (
                                    <IconLoader2 className="size-4 animate-spin" />
                                ) : (
                                    <IconDownload className="size-4" />
                                )}
                                {isExportingExcel ? "Exporting Excel..." : isExportingPdf ? "Exporting PDF..." : "Export"}
                                <IconChevronDown className="size-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-primary/10">
                            <DropdownMenuLabel className="text-xs font-bold opacity-50">Generate Report</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleExportPdf}
                                className="cursor-pointer gap-2 py-2"
                                disabled={isExportingPdf}
                            >
                                {isExportingPdf ? (
                                    <IconLoader2 className="size-4 animate-spin text-destructive" />
                                ) : (
                                    <IconFileTypePdf className="size-4 text-destructive" />
                                )}
                                <span className="font-semibold">{isExportingPdf ? "Generating..." : "Download PDF"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleExportExcel}
                                className="cursor-pointer gap-2 py-2"
                                disabled={isExportingExcel}
                            >
                                {isExportingExcel ? (
                                    <IconLoader2 className="size-4 animate-spin text-primary" />
                                ) : (
                                    <IconDownload className="size-4 text-primary" />
                                )}
                                <span className="font-semibold">{isExportingExcel ? "Generating..." : "Download Excel"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Filters — always visible so users can select company and apply */}
            <div className="px-6">
                <AttendanceCompanyFilter
                    isLoading={isLoading}
                    onFilterChange={({ query, legacy }) => {
                        if (query.date) {
                            setDate(new Date(query.date + "T00:00:00"))
                        }
                        setDeptFilter(legacy?.departmentId?.toString() || "all")
                        setActiveQuery(query)
                        fetchData(query)
                    }}
                    initialDate={date ? format(date, "yyyy-MM-dd") : undefined}
                />
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <IconLoader className="size-8 animate-spin text-muted-foreground" />
                </div>
            ) : !hasLoaded ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Select a company above to load the daily attendance summary.
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 px-6">
                        <SummaryCard
                            title="Total Workforce"
                            value={summaryData?.overallSummary.totalHeadcount.toString() || "0"}
                            icon={IconUsers}
                            status="primary"

                        />
                        <SummaryCard
                            title="Present"
                            value={summaryData?.overallSummary.presentCount.toString() || "0"}
                            icon={IconUserCheck}
                            trend={{
                                value: `${summaryData?.overallSummary.attendanceRate || 0}%`,
                                label: "attendance",
                                isUp: true
                            }}
                            status="success"
                        />
                        <SummaryCard
                            title="Absent"
                            value={summaryData?.overallSummary.absentCount.toString() || "0"}
                            icon={IconUserOff}
                            trend={{
                                value: `${summaryData?.overallSummary.leaveCount || 0}`,
                                label: "on leave",
                                isUp: false
                            }}
                            status="error"
                        />
                        <SummaryCard
                            title="Late Entry"
                            value={summaryData?.overallSummary.lateCount.toString() || "0"}
                            icon={IconClock}
                            trend={{
                                value: "Needs review",
                                label: "by supervisor",
                                isUp: false
                            }}
                            status="warning"
                        />
                    </div>

                    {/* Breakdowns */}
                    <div className="px-6">
                        <Tabs defaultValue="department" className="w-full space-y-6">
                            <TabsList className="bg-muted/50 p-1 h-11 w-full justify-start rounded-lg">
                                <TabsTrigger value="department" className="gap-2 px-4 h-9">
                                    <IconBuildingCommunity className="size-4" /> Department
                                </TabsTrigger>
                                <TabsTrigger value="section" className="gap-2 px-4 h-9">
                                    <IconBox className="size-4" /> Section
                                </TabsTrigger>
                                <TabsTrigger value="designation" className="gap-2 px-4 h-9">
                                    <IconIdBadge2 className="size-4" /> Designation
                                </TabsTrigger>
                                <TabsTrigger value="line" className="gap-2 px-4 h-9">
                                    <IconLayoutList className="size-4" /> Line
                                </TabsTrigger>
                                <TabsTrigger value="group" className="gap-2 px-4 h-9">
                                    <IconUsersGroup className="size-4" /> Group
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="department" className="mt-0">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={columns}
                                            data={summaryData?.departmentSummaries || []}
                                            showColumnCustomizer={false}
                                            showActions={false}
                                            showTabs={false}
                                            searchKey="departmentName"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="section" className="mt-0">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle className="text-base font-semibold">Section Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={getColumns("Section", "sectionName")}
                                            data={summaryData?.sectionSummaries || []}
                                            showColumnCustomizer={false}
                                            showActions={false}
                                            showTabs={false}
                                            searchKey="sectionName"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="designation" className="mt-0">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle className="text-base font-semibold">Designation Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={getColumns("Designation", "designationName")}
                                            data={summaryData?.designationSummaries || []}
                                            showColumnCustomizer={false}
                                            showActions={false}
                                            showTabs={false}
                                            searchKey="designationName"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="line" className="mt-0">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle className="text-base font-semibold">Line Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={getColumns("Line", "lineName")}
                                            data={summaryData?.lineSummaries || []}
                                            showColumnCustomizer={false}
                                            showActions={false}
                                            showTabs={false}
                                            searchKey="lineName"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="group" className="mt-0">
                                <Card>
                                    <CardHeader className="pb-4 border-b">
                                        <CardTitle className="text-base font-semibold">Group Summary</CardTitle>
                                        <CardDescription>Department & Section Hierarchy</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={[
                                                {
                                                    accessorKey: "departmentName",
                                                    header: ({ column }: { column: any }) => (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                                            className="font-medium text-xs px-0 hover:bg-transparent"
                                                        >
                                                            Department
                                                            <IconFilter className="ml-2 size-3 opacity-50" />
                                                        </Button>
                                                    ),
                                                    cell: ({ row }: { row: any }) => <span className="font-medium text-sm">{row.getValue("departmentName")}</span>
                                                },
                                                {
                                                    accessorKey: "sectionName",
                                                    header: "Section",
                                                    cell: ({ row }: { row: any }) => <span className="text-sm text-muted-foreground">{row.getValue("sectionName")}</span>
                                                },
                                                {
                                                    accessorKey: "totalEmployees",
                                                    header: "Total",
                                                    cell: ({ row }: { row: any }) => <span className="font-semibold text-sm">{row.getValue("totalEmployees")}</span>
                                                },
                                                {
                                                    accessorKey: "present",
                                                    header: "Present",
                                                    cell: ({ row }: { row: any }) => <span className="text-green-600 font-medium text-sm">{row.getValue("present")}</span>
                                                },
                                                {
                                                    accessorKey: "absent",
                                                    header: "Absent",
                                                    cell: ({ row }: { row: any }) => <span className="text-red-600 font-medium text-sm">{row.getValue("absent")}</span>
                                                },
                                                {
                                                    accessorKey: "late",
                                                    header: "Late",
                                                    cell: ({ row }: { row: any }) => <span className="text-amber-600 font-medium text-sm">{row.getValue("late")}</span>
                                                },
                                                {
                                                    accessorKey: "onLeave",
                                                    header: "Leave",
                                                    cell: ({ row }: { row: any }) => <span className="text-blue-600 font-medium text-sm">{row.getValue("onLeave")}</span>
                                                },
                                                {
                                                    accessorKey: "attendanceRate",
                                                    header: "Rate (%)",
                                                    cell: ({ row }: { row: any }) => {
                                                        const rate = parseFloat(row.getValue("attendanceRate"))
                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-muted rounded-full">
                                                                    <div
                                                                        className={cn("h-full rounded-full", rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                                                                        style={{ width: `${rate}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium tabular-nums">{rate}%</span>
                                                            </div>
                                                        )
                                                    }
                                                }
                                            ]}
                                            data={summaryData?.deptSectionSummaries || []}
                                            showColumnCustomizer={false}
                                            showActions={false}
                                            showTabs={false}
                                            searchKey="departmentName"
                                        />

                                        {/* Footer Section */}
                                        <div className="bg-muted/30 border-t p-4 flex flex-wrap justify-end gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Total Worker:</span>
                                                <span className="font-bold">
                                                    {summaryData?.groupSummaries?.find(g => g.groupName === 'Worker')?.totalEmployees || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Total Staff:</span>
                                                <span className="font-bold">
                                                    {summaryData?.groupSummaries?.find(g => g.groupName === 'Staff')?.totalEmployees || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            )}
        </div>
    )
}
