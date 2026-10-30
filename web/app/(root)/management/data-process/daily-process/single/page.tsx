"use client"

import * as React from "react"
import {
    IconCalendarStats,
    IconPlayerPlay,
    IconCheck,
    IconLoader2,
    IconInfoCircle,
    IconUser,
    IconArrowLeft,
    IconFilter,
    IconRefresh
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DateRange } from "react-day-picker"
import { differenceInCalendarDays, format } from "date-fns"
import { attendanceApi } from "@/lib/services/attendance-api"
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select"
import { employeeService, EmployeeMini } from "@/lib/services/employee"
import { organogramService, Department, Section, Designation, Line, Shift, Group } from "@/lib/services/organogram"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { NativeSelect } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

function processProgressLabel(progress: number): string {
    if (progress < 25) return "Preparing selected employees..."
    if (progress < 45) return "Reading punch records..."
    if (progress < 70) return "Evaluating shifts and attendance rules..."
    if (progress < 90) return "Saving daily attendance..."
    return "Finalizing result..."
}

export default function DailyProcessSinglePage() {
    const router = useRouter()
    const [range, setRange] = React.useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(),
    })

    // Filters state
    const [filters, setFilters] = React.useState({
        departmentId: "",
        sectionId: "",
        designationId: "",
        lineId: "",
        shiftId: "",
        groupId: "",
        searchTerm: ""
    })

    // Data for dropdowns
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [lines, setLines] = React.useState<Line[]>([])
    const [shifts, setShifts] = React.useState<Shift[]>([])
    const [groups, setGroups] = React.useState<Group[]>([])

    const [employees, setEmployees] = React.useState<EmployeeMini[]>([])
    const [selectedEmployees, setSelectedEmployees] = React.useState<EmployeeMini[]>([])
    const [loading, setLoading] = React.useState(false)
    const [processing, setProcessing] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
    const [processingScope, setProcessingScope] = React.useState("")
    const [result, setResult] = React.useState<string | null>(null)
    const [companyId, setCompanyId] = React.useState("")

    // Load initial dropdown data
    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [depts, shfts, grps] = await Promise.all([
                    organogramService.getDepartments(),
                    organogramService.getShifts(),
                    organogramService.getGroups()
                ])
                setDepartments(depts)
                setShifts(shfts)
                setGroups(grps)
            } catch (error) {
                console.error("Failed to load filter data", error)
            }
        }
        loadInitialData()
    }, [])

    // Dependent filters
    React.useEffect(() => {
        if (filters.departmentId) {
            organogramService.getSections({ departmentId: parseInt(filters.departmentId) }).then(setSections)
        } else {
            setSections([])
        }
    }, [filters.departmentId])

    React.useEffect(() => {
        if (filters.sectionId) {
            Promise.all([
                organogramService.getDesignations({ sectionId: parseInt(filters.sectionId) }),
                organogramService.getLines({ sectionId: parseInt(filters.sectionId) })
            ]).then(([desigs, lns]) => {
                setDesignations(desigs)
                setLines(lns)
            })
        } else {
            setDesignations([])
            setLines([])
        }
    }, [filters.sectionId])

    const fetchEmployees = async () => {
        setLoading(true)
        try {
            const data = await employeeService.getEmployeesMini({
                departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                sectionId: filters.sectionId ? parseInt(filters.sectionId) : undefined,
                designationId: filters.designationId ? parseInt(filters.designationId) : undefined,
                lineId: filters.lineId ? parseInt(filters.lineId) : undefined,
                shiftId: filters.shiftId ? parseInt(filters.shiftId) : undefined,
                groupId: filters.groupId ? parseInt(filters.groupId) : undefined,
                searchTerm: filters.searchTerm
            })
            setEmployees(data)
        } catch (error) {
            toast.error("Failed to fetch employees")
        } finally {
            setLoading(false)
        }
    }

    const handleProcess = async (type: 'selected' | 'all') => {
        if (!range?.from) return toast.error("Please select a date range")
        if (!companyId) return toast.error("Please select a company")

        const employeeIDs =
            type === "selected"
                ? selectedEmployees.map((e) => e.employeeId)
                : employees.map((e) => e.employeeId)
        if (type === "selected" && (!employeeIDs || employeeIDs.length === 0)) {
            return toast.error("No employees selected")
        }
        if (type === "all" && employeeIDs.length === 0) {
            return toast.error("No filtered employees found")
        }

        setProcessing(true)
        setProgress(5)
        setElapsedSeconds(0)
        setProcessingScope(
            `${employeeIDs.length} ${employeeIDs.length === 1 ? "employee" : "employees"}${
                type === "all" ? " from current filter" : ""
            }`,
        )
        setResult(null)
        const end = range.to ?? range.from
        const totalDays = Math.max(1, differenceInCalendarDays(end, range.from) + 1)
        const startedAt = Date.now()
        const progressTimer = window.setInterval(() => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000)
            setElapsedSeconds(elapsed)
            setProgress((current) => {
                if (current >= 95) return current
                const rowFactor = employeeIDs.length > 500 || totalDays > 7 ? 1 : 3
                return Math.min(95, current + rowFactor)
            })
        }, 1000)

        try {
            const response = await attendanceApi.processRange({
                companyId,
                startDate: format(range.from, "yyyy-MM-dd"),
                endDate: format(end, "yyyy-MM-dd"),
                employeeIDs,
            })
            setProgress(100)
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
            setResult(
                `Processed ${response.recordsProcessed} records across ${response.daysProcessed} day(s).` +
                    (response.errors.length ? ` ${response.errors.length} day(s) had errors.` : ""),
            )
            toast.success("Process completed successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Processing failed")
            setProgress(0)
        } finally {
            window.clearInterval(progressTimer)
            setProcessing(false)
        }
    }

    const columns: ColumnDef<EmployeeMini>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.getValue("employeeId")}</span>,
        },
        {
            accessorKey: "fullNameEn",
            header: "Name",
        },
        {
            accessorKey: "departmentName",
            header: "Department",
        },
        {
            accessorKey: "sectionName",
            header: "Section",
        },
        {
            accessorKey: "designationName",
            header: "Designation",
        },
        {
            accessorKey: "lineName",
            header: "Line",
        },
        {
            accessorKey: "shiftName",
            header: "Shift",
        },
        {
            accessorKey: "groupName",
            header: "Group",
        }
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-2">
                    <IconUser className="size-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">Daily Process (Single & Multiple)</h1>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
                    <IconArrowLeft className="size-4" />
                    Back
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 lg:px-6">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border shadow-none h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-md flex items-center gap-2">
                                <IconFilter className="size-4" />
                                Selection Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Company</Label>
                                <ScopedCompanySelect
                                    value={companyId}
                                    onChange={(entityId) => setCompanyId(entityId)}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Department</Label>
                                <NativeSelect
                                    value={filters.departmentId}
                                    onChange={e => setFilters({ ...filters, departmentId: e.target.value, sectionId: "", designationId: "", lineId: "" })}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Section</Label>
                                <NativeSelect
                                    value={filters.sectionId}
                                    onChange={e => setFilters({ ...filters, sectionId: e.target.value, designationId: "", lineId: "" })}
                                    disabled={!filters.departmentId}
                                >
                                    <option value="">All Sections</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Designation</Label>
                                <NativeSelect
                                    value={filters.designationId}
                                    onChange={e => setFilters({ ...filters, designationId: e.target.value })}
                                    disabled={!filters.sectionId}
                                >
                                    <option value="">All Designations</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Line</Label>
                                <NativeSelect
                                    value={filters.lineId}
                                    onChange={e => setFilters({ ...filters, lineId: e.target.value })}
                                    disabled={!filters.sectionId}
                                >
                                    <option value="">All Lines</option>
                                    {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Shift</Label>
                                <NativeSelect
                                    value={filters.shiftId}
                                    onChange={e => setFilters({ ...filters, shiftId: e.target.value })}
                                >
                                    <option value="">All Shifts</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Search</Label>
                                <Input
                                    placeholder="Employee ID or Name..."
                                    value={filters.searchTerm}
                                    onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
                                />
                            </div>
                            <Button className="w-full gap-2 mt-2" onClick={fetchEmployees} disabled={loading}>
                                <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                                Get Employees
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-none">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-md flex items-center gap-2">
                                <IconCalendarStats className="size-4" />
                                Target Date Range
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DateRangePicker date={range} setDate={setRange} />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="border shadow-none overflow-hidden h-full flex flex-col">
                        <div className="bg-muted/30 border-b px-4 py-3 flex items-center justify-between shrink-0">
                            <div className="flex flex-col">
                                <h3 className="text-sm font-semibold">Matched Employees ({employees.length})</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Select employees to process</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleProcess('selected')}
                                    disabled={processing || selectedEmployees.length === 0 || !range?.from}
                                >
                                    <IconPlayerPlay className="size-3 fill-current" />
                                    Process Selected ({selectedEmployees.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleProcess('all')}
                                    disabled={processing || employees.length === 0 || !range?.from}
                                >
                                    <IconRefresh className="size-3" />
                                    Process Bulk (Filtered)
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-0 flex-1 relative min-h-[400px]">
                            {processing && (
                                <div className="absolute inset-x-0 top-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-b animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <IconLoader2 className="size-5 animate-spin text-primary" />
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                                                <p>{processProgressLabel(progress)}</p>
                                                <span>{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground italic">
                                                Processing {processingScope || "employees"} for{" "}
                                                {range?.from ? format(range.from, "dd MMM yyyy") : ""}
                                                {range?.to ? ` to ${format(range.to, "dd MMM yyyy")}` : ""}
                                                {elapsedSeconds > 0 ? ` • ${elapsedSeconds}s elapsed` : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {result && !processing && (
                                <div className="mx-4 mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-md flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <IconCheck className="size-4 stroke-3" />
                                    <p className="text-sm font-medium">{result}</p>
                                </div>
                            )}
                            <DataTable
                                data={employees}
                                columns={columns}
                                enableSelection={true}
                                showTabs={false}
                                showActions={false}
                                showColumnCustomizer={false}
                                isLoading={loading}
                                onSelectionChange={setSelectedEmployees}
                                searchKey="fullNameEn"
                            />
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t py-4">
                            <div className="flex gap-2 items-start text-xs text-muted-foreground">
                                <IconInfoCircle className="size-4 shrink-0 text-primary opacity-70" />
                                <p>Use filters on the left to find employees. You can select individual employees from the table or process the entire filtered list at once.</p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
