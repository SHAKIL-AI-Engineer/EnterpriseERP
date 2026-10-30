"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconMinus,
    IconSearch,
    IconPlus,
    IconEdit,
    IconTrash,
    IconEye,
    IconRefresh,
    IconDownload,
    IconUser,
    IconX,
    IconClock,
    IconArrowLeft
} from "@tabler/icons-react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { otDeductionService, type OTDeduction, type OTDeductionSummary } from "@/lib/services/otDeduction"
import { organogramService } from "@/lib/services/organogram"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const DEDUCTION_REASONS = ["Early Exit", "Extended Break", "Performance Deduction", "Policy Non-compliance", "Other"]
const STATUS_OPTIONS = ["Approved", "Pending", "Rejected"]

export default function OTDeductionLogPage() {
    const router = useRouter()
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
    })
    const [empId, setEmpId] = React.useState("")
    const [department, setDepartment] = React.useState("all")
    const [status, setStatus] = React.useState("all")

    const [isLoading, setIsLoading] = React.useState(false)
    const [filteredData, setFilteredData] = React.useState<OTDeduction[]>([])
    const [summary, setSummary] = React.useState<OTDeductionSummary | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)

    const [departments, setDepartments] = React.useState<any[]>([])
    const [employees, setEmployees] = React.useState<any[]>([])

    // Form states
    const [showCreateDialog, setShowCreateDialog] = React.useState(false)
    const [showViewDialog, setShowViewDialog] = React.useState(false)
    const [showEditDialog, setShowEditDialog] = React.useState(false)
    const [selectedRecord, setSelectedRecord] = React.useState<OTDeduction | null>(null)
    const [formData, setFormData] = React.useState({
        employeeCard: "",
        date: format(new Date(), "yyyy-MM-dd"),
        deductionHours: "1",
        reason: "Early Exit",
        remarks: "",
        status: "Approved"
    })

    React.useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [depts, emps] = await Promise.all([
                    organogramService.getDepartments(),
                    employeeService.getEmployees()
                ])
                setDepartments(depts)
                setEmployees(emps || [])
            } catch (error) {
                console.error("Failed to fetch filters", error)
            }
        }
        fetchFilters()
        handleSearch() // Initial search
    }, [])

    const columns: ColumnDef<OTDeduction>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => <span className="text-sm">{format(new Date(row.original.date), "dd MMM yyyy")}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.original.employeeName}</span>
                    <span className="text-xs text-gray-400">{row.original.employeeId}</span>
                </div>
            )
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => <span className="text-xs">{row.original.department}</span>
        },
        {
            accessorKey: "deductionHours",
            header: "Deduction",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-red-600 font-bold">
                    <span>-{row.original.deductionHours} hr</span>
                </div>
            )
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-medium">
                    {row.original.reason}
                </Badge>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const colors = {
                    "Approved": "bg-green-50 text-green-600 border-green-200",
                    "Pending": "bg-yellow-50 text-yellow-600 border-yellow-200",
                    "Rejected": "bg-red-50 text-red-600 border-red-200"
                }
                return (
                    <Badge variant="outline" className={cn("font-medium", colors[row.original.status as keyof typeof colors])}>
                        {row.original.status}
                    </Badge>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleView(row.original)}>
                        <IconEye size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600" onClick={() => handleEdit(row.original)}>
                        <IconEdit size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(row.original.id)}>
                        <IconTrash size={16} />
                    </Button>
                </div>
            )
        }
    ]

    const handleSearch = async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (dateRange?.from) params.fromDate = format(dateRange.from, "yyyy-MM-dd")
            if (dateRange?.to) params.toDate = format(dateRange.to, "yyyy-MM-dd")
            if (department !== "all") params.departmentId = parseInt(department)
            if (status !== "all") params.status = status
            if (empId.trim()) params.searchTerm = empId.trim()

            const data = await otDeductionService.getOTDeductions(params)
            setFilteredData(data.records)
            setSummary(data.summary)
            setHasSearched(true)
        } catch (error: any) {
            toast.error("Failed to fetch records")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.employeeCard || !formData.deductionHours || !formData.reason) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            const { employeeCard: _, ...rest } = formData;
            const payload = {
                ...rest,
                employeeCard: parseInt(formData.employeeCard),
                deductionHours: parseFloat(formData.deductionHours)
            }
            await otDeductionService.createOTDeduction(payload)
            toast.success("Deduction created")
            setShowCreateDialog(false)
            resetForm()
            handleSearch()
        } catch (error: any) {
            toast.error("Failed to create record")
        }
    }

    const handleEdit = (record: OTDeduction) => {
        setSelectedRecord(record)
        setFormData({
            employeeCard: record.employeeCard.toString(),
            date: format(new Date(record.date), "yyyy-MM-dd"),
            deductionHours: record.deductionHours.toString(),
            reason: record.reason,
            remarks: record.remarks || "",
            status: record.status
        })
        setShowEditDialog(true)
    }

    const handleUpdate = async () => {
        if (!selectedRecord) return

        try {
            const { employeeCard: _, ...rest } = formData;
            const payload = {
                ...rest,
                employeeCard: parseInt(formData.employeeCard),
                deductionHours: parseFloat(formData.deductionHours)
            }
            await otDeductionService.updateOTDeduction(selectedRecord.id, payload)
            toast.success("Record updated")
            setShowEditDialog(false)
            resetForm()
            handleSearch()
        } catch (error: any) {
            toast.error("Failed to update record")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return
        try {
            await otDeductionService.deleteOTDeduction(id)
            toast.success("Record deleted")
            handleSearch()
        } catch (error: any) {
            toast.error("Failed to delete record")
        }
    }

    const handleView = (record: OTDeduction) => {
        setSelectedRecord(record)
        setShowViewDialog(true)
    }

    const resetForm = () => {
        setFormData({
            employeeCard: "",
            date: format(new Date(), "yyyy-MM-dd"),
            deductionHours: "1",
            reason: "Early Exit",
            remarks: "",
            status: "Approved"
        })
        setSelectedRecord(null)
    }

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">OT Deduction Log</h1>
                        <p className="text-sm text-gray-500">Manage and adjust employee overtime records</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <IconPlus size={18} /> Add Deduction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>New OT Deduction</DialogTitle>
                            </DialogHeader>
                            <OTDeductionForm formData={formData} setFormData={setFormData} employees={employees} onSubmit={handleCreate} onCancel={() => setShowCreateDialog(false)} />
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => handleSearch()}>
                        <IconRefresh size={18} className={cn("mr-2", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" disabled={filteredData.length === 0}>
                        <IconDownload className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Deducted</p>
                                <h3 className="text-2xl font-bold mt-1 text-red-600">-{summary.totalDeductedHours} hrs</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employees Affected</p>
                                <h3 className="text-2xl font-bold mt-1">{summary.totalEmployeesAffected}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Requests</p>
                                <h3 className="text-2xl font-bold mt-1 text-yellow-600">{summary.pendingRequests}</h3>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Deduction</p>
                                <h3 className="text-2xl font-bold mt-1">{summary.averageDeduction.toFixed(1)} hrs</h3>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card className="border shadow-none">
                    <CardHeader className="bg-gray-50 border-b py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <IconSearch size={18} />
                            Filter Records
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-gray-400">Employee</Label>
                                <Input placeholder="ID or Name" value={empId} onChange={(e) => setEmpId(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-gray-400">Department</Label>
                                <NativeSelect value={department} onChange={(e) => setDepartment(e.target.value)}>
                                    <option value="all">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-gray-400">Status</Label>
                                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="all">Every Status</option>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs uppercase font-bold text-gray-400">Date Range</Label>
                                <DateRangePicker date={dateRange} setDate={setDateRange} />
                            </div>
                            <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
                                <IconSearch size={18} /> Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-none overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">Deduction History</CardTitle>
                            {hasSearched && (
                                <Badge variant="outline" className="bg-white font-medium">
                                    {filteredData.length} Records
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            showColumnCustomizer={false}
                            searchKey="employeeName"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Details</DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div className="h-10 w-10 shrink-0 bg-white rounded-full flex items-center justify-center border text-gray-400">
                                    <IconUser size={20} />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{selectedRecord.employeeName}</p>
                                    <p className="text-xs text-gray-500">{selectedRecord.employeeId} • {selectedRecord.department}</p>
                                </div>
                                <Badge variant="outline" className="ml-auto bg-white">{selectedRecord.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Date</Label>
                                    <p className="text-sm font-medium">{format(new Date(selectedRecord.date), "dd MMM yyyy")}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-gray-400">Deduction</Label>
                                    <p className="text-sm font-bold text-red-600">{selectedRecord.deductionHours} Hours</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-gray-400">Reason</Label>
                                <p className="text-sm font-medium text-gray-700">{selectedRecord.reason}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-gray-400">Remarks</Label>
                                <p className="text-sm text-gray-600">{selectedRecord.remarks || "No remarks"}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Record</DialogTitle>
                    </DialogHeader>
                    <OTDeductionForm formData={formData} setFormData={setFormData} employees={employees} onSubmit={handleUpdate} onCancel={() => setShowEditDialog(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}

function OTDeductionForm({ formData, setFormData, employees, onSubmit, onCancel }: any) {
    return (
        <div className="space-y-6 pt-4 text-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Employee *</Label>
                    <NativeSelect
                        value={formData.employeeCard}
                        onChange={(e) => setFormData({ ...formData, employeeCard: e.target.value })}
                    >
                        <option value="">Select Employee</option>
                        {employees.map((emp: any) => (
                            <option key={emp.id} value={emp.id}>{emp.employeeId} - {emp.fullNameEn}</option>
                        ))}
                    </NativeSelect>
                </div>
                <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label>Deduction Hours *</Label>
                    <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={formData.deductionHours}
                        onChange={(e) => setFormData({ ...formData, deductionHours: e.target.value })}
                        className="font-bold text-red-600"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Reason *</Label>
                    <NativeSelect
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    >
                        {DEDUCTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </NativeSelect>
                </div>
                <div className="space-y-2">
                    <Label>Status *</Label>
                    <NativeSelect
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </NativeSelect>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="min-h-[100px]"
                    placeholder="Enter details..."
                />
            </div>

            <DialogFooter className="gap-2 border-t pt-4">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={onSubmit}>Save Record</Button>
            </DialogFooter>
        </div>
    )
}
