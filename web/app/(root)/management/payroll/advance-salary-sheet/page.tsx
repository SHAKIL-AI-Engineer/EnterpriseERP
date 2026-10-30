"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { payrollService, type AdvanceSalary } from "@/lib/services/payroll"
import { companyService } from "@/lib/services/company"
import { organogramService } from "@/lib/services/organogram"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import {
    IconChevronUp,
    IconChevronDown,
    IconRotateClockwise,
    IconLayoutGrid,
    IconFileText,
    IconBuildingBank,
    IconPlus,
    IconSearch,
    IconLoader,
    IconCurrencyTaka,
    IconFilter,
    IconCurrencyDollar,
    IconFileSpreadsheet
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

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

export default function AdvanceSalarySheetPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [records, setRecords] = React.useState<AdvanceSalary[]>([])
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
        status: "all",
        search: ""
    })

    // Data for dropdowns
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

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const result = await payrollService.getAdvanceSalaries({
                year: filters.year,
                month: filters.month,
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId)
            })
            setRecords(result)
        } catch (error) {
            toast.error("Failed to load advance salary records")
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
            status: "all",
            search: ""
        })
    }

    const columns: ColumnDef<AdvanceSalary>[] = [
        {
            id: "sl",
            header: "SL.No",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.index + 1}</span>
        },
        {
            accessorKey: "employeeId",
            header: "Emp.ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => (
                <div className="font-medium whitespace-nowrap">{row.original.employeeName}</div>
            )
        },
        {
            accessorKey: "designation",
            header: "Designation",
            cell: ({ row }) => <div className="text-xs whitespace-nowrap">{row.original.designation}</div>
        },
        {
            accessorKey: "joiningDate",
            header: "Joining Date",
            cell: ({ row }) => <div className="text-xs whitespace-nowrap">{row.original.joiningDate ? format(new Date(row.original.joiningDate), "dd-MMM-yyyy") : "N/A"}</div>
        },
        {
            accessorKey: "grade",
            header: "Grade",
            cell: ({ row }) => <div className="text-xs">{row.original.grade ?? "N/A"}</div>
        },
        {
            accessorKey: "basicSalary",
            header: "Basic",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.basicSalary.toLocaleString()}</div>
        },
        {
            accessorKey: "houseRent",
            header: "House Rent",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.houseRent.toLocaleString()}</div>
        },
        {
            accessorKey: "medicalAllowance",
            header: "Medical",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.medicalAllowance.toLocaleString()}</div>
        },
        {
            accessorKey: "foodAllowance",
            header: "Food",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.foodAllowance.toLocaleString()}</div>
        },
        {
            accessorKey: "transportAllowance",
            header: "Transport",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.transportAllowance.toLocaleString()}</div>
        },
        {
            accessorKey: "grossSalary",
            header: "Gross",
            cell: ({ row }) => <div className="text-right font-bold tabular-nums">{row.original.grossSalary.toLocaleString()}</div>
        },
        {
            id: "ways",
            header: "Ways",
            cell: ({ row }) => <div className="text-center">{row.original.presentDays + row.original.absentDays}</div>
        },
        {
            accessorKey: "absentDays",
            header: "Abs",
            cell: ({ row }) => <div className="text-center text-red-600 font-medium">{row.original.absentDays}</div>
        },
        {
            accessorKey: "presentDays",
            header: "Day",
            cell: ({ row }) => <div className="text-center text-green-600 font-medium">{row.original.presentDays}</div>
        },
        {
            accessorKey: "absentDeduction",
            header: "Absent Deduction",
            cell: ({ row }) => <div className="text-right tabular-nums text-red-500">{row.original.absentDeduction.toLocaleString()}</div>
        },
        {
            accessorKey: "totalPayableWages",
            header: "Total Payable Wages",
            cell: ({ row }) => <div className="text-right font-semibold tabular-nums">{row.original.totalPayableWages.toLocaleString()}</div>
        },
        {
            accessorKey: "otHours",
            header: "OT Hr",
            cell: ({ row }) => <div className="text-center">{row.original.otHours}</div>
        },
        {
            accessorKey: "otRate",
            header: "OT Rate",
            cell: ({ row }) => <div className="text-right tabular-nums">{row.original.otRate.toFixed(2)}</div>
        },
        {
            accessorKey: "otAmount",
            header: "OT payable",
            cell: ({ row }) => <div className="text-right tabular-nums text-green-600">{row.original.otAmount.toLocaleString()}</div>
        },
        {
            accessorKey: "bankAccountNo",
            header: "Bank Account /Bkash",
            cell: ({ row }) => (
                <div className="text-xs">
                    <div className="font-medium">{row.original.bankAccountNo ?? "N/A"}</div>
                    <div className="text-[10px] text-muted-foreground">{row.original.paymentMethod}</div>
                </div>
            )
        },
        {
            accessorKey: "netPayable",
            header: "Net Payble",
            cell: ({ row }) => <div className="text-right font-bold text-blue-700 tabular-nums">৳{row.original.netPayable.toLocaleString()}</div>
        },
        {
            id: "signature",
            header: "Signature",
            cell: () => <div className="h-8 border-b border-gray-300 w-20"></div>
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Advance Salary</h1>
                    <p className="text-muted-foreground text-sm">Manage employee advance salary records and payments</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 h-9 border-green-200 bg-green-50/50 hover:bg-green-50 hover:text-green-700 text-green-600"
                        onClick={() => router.push("/management/payroll/advance-salary-sheet/summary")}
                    >
                        <IconLayoutGrid className="size-4" />
                        Summary
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-9 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 text-blue-600"
                        onClick={() => router.push("/management/payroll/advance-salary-sheet/entry")}
                    >
                        <IconPlus className="size-4" />
                        Advance Entry
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-9 border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:text-purple-700 text-purple-600"
                        onClick={() => router.push("/management/payroll/advance-salary-sheet/bank-sheet")}
                    >
                        <IconBuildingBank className="size-4" />
                        Bank Sheet
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-9 border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:text-orange-700 text-orange-600"
                        onClick={() => router.push("/management/payroll/advance-salary-sheet/report")}
                    >
                        <IconFileText className="size-4" />
                        Report
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 h-9 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:text-indigo-700 text-indigo-600"
                        disabled={isExporting}
                        onClick={async () => {
                            setIsExporting(true)
                            try {
                                await payrollService.exportAdvanceSalarySheet({
                                    year: filters.year,
                                    month: filters.month,
                                    companyId: filters.companyId !== "all" ? parseInt(filters.companyId) : undefined,
                                    departmentId: filters.departmentId !== "all" ? parseInt(filters.departmentId) : undefined,
                                    searchTerm: filters.search
                                })
                            } catch (error) {
                                toast.error("Failed to export excel")
                            } finally {
                                setIsExporting(false)
                            }
                        }}
                    >
                        {isExporting ? <IconLoader className="size-4 animate-spin" /> : <IconFileSpreadsheet className="size-4" />}
                        {isExporting ? "Exporting..." : "Export Excel"}
                    </Button>
                </div>
            </div>

            {/* Advance Filters Section */}
            <div className="px-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <IconFilter className="size-5 text-green-600" />
                            </div>
                            <h2 className="font-bold text-gray-800">Attendance Filters</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <IconRotateClockwise className="size-4" />
                                Reset
                            </button>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                {isFilterOpen ? <IconChevronUp className="size-4 text-gray-500" /> : <IconChevronDown className="size-4 text-gray-500" />}
                            </button>
                        </div>
                    </div>

                    {isFilterOpen && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-y-6 gap-x-4 animate-in slide-in-from-top-2 duration-300">
                            {/* Row 1 */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Month</Label>
                                <NativeSelect
                                    value={filters.month}
                                    onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Year</Label>
                                <NativeSelect
                                    value={filters.year}
                                    onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Company</Label>
                                <NativeSelect
                                    value={filters.companyId}
                                    onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Company</option>
                                    {data.companies.map(c => <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Department</Label>
                                <NativeSelect
                                    value={filters.departmentId}
                                    onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Department</option>
                                    {data.departments.map(d => <option key={d.id} value={d.id.toString()}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Section</Label>
                                <NativeSelect
                                    value={filters.sectionId}
                                    onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Section</option>
                                    {data.sections.map(s => <option key={s.id} value={s.id.toString()}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Line</Label>
                                <NativeSelect
                                    value={filters.lineId}
                                    onChange={(e) => setFilters({ ...filters, lineId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Line</option>
                                    {data.lines.map(l => <option key={l.id} value={l.id.toString()}>{l.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            {/* Row 2 */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Designation</Label>
                                <NativeSelect
                                    value={filters.designationId}
                                    onChange={(e) => setFilters({ ...filters, designationId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Designation</option>
                                    {data.designations.map(d => <option key={d.id} value={d.id.toString()}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Shift</Label>
                                <NativeSelect
                                    value={filters.shiftId}
                                    onChange={(e) => setFilters({ ...filters, shiftId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Shift</option>
                                    {data.shifts.map(s => <option key={s.id} value={s.id.toString()}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Group</Label>
                                <NativeSelect
                                    value={filters.groupId}
                                    onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Group</option>
                                    {data.groups.map(g => <option key={g.id} value={g.id.toString()}>{g.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Floor</Label>
                                <NativeSelect
                                    value={filters.floorId}
                                    onChange={(e) => setFilters({ ...filters, floorId: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">Every Floor</option>
                                    {data.floors.map(f => <option key={f.id} value={f.id.toString()}>{f.nameEn}</option>)}
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Gender</Label>
                                <NativeSelect
                                    value={filters.gender}
                                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </NativeSelect>
                            </div>

                            {/* Row 3 */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Religion</Label>
                                <NativeSelect
                                    value={filters.religion}
                                    onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                                    className="h-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                >
                                    <option value="all">All Religions</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Hinduism">Hinduism</option>
                                    <option value="Christianity">Christianity</option>
                                    <option value="Buddhism">Buddhism</option>
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Status</Label>
                                <NativeSelect
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="h-10 bg-green-50/50 border-green-200 focus:bg-white transition-all"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                </NativeSelect>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">Quick Search</Label>
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                    <Input
                                        placeholder="Search..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        className="h-10 pl-10 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    onClick={handleSearch}
                                    className="w-full h-10 bg-[#0F763E] hover:bg-[#0A5D31] text-white font-semibold gap-2 shadow-sm rounded-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-5" />}
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Main Content Table */}
            <div className="px-6">
                <Card className="border-none shadow-sm bg-white">
                    <div className="px-6 py-4 border-b">
                        <h2 className="font-bold text-gray-800">Advance Salary Records</h2>
                    </div>
                    <DataTable
                        columns={columns}
                        data={records}
                        showColumnCustomizer={false}
                        showActions={false}
                        searchKey="employeeName"
                    />
                </Card>
            </div>
        </div>
    )
}
