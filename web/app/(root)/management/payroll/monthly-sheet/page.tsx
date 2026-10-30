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
    IconFilter
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { payrollService, type MonthlySalarySheet } from "@/lib/services/payroll"
import { organogramService } from "@/lib/services/organogram"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"

import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"

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

export default function MonthlySalarySheetPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [departmentId, setDepartmentId] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")

    const [isLoading, setIsLoading] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
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
            setDepartments([])
            setDepartmentId("all")
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

    const handleProcess = async () => {
        if (!confirm(`Process salary for ${MONTHS.find(m => m.value === month)?.label} ${year}? This will overwrite existing drafts.`)) return

        setIsProcessing(true)
        try {
            const res = await payrollService.processSalary({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId)
            })
            toast.success(res.message || "Salary processed successfully")
            handleSearch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process salary")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleExport = async () => {
        try {
            toast.promise(
                payrollService.exportPaySlips({
                    year,
                    month,
                    companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                    departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                    searchTerm: searchTerm.trim() || undefined
                }),
                {
                    loading: 'Generating Excel file...',
                    success: 'File downloaded successfully',
                    error: 'Failed to export salary sheet'
                }
            )
        } catch (error) {
            console.error(error)
        }
    }

    const columns: ColumnDef<MonthlySalarySheet>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.employeeName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.department}</span>
                </div>
            )
        },
        {
            accessorKey: "grossSalary",
            header: "Gross Salary",
            cell: ({ row }) => <span className="font-medium">৳{row.original.grossSalary.toLocaleString()}</span>
        },
        {
            accessorKey: "presentDays",
            header: "Attendance (P/L/A)",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-xs">
                    <span className="font-medium text-emerald-600">{row.original.presentDays}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-blue-600">{row.original.leaveDays}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-rose-600">{row.original.absentDays}</span>
                </div>
            )
        },
        {
            accessorKey: "otAmount",
            header: "OT Pay",
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium">৳{row.original.otAmount.toLocaleString()}</span>
                    <span className="text-muted-foreground text-[10px]">{row.original.otHours}h</span>
                </div>
            )
        },
        {
            accessorKey: "totalDeduction",
            header: "Deduction",
            cell: ({ row }) => <span className="text-xs font-medium text-rose-600">-৳{row.original.totalDeduction.toLocaleString()}</span>
        },
        {
            accessorKey: "netPayable",
            header: "Net Payable",
            cell: ({ row }) => <span className="font-bold text-emerald-700">৳{row.original.netPayable.toLocaleString()}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const colors: Record<string, string> = {
                    "Processed": "bg-blue-100 text-blue-700 border-blue-200",
                    "Approved": "bg-purple-100 text-purple-700 border-purple-200",
                    "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
                    "Draft": "bg-gray-100 text-gray-700 border-gray-200"
                }
                return (
                    <Badge variant="outline" className={`${colors[row.original.status] || colors.Draft} border font-normal`}>
                        {row.original.status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link href={`/management/payroll/payslip/${row.original.periodId}/${row.original.employeeGuid}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <IconEye className="size-4" />
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
                    <h1 className="text-2xl font-bold tracking-tight">Monthly Salary Sheet</h1>
                    <p className="text-muted-foreground text-sm">Process and manage monthly employee salaries</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleProcess}
                        disabled={isProcessing}
                        className="gap-2"
                    >
                        {isProcessing ? <IconLoader className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />}
                        Process Salary
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isLoading || records.length === 0}
                        className="gap-2"
                    >
                        <IconDownload className="size-4" />
                        Export
                    </Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Month</Label>
                                <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-9">
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Year</Label>
                                <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-9">
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Company</Label>
                                <ManagementLegacyCompanySelect
                                    value={selectedCompanyId}
                                    onChange={setSelectedCompanyId}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Department</Label>
                                <NativeSelect value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-9" disabled={selectedCompanyId === "all"}>
                                    <option value="all">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">Search</Label>
                                <Input
                                    placeholder="Search by ID or Name"
                                    className="h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                className="h-9 gap-2 w-full"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                Load Data
                            </Button>
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
