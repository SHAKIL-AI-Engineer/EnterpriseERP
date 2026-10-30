"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    IconCalendarMonth,
    IconPlus,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconInfoCircle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { format, eachDayOfInterval } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { leaveService } from "@/lib/services/leave"
import { groupHolidaysByRange, type GroupedHoliday } from "@/lib/services/leave-helpers"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import {
    HOLIDAY_NAME_PRESETS,
    HOLIDAY_TYPE_OPTIONS,
    holidayTypeLabel,
    normalizeHolidayType,
    type HolidayTypeValue,
} from "@/lib/holiday-types"

function dailyProcessHref(companyId: string, from: Date, to: Date): string {
    const params = new URLSearchParams({
        companyId,
        from: format(from, "yyyy-MM-dd"),
        to: format(to, "yyyy-MM-dd"),
    })
    return `/management/data-process/daily-process?${params.toString()}`
}

export default function HolidayPage() {
    const router = useRouter()
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [isLoading, setIsLoading] = React.useState(false)
    const [holidays, setHolidays] = React.useState<GroupedHoliday[]>([])
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [editingHoliday, setEditingHoliday] = React.useState<GroupedHoliday | null>(null)
    const [range, setRange] = React.useState<DateRange | undefined>(undefined)
    const [formData, setFormData] = React.useState({
        name: "",
        type: "Festival" as HolidayTypeValue,
        isPaid: true,
    })

    const loadHolidays = React.useCallback(async () => {
        if (!selectedCompanyId) return
        setIsLoading(true)
        try {
            const rows = await leaveService.listHolidays({ companyId: selectedCompanyId, year })
            setHolidays(groupHolidaysByRange(rows))
        } catch {
            toast.error("Failed to load holidays")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, year])

    const handleFilterChange = React.useCallback((filters: LeaveFilterParams) => {
        setSelectedCompanyId(filters.companyEntityId)
        if (filters.year) setYear(filters.year)
    }, [])

    React.useEffect(() => {
        if (selectedCompanyId) loadHolidays()
    }, [selectedCompanyId, loadHolidays])

    const createHolidayRange = async (start: Date, end: Date) => {
        if (!selectedCompanyId) return
        const days = eachDayOfInterval({ start, end })
        await Promise.all(
            days.map((d) =>
                leaveService.createHoliday({
                    companyId: selectedCompanyId,
                    holidayDate: format(d, "yyyy-MM-dd"),
                    holidayName: formData.name,
                    holidayType: formData.type,
                    isPaid: formData.isPaid,
                    isActive: true,
                })
            )
        )
    }

    const notifyProcessReminder = (from: Date, to: Date) => {
        if (!selectedCompanyId) return
        const href = dailyProcessHref(selectedCompanyId, from, to)
        toast.success("Holiday saved", {
            description: "Run daily attendance process for these dates so status shows Holiday.",
            action: {
                label: "Daily Process",
                onClick: () => router.push(href),
            },
        })
    }

    const handleSubmit = async () => {
        if (!formData.name || !range?.from || !selectedCompanyId) {
            toast.error("Please fill in all required fields")
            return
        }
        const end = range.to ?? range.from

        try {
            if (editingHoliday) {
                await Promise.all(editingHoliday.entityIds.map((id) => leaveService.deleteHoliday(id)))
                await createHolidayRange(range.from, end)
            } else {
                await createHolidayRange(range.from, end)
            }
            loadHolidays()
            handleCloseSheet()
            notifyProcessReminder(range.from, end)
        } catch {
            toast.error("Failed to save holiday")
        }
    }

    const handleEdit = (holiday: GroupedHoliday) => {
        setEditingHoliday(holiday)
        setFormData({
            name: holiday.name,
            type: normalizeHolidayType(holiday.type),
            isPaid: holiday.isPaid,
        })
        setRange({
            from: new Date(holiday.startDate + "T00:00:00"),
            to: new Date(holiday.endDate + "T00:00:00"),
        })
        setIsSheetOpen(true)
    }

    const handleDelete = async (group: GroupedHoliday) => {
        try {
            await Promise.all(group.entityIds.map((id) => leaveService.deleteHoliday(id)))
            toast.success("Holiday removed")
            loadHolidays()
        } catch {
            toast.error("Failed to delete holiday")
        }
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setEditingHoliday(null)
        setFormData({ name: "", type: "Festival", isPaid: true })
        setRange(undefined)
    }

    const applyPreset = (preset: (typeof HOLIDAY_NAME_PRESETS)[number]) => {
        setFormData((p) => ({ ...p, name: preset.name, type: preset.type }))
    }

    const columns: ColumnDef<GroupedHoliday>[] = [
        {
            id: "date",
            header: "Date Range",
            cell: ({ row }) => {
                const start = new Date(row.original.startDate + "T00:00:00")
                const end = new Date(row.original.endDate + "T00:00:00")
                const same = row.original.startDate === row.original.endDate
                return (
                    <span className="font-medium">
                        {format(start, "dd MMM")}
                        {!same && ` - ${format(end, "dd MMM")}`} {format(end, "yyyy")}
                    </span>
                )
            },
        },
        { accessorKey: "name", header: "Name", cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="secondary">{holidayTypeLabel(row.original.type)}</Badge>
            ),
        },
        {
            id: "paid",
            header: "Paid",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.isPaid ? "Yes" : "No"}</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <IconDotsVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <LeavePermissionGate permission="HOLIDAY_MANAGE">
                            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                                <IconEdit className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(row.original)}>
                                <IconTrash className="mr-2 size-4" /> Delete
                            </DropdownMenuItem>
                        </LeavePermissionGate>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <IconCalendarMonth className="size-7" /> Holiday Calendar
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Company-wide holidays (Eid, public days, special off). Applies to all employees after daily process.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {selectedCompanyId && (
                        <HrReportExportButtons
                            exportUrl="/api/v1/leave/reports/holidays"
                            params={{ companyId: selectedCompanyId, year }}
                            filePrefix={`holidays-${year}`}
                            disabled={isLoading || holidays.length === 0}
                        />
                    )}
                    <LeavePermissionGate permission="HOLIDAY_MANAGE">
                        <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
                        <SheetTrigger asChild>
                            <Button className="gap-2" onClick={() => setIsSheetOpen(true)}>
                                <IconPlus className="size-4" /> Add Holiday
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{editingHoliday ? "Edit Holiday" : "New Holiday"}</SheetTitle>
                                <SheetDescription>Add dates to the company calendar (Eid, special leave, public holidays).</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 py-6">
                                <div className="space-y-2">
                                    <Label>Quick preset</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {HOLIDAY_NAME_PRESETS.map((preset) => (
                                            <Button
                                                key={preset.name}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyPreset(preset)}
                                            >
                                                {preset.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date range</Label>
                                    <DateRangePicker date={range} setDate={setRange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Eid-ul-Fitr 2026"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        className="w-full h-10 rounded-md border px-3 text-sm bg-background"
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData((p) => ({
                                                ...p,
                                                type: e.target.value as HolidayTypeValue,
                                            }))
                                        }
                                    >
                                        {HOLIDAY_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between rounded-md border px-3 py-3">
                                    <div className="space-y-0.5">
                                        <Label>Paid holiday</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Mark as paid for reporting; attendance uses calendar day as Holiday.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isPaid}
                                        onCheckedChange={(checked) =>
                                            setFormData((p) => ({ ...p, isPaid: checked }))
                                        }
                                    />
                                </div>
                                <Button className="w-full" onClick={handleSubmit}>Save</Button>
                            </div>
                        </SheetContent>
                        </Sheet>
                    </LeavePermissionGate>
                </div>
            </div>

            <Card className="border-primary/20 bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconInfoCircle className="size-4 text-primary" />
                        How Eid / special leave works
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Holidays apply to the whole company. They do not deduct leave balance (use Leave Application for individual leave).
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2 pb-4">
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Add the date range here (use Religious / Festival for Eid).</li>
                        <li>
                            Run{" "}
                            <Link
                                href="/management/data-process/daily-process"
                                className="text-primary underline underline-offset-2"
                            >
                                Data Process → Daily Process
                            </Link>{" "}
                            for the same company and dates.
                        </li>
                        <li>
                            Check{" "}
                            <Link
                                href="/management/attendance/daily-report"
                                className="text-primary underline underline-offset-2"
                            >
                                Daily Attendance Report
                            </Link>
                            : no punch → <strong className="text-foreground">Holiday</strong>; with punch →{" "}
                            <strong className="text-foreground">HolidayPresent</strong>.
                        </li>
                    </ol>
                    <p className="text-xs pt-1">
                        Standalone Shift Service must have <code className="text-xs">ConnectionStrings:LeaveDb</code> configured
                        so process picks up holidays from this calendar.
                    </p>
                </CardContent>
            </Card>

            <LeaveAdvancedFilter
                showYear
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
                initialYear={year}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Holidays ({year})</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={holidays} searchKey="name" isLoading={isLoading} showColumnCustomizer={false} />
                </CardContent>
            </Card>
        </div>
    )
}
