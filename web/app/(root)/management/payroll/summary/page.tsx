"use client"

import * as React from "react"
import {
    IconChartBar,
    IconSearch,
    IconLoader,
    IconTrendingUp,
    IconUsers,
    IconReportMoney,
    IconFileAnalytics
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import { payrollService, type SalarySummary } from "@/lib/services/payroll"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
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

export default function SalarySummaryPage() {
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [isLoading, setIsLoading] = React.useState(false)
    const [summary, setSummary] = React.useState<SalarySummary | null>(null)

    React.useEffect(() => {
        handleSearch()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const data = await payrollService.getSummary(year, month)
            setSummary(data)
        } catch (error) {
            toast.error("Failed to load summary")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1 px-6">
                <h1 className="text-2xl font-bold tracking-tight">Financial Summary</h1>
                <p className="text-muted-foreground text-sm">Overview of payroll expenses and statistics</p>
            </div>

            {/* Filters */}
            <div className="px-6">
                <Card className="border-none shadow-sm bg-muted/30">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <IconSearch className="size-4 opacity-70" />
                            Filter Criteria
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5 min-w-[150px]">
                                <Label className="text-xs font-semibold text-muted-foreground">Month</Label>
                                <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-9">
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1.5 min-w-[120px]">
                                <Label className="text-xs font-semibold text-muted-foreground">Year</Label>
                                <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-9">
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                    <option value={2024}>2024</option>
                                </NativeSelect>
                            </div>
                            <Button
                                className="h-9 gap-2"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                                Update View
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {summary && (
                <div className="px-6 space-y-6">
                    {/* High Level Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Total Disbursement"
                            value={`৳${summary.totalNetPayable.toLocaleString()}`}
                            icon={IconReportMoney}
                        />
                        <MetricCard
                            title="Total OT Amount"
                            value={`৳${summary.totalOTAmount.toLocaleString()}`}
                            icon={IconTrendingUp}
                        />
                        <MetricCard
                            title="Employee Count"
                            value={summary.totalEmployees.toString()}
                            icon={IconUsers}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Department Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
                                <CardDescription>Payroll distribution by department</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {summary.departmentSummaries.map((dept, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{dept.name}</span>
                                            <span className="font-bold">৳{dept.totalNetPayable.toLocaleString()}</span>
                                        </div>
                                        <Progress
                                            value={(dept.totalNetPayable / (summary.totalNetPayable || 1)) * 100}
                                            className="h-2"
                                        />
                                        <div className="text-xs text-muted-foreground text-right">{dept.employeeCount} Employees</div>
                                    </div>
                                ))}
                                {summary.departmentSummaries.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No department data available.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Analysis Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <IconFileAnalytics className="size-4 text-muted-foreground" />
                                    Cost Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Average Cost per Employee</p>
                                    <h3 className="text-2xl font-bold">
                                        ৳{(summary.totalEmployees > 0 ? summary.totalNetPayable / summary.totalEmployees : 0).toFixed(0).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm border-b pb-2">
                                        <span className="text-muted-foreground">Total Gross Salary</span>
                                        <span className="font-medium">৳{summary.totalGrossSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-b pb-2">
                                        <span className="text-muted-foreground">Total Deductions</span>
                                        <span className="font-medium text-rose-600">-৳{summary.totalDeductions.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2">
                                        <span className="font-semibold">Net Payable</span>
                                        <span className="font-bold">৳{summary.totalNetPayable.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ title, value, icon: Icon }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
