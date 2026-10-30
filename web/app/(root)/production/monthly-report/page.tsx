"use client"

import * as React from "react"
import { IconCalendarStats, IconFilter, IconTarget, IconChartLine, IconTrophy } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { productionAssignmentService, MonthlyReportItem } from "@/lib/services/production-assignment"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { format, startOfMonth, endOfMonth } from "date-fns"

export default function MonthlyReportPage() {
    const [data, setData] = React.useState<MonthlyReportItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [filters, setFilters] = React.useState({
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
    })

    const fetchReport = async () => {
        try {
            setIsLoading(true)
            const result = await productionAssignmentService.getMonthlyReport({
                month: filters.month,
                year: filters.year
            })
            setData(result)
        } catch (error) {
            toast.error("Failed to fetch monthly report")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchReport()
    }, [filters])

    const summaryStats = React.useMemo(() => {
        const totalOutput = data.reduce((sum, item) => sum + item.totalCompleted, 0)
        const avgEfficiency = data.length > 0
            ? data.reduce((sum, item) => sum + item.avgAchievement, 0) / data.length
            : 0
        const topLine = data.length > 0
            ? [...data].sort((a, b) => b.totalCompleted - a.totalCompleted)[0].lineName
            : "-"

        return { totalOutput, avgEfficiency, topLine }
    }, [data])

    const columns: ColumnDef<MonthlyReportItem>[] = [
        {
            accessorKey: "lineName",
            header: "Line Name",
            cell: ({ row }) => <div className="font-semibold">{row.original.lineName}</div>,
        },
        {
            accessorKey: "month",
            header: "Month",
            cell: ({ row }) => <div>{row.original.month} {row.original.year}</div>,
        },
        {
            accessorKey: "totalTarget",
            header: "Monthly Target",
            cell: ({ row }) => <div>{row.original.totalTarget.toLocaleString()}</div>,
        },
        {
            accessorKey: "totalCompleted",
            header: "Total Output",
            cell: ({ row }) => <div className="font-medium">{(row.getValue("totalCompleted") as number).toLocaleString()} pcs</div>,
        },
        {
            accessorKey: "avgAchievement",
            header: "Avg. Achievement",
            cell: ({ row }) => {
                const achievement = row.getValue("avgAchievement") as number
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full ${achievement >= 90 ? 'bg-green-500' : achievement >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(achievement, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold">{achievement.toFixed(1)}%</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "workingDays",
            header: "Working Days",
        },
        {
            accessorKey: "topStyle",
            header: "Major Style",
            cell: ({ row }) => <Badge variant="outline">{row.original.topStyle || "-"}</Badge>,
        },
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-muted/30 min-h-screen">
            <div className="flex items-center gap-2 px-4 lg:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <IconCalendarStats className="size-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Monthly Production Monitoring</h1>
                    <p className="text-sm text-muted-foreground">
                        Performance overview and aggregated monthly analysis.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 px-4 lg:px-6 grid-cols-1 md:grid-cols-3">
                <Card className="border shadow-none bg-blue-50/10 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <IconTarget className="size-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Total Output</p>
                            <p className="text-2xl font-bold">{summaryStats.totalOutput.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-none bg-orange-50/10 dark:bg-orange-900/10 border-orange-200/50 dark:border-orange-800/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <IconChartLine className="size-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wider">Avg. Achievement</p>
                            <p className="text-2xl font-bold">{summaryStats.avgEfficiency.toFixed(1)}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-none bg-green-50/10 dark:bg-green-900/10 border-green-200/50 dark:border-green-800/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <IconTrophy className="size-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Top Line</p>
                            <p className="text-2xl font-bold">{summaryStats.topLine}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Section */}
            <Card className="mx-4 lg:mx-6 border shadow-sm bg-card">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <IconFilter className="size-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Report Filters:</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Month</Label>
                            <NativeSelect
                                className="h-9 text-xs w-32"
                                value={filters.month}
                                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                            >
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                    <option key={m} value={String(i + 1)}>{m}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Year</Label>
                            <NativeSelect
                                className="h-9 text-xs w-24"
                                value={filters.year}
                                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                            >
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </NativeSelect>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-9 ml-auto"
                            onClick={() => setFilters({
                                month: String(new Date().getMonth() + 1),
                                year: String(new Date().getFullYear())
                            })}
                        >
                            Current Month
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="mx-4 lg:mx-6 bg-card border rounded-lg overflow-hidden">
                <DataTable
                    data={data}
                    columns={columns}
                    showTabs={false}
                    isLoading={isLoading}
                />
            </div>
        </div>
    )
}
import { Button } from "@/components/ui/button"
