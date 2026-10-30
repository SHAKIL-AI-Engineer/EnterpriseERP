"use client"

import * as React from "react"
import {
    IconChartBar,
    IconSearch,
    IconLoader,
    IconTrendingUp,
    IconUsers,
    IconReportMoney,
    IconFileAnalytics,
    IconFileSpreadsheet,
    IconFileTypePdf,
    IconBuilding,
    IconHierarchy,
    IconLayersIntersect,
    IconStack3
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import { payrollService, type SalarySummary, type SummaryItem } from "@/lib/services/payroll"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function SalarySummaryPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [summary, setSummary] = React.useState<SalarySummary | null>(null)

    React.useEffect(() => {
        handleSearch()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const data = await payrollService.getSummary(
                year,
                month,
                selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            )
            console.log("Summary API Response:", data);
            setSummary(data)
        } catch (error) {
            toast.error("Failed to load summary")
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportExcel = async () => {
        setIsExporting(true)
        try {
            await payrollService.exportSummaryExcel({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            })
            toast.success("Excel summary downloaded")
        } catch (error) {
            toast.error("Failed to export Excel")
        } finally {
            setIsExporting(false)
        }
    }

    const handleExportPdf = async () => {
        setIsExporting(true)
        try {
            await payrollService.exportSummaryPdf({
                year,
                month,
                companyId: selectedCompanyId === "all" ? undefined : parseInt(selectedCompanyId)
            })
            toast.success("PDF summary downloaded")
        } catch (error) {
            toast.error("Failed to export PDF")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent uppercase">
                        Payroll Financial Summary
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <IconChartBar className="size-4" />
                        Consolidated organizational payroll analysis and cost breakdown
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 gap-2 border-green-200 hover:bg-green-50 hover:text-green-700 transition-all font-semibold shadow-sm"
                        onClick={handleExportExcel}
                        disabled={isExporting || !summary}
                    >
                        <IconFileSpreadsheet className="size-4" />
                        Excel
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 gap-2 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all font-semibold shadow-sm"
                        onClick={handleExportPdf}
                        disabled={isExporting || !summary}
                    >
                        <IconFileTypePdf className="size-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm bg-muted/20 border">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                Month
                            </Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-10">
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Year</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-10">
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                            </NativeSelect>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase">Company</Label>
                            <ManagementLegacyCompanySelect
                                value={selectedCompanyId}
                                onChange={setSelectedCompanyId}
                                className="h-10"
                            />
                        </div>
                        <Button
                            className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95 text-white"
                            onClick={handleSearch}
                            disabled={isLoading}
                        >
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                            Update Summary
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {summary && (
                <div className="space-y-8">
                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Total Disbursement"
                            value={`৳${Math.round(summary.totalNetPayable ?? 0).toLocaleString()}`}
                            icon={IconReportMoney}
                            color="primary"
                            description="Actual amount to be paid"
                        />
                        <MetricCard
                            title="Gross Liability"
                            value={`৳${Math.round(summary.totalGrossSalary ?? 0).toLocaleString()}`}
                            icon={IconBuilding}
                            color="primary"
                            description="Total salary before deductions"
                        />
                        <MetricCard
                            title="Total OT Expense"
                            value={`৳${Math.round(summary.totalOTAmount ?? 0).toLocaleString()}`}
                            icon={IconTrendingUp}
                            color="emerald"
                            description="Overtime cost for the month"
                        />
                        <MetricCard
                            title="Workforce Size"
                            value={(summary.totalEmployees ?? 0).toString()}
                            icon={IconUsers}
                            color="amber"
                            description="Total active employees"
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Tabbed Summaries */}
                        <div className="xl:col-span-2 space-y-4">
                            <Tabs defaultValue="department" className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <TabsList scrollable={false} className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/40">
                                        <TabsTrigger value="department" className="py-2 flex items-center gap-1.5">
                                            <IconHierarchy className="size-3.5" />
                                            Dept
                                        </TabsTrigger>
                                        <TabsTrigger value="section" className="py-2 flex items-center gap-1.5">
                                            <IconLayersIntersect className="size-3.5" />
                                            Section
                                        </TabsTrigger>
                                        <TabsTrigger value="line" className="py-2 flex items-center gap-1.5">
                                            <IconChartBar className="size-3.5" />
                                            Line
                                        </TabsTrigger>
                                        <TabsTrigger value="group" className="py-2 flex items-center gap-1.5">
                                            <IconStack3 className="size-3.5" />
                                            Group
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="department" className="outline-none space-y-4">
                                    <SummaryTable 
                                        items={summary.departmentSummaries ?? (summary as any).DepartmentSummaries} 
                                        label="Department" 
                                        total={summary.totalNetPayable ?? (summary as any).TotalNetPayable ?? 0} 
                                    />
                                </TabsContent>
                                <TabsContent value="section" className="outline-none space-y-4">
                                    <SummaryTable 
                                        items={summary.sectionSummaries ?? (summary as any).SectionSummaries} 
                                        label="Section" 
                                        total={summary.totalNetPayable ?? (summary as any).TotalNetPayable ?? 0} 
                                    />
                                </TabsContent>
                                <TabsContent value="line" className="outline-none space-y-4">
                                    <SummaryTable 
                                        items={summary.lineSummaries ?? (summary as any).LineSummaries} 
                                        label="Line" 
                                        total={summary.totalNetPayable ?? (summary as any).TotalNetPayable ?? 0} 
                                    />
                                </TabsContent>
                                <TabsContent value="group" className="outline-none space-y-4">
                                    <SummaryTable 
                                        items={summary.groupSummaries ?? (summary as any).GroupSummaries} 
                                        label="Group" 
                                        total={summary.totalNetPayable ?? (summary as any).TotalNetPayable ?? 0} 
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Analysis & Cost Center */}
                        <div className="space-y-6">
                            <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-primary/5 to-white dark:from-slate-900 border">
                                <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <IconFileAnalytics className="size-5 text-primary" />
                                        Cost Center Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Efficiency Metrics</p>
                                        <div className="p-5 bg-white/80 rounded-xl border-2 border-primary/10 shadow-sm">
                                            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Avg Cost / Employee</p>
                                            <div className="flex items-baseline gap-1">
                                                <h3 className="text-3xl font-black text-primary">
                                                    ৳{Math.round((summary.totalEmployees ?? 0) > 0 ? (summary.totalNetPayable ?? 0) / (summary.totalEmployees ?? 1) : 0).toLocaleString()}
                                                </h3>
                                                <span className="text-xs font-semibold text-primary/70 ml-1">month</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <AnalysisRow label="Total Gross Salary" value={(summary.totalGrossSalary ?? (summary as any).TotalGrossSalary) ?? 0} color="slate" />
                                        <AnalysisRow label="Overtime Expense" value={(summary.totalOTAmount ?? (summary as any).TotalOTAmount) ?? 0} color="emerald" />
                                        <div className="h-px bg-slate-200 w-full" />
                                        <AnalysisRow label="Deductions & Adjust." value={(summary.totalDeductions ?? (summary as any).TotalDeductions) ?? 0} color="rose" negative />
                                        <div className="pt-2">
                                            <div className="flex justify-between items-center p-4 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                                                <span className="font-bold text-sm">TOTAL NET PAYABLE</span>
                                                <span className="text-xl font-black">৳{Math.round((summary.totalNetPayable ?? (summary as any).TotalNetPayable) ?? 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary Note */}
                            <div className="p-4 rounded-xl border-l-4 border-amber-400 bg-amber-50 text-amber-900 text-xs italic leading-loose shadow-sm">
                                <strong>Note:</strong> All figures presented are rounded to the nearest integer for summary reporting. 
                                Percentages for breakdown tables are calculated against the Total Net Payable liability.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ title, value, icon: Icon, color, description }: any) {
    const colorMap: any = {
        primary: "text-primary bg-primary/5 border-primary/10",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100"
    }

    return (
        <Card className="hover:shadow-md transition-shadow border-none shadow-sm border">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl border ${colorMap[color] || ""}`}>
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{title}</p>
                        <p className="text-[10px] text-muted-foreground/70 leading-none">{description}</p>
                    </div>
                </div>
                <div className="text-2xl font-bold tracking-tighter">{value}</div>
            </CardContent>
        </Card>
    )
}

function SummaryTable({ items, label, total }: { items: SummaryItem[], label: string, total: number }) {
    return (
        <Card className="border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">#</th>
                            <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground">{label} Name</th>
                            <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Staff</th>
                            <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Total Salary</th>
                            <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Contr. %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items?.map((item, i) => {
                            // Robust fallbacks for property casing
                            const name = item.name || (item as any).Name || "";
                            const staff = item.employeeCount || (item as any).EmployeeCount || 0;
                            const amount = item.totalNetPayable || (item as any).TotalNetPayable || 0;
                            const percentage = total > 0 ? (amount / total) * 100 : 0;

                            return (
                                <tr key={i} className="hover:bg-muted/30 transition-colors group">
                                    <td className="py-3 px-4 text-muted-foreground font-medium">{i + 1}</td>
                                    <td className="py-3 px-4 font-semibold group-hover:text-primary transition-colors">{name}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold border border-slate-200">
                                            {staff}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold">৳{Math.round(amount).toLocaleString()}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-3 min-w-[100px]">
                                            <span className="text-[10px] font-black text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </span>
                                            <Progress 
                                                value={percentage} 
                                                className="h-1.5 w-16" 
                                                indicatorClassName="bg-primary"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!items || items.length === 0) && (
                            <tr>
                                <td colSpan={5} className="py-10 text-center text-muted-foreground italic">
                                    No summary data found for {label}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

function AnalysisRow({ label, value, color, negative }: any) {
    const colorClasses: any = {
        slate: "text-slate-900",
        emerald: "text-emerald-700",
        rose: "text-rose-700"
    }

    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className={`font-black ${colorClasses[color] || ""}`}>
                {negative ? "-" : ""}৳{Math.round(Math.abs(value)).toLocaleString()}
            </span>
        </div>
    )
}
