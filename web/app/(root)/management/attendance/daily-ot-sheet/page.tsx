"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconClock,
    IconUser,
    IconRefresh,
    IconPrinter,
    IconActivity,
    IconChevronDown,
    IconLoader2,
    IconArrowLeft
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { overtimeService, type DailyOtSheetRow } from "@/lib/services/overtime"
import { type AttendanceQuery, toAttendanceExportParams } from "@/lib/services/attendance-api"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { organogramService } from "@/lib/services/organogram"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"

export default function DailyOTSheetPage() {
    const router = useRouter()
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [empId, setEmpId] = React.useState("")
    const [department, setDepartment] = React.useState("all")
    const [designation, setDesignation] = React.useState("all")

    const [isLoading, setIsLoading] = React.useState(false)
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)
    const [filteredData, setFilteredData] = React.useState<DailyOtSheetRow[]>([])
    const [totalOT, setTotalOT] = React.useState(0)
    const [hasSearched, setHasSearched] = React.useState(false)

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

    const handleSearch = React.useCallback(async (q: AttendanceQuery) => {
        setIsLoading(true)
        try {
            const data = await overtimeService.getDailyOTSheet(q)
            setFilteredData(data)
            setTotalOT(data.reduce((sum, r) => sum + r.otHours, 0))
            setHasSearched(true)
        } catch {
            toast.error("Generation failed")
        } finally {
            setIsLoading(false)
        }
    }, [])

    const columns: ColumnDef<DailyOtSheetRow>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.designation}</span>
                </div>
            )
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => <span className="text-xs">{row.original.department}</span>
        },
        {
            accessorKey: "section",
            header: "Section",
            cell: ({ row }) => <span className="text-xs">{row.original.section}</span>
        },
        {
            accessorKey: "inTime",
            header: "In Time",
            cell: ({ row }) => {
                const val = row.original.inTime
                if (!val) return <span className="text-xs text-muted-foreground opacity-50">--:--</span>
                try {
                    return <span className="text-xs font-medium">{format(new Date(val), "hh:mm aa")}</span>
                } catch {
                    return <span className="text-xs">{val}</span>
                }
            }
        },
        {
            accessorKey: "outTime",
            header: "Out Time",
            cell: ({ row }) => {
                const val = row.original.outTime
                if (!val) return <span className="text-xs text-muted-foreground opacity-50">--:--</span>
                try {
                    return <span className="text-xs font-medium">{format(new Date(val), "hh:mm aa")}</span>
                } catch {
                    return <span className="text-xs">{val}</span>
                }
            }
        },
        {
            accessorKey: "otHours",
            header: "OT Hours",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                    {row.original.otHours} hrs
                </Badge>
            )
        }
    ]



    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daily OT Sheet</h1>
                        <p className="text-sm text-muted-foreground">Overtime records and worker movement synchronization</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {hasSearched && activeQuery && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/attendance/reports/daily-ot-sheet"
                            params={toAttendanceExportParams(activeQuery)}
                            filePrefix={`daily-ot-sheet-${activeQuery.date ?? activeQuery.fromDate}`}
                            disabled={isLoading || filteredData.length === 0}
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
                            handleSearch(query)
                        }}
                        initialDate={date ? format(date, "yyyy-MM-dd") : undefined}
                    />
                </div>

                {hasSearched && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-linear-to-br from-primary/5 to-white dark:from-primary/10 dark:to-card overflow-hidden relative group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total OT Hours</p>
                                    <IconClock className="size-4 text-primary opacity-50" />
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight text-primary">{totalOT.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">hrs</span></h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-linear-to-br from-blue-50/50 to-white dark:from-blue-950/10 dark:to-card overflow-hidden relative group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Workers Count</p>
                                    <IconUser className="size-4 text-blue-500 opacity-50" />
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight">{filteredData.length}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-linear-to-br from-indigo-50/50 to-white dark:from-indigo-950/10 dark:to-card overflow-hidden relative group">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Average Per Person</p>
                                    <IconActivity className="size-4 text-indigo-500 opacity-50" />
                                </div>
                                <h3 className="text-3xl font-bold tracking-tight">{filteredData.length > 0 ? (totalOT / filteredData.length).toFixed(1) : "0.0"} <span className="text-sm font-medium text-muted-foreground">hrs</span></h3>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {hasSearched ? (
                    <Card className="border shadow-sm overflow-hidden bg-card dark:border-zinc-800">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">OT Data Sheet</CardTitle>
                                <Badge variant="outline" className="font-medium bg-background">
                                    {filteredData.length} records found
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable columns={columns} data={filteredData} showColumnCustomizer={false} showActions={false} showTabs={false} />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl bg-muted/20 text-muted-foreground outline-none">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <IconClock size={40} className="animate-pulse" />
                        </div>
                        <p className="font-semibold text-lg">No OT data generated</p>
                        <p className="text-sm opacity-70">Select parameters and click 'Generate Sheet' to begin</p>
                    </div>
                )}
            </div>
        </div>
    )
}
