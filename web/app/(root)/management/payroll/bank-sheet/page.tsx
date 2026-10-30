"use client"

import * as React from "react"
import {
    IconBuildingBank,
    IconSearch,
    IconLoader,
    IconDownload,
    IconCalendar,
    IconFilter,
    IconChevronLeft,
    IconExternalLink,
    IconCash,
    IconPlayerPlay
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { payrollService } from "@/lib/services/payroll"
import { organogramService } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { toast } from "sonner"
import Link from "next/link"
import { Label } from "@/components/ui/label"

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

export default function BankSheetPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [departmentId, setDepartmentId] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")

    const [isLoading, setIsLoading] = React.useState(false)
    const [records, setRecords] = React.useState<any[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])

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
            const data = await payrollService.getLegacyBankSheet({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                searchTerm: searchTerm.trim() || undefined
            })
            setRecords(data)
        } catch (error) {
            toast.error("Failed to load bank sheet")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            await payrollService.exportBankSheet({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                searchTerm: searchTerm.trim() || undefined
            })
        } catch (error) {
            console.error(error)
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => <span className="font-medium">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{row.original.employeeName}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-tight">
                        <span>{row.original.companyName}</span>
                        <span>•</span>
                        <span>{row.original.department}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "bankName",
            header: "Bank & Branch",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-primary">{row.original.bankName}</span>
                    {row.original.bankBranchName && (
                        <span className="text-[10px] text-muted-foreground">{row.original.bankBranchName}</span>
                    )}
                </div>
            )
        },
        {
            accessorKey: "bankAccountNo",
            header: "Account Number",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded border">{row.original.bankAccountNo || 'No Account'}</span>
                </div>
            )
        },
        {
            accessorKey: "netPayable",
            header: "Amount (BDT)",
            cell: ({ row }) => (
                <div className="text-right pr-4">
                    <span className="font-bold text-emerald-600 text-lg">
                        ৳{row.original.netPayable.toLocaleString()}
                    </span>
                </div>
            )
        }
    ]

    const totalAmount = records.reduce((sum, r) => sum + r.netPayable, 0)

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/management/payroll/salary-sheet">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <IconChevronLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <IconBuildingBank size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bank Payment Sheet</h1>
                        <p className="text-muted-foreground text-sm">Advice for bank transfer of salaries</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="default"
                        onClick={handleExport}
                        disabled={isLoading || records.length === 0}
                        className="gap-2 shadow-md"
                    >
                        <IconDownload className="size-4" />
                        Export Advice
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Total Transfer Amount"
                    value={`৳${totalAmount.toLocaleString()}`}
                    icon={IconCash}
                    color="text-emerald-600"
                    bgColor="bg-emerald-500/10"
                />
                <KPICard
                    title="Recipient Count"
                    value={records.length.toString()}
                    icon={IconBuildingBank}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <KPICard
                    title="Period"
                    value={`${MONTHS.find(m => m.value === month)?.label} ${year}`}
                    icon={IconCalendar}
                    color="text-orange-600"
                    bgColor="bg-orange-500/10"
                />
            </div>

            {/* Filters */}
            <Card className="border shadow-none bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b bg-muted/20">
                    <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                        <IconFilter className="size-4" />
                        Refine Results
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">PAYMENT MONTH</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-10">
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">PAYMENT YEAR</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-10">
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">COMPANY</Label>
                            <ManagementLegacyCompanySelect
                                value={selectedCompanyId}
                                onChange={setSelectedCompanyId}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">DEPARTMENT</Label>
                            <NativeSelect value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-10">
                                <option value="all">All Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">QUICK SEARCH</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name or ID..."
                                    className="h-10 pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            className="h-10 gap-2 w-full font-bold shadow-sm"
                            onClick={handleSearch}
                            disabled={isLoading}
                        >
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />}
                            REFRESH
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border shadow-none overflow-hidden bg-card">
                <CardHeader className="bg-muted/10 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-bold">Transfer List</CardTitle>
                            <CardDescription>Eligible employees with valid bank accounts</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={records}
                        showColumnCustomizer={false}
                        searchKey="employeeName"
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
    return (
        <Card className="border shadow-sm overflow-hidden bg-card">
            <CardContent className="p-6 flex items-center gap-6">
                <div className={`h-14 w-14 rounded-2xl ${bgColor} flex items-center justify-center ${color} shadow-inner`}>
                    <Icon size={32} />
                </div>
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
