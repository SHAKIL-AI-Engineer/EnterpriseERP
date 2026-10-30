"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconCash,
    IconSearch,
    IconLoader,
    IconDownload,
    IconCalendar,
    IconTrendingUp,
    IconUsers,
    IconFilter,
    IconPlayerPlay,
    IconRefresh,
    IconSparkles,
    IconAlertCircle,
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { payrollService, type DailySalarySheet } from "@/lib/services/payroll"
import { organogramService } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function DailySalarySheetPage() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [departmentId, setDepartmentId] = React.useState("all")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")

    const [isLoading, setIsLoading] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [records, setRecords] = React.useState<DailySalarySheet[]>([])
    const [departments, setDepartments] = React.useState<any[]>([])
    // Process dialog
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [processResult, setProcessResult] = React.useState<{ processedCount: number; skippedCount: number; message: string } | null>(null)
    const [processCompanyId, setProcessCompanyId] = React.useState("all")
    const [processDeptId, setProcessDeptId] = React.useState("all")

    React.useEffect(() => {
        organogramService.getDepartments().then(setDepartments)
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
        if (!date) return
        setIsLoading(true)
        try {
            const data = await payrollService.getDailySheet({
                date: format(date, "yyyy-MM-dd"),
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                searchTerm: searchTerm.trim() || undefined
            })
            setRecords(data)
        } catch {
            toast.error("Failed to load daily salary data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        if (!date || records.length === 0) return
        setIsExporting(true)
        try {
            await payrollService.exportDailySheet({
                date: format(date, "yyyy-MM-dd"),
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId),
                departmentId: departmentId === "all" ? undefined : parseInt(departmentId),
                searchTerm: searchTerm.trim() || undefined
            })
            toast.success("Daily sheet exported!")
        } catch {
            toast.error("Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    const handleProcess = async () => {
        if (!date) return
        setIsProcessing(true)
        setProcessResult(null)
        try {
            const result = await payrollService.processDailySheet({
                date: format(date, "yyyy-MM-dd"),
                companyId: processCompanyId === "all" ? undefined : parseInt(processCompanyId),
                departmentId: processDeptId === "all" ? undefined : parseInt(processDeptId),
            })
            setProcessResult(result)
            toast.success(result.message)
            await handleSearch()
        } catch {
            toast.error("Failed to process daily salary")
        } finally {
            setIsProcessing(false)
        }
    }

    const statusVariant = (status: string) => {
        if (status === "Present") return "default"
        if (status === "Late") return "secondary"
        if (status === "On Leave" || status === "Holiday" || status === "Off Day") return "outline"
        return "destructive" // Absent
    }

    const columns: ColumnDef<DailySalarySheet>[] = [
        {
            accessorKey: "employeeId",
            header: "EMP ID",
            cell: ({ row }) => <span className="font-mono text-xs font-bold text-primary">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{row.original.employeeName}</span>
                    <span className="text-[10px] text-muted-foreground">{row.original.department} • {row.original.designation}</span>
                </div>
            )
        },
        {
            accessorKey: "attendanceStatus",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={statusVariant(row.original.attendanceStatus)} className="font-medium text-xs">
                    {row.original.attendanceStatus}
                </Badge>
            )
        },
        {
            accessorKey: "perDaySalary",
            header: "Per Day",
            cell: ({ row }) => <span className="font-medium tabular-nums">৳{row.original.perDaySalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        },
        {
            accessorKey: "otHours",
            header: "OT",
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium">{row.original.otHours}h</span>
                    <span className="text-muted-foreground tabular-nums">৳{row.original.otAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
            )
        },
        {
            accessorKey: "deduction",
            header: "Deduction",
            cell: ({ row }) => (
                <span className={`font-medium tabular-nums text-sm ${row.original.deduction > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                    {row.original.deduction > 0 ? `-৳${row.original.deduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                </span>
            )
        },
        {
            accessorKey: "netPayable",
            header: "Net Payable",
            cell: ({ row }) => (
                <div className="text-right pr-2">
                    <span className={`font-bold text-base tabular-nums ${row.original.netPayable >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                        ৳{row.original.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            )
        }
    ]

    const totalPayable = records.reduce((sum, r) => sum + r.netPayable, 0)
    const presentCount = records.filter(r => r.attendanceStatus === "Present" || r.attendanceStatus === "Late").length
    const absentCount = records.filter(r => r.attendanceStatus === "Absent").length

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <IconCalendar size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Salary Sheet</h1>
                        <p className="text-muted-foreground text-sm">
                            View and process daily prorated earnings based on attendance
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting || records.length === 0}
                        className="gap-2"
                    >
                        {isExporting ? <IconLoader className="size-4 animate-spin" /> : <IconDownload className="size-4" />}
                        Export
                    </Button>
                    <Button onClick={() => { setProcessResult(null); setDialogOpen(true) }} className="gap-2 shadow-md">
                        <IconSparkles className="size-4" />
                        Process Daily
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KPICard
                    title="Total Net Payable"
                    value={`৳${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                    icon={IconCash}
                    color="text-emerald-600"
                    bgColor="bg-emerald-500/10"
                />
                <KPICard
                    title="Total Employees"
                    value={records.length.toString()}
                    icon={IconUsers}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <KPICard
                    title="Present"
                    value={presentCount.toString()}
                    icon={IconTrendingUp}
                    color="text-blue-600"
                    bgColor="bg-blue-500/10"
                />
                <KPICard
                    title="Absent"
                    value={absentCount.toString()}
                    icon={IconAlertCircle}
                    color="text-rose-600"
                    bgColor="bg-rose-500/10"
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
                            <Label className="text-xs font-bold text-muted-foreground">DATE</Label>
                            <DatePicker date={date} setDate={setDate} className="h-10 w-full" />
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
                                <option value="all">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-xs font-bold text-muted-foreground">QUICK SEARCH</Label>
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name or ID..."
                                    className="h-10 pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                            <CardTitle className="text-lg font-bold">Daily Records</CardTitle>
                            <CardDescription>
                                {date ? `Showing salary records for ${format(date, "dd MMMM yyyy")}` : "Select a date to view records"}
                            </CardDescription>
                        </div>
                        {records.length > 0 && (
                            <Badge variant="secondary" className="text-sm font-bold px-3 py-1">
                                {records.length} Records
                            </Badge>
                        )}
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

            {/* Process Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <IconSparkles className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Process Daily Salary</DialogTitle>
                                <DialogDescription>
                                    Calculates daily prorated pay from attendance data
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                            <DatePicker date={date} setDate={setDate} className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</Label>
                            <ManagementLegacyCompanySelect
                                value={processCompanyId}
                                onChange={setProcessCompanyId}
                                className="w-full h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</Label>
                            <NativeSelect value={processDeptId} onChange={e => setProcessDeptId(e.target.value)} className="w-full h-10">
                                <option value="all">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>

                        {/* Policy Info */}
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-medium leading-relaxed">
                            <p className="font-bold mb-1.5 flex items-center gap-1.5">
                                <IconAlertCircle className="size-3.5" /> Daily Calculation Rules
                            </p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>Present / Late → Per-day salary + OT amount</li>
                                <li>Absent → Deduction of per-day salary</li>
                                <li>Holiday / Off Day / Leave → No pay, no deduction</li>
                                <li>Per-day = Gross ÷ Days in Month</li>
                            </ul>
                        </div>

                        {/* Result */}
                        {processResult && (
                            <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 p-4">
                                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                                    <IconSparkles className="size-4" />
                                    Processing Complete
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm border-t border-emerald-200 dark:border-emerald-800 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Processed</span>
                                        <span className="text-xl font-black">{processResult.processedCount} Records</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Skipped</span>
                                        <span className="text-xl font-black text-orange-600">{processResult.skippedCount}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        {!processResult ? (
                            <Button
                                className="w-full h-11 font-bold shadow-md"
                                onClick={handleProcess}
                                disabled={isProcessing || !date}
                            >
                                {isProcessing ? (
                                    <><IconLoader className="size-4 animate-spin mr-2" />Processing...</>
                                ) : (
                                    <><IconRefresh className="size-4 mr-2" />Process Now</>
                                )}
                            </Button>
                        ) : (
                            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => setDialogOpen(false)}>
                                Done
                            </Button>
                        )}
                        <Button variant="ghost" className="font-semibold text-muted-foreground" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
