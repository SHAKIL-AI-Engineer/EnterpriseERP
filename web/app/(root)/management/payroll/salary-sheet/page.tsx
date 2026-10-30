"use client"

import * as React from "react"
import {
    IconCash,
    IconSearch,
    IconLoader,
    IconDownload,
    IconPlayerPlay,
    IconCalendar,
    IconBuildingBank,
    IconEye,
    IconUser,
    IconCreditCard,
    IconFilter,
    IconCaretDown
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { payrollService, type MonthlySalarySheet } from "@/lib/services/payroll"
import { organogramService } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

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

const YEARS = [2024, 2025, 2026]

export default function SalarySheetPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [departmentId, setDepartmentId] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")

    const [isLoading, setIsLoading] = React.useState(false)
    const [records, setRecords] = React.useState<MonthlySalarySheet[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])
    const [hasSearched, setHasSearched] = React.useState(false)

    React.useEffect(() => {
        handleSearch()
    }, [])

    React.useEffect(() => {
        if (selectedCompanyId !== "all") {
            organogramService.getDepartments({ companyId: parseInt(selectedCompanyId) }).then(setDepartments)
        } else {
            organogramService.getDepartments().then(setDepartments)
        }
    }, [selectedCompanyId])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const data = await payrollService.getMonthlySheet({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                searchTerm: searchTerm.trim() || undefined
            })
            setRecords(data)
            setHasSearched(true)
        } catch (error) {
            toast.error("Failed to load salary sheet")
        } finally {
            setIsLoading(false)
        }
    }


    const handleExport = async (exportType: "master" | "salary") => {
        const exportLabel = exportType === "master" ? "Master sheet" : "Salary sheet";
        try {
            toast.promise(
                payrollService.exportPaySlips({
                    year,
                    month,
                    companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                    departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                    searchTerm: searchTerm.trim() || undefined,
                    exportType
                }),
                {
                    loading: `Generating ${exportLabel}...`,
                    success: `${exportLabel} downloaded successfully`,
                    error: `Failed to export ${exportLabel.toLowerCase()}`
                }
            )
        } catch (error) {
            console.error(error)
        }
    }

    const columns: ColumnDef<MonthlySalarySheet>[] = [
        {
            id: "sl",
            header: "Sl",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.index + 1}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span className="text-xs font-medium whitespace-nowrap min-w-[180px]">{row.original.employeeName}</span>,
            meta: { 
                className: "text-left font-medium whitespace-nowrap",
                headerClassName: "whitespace-nowrap"
            }
        },
        {
            accessorKey: "employeeId",
            header: "Emp. ID",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.original.employeeId}</span>
        },
        {
            header: "Designation & Joining Date",
            cell: ({ row }) => (
                <div className="flex flex-col text-[10px] leading-tight whitespace-normal wrap-break-word min-w-[120px]">
                    <span className="font-semibold">{row.original.designation}</span>
                    <span className="text-muted-foreground">{row.original.joinedDate ? new Date(row.original.joinedDate).toLocaleDateString() : "N/A"}</span>
                </div>
            )
        },
        {
            accessorKey: "totalDays",
            header: "Total days of the month",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.original.totalDays}</span>
        },
        {
            accessorKey: "weekendDays",
            header: "Weekly leave",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.original.weekendDays}</span>
        },
        {
            accessorKey: "leaveDays",
            header: "Leave",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.original.leaveDays}</span>
        },
        {
            accessorKey: "absentDays",
            header: "Total Absent",
            cell: ({ row }) => <span className="text-xs text-rose-600 whitespace-normal">{row.original.absentDays}</span>
        },
        {
            header: "Total working days",
            cell: ({ row }) => <span className="text-xs font-semibold whitespace-normal">{(row.original.presentDays || 0) + (row.original.weekendDays || 0) + (row.original.holidays || 0) + (row.original.leaveDays || 0)}</span>
        },
        {
            accessorKey: "basicSalary",
            header: "Basic Salary",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.basicSalary || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "houseRent",
            header: "Rent Bill",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.houseRent || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "medicalAllowance",
            header: "Medical allowance",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.medicalAllowance || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "foodAllowance",
            header: "Food allowance",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.foodAllowance || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "conveyance",
            header: "Travel allowance",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.conveyance || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "grossSalary",
            header: "Total Salary",
            cell: ({ row }) => <span className="text-xs font-bold whitespace-normal">৳{(row.original.grossSalary || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "absentDeduction",
            header: "Absence deduction",
            cell: ({ row }) => <span className="text-xs text-rose-600 whitespace-normal">৳{(row.original.absentDeduction || 0).toLocaleString()}</span>
        },
        {
            header: "Wages payable",
            cell: ({ row }) => <span className="text-xs font-semibold whitespace-normal">৳{((row.original.totalEarning || 0) - (row.original.otAmount || 0)).toLocaleString()}</span>
        },
        {
            accessorKey: "otHours",
            header: "Overtime hours",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{row.original.otHours}</span>
        },
        {
            accessorKey: "otRate",
            header: "Overtime rate",
            cell: ({ row }) => <span className="text-xs whitespace-normal">{(row.original.otRate || 0).toFixed(2)}</span>
        },
        {
            accessorKey: "otAmount",
            header: "Overtime pay",
            cell: ({ row }) => <span className="text-xs whitespace-normal">৳{(row.original.otAmount || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "attendanceBonus",
            header: "Attendance bonus",
            cell: ({ row }) => <span className="text-xs text-emerald-600 whitespace-normal">৳{(row.original.attendanceBonus || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "totalDeduction",
            header: "Deduction",
            cell: ({ row }) => <span className="text-xs text-rose-600 whitespace-normal">৳{(row.original.totalDeduction || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "bankAccountNo",
            header: "Account No.",
            cell: ({ row }) => <span className="text-xs font-mono whitespace-normal">{row.original.bankAccountNo || "—"}</span>
        },
        {
            accessorKey: "netPayable",
            header: "Total payable",
            cell: ({ row }) => <span className="text-xs font-bold text-emerald-700 whitespace-normal">৳{(row.original.netPayable || 0).toLocaleString()}</span>
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 whitespace-normal">
                    <Link href={`/management/payroll/payslip/${row.original.periodId}/${row.original.employeeGuid}`}>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                            <IconEye className="size-3.5" />
                        </Button>
                    </Link>
                </div>
            )
        }
    ]

    const totalNetPayable = records.reduce((sum, r) => sum + r.netPayable, 0)
    const totalDeductions = records.reduce((sum, r) => sum + r.totalDeduction, 0)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Salary Sheet</h1>
                    <p className="text-muted-foreground text-sm">Master payroll audit and management</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/management/payroll/bank-sheet">
                        <Button variant="outline" className="gap-2">
                            <IconBuildingBank className="size-4" />
                            Bank Sheet
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={isLoading || records.length === 0}
                                className="gap-2"
                            >
                                Export
                                <ChevronDown className="size-4 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("master")} className="gap-2 py-2 cursor-pointer">
                                <IconDownload className="size-4 opacity-70" />
                                Master Sheet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("salary")} className="gap-2 py-2 cursor-pointer">
                                <IconDownload className="size-4 opacity-70" />
                                Salary Sheet
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Metrics */}
            {hasSearched && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6">
                    <KPICard title="Total Payable" value={`৳${totalNetPayable.toLocaleString()}`} icon={IconBuildingBank} />
                    <KPICard title="Total Deductions" value={`৳${totalDeductions.toLocaleString()}`} icon={IconCreditCard} />
                    <KPICard title="Employees" value={records.length.toString()} icon={IconUser} />
                    <KPICard title="Period" value={`${MONTHS.find(m => m.value === month)?.label} ${year}`} icon={IconCalendar} />
                </div>
            )}

            {/* Filters */}
            <div className="px-6">
                <Card className="border-none shadow-sm bg-muted/30">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <IconFilter className="size-4 opacity-70" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</Label>
                                <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-10">
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</Label>
                                <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-10">
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</Label>
                                <ManagementLegacyCompanySelect
                                    value={selectedCompanyId}
                                    onChange={setSelectedCompanyId}
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</Label>
                                <NativeSelect value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-10">
                                    <option value="all">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5 lg:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
                                <div className="relative group">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="Search by ID or Name..."
                                        className="h-10 pl-9 bg-background focus-visible:ring-primary/20 transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <Button
                                    className="h-10 gap-2 w-full font-bold shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                                    onClick={handleSearch}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                    Load Salary Sheet
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <div className="px-6">
                <Card>
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-base font-semibold">Salary Records</CardTitle>
                    </CardHeader>
                    <DataTable
                        columns={columns}
                        data={records}
                        showColumnCustomizer={false}
                        searchKey="employeeName"
                    />
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon }: any) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
