"use client"

import * as React from "react"
import { format } from "date-fns"
import { IconCalendar as CalendarIcon, IconFileSpreadsheet, IconLoader, IconRefresh, IconTrash, IconCalculator } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { cn } from "@/lib/utils"
import { BillDto, BillResponseDto } from "@/lib/services/bill"
import { organogramService } from "@/lib/services/organogram"
import { useCompanyContext } from "@/components/providers/company-context"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"

interface BillReportPageProps {
    title: string
    exportEndpoint: string
    service: {
        getAll: (params: any) => Promise<BillResponseDto>
        process: (data: any) => Promise<any>
        delete: (id: number) => Promise<any>
        deleteMultiple: (ids: number[]) => Promise<any>
        export: (params: any) => Promise<any>
    }
}

export function BillReportPage({ title, exportEndpoint, service }: BillReportPageProps) {
    const { activeCompanyId } = useCompanyContext()
    const [data, setData] = React.useState<BillDto[]>([])
    const [summary, setSummary] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [selectedRows, setSelectedRows] = React.useState<BillDto[]>([])

    // Filters
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
    const [departmentId, setDepartmentId] = React.useState<string>("all")
    const [employeeType, setEmployeeType] = React.useState<string>("all")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [departments, setDepartments] = React.useState<{ id: number; nameEn: string }[]>([])

    React.useEffect(() => {
        fetchDepartments()
    }, [])

    const buildExportParams = React.useCallback(async () => {
        if (!activeCompanyId) return null
        const dept = departments.find((d) => String(d.id) === departmentId)
        let departmentGuid: string | undefined
        if (departmentId !== "all" && dept) {
            const fullDept = await organogramService.getDepartments({ companyId: activeCompanyId })
            departmentGuid = fullDept.find((d) => d.id === dept.id)?.entityId
        }
        return {
            companyId: activeCompanyId,
            fromDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
            toDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
            departmentId: departmentGuid,
            employeeType: employeeType !== "all" ? employeeType : undefined,
            searchTerm: searchTerm.trim() || undefined,
        }
    }, [activeCompanyId, departmentId, departments, employeeType, searchTerm, selectedDate])

    const [exportParams, setExportParams] = React.useState<Record<string, string | undefined>>({})

    React.useEffect(() => {
        void buildExportParams().then((params) => {
            if (params) setExportParams(params)
        })
    }, [buildExportParams])

    const fetchDepartments = async () => {
        try {
            const depts = await organogramService.getDepartments()
            setDepartments(depts)
        } catch (error) {
            console.error("Failed to fetch departments", error)
        }
    }

    const fetchData = React.useCallback(async () => {
        if (!activeCompanyId) {
            setData([])
            setSummary(null)
            setIsLoading(false)
            return
        }
        setIsLoading(true)
        try {
            const dept = departments.find((d) => String(d.id) === departmentId)
            const params: {
                companyId: string
                fromDate: string
                toDate: string
                departmentId?: string
                searchTerm?: string
                employeeType?: string
            } = {
                companyId: activeCompanyId,
                fromDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
                toDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
            }
            if (departmentId !== "all" && dept) {
                const fullDept = await organogramService.getDepartments({ companyId: activeCompanyId })
                const match = fullDept.find((d) => d.id === dept.id)
                if (match?.entityId) params.departmentId = match.entityId
            }
            if (searchTerm.trim()) params.searchTerm = searchTerm
            if (employeeType !== "all") params.employeeType = employeeType

            const response = await service.getAll(params)
            setData(response.records)
            setSummary(response.summary)
        } catch (error) {
            toast.error(`Failed to fetch ${title} data`)
        } finally {
            setIsLoading(false)
        }
    }, [selectedDate, departmentId, searchTerm, employeeType, service, title, activeCompanyId, departments])

    React.useEffect(() => {
        if (!activeCompanyId) return
        const timeoutId = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [fetchData, activeCompanyId])

    const handleProcess = async () => {
        if (!selectedDate) {
            toast.error("Please select a date")
            return
        }
        if (!activeCompanyId) {
            toast.error("Select a company first")
            return
        }

        setIsProcessing(true)
        try {
            const dept = departments.find((d) => String(d.id) === departmentId)
            let departmentGuid: string | undefined
            if (departmentId !== "all" && dept) {
                const fullDept = await organogramService.getDepartments({ companyId: activeCompanyId })
                departmentGuid = fullDept.find((d) => d.id === dept.id)?.entityId
            }
            await service.process({
                companyId: activeCompanyId,
                fromDate: format(selectedDate, "yyyy-MM-dd"),
                toDate: format(selectedDate, "yyyy-MM-dd"),
                departmentId: departmentGuid,
                employeeType: employeeType !== "all" ? employeeType : undefined,
                searchTerm: searchTerm.trim() || undefined,
            })
            toast.success(`${title} processed successfully`)
            fetchData()
        } catch (error) {
            toast.error(`Failed to process ${title}`)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            if (!activeCompanyId) {
                toast.error("Select a company first")
                return
            }
            const dept = departments.find((d) => String(d.id) === departmentId)
            let departmentGuid: string | undefined
            if (departmentId !== "all" && dept) {
                const fullDept = await organogramService.getDepartments({ companyId: activeCompanyId })
                departmentGuid = fullDept.find((d) => d.id === dept.id)?.entityId
            }
            await service.export({
                companyId: activeCompanyId,
                fromDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
                toDate: format(selectedDate ?? new Date(), "yyyy-MM-dd"),
                departmentId: departmentGuid,
                employeeType: employeeType !== "all" ? employeeType : undefined,
                searchTerm: searchTerm.trim() || undefined,
            })
            toast.success("Excel exported successfully")
        } catch (error) {
            toast.error("Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    const handleDeleteMultiple = async () => {
        if (selectedRows.length === 0) return
        
        try {
            await service.deleteMultiple(selectedRows.map(r => r.id))
            toast.success("Records deleted successfully")
            fetchData()
            setSelectedRows([])
        } catch (error) {
            toast.error("Deletion failed")
        }
    }

    const columns: ColumnDef<BillDto>[] = [
        {
            accessorKey: "employeeId",
            header: "ID",
        },
        {
            accessorKey: "employeeName",
            header: "Name",
        },
        {
            accessorKey: "department",
            header: "Department",
        },
        {
            accessorKey: "designation",
            header: "Designation",
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
        },
        {
            accessorKey: "shiftName",
            header: "Shift",
        },
        {
            accessorKey: "inTime",
            header: "In Time",
            cell: ({ row }) => row.original.inTime ? format(new Date(row.original.inTime), "HH:mm") : "-",
        },
        {
            accessorKey: "outTime",
            header: "Out Time",
            cell: ({ row }) => row.original.outTime ? format(new Date(row.original.outTime), "HH:mm") : "-",
        },
        ...(title.toLowerCase().includes("tiffin") ? [{
            accessorKey: "tiffinCount",
            header: "Tiffin Count",
            cell: ({ row }: any) => <span className="font-bold text-blue-600">{row.original.tiffinCount}</span>
        }] : []),
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => (
                <span className="font-medium text-primary">
                    {row.original.amount.toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    row.original.status === "Approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                )}>
                    {row.original.status}
                </span>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground/90">{title}</h1>
                    <p className="text-muted-foreground mt-1">Manage and process employee {title.toLowerCase()} reports</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <HrReportExportButtons
                        variant="bill"
                        exportUrl={exportEndpoint}
                        params={exportParams}
                        filePrefix={`${exportEndpoint.replace(/-bills$/, "")}-${format(selectedDate ?? new Date(), "yyyyMMdd")}`}
                        disabled={!activeCompanyId || data.length === 0}
                    />
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting || data.length === 0}
                        className="h-10 hover:bg-muted/50"
                    >
                        {isExporting ? <IconLoader className="mr-2 h-4 w-4 animate-spin" /> : <IconFileSpreadsheet className="mr-2 h-4 w-4" />}
                        CSV
                    </Button>
                    <Button 
                        onClick={handleProcess} 
                        disabled={isProcessing}
                        className="h-10 shadow-md transition-all active:scale-95"
                    >
                        {isProcessing ? <IconLoader className="mr-2 h-4 w-4 animate-spin" /> : <IconCalculator className="mr-2 h-4 w-4" />}
                        Process Bills
                    </Button>
                </div>
            </div>

            {/* Tabs & Advanced Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <Tabs value={employeeType} onValueChange={setEmployeeType} className="w-[300px]">
                    <TabsList className="bg-muted/50">
                        <TabsTrigger value="all" className="data-[state=active]:bg-background">All</TabsTrigger>
                        <TabsTrigger value="staff" className="data-[state=active]:bg-background">Staff</TabsTrigger>
                        <TabsTrigger value="worker" className="data-[state=active]:bg-background">Worker</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">৳ {summary?.totalAmount?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Accumulated for period</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary?.totalEmployees || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique recipients</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{summary?.totalRecords || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Processed occurrences</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Search</label>
                        <Input
                            placeholder="Employee ID or Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="w-[200px]">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Department</label>
                        <Select value={departmentId} onValueChange={setDepartmentId}>
                            <SelectTrigger className="bg-muted/30 border-none">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                        {dept.nameEn}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-none">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block uppercase">Select Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[200px] justify-start text-left font-normal bg-muted/30 border-none h-10",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-end self-end h-10">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={fetchData} 
                            disabled={isLoading}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            <IconRefresh className={cn("h-5 w-5", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table Area */}
            <Card className="border-none shadow-md overflow-hidden bg-background">
                <DataTable
                    data={data}
                    columns={columns}
                    isLoading={isLoading}
                    enableSelection={true}
                    onSelectionChange={setSelectedRows}
                    showActions={true}
                    onDeleteSelected={handleDeleteMultiple}
                    className="p-0 border-none rounded-none"
                />
            </Card>
        </div>
    )
}
