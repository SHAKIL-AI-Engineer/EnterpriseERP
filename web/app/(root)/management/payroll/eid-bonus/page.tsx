"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconPlus,
    IconLoader,
    IconGift,
    IconSparkles,
    IconAlertCircle,
    IconDownload,
    IconCalendar,
    IconCash,
    IconUsers,
    IconBuildingBank,
    IconSearch,
    IconFilter,
    IconPlayerPlay,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { payrollService, type Bonus, type FestivalBonusSummary } from "@/lib/services/payroll"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    { label: "December", value: 12 },
]

const YEARS = [2024, 2025, 2026]

const FESTIVAL_TYPES = [
    "Eid-ul-Fitr",
    "Eid-ul-Adha",
    "Puja Bonus",
    "Christmas Bonus",
    "New Year Bonus",
    "Performance Bonus",
]

export default function FestivalBonusPage() {
    const router = useRouter()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState<string>("all")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [isLoading, setIsLoading] = React.useState(false)
    const [records, setRecords] = React.useState<Bonus[]>([])

    // Dialog state
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [processResult, setProcessResult] = React.useState<FestivalBonusSummary | null>(null)

    // Form state
    const [bonusType, setBonusType] = React.useState("Eid-ul-Fitr")
    const [bonusYear, setBonusYear] = React.useState(new Date().getFullYear())
    const [bonusMonth, setBonusMonth] = React.useState(new Date().getMonth() + 1)
    const [processCompanyId, setProcessCompanyId] = React.useState<string>("all")

    React.useEffect(() => {
        handleSearch()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const data = await payrollService.getBonuses({
                year,
                month: month === "all" ? undefined : parseInt(month),
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            })
            setRecords(data)
        } catch {
            toast.error("Failed to load bonus records")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            await payrollService.exportFestivalBonus({
                year,
                month: month === "all" ? undefined : parseInt(month),
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            })
            toast.success("Exporting excel sheet...")
        } catch {
            toast.error("Failed to export bonus records")
        }
    }

    const handleProcess = async () => {
        if (!bonusType) return toast.error("Please select a festival type")
        setIsProcessing(true)
        setProcessResult(null)
        try {
            const result = await payrollService.processFestivalBonus({
                bonusType,
                year: bonusYear,
                month: bonusMonth,
                percentage: 0,
                baseOn: "Gross",
                companyId: processCompanyId === "all" ? undefined : parseInt(processCompanyId),
            })
            setProcessResult(result)
            toast.success(`Processed ${result.processedCount} bonus records!`)
            await handleSearch()
        } catch {
            toast.error("Failed to process festival bonus")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleOpenDialog = () => {
        setProcessResult(null)
        setDialogOpen(true)
    }

    const columns: ColumnDef<Bonus>[] = [
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
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <IconGift className="size-3" />
                        {row.original.bonusType}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "joiningDate",
            header: "Joining Date",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.joiningDate
                        ? new Date(row.original.joiningDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                </span>
            )
        },
        {
            accessorKey: "grossSalary",
            header: "Gross Salary",
            cell: ({ row }) => <span className="font-semibold">৳{(row.original.grossSalary || 0).toLocaleString()}</span>
        },
        {
            accessorKey: "jobAge",
            header: "Service Age",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-medium">
                    {row.original.jobAge || "—"}
                </Badge>
            )
        },
        {
            accessorKey: "amount",
            header: "Bonus Amount",
            cell: ({ row }) => (
                <div className="text-right pr-4">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base tabular-nums">
                        ৳{row.original.amount.toLocaleString()}
                    </span>
                </div>
            )
        }
    ]

    const totalBonus = records.reduce((sum, r) => sum + r.amount, 0)

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <IconGift size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Festival Bonus</h1>
                        <p className="text-muted-foreground text-sm">Manage and process festival disbursements by job tenure</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/management/payroll/festival-bonus-bank-sheet")}
                        className="gap-2"
                    >
                        <IconBuildingBank className="size-4" />
                        Bank Sheet
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={records.length === 0}
                        className="gap-2"
                    >
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                    <Button onClick={handleOpenDialog} className="gap-2 shadow-md">
                        <IconPlus className="size-4" />
                        Generate Bonus
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Total Recipients"
                    value={records.length.toString()}
                    icon={IconUsers}
                    color="text-primary"
                    bgColor="bg-primary/10"
                />
                <KPICard
                    title="Total Disbursement"
                    value={`৳${totalBonus.toLocaleString()}`}
                    icon={IconCash}
                    color="text-emerald-600"
                    bgColor="bg-emerald-500/10"
                />
                <KPICard
                    title="Calendar Year"
                    value={year.toString()}
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
                        Filter Records
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">COMPANY</Label>
                            <ManagementLegacyCompanySelect
                                value={selectedCompanyId}
                                onChange={setSelectedCompanyId}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">MONTH</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(e.target.value)} className="h-10">
                                <option value="all">All Months</option>
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">YEAR</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-10">
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="lg:col-span-2">
                            <Button
                                className="h-10 gap-2 w-full font-bold shadow-sm"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />}
                                Apply Filter
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border shadow-none overflow-hidden bg-card">
                <CardHeader className="bg-muted/10 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-bold">Bonus Records</CardTitle>
                            <CardDescription>All processed festival bonus disbursements</CardDescription>
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

            {/* Generate Bonus Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <IconGift className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Generate Festival Bonus</DialogTitle>
                                <DialogDescription>
                                    Bulk calculation based on Gross Salary & Job Tenure.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Festival Type */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Festival Category</Label>
                            <NativeSelect value={bonusType} onChange={e => setBonusType(e.target.value)} className="w-full h-10">
                                {FESTIVAL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                            </NativeSelect>
                        </div>

                        {/* Company */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</Label>
                            <ManagementLegacyCompanySelect
                                value={processCompanyId}
                                onChange={setProcessCompanyId}
                                className="w-full h-10"
                            />
                        </div>

                        {/* Year & Month */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Year</Label>
                                <NativeSelect value={bonusYear} onChange={e => setBonusYear(parseInt(e.target.value))} className="w-full h-10">
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Month</Label>
                                <NativeSelect value={bonusMonth} onChange={e => setBonusMonth(parseInt(e.target.value))} className="w-full h-10">
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </NativeSelect>
                            </div>
                        </div>

                        {/* Policy Info */}
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-medium leading-relaxed">
                            <p className="font-bold mb-1.5 flex items-center gap-1.5">
                                <IconAlertCircle className="size-3.5" /> Auto-Calculation Policy
                            </p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>Job Age &gt; 1 Year → 50% of Gross Salary</li>
                                <li>Job Age 6–12 Months → 25% of Gross Salary</li>
                                <li>Job Age &lt; 6 Months → Not eligible</li>
                            </ul>
                        </div>

                        {/* Result Summary */}
                        {processResult && (
                            <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 p-4 space-y-3">
                                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                                    <IconSparkles className="size-4" />
                                    Processing Complete
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm border-t border-emerald-200 dark:border-emerald-800 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Processed</span>
                                        <span className="text-xl font-black">{processResult.processedCount} Records</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Total Value</span>
                                        <span className="text-xl font-black text-emerald-600">৳{processResult.totalAmount.toLocaleString()}</span>
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
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <><IconLoader className="size-4 animate-spin mr-2" />Processing...</>
                                ) : (
                                    <><IconSparkles className="size-4 mr-2" />Process Now</>
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
