"use client"

import * as React from "react"
import {
    IconCalendar,
    IconChartBar,
    IconFileSpreadsheet,
    IconRefresh,
    IconTrendingUp,
    IconTarget,
    IconCheck,
    IconFilter,
    IconSearch
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { productionAssignmentService, DailyReportItem } from "@/lib/services/production-assignment"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { productionLineService, ProductionLine } from "@/lib/services/production-line"

export default function DailyProductionReportPage() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [records, setRecords] = React.useState<DailyReportItem[]>([])
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [lines, setLines] = React.useState<ProductionLine[]>([])

    // Filters
    const [filters, setFilters] = React.useState({
        lineId: "",
        buyer: "",
        styleNo: "",
        searchTerm: ""
    })

    const [showFilters, setShowFilters] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params = {
                date: date ? date.toISOString().split('T')[0] : undefined,
                lineId: filters.lineId || undefined,
                buyer: filters.buyer || undefined,
                styleNo: filters.styleNo || undefined,
                searchTerm: filters.searchTerm || undefined
            }
            const data = await productionAssignmentService.getDailyReport(params)
            setRecords(data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load report")
        } finally {
            setIsLoading(false)
        }
    }, [date, filters])

    const fetchLines = async () => {
        try {
            const data = await productionLineService.getAll()
            setLines(data)
        } catch (error) {
            console.error(error)
        }
    }

    React.useEffect(() => {
        fetchLines()
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleExportExcel = async () => {
        try {
            const params = {
                date: date ? date.toISOString().split('T')[0] : undefined,
                lineId: filters.lineId || undefined,
                buyer: filters.buyer || undefined,
                styleNo: filters.styleNo || undefined,
                searchTerm: filters.searchTerm || undefined
            }
            await productionAssignmentService.exportExcel(params)
            toast.success("Excel exported successfully")
        } catch (error) {
            toast.error("Excel export failed")
        }
    }

    const columns: ColumnDef<DailyReportItem>[] = [
        {
            accessorKey: "lineName",
            header: "Line Name",
            cell: ({ row }) => <div className="font-semibold text-gray-900">{row.getValue("lineName")}</div>,
        },
        {
            accessorKey: "styleNo",
            header: "Style No",
            cell: ({ row }) => <div className="text-gray-600">{row.getValue("styleNo")}</div>,
        },
        {
            accessorKey: "buyer",
            header: "Buyer",
        },
        {
            accessorKey: "dailyTarget",
            header: "Daily Target",
            cell: ({ row }) => <div className="font-semibold text-gray-700">{row.getValue("dailyTarget")}</div>,
        },
        {
            accessorKey: "completed",
            header: "Total Produced",
            cell: ({ row }) => <div className="font-semibold text-blue-600">{row.getValue("completed")}</div>,
        },
        {
            accessorKey: "achievement",
            header: "Achievement %",
            cell: ({ row }) => {
                const achievement = row.getValue("achievement") as number
                return (
                    <div className="flex flex-col gap-1 w-32">
                        <div className="flex justify-between text-[11px] font-medium text-gray-500">
                            <span>{achievement.toFixed(1)}%</span>
                        </div>
                        <Progress value={achievement} className="h-1.5" />
                    </div>
                )
            },
        },
    ]

    const totalTarget = records.reduce((acc, r) => acc + r.dailyTarget, 0)
    const totalProduced = records.reduce((acc, r) => acc + r.completed, 0)
    const avgAchievement = totalTarget > 0 ? (totalProduced / totalTarget * 100) : 0

    return (
        <div className="flex flex-col gap-8 p-8 font-sans bg-muted/30 min-h-screen">
            {/* Simple Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Daily Production Monitoring</h1>
                    <p className="text-muted-foreground mt-1">Monitor and export daily production performance reports</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-[200px]">
                        <DatePicker date={date} setDate={setDate} />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(showFilters && "bg-muted")}
                    >
                        <IconFilter size={18} className="mr-2" />
                        Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconRefresh size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90" onClick={handleExportExcel}>
                        <IconFileSpreadsheet size={18} className="mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Quick Stats - Simple Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg bg-card">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <IconTarget size={20} />
                        <span className="text-sm font-medium uppercase tracking-wider">Total Target</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{totalTarget.toLocaleString()}</div>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <IconCheck size={20} />
                        <span className="text-sm font-medium uppercase tracking-wider">Produced</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">{totalProduced.toLocaleString()}</div>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                    <div className="flex items-center gap-3 text-muted-foreground mb-2">
                        <IconTrendingUp size={20} />
                        <span className="text-sm font-medium uppercase tracking-wider">Achievement</span>
                    </div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{avgAchievement.toFixed(1)}%</div>
                </div>
            </div>

            {/* Simple Filters */}
            {showFilters && (
                <div className="p-6 border rounded-lg bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-bold uppercase">Line</Label>
                        <NativeSelect
                            value={filters.lineId}
                            onChange={(e) => setFilters(prev => ({ ...prev, lineId: e.target.value }))}
                        >
                            <option value="">All Lines</option>
                            {lines.map(l => (
                                <option key={l.id} value={l.id}>{l.lineName}</option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-bold uppercase">Buyer</Label>
                        <Input
                            placeholder="Find buyer..."
                            value={filters.buyer}
                            onChange={(e) => setFilters(prev => ({ ...prev, buyer: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-bold uppercase">Style</Label>
                        <Input
                            placeholder="Find style..."
                            value={filters.styleNo}
                            onChange={(e) => setFilters(prev => ({ ...prev, styleNo: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-bold uppercase">Search</Label>
                        <Input
                            placeholder="Search..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        />
                    </div>
                </div>
            )}

            {/* Data Table Section */}
            <div className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-muted/50 p-4 border-b">
                    <h3 className="font-semibold text-foreground">Performance Details</h3>
                </div>
                <DataTable
                    data={records}
                    columns={columns}
                    isLoading={isLoading}
                    showTabs={false}
                    searchKey="styleNo"
                />
            </div>
        </div>
    )
}
