"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconArrowLeft,
    IconPlus,
    IconSearch,
    IconLoader,
    IconFilter,
    IconChevronUp,
    IconChevronDown,
    IconRotateClockwise,
    IconUsers,
    IconCalendar,
    IconCurrencyTaka,
    IconCheck
} from "@tabler/icons-react"
import { payrollService } from "@/lib/services/payroll"
import { companyService } from "@/lib/services/company"
import { organogramService } from "@/lib/services/organogram"
import { employeeService, type EmployeeSimple } from "@/lib/services/employee"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

import { DatePicker } from "@/components/ui/date-picker"

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 }
]

export default function AdvanceSalaryEntryPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [employees, setEmployees] = React.useState<EmployeeSimple[]>([])
    const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<number>>(new Set())
    const [isFilterOpen, setIsFilterOpen] = React.useState(true)

    // Filter States
    const [filters, setFilters] = React.useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        companyId: "all",
        departmentId: "all",
        sectionId: "all",
        lineId: "all",
        designationId: "all",
        shiftId: "all",
        groupId: "all",
        floorId: "all",
        gender: "all",
        religion: "all",
        status: "Active",
        search: ""
    })

    // Advance Entry Settings
    const [entryType, setEntryType] = React.useState<"fixed" | "range">("fixed")
    const [amount, setAmount] = React.useState("")
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined, to: Date | undefined }>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    })
    const [repayment, setRepayment] = React.useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })
    const [remarks, setRemarks] = React.useState("")

    // Dropdown Data
    const [data, setData] = React.useState({
        companies: [] as any[],
        departments: [] as any[],
        sections: [] as any[],
        lines: [] as any[],
        designations: [] as any[],
        shifts: [] as any[],
        groups: [] as any[],
        floors: [] as any[]
    })

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [
                    companies,
                    departments,
                    sections,
                    lines,
                    designations,
                    shifts,
                    groups,
                    floors
                ] = await Promise.all([
                    companyService.getAll(),
                    organogramService.getDepartments(),
                    organogramService.getSections(),
                    organogramService.getLines(),
                    organogramService.getDesignations(),
                    organogramService.getShifts(),
                    organogramService.getGroups(),
                    organogramService.getFloors()
                ])

                setData({
                    companies,
                    departments,
                    sections,
                    lines,
                    designations,
                    shifts,
                    groups,
                    floors
                })
            } catch (error) {
                console.error("Failed to load filter data", error)
            }
        }

        loadInitialData()
        handleSearch()
    }, [])

    // Filter Logic Helpers
    const filteredDepartments = React.useMemo(() => {
        if (filters.companyId === "all") return data.departments
        return data.departments.filter(d => d.companyId?.toString() === filters.companyId)
    }, [filters.companyId, data.departments])

    const filteredSections = React.useMemo(() => {
        let result = data.sections
        if (filters.companyId !== "all") {
            result = result.filter(s => s.companyId?.toString() === filters.companyId)
        }
        if (filters.departmentId !== "all") {
            result = result.filter(s => s.departmentId?.toString() === filters.departmentId)
        }
        return result
    }, [filters.companyId, filters.departmentId, data.sections])

    const filteredLines = React.useMemo(() => {
        let result = data.lines
        if (filters.companyId !== "all") result = result.filter(l => l.companyId?.toString() === filters.companyId)
        if (filters.departmentId !== "all") result = result.filter(l => l.departmentId?.toString() === filters.departmentId)
        if (filters.sectionId !== "all") result = result.filter(l => l.sectionId?.toString() === filters.sectionId)
        return result
    }, [filters.companyId, filters.departmentId, filters.sectionId, data.lines])

    const filteredDesignations = React.useMemo(() => {
        let result = data.designations
        if (filters.companyId !== "all") result = result.filter(d => d.companyId?.toString() === filters.companyId)
        if (filters.departmentId !== "all") result = result.filter(d => d.departmentId?.toString() === filters.departmentId)
        if (filters.sectionId !== "all") result = result.filter(d => d.sectionId?.toString() === filters.sectionId)
        return result
    }, [filters.companyId, filters.departmentId, filters.sectionId, data.designations])

    const filteredShifts = React.useMemo(() => {
        if (filters.companyId === "all") return data.shifts
        return data.shifts.filter(s => s.companyId?.toString() === filters.companyId)
    }, [filters.companyId, data.shifts])

    const filteredGroups = React.useMemo(() => {
        if (filters.companyId === "all") return data.groups
        return data.groups.filter(g => g.companyId?.toString() === filters.companyId)
    }, [filters.companyId, data.groups])

    const filteredFloors = React.useMemo(() => {
        if (filters.companyId === "all") return data.floors
        return data.floors.filter(f => f.companyId?.toString() === filters.companyId)
    }, [filters.companyId, data.floors])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const results = await employeeService.getEmployeesSimple({
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId),
                departmentId: filters.departmentId === "all" ? undefined : parseInt(filters.departmentId),
                sectionId: filters.sectionId === "all" ? undefined : parseInt(filters.sectionId),
                designationId: filters.designationId === "all" ? undefined : parseInt(filters.designationId),
                lineId: filters.lineId === "all" ? undefined : parseInt(filters.lineId),
                shiftId: filters.shiftId === "all" ? undefined : parseInt(filters.shiftId),
                groupId: filters.groupId === "all" ? undefined : parseInt(filters.groupId),
                floorId: filters.floorId === "all" ? undefined : parseInt(filters.floorId),
                status: filters.status === "all" ? undefined : filters.status,
                searchTerm: filters.search || undefined
            })
            setEmployees(results)
            setSelectedEmployeeIds(new Set())
        } catch (error) {
            toast.error("Failed to load employee list")
        } finally {
            setIsLoading(false)
        }
    }

    const resetFilters = () => {
        setFilters({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            companyId: "all",
            departmentId: "all",
            sectionId: "all",
            lineId: "all",
            designationId: "all",
            shiftId: "all",
            groupId: "all",
            floorId: "all",
            gender: "all",
            religion: "all",
            status: "Active",
            search: ""
        })
    }

    const toggleEmployee = (id: number) => {
        const newSelected = new Set(selectedEmployeeIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedEmployeeIds(newSelected)
    }

    const toggleAll = () => {
        if (selectedEmployeeIds.size === employees.length) {
            setSelectedEmployeeIds(new Set())
        } else {
            setSelectedEmployeeIds(new Set(employees.map(e => e.id)))
        }
    }

    const handleSubmit = async () => {
        if (selectedEmployeeIds.size === 0) {
            toast.error("Please select at least one employee")
            return
        }

        if (entryType === "fixed" && !amount) {
            toast.error("Please enter advance amount")
            return
        }

        setIsProcessing(true)
        try {
            const selectedEmployees = employees.filter(e => selectedEmployeeIds.has(e.id))
            const employeeIds = selectedEmployees.map(e => e.employeeId)
            const companyId = selectedEmployees[0]?.companyId || parseInt(filters.companyId) || 0

            await payrollService.batchAdvanceSalary({
                employeeIds,
                companyId,
                amount: entryType === "fixed" ? parseFloat(amount) : 0,
                isDateRange: entryType === "range",
                fromDate: entryType === "range" && dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                toDate: entryType === "range" && dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
                requestDate: format(new Date(), "yyyy-MM-dd"),
                repaymentMonth: repayment.month,
                repaymentYear: repayment.year,
                remarks: entryType === "range" ? `Date Range: ${dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""} to ${dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}. ${remarks}` : remarks
            })

            toast.success(`Successfully processed ${selectedEmployeeIds.size} advance salary requests`)
            router.push("/management/payroll/advance-salary-sheet")
        } catch (error) {
            toast.error("Failed to process requests. Please check logs.")
        } finally {
            setIsProcessing(false)
        }
    }

    const columns: ColumnDef<EmployeeSimple>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={selectedEmployeeIds.size === employees.length && employees.length > 0}
                    onCheckedChange={toggleAll}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedEmployeeIds.has(row.original.id)}
                    onCheckedChange={() => toggleEmployee(row.original.id)}
                />
            )
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "fullNameEn",
            header: "Name",
            cell: ({ row }) => <span className="font-semibold text-gray-700">{row.original.fullNameEn}</span>
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => <span className="text-gray-600">{row.original.departmentName}</span>
        },
        {
            accessorKey: "groupName",
            header: "Group",
            cell: ({ row }) => <span className="text-gray-600 italic text-[10px]">{row.original.groupName || "Standard"}</span>
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => <span className="text-gray-600 text-xs">{row.original.designationName}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.status === "Active" ? "success" : "secondary"} className="text-[10px] font-normal px-2 py-0 h-5">
                    {row.original.status}
                </Badge>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">Advance Salary Entry</h1>
                        <p className="text-muted-foreground text-xs">Process advance salary requests for employees</p>
                    </div>
                </div>
            </div>

            {/* 1. Employee Search Section */}
            <div className="px-6">
                <Card className="border shadow-sm">
                    <div className="px-6 py-3 flex items-center justify-between border-b bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <IconSearch className="size-4 text-gray-500" />
                            <h2 className="text-sm font-semibold text-gray-700">Filter Employees</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetFilters}
                                className="text-xs font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1"
                            >
                                <IconRotateClockwise className="size-3" />
                                Reset
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                {isFilterOpen ? <IconChevronUp className="size-4 text-gray-400" /> : <IconChevronDown className="size-4 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    {isFilterOpen && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Company</Label>
                                <NativeSelect
                                    value={filters.companyId}
                                    onChange={(e) => setFilters({ 
                                        ...filters, 
                                        companyId: e.target.value,
                                        departmentId: "all",
                                        sectionId: "all",
                                        lineId: "all",
                                        designationId: "all",
                                        shiftId: "all",
                                        groupId: "all",
                                        floorId: "all"
                                    })}
                                    className="h-9 text-sm"
                                >
                                    <option value="all">Every Company</option>
                                    {data.companies.map(c => <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Department</Label>
                                <NativeSelect
                                    value={filters.departmentId}
                                    onChange={(e) => setFilters({ 
                                        ...filters, 
                                        departmentId: e.target.value,
                                        sectionId: "all",
                                        lineId: "all",
                                        designationId: "all"
                                    })}
                                    disabled={filters.companyId === "all"}
                                    className="h-9 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <option value="all">Every Department</option>
                                    {filteredDepartments.map(d => <option key={d.id} value={d.id.toString()}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Section</Label>
                                <NativeSelect
                                    value={filters.sectionId}
                                    onChange={(e) => setFilters({ 
                                        ...filters, 
                                        sectionId: e.target.value,
                                        lineId: "all",
                                        designationId: "all"
                                    })}
                                    disabled={filters.departmentId === "all"}
                                    className="h-9 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                >
                                    <option value="all">Every Section</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.id.toString()}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Group</Label>
                                <NativeSelect
                                    value={filters.groupId}
                                    onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
                                    className="h-9 text-sm"
                                >
                                    <option value="all">Every Group</option>
                                    {filteredGroups.map(g => <option key={g.id} value={g.id.toString()}>{g.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Status</Label>
                                <NativeSelect
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="h-9 text-sm"
                                >
                                    <option value="all">Every Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </NativeSelect>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-500">Quick Search</Label>
                                <Input
                                    placeholder="Name or ID..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="h-9 text-sm"
                                />
                            </div>
                            
                            <div className="lg:col-span-4"></div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleSearch}
                                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                    Search
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* 2. Advance Details Section */}
            <div className="px-6">
                <Card className="border shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <IconCurrencyTaka className="size-4 text-green-600" />
                            Advance Details
                        </h2>
                        <span className="text-xs font-medium text-blue-600">
                             {selectedEmployeeIds.size} selected
                        </span>
                    </div>
                    
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Entry Type</Label>
                                    <div className="flex bg-gray-100 p-1 rounded-md">
                                        <button
                                            onClick={() => setEntryType("fixed")}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded ${entryType === "fixed" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                                        >
                                            Fixed Amount
                                        </button>
                                        <button
                                            onClick={() => setEntryType("range")}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded ${entryType === "range" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                                        >
                                            Date Range
                                        </button>
                                    </div>
                                </div>

                                {entryType === "fixed" ? (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-gray-600">Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                                            <Input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="pl-7 h-10 font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">From Date</Label>
                                            <DatePicker date={dateRange.from} setDate={(d) => setDateRange({ ...dateRange, from: d })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500">To Date</Label>
                                            <DatePicker date={dateRange.to} setDate={(d) => setDateRange({ ...dateRange, to: d })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Repayment Month & Year</Label>
                                    <div className="flex gap-2">
                                        <NativeSelect
                                            value={repayment.month}
                                            onChange={(e) => setRepayment({ ...repayment, month: parseInt(e.target.value) })}
                                            className="h-10 text-sm"
                                        >
                                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </NativeSelect>
                                        <NativeSelect
                                            value={repayment.year}
                                            onChange={(e) => setRepayment({ ...repayment, year: parseInt(e.target.value) })}
                                            className="h-10 text-sm"
                                        >
                                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                        </NativeSelect>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-600">Remarks (Optional)</Label>
                                    <Input
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Note..."
                                        className="h-10 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                                    disabled={isProcessing || selectedEmployeeIds.size === 0}
                                >
                                    {isProcessing ? <IconLoader className="size-5 animate-spin" /> : <IconCheck className="size-5" />}
                                    Process Advance
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground mt-2">
                                    Create advance salary records for {selectedEmployeeIds.size} employees
                                </p>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Data Table Section */}
            <div className="px-6 mb-20">
                <Card className="border shadow-sm">
                    <div className="px-6 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <IconUsers className="size-4 text-gray-500" />
                            Employee List
                        </h2>
                    </div>
                    <DataTable
                        columns={columns}
                        data={employees}
                        showColumnCustomizer={false}
                        searchKey="fullNameEn"
                    />
                </Card>
            </div>
        </div>
    )
}
