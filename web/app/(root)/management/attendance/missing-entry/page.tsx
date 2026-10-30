"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    formatAttendanceDate,
    formatAttendanceWeekday,
    formatPunchTime,
    parsePunchTimeToDate,
} from "@/lib/format-attendance-time"
import {
    IconArrowLeft,
    IconRefresh,
    IconEdit,
    IconTrash,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconSearch,
    IconLoader
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { missingEntryService, type MissingEntry, type MissingEntrySummary } from "@/lib/services/missingEntry"
import { attendanceApi, toAttendanceExportParams, type AttendanceQuery } from "@/lib/services/attendance-api"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AttendanceCompanyFilter } from "@/components/attendance/attendance-company-filter"

export default function MissingEntryPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [isLoading, setIsLoading] = React.useState(false)
    const [filteredData, setFilteredData] = React.useState<MissingEntry[]>([])
    const [summary, setSummary] = React.useState<MissingEntrySummary | null>(null)
    const [hasSearched, setHasSearched] = React.useState(false)
    const [selectedRows, setSelectedRows] = React.useState<MissingEntry[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingEntry, setEditingEntry] = React.useState<MissingEntry | null>(null)
    const [manualInTime, setManualInTime] = React.useState<Date | undefined>()
    const [manualOutTime, setManualOutTime] = React.useState<Date | undefined>()
    const [manualStatus, setManualStatus] = React.useState("Present")
    const [manualReason, setManualReason] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    // Filter state
    const [activeQuery, setActiveQuery] = React.useState<AttendanceQuery | null>(null)

    const columns: ColumnDef<MissingEntry>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-sm font-medium text-muted-foreground">{(row.index + 1).toString().padStart(2, '0')}</span>,
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{formatAttendanceDate(row.original.date)}</span>
                        <span className="text-xs text-muted-foreground uppercase">{formatAttendanceWeekday(row.original.date)}</span>
                    </div>
                )
        },
        {
            accessorKey: "employeeId",
            header: "Employee ID",
            cell: ({ row }) => <span className="font-bold text-sm tabular-nums text-foreground">{row.original.employeeId}</span>
        },
        {
            accessorKey: "employeeName",
            header: "Name",
            cell: ({ row }) => <span className="font-medium text-sm text-foreground">{row.original.employeeName}</span>
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{row.original.department}</span>
                    <span className="text-xs text-muted-foreground">{row.original.designation}</span>
                </div>
            )
        },
        {
            id: "punches",
            header: "In/Out Time",
            cell: ({ row }) => {
                const { date, inTime, outTime } = row.original
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">In</span>
                            <span className={cn("text-sm font-medium tabular-nums", !inTime && "text-destructive")}>
                                {formatPunchTime(inTime, date)}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-muted-foreground/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Out</span>
                            <span className={cn("text-sm font-medium tabular-nums", !outTime && "text-destructive")}>
                                {formatPunchTime(outTime, date)}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "missingType",
            header: "Requirement",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 font-medium text-xs px-2 py-0">
                    {row.original.missingType}
                </Badge>
            )
        },
        {
            id: "actions",
            header: "Operation",
            cell: ({ row }) => (
                <Button
                    size="sm"
                    className="h-8 rounded-lg font-bold gap-2"
                    onClick={() => {
                        setEditingEntry(row.original)
                        const dayBase =
                            parsePunchTimeToDate("09:00", row.original.date)
                            ?? new Date(row.original.date)
                        const existingIn = parsePunchTimeToDate(row.original.inTime, row.original.date)
                        const existingOut = parsePunchTimeToDate(row.original.outTime, row.original.date)
                        setManualInTime(
                            row.original.missingType === "OutTime"
                                ? existingIn
                                : existingIn ?? dayBase,
                        )
                        setManualOutTime(
                            row.original.missingType === "InTime"
                                ? existingOut
                                : existingOut ?? dayBase,
                        )
                        setManualStatus("Present")
                        setManualReason("Correcting missing punch")
                        setIsSheetOpen(true)
                    }}
                >
                    <IconCheck size={16} /> Resolve
                </Button>
            )
        }
    ]

    const handleManualSubmit = async () => {
        if (!editingEntry) return

        setIsSubmitting(true)
        try {
            if (!activeQuery) return
            const adminId = user?.id ?? "00000000-0000-0000-0000-000000000001"
            const existingIn = parsePunchTimeToDate(editingEntry.inTime, editingEntry.date)
            const existingOut = parsePunchTimeToDate(editingEntry.outTime, editingEntry.date)
            await attendanceApi.bulkAdjust({
                companyId: activeQuery.companyId,
                adminId,
                entries: [{
                    employeeID: editingEntry.employeeId,
                    date: editingEntry.date,
                    inTime:
                        editingEntry.missingType === "OutTime"
                            ? existingIn?.toISOString()
                            : manualInTime?.toISOString(),
                    outTime:
                        editingEntry.missingType === "InTime"
                            ? existingOut?.toISOString()
                            : manualOutTime?.toISOString(),
                    remarks: manualReason,
                }],
            })
            toast.success("Punch fixed successfully")
            setIsSheetOpen(false)
            handleSearch()
        } catch (error: any) {
            toast.error("Failed to fix punch")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBulkSubmit = async () => {
        if (selectedRows.length === 0) return

        setIsSubmitting(true)
        try {
            if (!activeQuery) return
            const adminId = user?.id ?? "00000000-0000-0000-0000-000000000001"
            await attendanceApi.bulkAdjust({
                companyId: activeQuery.companyId,
                adminId,
                entries: selectedRows.map((r) => ({
                    employeeID: r.employeeId,
                    date: r.date,
                    inTime: manualInTime?.toISOString(),
                    outTime: manualOutTime?.toISOString(),
                    remarks: manualReason,
                })),
            })
            toast.success(`Bulk fix completed for ${selectedRows.length} employees`)
            setSelectedRows([])
            setIsSheetOpen(false)
            handleSearch()
        } catch (error: any) {
            toast.error("Bulk submission failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSearch = async (q?: AttendanceQuery) => {
        const query = q ?? activeQuery
        if (!query) {
            toast.error("Apply filters first")
            return
        }

        setIsLoading(true)
        try {
            const data = await missingEntryService.getMissingEntries(query)
            const entries = data.entries.filter((e) => e.missingType !== "Both")
            setFilteredData(entries)
            setSummary({
                totalMissing: entries.length,
                missingInTime: entries.filter((e) => e.missingType === "InTime").length,
                missingOutTime: entries.filter((e) => e.missingType === "OutTime").length,
                missingBoth: 0,
                criticalCount: 0,
            })
            setHasSearched(true)
        } catch (error: any) {
            toast.error("Failed to fetch records")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-md">
                        <IconArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Missing Entry Log</h1>
                        <p className="text-sm text-gray-500">
                            Shows records missing only In or only Out time (not both).
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedRows.length > 0 && (
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                                setEditingEntry(null)
                                setManualInTime(undefined)
                                setManualOutTime(undefined)
                                setManualStatus("Present")
                                setManualReason("Bulk fix")
                                setIsSheetOpen(true)
                            }}
                        >
                            <IconEdit size={18} className="mr-2" />
                            Fix Selected ({selectedRows.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleSearch()} disabled={isLoading}>
                        <IconRefresh size={18} className={cn("mr-2", isLoading && "animate-spin")} /> Refresh
                    </Button>
                    {hasSearched && activeQuery && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/attendance/reports/missing-entries"
                            params={toAttendanceExportParams(activeQuery)}
                            filePrefix={`missing-entries-${activeQuery.fromDate}`}
                            disabled={isLoading || filteredData.length === 0}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Missing</p>
                                <p className="text-2xl font-bold mt-1 text-red-600">{summary.totalMissing}</p>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Missing In</p>
                                <p className="text-2xl font-bold mt-1 text-orange-600">{summary.missingInTime}</p>
                            </CardContent>
                        </Card>
                        <Card className="border shadow-none">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Missing Out</p>
                                <p className="text-2xl font-bold mt-1 text-orange-600">{summary.missingOutTime}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <AttendanceCompanyFilter
                    showDate={false}
                    showDateRange
                    initialStartDate={format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")}
                    initialEndDate={format(new Date(), "yyyy-MM-dd")}
                    onFilterChange={({ query }) => {
                        setActiveQuery(query)
                        handleSearch(query)
                    }}
                    isLoading={isLoading}
                />

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="size-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <IconLoader className="size-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <h3 className="text-xl font-bold tracking-tight">Scanning for Missing Punches...</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                We're auditing the attendance logs to identify missing in/out times. Please wait.
                            </p>
                        </div>
                    </div>
                )}

                {!isLoading && hasSearched ? (
                    <Card className="border shadow-none overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Missing Records</CardTitle>
                                <Badge variant="outline" className="bg-white font-medium">
                                    {filteredData.length} records found
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={columns}
                                data={filteredData}
                                showColumnCustomizer={false}
                                searchKey="employeeName"
                                enableSelection={true}
                                onSelectionChange={setSelectedRows}
                            />
                        </CardContent>
                    </Card>
                ) : !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-gray-50 text-gray-400">
                        <IconAlertTriangle size={48} stroke={1.5} />
                        <p className="mt-4 font-medium">Define parameters and click 'Generate' to see missing entry logs</p>
                    </div>
                ) : null}

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>{editingEntry ? "Fix Punch Record" : `Bulk Fix (${selectedRows.length} Records)`}</SheetTitle>
                            <SheetDescription>Manually adjust attendance times for correction</SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6 py-6">
                            <div className="grid grid-cols-1 gap-6">
                                {(!editingEntry || editingEntry.missingType !== "OutTime") && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">In Time</Label>
                                        <DateTimePicker
                                            date={manualInTime}
                                            setDate={setManualInTime}
                                            attendanceDate={editingEntry?.date}
                                            placeholder="dd/mm/yyyy hh:mm am"
                                        />
                                    </div>
                                )}
                                {(!editingEntry || editingEntry.missingType !== "InTime") && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Out Time</Label>
                                        <DateTimePicker
                                            date={manualOutTime}
                                            setDate={setManualOutTime}
                                            attendanceDate={editingEntry?.date}
                                            placeholder="dd/mm/yyyy hh:mm am"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <NativeSelect
                                    value={manualStatus}
                                    onChange={(e) => setManualStatus(e.target.value)}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Late">Late</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Off Day">Off Day</option>
                                </NativeSelect>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason for Adjustment</Label>
                                <Input
                                    placeholder="Brief explanation..."
                                    value={manualReason}
                                    onChange={(e) => setManualReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <SheetFooter className="gap-2">
                            <SheetClose asChild>
                                <Button variant="outline" className="flex-1">Cancel</Button>
                            </SheetClose>
                            <Button
                                className="flex-1"
                                onClick={editingEntry ? handleManualSubmit : handleBulkSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <IconRefresh size={18} className="animate-spin" /> : "Save Changes"}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
