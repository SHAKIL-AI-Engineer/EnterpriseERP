"use client"

import * as React from "react"
import {
    IconSearch,
    IconFilter,
    IconX,
    IconChevronDown,
    IconChevronUp,
    IconRefresh,
    IconAdjustmentsHorizontal,
    IconLoader
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { organogramService } from "@/lib/services/organogram"
import { CommonFilterParams } from "@/lib/services/attendance"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface AdvancedFilterProps {
    onFilterChange: (filters: CommonFilterParams) => void;
    initialFilters?: CommonFilterParams;
    className?: string;
    showDate?: boolean;
    showDateRange?: boolean;
    showMonth?: boolean;
    statusOptions?: { label: string; value: string }[];
    isLoading?: boolean;
}

export function AdvancedFilter({
    onFilterChange,
    initialFilters = {},
    className,
    showDate = true,
    showDateRange = false,
    showMonth = false,
    isLoading = false,
    statusOptions = [
        { label: "All Statuses", value: "all" },
        { label: "Present", value: "Present" },
        { label: "Late", value: "Late" },
        { label: "Absent", value: "Absent" },
        { label: "On Leave", value: "On Leave" }
    ]
}: AdvancedFilterProps) {
    const { companies, isCompanyLocked, defaultCompany, loading: companiesLoading } =
        useCompanyFilterScope()
    const isCompanyDisabled = isCompanyLocked
    const autoAppliedRef = React.useRef(false)
    const [isExpanded, setIsExpanded] = React.useState(true)
    const [filters, setFilters] = React.useState<CommonFilterParams>({
        status: 'all',
        ...initialFilters
    })

    // Sync internal filters with initialFilters when they change from parent
    React.useEffect(() => {
        setFilters(prev => ({
            ...prev,
            ...initialFilters
        }))
    }, [initialFilters])

    const [departments, setDepartments] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [lines, setLines] = React.useState<any[]>([])
    const [shifts, setShifts] = React.useState<any[]>([])
    const [groups, setGroups] = React.useState<any[]>([])
    const [floors, setFloors] = React.useState<any[]>([])

    React.useEffect(() => {
        if (companiesLoading || !defaultCompany) return
        setFilters((prev) => {
            if (prev.companyId === defaultCompany.id) return prev
            return {
                ...prev,
                companyId: defaultCompany.id,
                companyName: defaultCompany.companyNameEn,
            }
        })
    }, [companiesLoading, defaultCompany])

    React.useEffect(() => {
        if (companiesLoading || autoAppliedRef.current || !isCompanyLocked || !defaultCompany) {
            return
        }
        autoAppliedRef.current = true
        const next: CommonFilterParams = {
            status: "all",
            ...initialFilters,
            companyId: defaultCompany.id,
            companyName: defaultCompany.companyNameEn,
        }
        setFilters(next)
        onFilterChange(next)
    }, [companiesLoading, isCompanyLocked, defaultCompany, initialFilters, onFilterChange])

    React.useEffect(() => {
        organogramService.getGroups().then(setGroups)
        organogramService.getShifts().then(setShifts)
        organogramService.getFloors().then(setFloors)
    }, [])

    // Company -> Department cascade
    React.useEffect(() => {
        if (filters.companyId) {
            organogramService.getDepartments({ companyId: filters.companyId }).then(setDepartments)
        } else {
            setDepartments([])
            // Clear dependent filters
            setFilters(prev => ({
                ...prev,
                departmentId: undefined,
                sectionId: undefined,
                lineId: undefined,
                designationId: undefined
            }))
        }
    }, [filters.companyId])

    // Department -> Section cascade
    React.useEffect(() => {
        if (filters.departmentId) {
            organogramService.getSections({
                companyId: filters.companyId,
                departmentId: filters.departmentId
            }).then(setSections)
        } else {
            setSections([])
            setFilters(prev => ({ ...prev, sectionId: undefined, lineId: undefined, designationId: undefined }))
        }
    }, [filters.departmentId, filters.companyId])

    // Section -> Designation/Line cascade
    React.useEffect(() => {
        if (filters.sectionId) {
            organogramService.getLines({
                companyId: filters.companyId,
                departmentId: filters.departmentId,
                sectionId: filters.sectionId
            }).then(setLines)
            organogramService.getDesignations({
                companyId: filters.companyId,
                departmentId: filters.departmentId,
                sectionId: filters.sectionId
            }).then(setDesignations)
        } else {
            setLines([])
            setDesignations([])
            setFilters(prev => ({ ...prev, lineId: undefined, designationId: undefined }))
        }
    }, [filters.sectionId, filters.departmentId, filters.companyId])

    const handleFilterChange = (key: keyof CommonFilterParams, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const applyFilters = () => {
        onFilterChange(filters)
    }

    const clearFilters = () => {
        const cleared = {
            date: initialFilters.date,
            startDate: initialFilters.startDate,
            endDate: initialFilters.endDate,
            status: 'all',
            ...(isCompanyLocked && defaultCompany
                ? {
                      companyId: defaultCompany.id,
                      companyName: defaultCompany.companyNameEn,
                  }
                : {}),
        } as CommonFilterParams
        setFilters(cleared)
        onFilterChange(cleared)
    }

    return (
        <Card className={cn("border-none shadow-sm bg-muted/20 overflow-hidden", className)}>
            <CardHeader className="pb-4 border-b bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <IconAdjustmentsHorizontal className="size-4" />
                        </div>
                        Attendance Filters
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <IconRefresh className="size-3.5 mr-1" />
                            Reset
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
                        >
                            {isExpanded ? <IconChevronUp className="size-4 text-muted-foreground" /> : <IconChevronDown className="size-4 text-muted-foreground" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn("p-6 transition-all duration-300 ease-in-out", !isExpanded && "hidden opacity-0")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {showDate && !showDateRange && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Date</Label>
                            <DatePicker
                                date={filters.date ? new Date(filters.date + "T00:00:00") : undefined}
                                setDate={(d) => handleFilterChange('date', d ? format(d, 'yyyy-MM-dd') : undefined)}
                            />
                        </div>
                    )}

                    {showDateRange && (
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Range</Label>
                            {/* Assuming DateRangePicker takes from/to or similar props based on common Shadcn implementations */}
                            <DateRangePicker
                                // You might need to adjust props based on your specific implementation
                                date={{
                                    from: filters.startDate ? new Date(filters.startDate + "T00:00:00") : undefined,
                                    to: filters.endDate ? new Date(filters.endDate + "T00:00:00") : undefined
                                }}
                                setDate={(range: any) => {
                                    handleFilterChange('startDate', range?.from ? format(range.from, 'yyyy-MM-dd') : undefined)
                                    handleFilterChange('endDate', range?.to ? format(range.to, 'yyyy-MM-dd') : undefined)
                                }}
                            />
                        </div>
                    )}

                    {showMonth && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Month</Label>
                            <NativeSelect
                                value={filters.date?.substring(0, 7) || format(new Date(), 'yyyy-MM')}
                                onChange={(e) => handleFilterChange('date', e.target.value + "-01")}
                                className="h-10 rounded-xl"
                            >
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const d = new Date(new Date().getFullYear(), i, 1)
                                    const val = format(d, 'yyyy-MM')
                                    const label = format(d, 'MMMM yyyy')
                                    return <option key={val} value={val}>{label}</option>
                                })}
                            </NativeSelect>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company</Label>
                        <NativeSelect
                            value={filters.companyId || "all"}
                            onChange={(e) => handleFilterChange('companyId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                            disabled={isCompanyDisabled}
                        >
                            <option value="all">Every Company</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.companyNameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Department</Label>
                        <NativeSelect
                            value={filters.departmentId || "all"}
                            onChange={(e) => handleFilterChange('departmentId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                            disabled={!filters.companyId}
                        >
                            <option value="all">Every Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Section</Label>
                        <NativeSelect
                            value={filters.sectionId || "all"}
                            onChange={(e) => handleFilterChange('sectionId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                            disabled={!filters.departmentId}
                        >
                            <option value="all">Every Section</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Line</Label>
                        <NativeSelect
                            value={filters.lineId || "all"}
                            onChange={(e) => handleFilterChange('lineId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                            disabled={!filters.sectionId}
                        >
                            <option value="all">Every Line</option>
                            {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Designation</Label>
                        <NativeSelect
                            value={filters.designationId || "all"}
                            onChange={(e) => handleFilterChange('designationId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                            disabled={!filters.sectionId}
                        >
                            <option value="all">Every Designation</option>
                            {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shift</Label>
                        <NativeSelect
                            value={filters.shiftId || "all"}
                            onChange={(e) => handleFilterChange('shiftId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                        >
                            <option value="all">Every Shift</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Group</Label>
                        <NativeSelect
                            value={filters.groupId || "all"}
                            onChange={(e) => handleFilterChange('groupId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                        >
                            <option value="all">Every Group</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Floor</Label>
                        <NativeSelect
                            value={filters.floorId || "all"}
                            onChange={(e) => handleFilterChange('floorId', e.target.value === "all" ? undefined : parseInt(e.target.value))}
                            className="h-10 rounded-xl"
                        >
                            <option value="all">Every Floor</option>
                            {floors.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gender</Label>
                        <NativeSelect
                            value={filters.gender || "all"}
                            onChange={(e) => handleFilterChange('gender', e.target.value === "all" ? undefined : e.target.value)}
                            className="h-10 rounded-xl"
                        >
                            <option value="all">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Religion</Label>
                        <NativeSelect
                            value={filters.religion || "all"}
                            onChange={(e) => handleFilterChange('religion', e.target.value === "all" ? undefined : e.target.value)}
                            className="h-10 rounded-xl"
                        >
                            <option value="all">All Religions</option>
                            <option value="Islam">Islam</option>
                            <option value="Hinduism">Hinduism</option>
                            <option value="Christianity">Christianity</option>
                            <option value="Buddhism">Buddhism</option>
                        </NativeSelect>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                        <NativeSelect
                            value={filters.status || "all"}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="h-10 rounded-xl border-primary/20 bg-primary/5 focus:bg-white"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </NativeSelect>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Search</Label>
                        <div className="relative group">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by Employee Name or ID..."
                                className="pl-10 h-10 rounded-xl border-muted/60 focus:border-primary/40 focus:ring-primary/10 transition-all"
                                value={filters.searchTerm || ""}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            />
                        </div>
                    </div>

                    <div className="lg:col-start-4 xl:col-start-5 flex items-end">
                        <Button
                            className="w-full h-10 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all transform active:scale-[0.98]"
                            onClick={applyFilters}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <IconLoader className="size-4 animate-spin" />
                            ) : (
                                <IconSearch className="size-4" />
                            )}
                            {isLoading ? "Processing..." : "Apply Filters"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
