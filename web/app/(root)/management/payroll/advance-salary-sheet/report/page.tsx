"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { IconArrowLeft, IconSearch, IconLoader, IconRotateClockwise, IconFileReport, IconDownload } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { payrollService, type AdvanceSalary } from "@/lib/services/payroll"
import { companyService } from "@/lib/services/company"
import { toast } from "sonner"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

export default function AdvanceSalaryReportPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [companies, setCompanies] = React.useState<any[]>([])
    const [records, setRecords] = React.useState<AdvanceSalary[]>([])
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [confirmDialog, setConfirmDialog] = React.useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {}
    })

    const openConfirmDialog = (title: string, description: string, onConfirm: () => void) => {
        setConfirmDialog({
            isOpen: true,
            title,
            description,
            onConfirm
        })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    }

    const [filters, setFilters] = React.useState({
        companyId: "all",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                const cmp = await companyService.getAll()
                setCompanies(cmp)
                handleSearch()
            } catch (error) {
                console.error("Failed to load generic data", error)
            }
        }
        loadInitialData()
    }, [])

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const results = await payrollService.getAdvanceSalaries({
                companyId: filters.companyId === "all" ? undefined : parseInt(filters.companyId),
                month: filters.month,
                year: filters.year
            })
            setRecords(results)
        } catch (error) {
            toast.error("Failed to load report data")
        } finally {
            setIsLoading(false)
            setSelectedIds(new Set())
        }
    }

    const resetFilters = () => {
        setFilters({
            companyId: "all",
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === records.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(records.map(r => r.id)))
        }
    }

    const toggleRecord = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const executeDelete = async () => {
        setIsDeleting(true)
        try {
            await payrollService.batchDeleteAdvanceSalary(Array.from(selectedIds))
            toast.success(`Successfully deleted ${selectedIds.size} records`)
            handleSearch() // Refresh data
        } catch (error) {
            toast.error("Failed to delete records")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDelete = () => {
        if (selectedIds.size === 0) return
        
        openConfirmDialog(
            "Delete Selected Records",
            `Are you sure you want to delete ${selectedIds.size} records? This action cannot be undone.`,
            () => executeDelete()
        )
    }

    const columns: ColumnDef<AdvanceSalary>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={selectedIds.size === records.length && records.length > 0}
                    onCheckedChange={toggleAll}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedIds.has(row.original.id)}
                    onCheckedChange={() => toggleRecord(row.original.id)}
                />
            )
        },
        {
            accessorKey: "employeeId",
            header: "Employee ID",
            cell: ({ row }) => <span className="font-medium text-gray-700">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span className="font-semibold">{row.original.employeeName}</span>
        },
        {
            accessorKey: "amount",
            header: "Advance Amount",
            cell: ({ row }) => <span className="font-bold text-gray-900">৳{row.original.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        },
        {
            accessorKey: "requestDate",
            header: "Processed Date",
            cell: ({ row }) => <span className="text-gray-600">{format(new Date(row.original.requestDate), "dd MMM yyyy")}</span>
        },
        {
            id: "repaymentPeriod",
            header: "Repayment Period",
            cell: ({ row }) => {
                const monthName = MONTHS.find(m => m.value === row.original.repaymentMonth)?.label || row.original.repaymentMonth
                return <span className="text-gray-600">{monthName} {row.original.repaymentYear}</span>
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.status === "Approved" ? "success" : "secondary"} className="text-[10px] font-normal px-2 py-0 h-5">
                    {row.original.status}
                </Badge>
            )
        },
        {
            accessorKey: "remarks",
            header: "Remarks",
            cell: ({ row }) => <span className="text-xs text-gray-500 truncate max-w-[200px] inline-block" title={row.original.remarks}>{row.original.remarks || "-"}</span>
        }
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">Advance Salary Report</h1>
                        <p className="text-muted-foreground text-xs">Detailed listing of all processed advance salaries</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 h-9 text-xs font-semibold" onClick={() => window.print()}>
                    <IconDownload className="size-4" />
                    Export
                </Button>
            </div>

            {/* Advance Filters */}
            <Card className="border shadow-sm">
                <div className="px-6 py-3 flex items-center justify-between border-b bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <IconSearch className="size-4 text-gray-500" />
                        <h2 className="text-sm font-semibold text-gray-700">Filter Records</h2>
                    </div>
                     <button
                        onClick={resetFilters}
                        className="text-xs font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1"
                    >
                        <IconRotateClockwise className="size-3" />
                        Reset
                    </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-gray-500">Company</Label>
                        <NativeSelect
                            value={filters.companyId}
                            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                            className="h-9 text-sm"
                        >
                            <option value="all">Every Company</option>
                            {companies.map(c => <option key={c.id} value={c.id.toString()}>{c.companyNameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-gray-500">Repayment Month</Label>
                        <NativeSelect
                            value={filters.month.toString()}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                            className="h-9 text-sm"
                        >
                            {MONTHS.map(m => <option key={m.value} value={m.value.toString()}>{m.label}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-gray-500">Repayment Year</Label>
                        <NativeSelect
                            value={filters.year.toString()}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                            className="h-9 text-sm"
                        >
                            {Array.from({ length: 5 }).map((_, i) => {
                                const yr = new Date().getFullYear() - 2 + i;
                                return <option key={yr} value={yr.toString()}>{yr}</option>;
                            })}
                        </NativeSelect>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleSearch}
                            className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                            Search
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Data Table */}
            <Card className="shadow-sm border overflow-hidden">
                <div className="px-6 py-3 border-b bg-gray-50/50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <IconFileReport className="size-4 text-gray-500" />
                        Advance Salary Details
                    </h2>
                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && (
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-7 text-xs px-2 gap-1"
                            >
                                {isDeleting ? <IconLoader className="size-3 animate-spin"/> : null}
                                Delete Selected ({selectedIds.size})
                            </Button>
                        )}
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                             {records.length} records found
                        </span>
                    </div>
                </div>
                <div className="p-0">
                    <DataTable
                        columns={columns}
                        data={records}
                        searchKey="employeeName"
                        showColumnCustomizer={true}
                    />
                </div>
            </Card>

            <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                confirmDialog.onConfirm()
                                closeConfirmDialog()
                            }}
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
