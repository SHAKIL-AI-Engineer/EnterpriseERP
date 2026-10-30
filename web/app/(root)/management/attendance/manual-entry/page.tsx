"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconSearch,
    IconFilter,
    IconX,
    IconDownload,
    IconUpload,
    IconClock,
    IconCheck,
    IconActivity,
    IconRefresh,
    IconUsers,
    IconCalendarCheck
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"
import { CommonFilterParams } from "@/lib/services/attendance"
import { attendanceApi, type AttendanceQuery } from "@/lib/services/attendance-api"
import { useAuth } from "@/components/providers/auth-provider"
import { employeeService, EmployeeSimple } from "@/lib/services/employee"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Types for the local table
interface EmployeeRow {
    id: number
    employeeId: string
    name: string
    designation: string
    department: string
    shift: string
    status: string
    company: string
    section: string
    line: string
    group: string
    floor: string
    gender: string
    religion: string
    companyId: number
}

export default function ManualAttendancePage() {
    const { user } = useAuth()
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)
    // State Management
    const [employees, setEmployees] = React.useState<EmployeeRow[]>([])
    const [selectedEmployees, setSelectedEmployees] = React.useState<EmployeeRow[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [showBulkEntryDialog, setShowBulkEntryDialog] = React.useState(false)

    // Filter States
    const [fullFilters, setFullFilters] = React.useState<CommonFilterParams>({
        status: "all"
    })

    // Bulk Entry States
    const [bulkCheckIn, setBulkCheckIn] = React.useState<Date | undefined>(() => {
        const d = new Date()
        d.setHours(9, 0, 0, 0)
        return d
    })
    const [bulkCheckOut, setBulkCheckOut] = React.useState<Date | undefined>(() => {
        const d = new Date()
        d.setHours(18, 0, 0, 0)
        return d
    })
    const [bulkStatus, setBulkStatus] = React.useState("Present")
    const [bulkRemarks, setBulkRemarks] = React.useState("")

    // Fetch Employees based on filters
    const fetchEmployees = React.useCallback(async (params: CommonFilterParams = {}) => {
        setIsLoading(true)
        try {
            const apiParams: any = { ...params }
            if (params.status === 'all') delete apiParams.status

            const data = await employeeService.getEmployeesSimple(apiParams)
            const employeeData = data.map((emp: EmployeeSimple) => ({
                id: emp.id,
                employeeId: emp.employeeId || "",
                name: emp.fullNameEn || "Unknown",
                designation: emp.designationName || "N/A",
                department: emp.departmentName || "N/A",
                shift: emp.shiftName || "General",
                status: emp.status || "Active",
                company: emp.companyName || "N/A",
                section: emp.sectionName || "N/A",
                line: emp.lineName || "N/A",
                group: emp.groupName || "N/A",
                floor: emp.floorName || "N/A",
                gender: emp.gender || "N/A",
                religion: emp.religion || "N/A",
                companyId: emp.companyId || 0
            }))
            setEmployees(employeeData)
        } catch (error) {
            console.error("Error fetching employees:", error)
            toast.error("Failed to fetch employees")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchEmployees(fullFilters)
    }, [fullFilters, fetchEmployees])

    // Handle Bulk Entry Submit
    const handleBulkEntry = async () => {
        if (selectedEmployees.length === 0) {
            toast.error("Please select at least one employee")
            return
        }
        if (!bulkCheckIn) {
            toast.error("Please select an In-Time")
            return
        }

        setIsLoading(true)
        try {
            if (!activeQuery) {
                toast.error("Apply filters and select a company first")
                return
            }
            const adminId = user?.id ?? "00000000-0000-0000-0000-000000000001"
            const entryDate = format(bulkCheckIn, "yyyy-MM-dd")
            await attendanceApi.bulkAdjust({
                companyId: activeQuery.companyId,
                adminId,
                entries: selectedEmployees.map((emp) => ({
                    employeeID: emp.employeeId,
                    date: entryDate,
                    inTime: bulkCheckIn?.toISOString(),
                    outTime: bulkCheckOut?.toISOString(),
                    remarks: bulkRemarks || bulkStatus,
                })),
            })

            toast.success(`Attendance recorded for ${selectedEmployees.length} employees`)
            setShowBulkEntryDialog(false)
            setSelectedEmployees([])
            setBulkRemarks("")
        } catch (error: any) {
            console.error("Error recording attendance:", error)
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to record attendance"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    // Table Columns
    const columns = React.useMemo<ColumnDef<EmployeeRow>[]>(() => [
        {
            accessorKey: "employeeId",
            header: "Employee ID",
            cell: ({ row }) => <span className="font-bold tabular-nums text-sm text-foreground">{row.original.employeeId}</span>,
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <span className="font-medium text-sm text-foreground">{row.original.name}</span>,
        },
        {
            accessorKey: "department",
            header: "Organization",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{row.original.department}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{row.original.company}</span>
                </div>
            )
        },
        {
            accessorKey: "designation",
            header: "Role",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{row.original.designation}</span>
                    <span className="text-xs text-muted-foreground">{row.original.section}</span>
                </div>
            )
        },
        {
            accessorKey: "shift",
            header: "Shift",
            cell: ({ row }) => <Badge variant="outline" className="font-medium text-[10px] uppercase px-2 py-0">{row.original.shift}</Badge>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.status === "Active"
                return (
                    <Badge variant={isActive ? "default" : "secondary"} className={cn(
                        "font-medium text-[10px] uppercase px-2 py-0",
                        isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    )}>
                        {row.original.status}
                    </Badge>
                )
            },
        },
    ], [])

    return (
        <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconCalendarCheck size={28} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manual Entry</h1>
                    </div>
                    <p className="text-muted-foreground ml-11">Bulk record attendance for selected employees</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="font-semibold shadow-sm rounded-xl">
                        <IconDownload className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" className="font-semibold shadow-sm rounded-xl">
                        <IconUpload className="mr-2 h-4 w-4" /> Import
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    <AttendanceCompanyFilter
                        onFilterChange={({ query, legacy }) => {
                            setActiveQuery(query)
                            const next = {
                                ...fullFilters,
                                companyId: legacy?.companyId,
                                departmentId: legacy?.departmentId,
                                sectionId: legacy?.sectionId,
                                designationId: legacy?.designationId,
                            }
                            setFullFilters(next)
                            fetchEmployees(next)
                        }}
                        showDate={false}
                    />
                </CardContent>
            </Card>

            <Card className="border shadow-none overflow-hidden rounded-2xl">
                <CardHeader className="bg-gray-50/50 border-b py-6 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <IconUsers size={20} className="text-primary" />
                            Employee Selection
                        </CardTitle>
                        <CardDescription>Select employees to apply manual attendance</CardDescription>
                    </div>
                    {selectedEmployees.length > 0 && (
                        <Button
                            onClick={() => setShowBulkEntryDialog(true)}
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl animate-in fade-in slide-in-from-right-4 transition-all"
                        >
                            <IconCheck className="mr-2 h-4 w-4" />
                            Record for {selectedEmployees.length} {selectedEmployees.length === 1 ? 'Employee' : 'Employees'}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={employees}
                        columns={columns}
                        enableSelection={true}
                        showActions={false}
                        showTabs={false}
                        showColumnCustomizer={false}
                        isLoading={isLoading}
                        onSelectionChange={setSelectedEmployees}
                        searchKey="name"
                    />
                </CardContent>
            </Card>

            <Dialog open={showBulkEntryDialog} onOpenChange={setShowBulkEntryDialog}>
                <DialogContent className="sm:max-w-[550px] border-none shadow-2xl rounded-[24px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-bold">Record Attendance</DialogTitle>
                        <DialogDescription className="text-sm">
                            Applying changes to <span className="text-primary font-semibold">{selectedEmployees.length}</span> employees
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-4 space-y-6">
                        {/* Selected List - Simplified */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Updating Selection</Label>
                            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-xl border border-dashed hover:border-muted-foreground/30 transition-colors">
                                {selectedEmployees.slice(0, 8).map((emp) =>
                                    <Badge key={emp.id} variant="secondary" className="bg-background font-medium border-none px-2 py-0.5 text-[10px]">
                                        {emp.name}
                                    </Badge>
                                )}
                                {selectedEmployees.length > 8 &&
                                    <Badge variant="outline" className="text-[10px] font-semibold border-none bg-primary/5 text-primary">
                                        +{selectedEmployees.length - 8} more
                                    </Badge>
                                }
                            </div>
                        </div>

                        {/* Timing Grid - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">In-Time</Label>
                                <DateTimePicker date={bulkCheckIn} setDate={setBulkCheckIn} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Out-Time</Label>
                                <DateTimePicker date={bulkCheckOut} setDate={setBulkCheckOut} />
                            </div>
                        </div>

                        {/* Status & Remarks */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Attendance Status</Label>
                                <NativeSelect
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    className="h-10 rounded-xl bg-muted/20 border-transparent focus:bg-background"
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Late">Late</option>
                                    <option value="Half Day">Half Day</option>
                                    <option value="Leave">Leave</option>
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Correction Reason</Label>
                                <Input
                                    placeholder="e.g., ZKTeco failure, field visit..."
                                    value={bulkRemarks}
                                    onChange={(e) => setBulkRemarks(e.target.value)}
                                    className="h-10 rounded-xl bg-muted/20 border-transparent focus:bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-muted/10 border-t flex-row gap-2">
                        <Button variant="ghost" onClick={() => setShowBulkEntryDialog(false)} className="flex-1 rounded-xl h-10 font-semibold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkEntry}
                            disabled={isLoading}
                            className="flex-[2] rounded-xl h-10 font-bold shadow-sm"
                        >
                            {isLoading ? <IconRefresh className="animate-spin mr-2 h-4 w-4" /> : <IconCheck className="mr-2 h-4 w-4" />}
                            {isLoading ? "Saving..." : "Confirm Entry"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
