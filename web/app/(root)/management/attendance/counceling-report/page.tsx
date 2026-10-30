"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconNote,
    IconSearch,
    IconPlus,
    IconEdit,
    IconTrash,
    IconEye,
    IconLoader,
    IconDownload,
    IconX,
    IconActivity,
    IconAlertCircle,
    IconCheck,
    IconInfoCircle,
    IconUser
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { counselingService, type CounselingRecord, type CounselingSummary } from "@/lib/services/counseling"
import { organogramService } from "@/lib/services/organogram"
import { employeeService } from "@/lib/services/employee"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ISSUE_TYPES = ["Absenteeism", "Late Coming", "Performance", "Behavior", "Policy Violation", "Other"]
const SEVERITY_LEVELS = ["Low", "Medium", "High"]
const STATUS_OPTIONS = ["Open", "Closed", "Follow-up Required"]

export default function CounselingReportPage() {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
    const [empId, setEmpId] = React.useState("")
    const [department, setDepartment] = React.useState("all")
    const [issueType, setIssueType] = React.useState("all")
    const [status, setStatus] = React.useState("all")

    const [isLoading, setIsLoading] = React.useState(false)
    const [filteredData, setFilteredData] = React.useState<CounselingRecord[]>([])
    const [summary, setSummary] = React.useState<CounselingSummary | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)

    const [departments, setDepartments] = React.useState<any[]>([])
    const [employees, setEmployees] = React.useState<any[]>([])

    // Form states
    const [showCreateDialog, setShowCreateDialog] = React.useState(false)
    const [showViewDialog, setShowViewDialog] = React.useState(false)
    const [showEditDialog, setShowEditDialog] = React.useState(false)
    const [selectedRecord, setSelectedRecord] = React.useState<CounselingRecord | null>(null)
    const [formData, setFormData] = React.useState({
        employeeCard: "",
        counselingDate: format(new Date(), "yyyy-MM-dd"),
        issueType: "Absenteeism",
        description: "",
        actionTaken: "",
        followUpNotes: "",
        status: "Open",
        severity: "Low",
        followUpDate: ""
    })

    React.useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [depts, empsResponse] = await Promise.all([
                    organogramService.getDepartments(),
                    employeeService.getEmployees()
                ])
                setDepartments(depts)
                setEmployees(empsResponse || [])
            } catch (error) {
                console.error("Failed to fetch filters", error)
            }
        }
        fetchFilters()
    }, [])

    const columns: ColumnDef<CounselingRecord>[] = [
        {
            accessorKey: "counselingDate",
            header: "Date",
            cell: ({ row }) => <span className="font-bold text-xs tabular-nums text-muted-foreground">{format(new Date(row.original.counselingDate), "dd MMM yyyy")}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Member",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{row.original.employeeName}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">{row.original.employeeId}</span>
                </div>
            )
        },
        {
            accessorKey: "issueType",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-none font-bold text-[10px] uppercase">
                    {row.original.issueType}
                </Badge>
            )
        },
        {
            accessorKey: "severity",
            header: "Severity",
            cell: ({ row }) => {
                const severity = row.original.severity
                return (
                    <Badge variant="outline" className={cn(
                        "font-bold text-[10px] uppercase h-6 px-2.5 rounded-full border-none shadow-sm",
                        severity === "High" ? "bg-red-500 text-white" :
                            severity === "Medium" ? "bg-amber-500 text-white" :
                                "bg-blue-500 text-white",
                    )}>
                        {severity}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant="outline" className={cn(
                    "font-bold text-[10px] uppercase h-6 px-2.5 rounded-full border-none shadow-sm",
                    row.original.status === "Open" ? "bg-destructive/10 text-destructive" :
                        row.original.status === "Closed" ? "bg-primary/10 text-primary" :
                            "bg-amber-100 text-amber-700",
                )}>
                    {row.original.status}
                </Badge>
            )
        },
        {
            id: "actions",
            header: "Manage",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="size-7 rounded-lg text-muted-foreground hover:text-primary" onClick={() => handleView(row.original)}>
                        <IconEye className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 rounded-lg text-muted-foreground hover:text-amber-600" onClick={() => handleEdit(row.original)}>
                        <IconEdit className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.original.id)}>
                        <IconTrash className="size-4" />
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
            if (issueType !== "all") params.issueType = issueType
            if (status !== "all") params.status = status
            if (empId.trim()) params.searchTerm = empId.trim()

            const data = await counselingService.getCounselingRecords(params)
            setFilteredData(data.records)
            setSummary(data.summary)
            setHasSearched(true)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!formData.employeeCard || !formData.description) {
            toast.error("Required fields missing")
            return
        }

        try {
            const payload = { ...formData, employeeCard: parseInt(formData.employeeCard) }
            await counselingService.createCounselingRecord(payload)
            toast.success("Record created")
            setShowCreateDialog(false)
            resetForm()
            handleSearch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Creation failed")
        }
    }

    const handleEdit = (record: CounselingRecord) => {
        setSelectedRecord(record)
        setFormData({
            employeeCard: record.employeeCard.toString(),
            counselingDate: format(new Date(record.counselingDate), "yyyy-MM-dd"),
            issueType: record.issueType,
            description: record.description,
            actionTaken: record.actionTaken || "",
            followUpNotes: record.followUpNotes || "",
            status: record.status,
            severity: record.severity,
            followUpDate: record.followUpDate ? format(new Date(record.followUpDate), "yyyy-MM-dd") : ""
        })
        setShowEditDialog(true)
    }

    const handleUpdate = async () => {
        if (!selectedRecord) return
        try {
            const payload = { ...formData, employeeCard: parseInt(formData.employeeCard) }
            await counselingService.updateCounselingRecord(selectedRecord.id, payload)
            toast.success("Record updated")
            setShowEditDialog(false)
            resetForm()
            handleSearch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Update failed")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this record?")) return
        try {
            await counselingService.deleteCounselingRecord(id)
            toast.success("Record deleted")
            handleSearch()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Deletion failed")
        }
    }

    const handleView = (record: CounselingRecord) => {
        setSelectedRecord(record)
        setShowViewDialog(true)
    }

    const resetForm = () => {
        setFormData({
            employeeCard: "",
            counselingDate: format(new Date(), "yyyy-MM-dd"),
            issueType: "Absenteeism",
            description: "",
            actionTaken: "",
            followUpNotes: "",
            status: "Open",
            severity: "Low",
            followUpDate: ""
        })
        setSelectedRecord(null)
    }

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 text-center sm:text-left">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <IconNote className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Audit Terminal</h1>
                        <p className="text-muted-foreground text-sm">Employee counseling and disciplinary audit trails</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full h-10 px-6 font-bold gap-2 shadow-lg shadow-primary/20 bg-primary">
                                <IconPlus className="size-4" />
                                Log Case
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-primary p-6 text-primary-foreground">
                                <DialogTitle className="text-2xl font-black italic tracking-tighter">Case Entry</DialogTitle>
                                <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                                    Manual counseling record initiation
                                </DialogDescription>
                            </div>
                            <div className="p-8">
                                <CounselingForm formData={formData} setFormData={setFormData} employees={employees} onSubmit={handleCreate} onCancel={() => setShowCreateDialog(false)} />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" className="gap-2 h-10 rounded-full px-5 border-2" disabled={filteredData.length === 0}>
                        <IconDownload className="size-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 px-6">
                    <StatCard title="Total Registry" value={summary.totalRecords} icon={IconNote} subtitle="All time cases" />
                    <StatCard title="Active Cases" value={summary.openCases} icon={IconActivity} className="text-destructive" subtitle="In progress" />
                    <StatCard title="Resolved" value={summary.closedCases} icon={IconCheck} className="text-primary" subtitle="Audit closed" />
                    <StatCard title="Critical" value={summary.highSeverity} icon={IconAlertCircle} className="text-red-600" subtitle="High priority" />
                    <StatCard title="Pending Review" value={summary.requiringFollowUp} icon={IconActivity} className="text-amber-600" subtitle="Follow-ups" />
                </div>
            )}

            {/* Filters */}
            <div className="px-6">
                <Card className="border-none shadow-sm bg-muted/20">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <IconSearch className="size-4 text-primary" />
                            Registry Filters
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Member</Label>
                            <Input placeholder="ID / Name" className="h-11 rounded-xl shadow-inner" value={empId} onChange={(e) => setEmpId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dept.</Label>
                            <NativeSelect value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 rounded-xl shadow-inner">
                                <option value="all">Every Dept</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Issue</Label>
                            <NativeSelect value={issueType} onChange={(e) => setIssueType(e.target.value)} className="h-11 rounded-xl shadow-inner">
                                <option value="all">All Issues</option>
                                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl shadow-inner">
                                <option value="all">All States</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 lg:col-span-1">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Period</Label>
                            <DateRangePicker date={dateRange} setDate={setDateRange} className="h-11 rounded-xl border-dashed" />
                        </div>
                        <Button className="h-11 rounded-xl font-bold gap-2" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconActivity className="size-4" />}
                            Execute
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="px-6">
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Case Registry</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase mt-1">Personnel disciplinary logs</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-muted-foreground/10">
                                <IconInfoCircle className="size-3.5" />
                                {filteredData.length} entries found
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={columns} data={filteredData} showColumnCustomizer={false} searchKey="employeeName" showActions={false} showTabs={false} />
                    </CardContent>
                </Card>
            </div>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-muted p-6 border-b">
                        <DialogTitle className="text-xl font-bold tracking-tight">Case Summary</DialogTitle>
                    </div>
                    {selectedRecord && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                                    <IconUser className="size-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-black tracking-tight">{selectedRecord.employeeName}</h3>
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                                        {selectedRecord.employeeId} • {selectedRecord.department}
                                    </p>
                                </div>
                                <Badge className={cn(
                                    "font-black text-[10px] tracking-widest uppercase h-7 px-4 rounded-full border-none",
                                    selectedRecord.status === "Closed" ? "bg-primary text-white" : "bg-destructive text-white"
                                )}>
                                    {selectedRecord.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-2">Logged Date</Label>
                                    <p className="text-sm font-bold">{format(new Date(selectedRecord.counselingDate), "dd MMM yyyy")}</p>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-2">Category</Label>
                                    <Badge variant="outline" className="border-none bg-primary/10 text-primary font-bold uppercase text-[10px]">{selectedRecord.issueType}</Badge>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed text-center">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-2">Severity</Label>
                                    <Badge className={cn(
                                        "border-none font-black text-[10px] uppercase",
                                        selectedRecord.severity === "High" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                                    )}>{selectedRecord.severity}</Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Incident Description</Label>
                                <p className="text-sm font-medium text-foreground bg-muted/30 p-4 rounded-2xl border border-dashed min-h-[100px]">{selectedRecord.description}</p>
                            </div>

                            {selectedRecord.actionTaken && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-bold">Action Taken</Label>
                                    <p className="text-sm font-medium text-primary bg-primary/5 p-4 rounded-2xl border border-primary/20">{selectedRecord.actionTaken}</p>
                                </div>
                            )}

                            {selectedRecord.followUpNotes && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest font-bold">Review Notes</Label>
                                    <p className="text-sm font-medium text-muted-foreground italic bg-muted/20 p-4 rounded-2xl border border-dashed">{selectedRecord.followUpNotes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-amber-500 p-6 text-white">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">Edit Registry</DialogTitle>
                    </div>
                    <div className="p-8">
                        <CounselingForm formData={formData} setFormData={setFormData} employees={employees} onSubmit={handleUpdate} onCancel={() => setShowEditDialog(false)} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CounselingForm({ formData, setFormData, employees, onSubmit, onCancel }: any) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Assign Member *</Label>
                    <NativeSelect value={formData.employeeCard} onChange={(e) => setFormData({ ...formData, employeeCard: e.target.value })} className="rounded-xl h-11 shadow-inner">
                        <option value="">Select Personnel</option>
                        {employees.map((emp: any) => (
                            <option key={emp.id} value={emp.id}>{emp.employeeId} - {emp.fullNameEn}</option>
                        ))}
                    </NativeSelect>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Logged Date *</Label>
                    <Input type="date" value={formData.counselingDate} onChange={(e) => setFormData({ ...formData, counselingDate: e.target.value })} className="rounded-xl h-11 shadow-inner border-dashed" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Issue Code *</Label>
                    <NativeSelect value={formData.issueType} onChange={(e) => setFormData({ ...formData, issueType: e.target.value })} className="rounded-xl h-11 shadow-inner">
                        {ISSUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </NativeSelect>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Severity *</Label>
                    <NativeSelect value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="rounded-xl h-11 shadow-inner">
                        {SEVERITY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </NativeSelect>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Log Status *</Label>
                    <NativeSelect value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="rounded-xl h-11 shadow-inner">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </NativeSelect>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Incident Narration *</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-2xl min-h-[120px] bg-muted/20 border-dashed shadow-inner p-4" placeholder="Detailed factual description of the incident..." />
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Remedial Action</Label>
                <Textarea value={formData.actionTaken} onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })} className="rounded-2xl min-h-[80px] bg-muted/10 border-dashed shadow-inner p-4" placeholder="Immediate measures taken..." />
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Review Notes</Label>
                    <Input value={formData.followUpNotes} onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })} className="rounded-xl h-11 shadow-inner border-dashed" placeholder="Future review points..." />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Review Date</Label>
                    <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className="rounded-xl h-11 shadow-inner border-dashed" />
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-dashed">
                <Button variant="ghost" onClick={onCancel} className="rounded-xl h-12 px-8 font-bold text-muted-foreground">Cancel</Button>
                <Button onClick={onSubmit} className="rounded-xl bg-primary h-12 px-10 font-bold shadow-lg shadow-primary/20 text-white uppercase tracking-tighter">Commit Registry</Button>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, className, subtitle }: any) {
    return (
        <Card className="border-none shadow-sm group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <h3 className={cn("text-3xl font-black mt-2 tracking-tight", className)}>{value}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary/40" />
                        {subtitle || "Patterns detected"}
                    </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                    <Icon className="size-6 text-muted-foreground group-hover:text-primary" />
                </div>
            </CardContent>
        </Card>
    )
}
