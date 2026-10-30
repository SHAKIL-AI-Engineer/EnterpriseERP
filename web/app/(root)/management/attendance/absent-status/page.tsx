"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconUserX,
    IconSearch,
    IconDownload,
    IconRefresh,
    IconAlertTriangle,
    IconCalendarOff,
    IconActivity,
    IconArrowLeft
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { absenteeismService, type AbsenteeismRecord, type AbsenteeismSummary } from "@/lib/services/absenteeism"
import { type CommonFilterParams } from "@/lib/services/attendance"
import { type AttendanceQuery } from "@/lib/services/attendance-api"
import { organogramService } from "@/lib/services/organogram"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"
import { Label } from "@/components/ui/label"

export default function AbsentStatusPage() {
    const router = useRouter()
    const [empId, setEmpId] = React.useState("")
    const [department, setDepartment] = React.useState("all")
    const [designation, setDesignation] = React.useState("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    })

    const [isLoading, setIsLoading] = React.useState(false)
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd")
    })
    const [filteredData, setFilteredData] = React.useState<AbsenteeismRecord[]>([])
    const [summary, setSummary] = React.useState<AbsenteeismSummary | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)

    const [departments, setDepartments] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])

    React.useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [depts, desigs] = await Promise.all([
                    organogramService.getDepartments(),
                    organogramService.getDesignations()
                ])
                setDepartments(depts)
                setDesignations(desigs)
            } catch (error) {
                console.error("Filter sync failed")
            }
        }
        fetchFilters()
    }, [])

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
                    <span className="font-semibold text-gray-900">{row.original.employeeName}</span>
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
                    row.original.consecutiveDays >= 3 ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600"
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
                    row.original.status === "Absent" ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"
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
            if (!activeQuery) {
                toast.error("Select company in filters first")
                return
            }
            const data = await absenteeismService.getAbsenteeismRecords(activeQuery)
            setFilteredData(data.records)
            setSummary(data.summary)
            setHasSearched(true)
        } catch (error: any) {
            toast.error("Analysis failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Absenteeism Records</h1>
                        <p className="text-sm text-gray-500">Monitor and audit employee absences and leave trends</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSearch()}>
                        <IconRefresh size={18} className={cn("mr-2", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" disabled={filteredData.length === 0}>
                        <IconDownload className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Absent</p>
                                <h3 className="text-2xl font-bold mt-1 text-red-600">{summary.totalAbsent}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Without Leave</p>
                                <h3 className="text-2xl font-bold mt-1 text-red-600">{summary.absentWithoutLeave}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">On Leave</p>
                                <h3 className="text-2xl font-bold mt-1 text-blue-600">{summary.onLeave}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Critical Cases</p>
                                <h3 className="text-2xl font-bold mt-1 text-orange-600">{summary.criticalCases}</h3>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="px-6">
                    <AttendanceCompanyFilter
                        showDate={false}
                        showDateRange
                        onFilterChange={({ query }) => {
                            setActiveQuery(query)
                            setFullFilters({
                                startDate: query.fromDate,
                                endDate: query.toDate,
                            })
                        }}
                        initialStartDate={fullFilters.startDate}
                        initialEndDate={fullFilters.endDate}
                    />
                </div>

                <Card className="border shadow-none overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">Absenteeism List</CardTitle>
                            {hasSearched && (
                                <Badge variant="outline" className="bg-white font-medium">
                                    {filteredData.length} Records Found
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={columns} data={filteredData} showColumnCustomizer={false} searchKey="employeeName" showActions={false} showTabs={false} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
