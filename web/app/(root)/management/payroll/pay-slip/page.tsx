"use client"

import * as React from "react"
import {
    IconSearch,
    IconLoader,
    IconBuildingBank,
    IconCalendarCheck,
    IconDownload,
    IconFilter,
    IconChevronLeft,
    IconChevronRight,
    IconPrinter,
    IconBuilding,
    IconPhone,
    IconMail,
    IconUserCircle,
    IconCreditCard,
    IconFileSpreadsheet
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { payrollService, type MonthlySalarySheet } from "@/lib/services/payroll"
import { organogramService, type Department, type Section, type Designation, type Line, type Group, type Shift, type Floor } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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

export default function PaySlipListPage() {
    // Filter States
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | "All">("All")
    const [deptFilter, setDeptFilter] = React.useState<number | "All">("All")
    const [sectionFilter, setSectionFilter] = React.useState<number | "All">("All")
    const [designationFilter, setDesignationFilter] = React.useState<number | "All">("All")
    const [lineFilter, setLineFilter] = React.useState<number | "All">("All")
    const [statusFilter, setStatusFilter] = React.useState<string>("All")

    // Data States
    const [records, setRecords] = React.useState<MonthlySalarySheet[]>([])
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasSearched, setHasSearched] = React.useState(false)

    // Option Lists
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [lines, setLines] = React.useState<Line[]>([])

    React.useEffect(() => {
        if (selectedCompanyId !== "All") {
            organogramService.getDepartments({ companyId: selectedCompanyId as number }).then(setDepartments)
        } else {
            setDepartments([])
            setDeptFilter("All")
        }
    }, [selectedCompanyId])

    React.useEffect(() => {
        if (deptFilter !== "All") {
            organogramService.getSections({ departmentId: deptFilter as number }).then(setSections)
        } else {
            setSections([])
            setSectionFilter("All")
        }
    }, [deptFilter])

    React.useEffect(() => {
        if (sectionFilter !== "All") {
            organogramService.getDesignations({ sectionId: sectionFilter as number }).then(setDesignations)
            organogramService.getLines({ sectionId: sectionFilter as number }).then(setLines)
        } else {
            setDesignations([])
            setDesignationFilter("All")
            setLines([])
            setLineFilter("All")
        }
    }, [sectionFilter])

    const handleSearch = async () => {
        setIsLoading(true)
        setHasSearched(true)
        setCurrentIndex(0)
        try {
            const data = await payrollService.getMonthlySheet({
                year,
                month,
                companyId: selectedCompanyId === "All" ? undefined : selectedCompanyId,
                departmentId: deptFilter === "All" ? undefined : deptFilter,
                sectionId: sectionFilter === "All" ? undefined : sectionFilter,
                designationId: designationFilter === "All" ? undefined : designationFilter,
                lineId: lineFilter === "All" ? undefined : lineFilter,
                status: statusFilter === "All" ? undefined : statusFilter,
                searchTerm: searchTerm.trim() || undefined
            })
            setRecords(data)
        } catch (error) {
            toast.error("Failed to load records")
        } finally {
            setIsLoading(false)
        }
    }

    const nextBatch = () => {
        if (currentIndex + 4 < records.length) {
            setCurrentIndex(currentIndex + 4)
        }
    }

    const prevBatch = () => {
        if (currentIndex - 4 >= 0) {
            setCurrentIndex(currentIndex - 4)
        }
    }

    const handlePayslipExport = async () => {
        try {
            toast.promise(
                payrollService.exportIndividualPayslipsExcel({
                    year,
                    month,
                    companyId: selectedCompanyId === "All" ? undefined : selectedCompanyId,
                    departmentId: deptFilter === "All" ? undefined : deptFilter,
                    sectionId: sectionFilter === "All" ? undefined : sectionFilter,
                    designationId: designationFilter === "All" ? undefined : designationFilter,
                    lineId: lineFilter === "All" ? undefined : lineFilter,
                    status: statusFilter === "All" ? undefined : statusFilter,
                    searchTerm: searchTerm.trim() || undefined
                }),
                {
                    loading: 'Generating formatted payslips...',
                    success: 'Individual Payslips downloaded successfully',
                    error: 'Failed to export payslips'
                }
            )
        } catch (error) {
            console.error(error)
        }
    }

    const handleExport = async () => {
        try {
            toast.promise(
                payrollService.exportPaySlips({
                    year,
                    month,
                    companyId: selectedCompanyId === "All" ? undefined : selectedCompanyId,
                    departmentId: deptFilter === "All" ? undefined : deptFilter,
                    sectionId: sectionFilter === "All" ? undefined : sectionFilter,
                    designationId: designationFilter === "All" ? undefined : designationFilter,
                    lineId: lineFilter === "All" ? undefined : lineFilter,
                    status: statusFilter === "All" ? undefined : statusFilter,
                    searchTerm: searchTerm.trim() || undefined,
                    exportType: "master"
                }),
                {
                    loading: 'Preparing Excel report...',
                    success: 'Master Salary Sheet downloaded successfully',
                    error: 'Failed to export salary sheet'
                }
            )
        } catch (error) {
            console.error(error)
        }
    }

    const visibleRecords = records.slice(currentIndex, currentIndex + 4)

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500 bg-background min-h-screen">
            {/* Header - Print Hidden */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                        <IconCreditCard className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payslip Management</h1>
                        <p className="text-muted-foreground text-sm font-medium">Review and Print Batch Payslips (4 per page)</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <IconFileSpreadsheet className="size-4" />
                        Master Sheet
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handlePayslipExport}>
                        <IconDownload className="size-4" />
                        Export Payslips
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <IconPrinter className="size-4" />
                        Print Batch
                    </Button>
                </div>
            </div>

            {/* Filters - Print Hidden */}
            <div className="px-6 print:hidden">
                <Card className="border shadow-none bg-card p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Payroll Month</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="h-11">
                                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Year</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="h-11">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Select Company</Label>
                            <ManagementLegacyCompanySelect
                                value={selectedCompanyId === "All" ? "All" : String(selectedCompanyId)}
                                onChange={(value) => setSelectedCompanyId(value === "All" ? "All" : parseInt(value))}
                                allValue="All"
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Department</Label>
                            <NativeSelect value={deptFilter} onChange={(e) => setDeptFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))} className="h-11">
                                <option value="All">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Section</Label>
                            <NativeSelect value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))} className="h-11" disabled={deptFilter === "All"}>
                                <option value="All">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Designation</Label>
                            <NativeSelect value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))} className="h-11" disabled={sectionFilter === "All"}>
                                <option value="All">All Designations</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Line</Label>
                            <NativeSelect value={lineFilter} onChange={(e) => setLineFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))} className="h-11" disabled={sectionFilter === "All"}>
                                <option value="All">All Lines</option>
                                {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Status</Label>
                            <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11">
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                            </NativeSelect>
                        </div>
                        <div className="lg:col-span-3 space-y-2">
                            <Label className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">Search Employee</Label>
                            <Input placeholder="Search by ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11" />
                        </div>
                        <Button className="h-11 gap-2 font-bold" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <IconLoader className="size-5 animate-spin" /> : <IconSearch className="size-5" />}
                            Load Records
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Navigation & Counter - Print Hidden */}
            {hasSearched && records.length > 0 && (
                <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-card" onClick={prevBatch} disabled={currentIndex === 0}>
                            <IconChevronLeft className="size-4 mr-1" /> Previous Batch
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-card" onClick={nextBatch} disabled={currentIndex + 4 >= records.length}>
                            Next Batch <IconChevronRight className="size-4 ml-1" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">Record Progress</span>
                        <Badge variant="secondary" className="px-4 py-1.5 font-bold text-primary bg-primary/10 border-primary/20 rounded-full">
                            {currentIndex + 1} - {Math.min(currentIndex + 4, records.length)} of {records.length}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Payslip Grid - Fully Responsive */}
            <div className="px-6 pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 bg-card rounded-3xl border border-dashed border-border">
                        <IconLoader className="size-12 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="text-lg font-bold">Fetching Payroll Data</p>
                            <p className="text-sm text-muted-foreground">Please wait while we generate the batch views...</p>
                        </div>
                    </div>
                ) : visibleRecords.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 print:gap-4 print:grid-cols-2">
                        {visibleRecords.map((payslip) => (
                            <PayslipCard key={payslip.id} data={payslip} />
                        ))}
                    </div>
                ) : hasSearched && (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-card">
                        <div className="size-20 bg-muted rounded-full flex items-center justify-center mb-4">
                            <IconUserCircle className="size-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold">No Payslips Found</h3>
                        <p className="text-muted-foreground">No records match your current filter criteria.</p>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4;
                        margin: 10mm; 
                    }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    .print\\:gap-4 { gap: 1rem !important; }
                    .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                }
            `}</style>
        </div>
    )
}

function PayslipCard({ data }: { data: MonthlySalarySheet }) {
    const earnings = [
        { label: "Basic Salary", value: data.basicSalary },
        { label: "House Rent", value: data.houseRent },
        { label: "Medical & Conveyance", value: (data.medicalAllowance || 0) + (data.conveyance || 0) + (data.foodAllowance || 0) },
        { label: "Attendance Bonus", value: data.attendanceBonus, highlight: "text-blue-700 bg-blue-50 px-1 rounded" },
        { label: "Overtime Payment", value: data.otAmount, highlight: "text-emerald-700 bg-emerald-50 px-1 rounded" },
    ].filter(i => i.value > 0)

    return (
        <Card className="bg-card border-border overflow-hidden print:bg-white print:border-slate-400 print:break-inside-avoid relative transition-all hover:border-primary/20">
            {/* Watermark/Accent */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none print:hidden">
                <IconBuilding className="size-32" />
            </div>

            <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-border pb-4 print:border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                            <IconBuilding className="size-7" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-tight leading-none mb-1 print:text-slate-900">HR HUB ERP SOLUTIONS</h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Official Payslip</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full mb-1 inline-block">
                            {data.monthName} {data.year}
                        </div>
                        <p className="text-[10px] font-mono font-bold text-slate-500 block">ID: {data.employeeId}</p>
                    </div>
                </div>

                {/* Employee Primary Info */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div className="col-span-2 space-y-1">
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block">Employee Particulars</span>
                        <h3 className="text-base font-black leading-tight print:text-slate-900">{data.employeeName}</h3>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Designation</span>
                        <span className="text-xs font-bold text-slate-700">{data.designation}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Department</span>
                        <span className="text-xs font-bold text-slate-700">{data.department}</span>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Joining Date</span>
                        <span className="text-xs font-bold text-foreground/80 print:text-slate-700">{data.joinedDate || "N/A"}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Bank Account</span>
                        <span className="text-xs font-mono font-bold text-foreground/80 print:text-slate-700">{data.bankAccountNo || "CASH PAYMENT"}</span>
                    </div>
                </div>

                {/* Attendance Summary - Compact Pill Layout */}
                <div className="bg-muted/50 rounded-xl p-3 flex justify-between items-center border border-border print:bg-slate-50 print:border-slate-100">
                    <div className="text-center flex-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block">Total</span>
                        <span className="text-sm font-black">{data.totalDays}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="text-center flex-1">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase block">Present</span>
                        <span className="text-sm font-black text-emerald-600">{data.presentDays}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="text-center flex-1">
                        <span className="text-[9px] font-bold text-rose-400 uppercase block">Absent</span>
                        <span className="text-sm font-black text-rose-500">{data.absentDays}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <div className="text-center flex-1">
                        <span className="text-[9px] font-bold text-amber-500 uppercase block">OT Hr</span>
                        <span className="text-sm font-black text-amber-600">{data.otHours}</span>
                    </div>
                </div>

                {/* Main Financials Grid */}
                <div className="grid grid-cols-2 gap-8 text-xs pt-1">
                    {/* Earnings Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                            <span className="font-black text-[10px] text-emerald-800 uppercase tracking-widest">Earnings</span>
                        </div>
                        {earnings.map(item => (
                            <div key={item.label} className="flex justify-between items-center group">
                                <span className="text-muted-foreground font-medium">{item.label}</span>
                                <span className={cn("font-bold", item.highlight, !item.highlight && "text-foreground")}>৳{(item.value || 0).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    {/* Deductions Section */}
                    <div className="space-y-2.5 border-l border-slate-100 pl-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-4 w-1 bg-rose-500 rounded-full" />
                            <span className="font-black text-[10px] text-rose-800 uppercase tracking-widest">Deductions</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-muted-foreground font-medium">Absence</span>
                            <span className="font-bold text-rose-600 bg-rose-500/10 px-1 rounded">৳{(data.absentDeduction || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-muted-foreground font-medium">Tax/Misc</span>
                            <span className="font-bold">৳{((data.totalDeduction || 0) - (data.absentDeduction || 0)).toLocaleString()}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 italic text-[10px] text-muted-foreground text-center">
                            No further deductions recorded
                        </div>
                    </div>
                </div>

                {/* Total Net Payable - Premium Look */}
                <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between print:bg-transparent print:border-2 print:border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800 leading-none mb-1">Total Net Payable</span>
                        <span className="text-white/60 text-[9px] font-bold print:text-slate-500 leading-none italic">Electronic generated payment</span>
                    </div>
                    <span className="text-xl font-black text-white print:text-slate-900 tracking-tighter">৳{(data.netPayable || 0).toLocaleString()}</span>
                </div>

                {/* Signature Row */}
                <div className="grid grid-cols-2 gap-12 pt-10 px-2">
                    <div className="text-center space-y-1">
                        <div className="h-px bg-slate-200 w-full mb-2 print:border-t print:border-slate-300" />
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Employee Acknowledgment</span>
                    </div>
                    <div className="text-center space-y-1">
                        <div className="h-px bg-slate-200 w-full mb-2 print:border-t print:border-slate-300" />
                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Authorized Signatory</span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center pt-6 text-[8px] text-slate-300 font-bold uppercase tracking-widest print:text-slate-400">
                    Confidence In Every Transaction • {new Date().toLocaleDateString()}
                </div>
            </CardContent>
        </Card>
    )
}
