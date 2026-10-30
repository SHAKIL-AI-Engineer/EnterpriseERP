"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconUsers,
    IconFilter,
    IconSearch,
    IconChevronDown,
    IconLoader,
    IconCircleCheckFilled,
    IconClock,
    IconUserCircle,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { HrFilterCard, HrFilterField } from "@/components/hr/hr-filter-card"
import { HrPageHeader } from "@/components/hr/hr-page-header"
import { HrPageShell } from "@/components/hr/hr-page-shell"
import { HrTableCard } from "@/components/hr/hr-table-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { employeeService, type Employee } from "@/lib/services/employee"
import { organogramService, type Floor } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"
import { toast } from "sonner"
import { cn, getImageUrl } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { type DateRange } from "react-day-picker"
import { useServerDataTable } from "@/hooks/use-server-data-table"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import type { HrReportExportParams } from "@/lib/services/hr-report-export"

export default function ManpowerListPage() {
    const router = useRouter()

    // Data states
    const [manpower, setManpower] = React.useState<Employee[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const serverTable = useServerDataTable()

    // Filter states
    const [searchTerm, setSearchTerm] = React.useState("")
    const [departmentId, setDepartmentId] = React.useState<string>("all")
    const [sectionId, setSectionId] = React.useState<string>("all")
    const [designationId, setDesignationId] = React.useState<string>("all")
    const [status, setStatus] = React.useState<string>("all")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [companyName, setCompanyName] = React.useState<string>("all")
    const [floorId, setFloorId] = React.useState<string>("all")
    const [gender, setGender] = React.useState<string>("all")
    const [religion, setReligion] = React.useState<string>("all")
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)

    // Dropdown options
    const [departments, setDepartments] = React.useState<any[]>([])
    const [sections, setSections] = React.useState<any[]>([])
    const [designations, setDesignations] = React.useState<any[]>([])
    const [floors, setFloors] = React.useState<Floor[]>([])
    const { companies, isCompanyLocked, defaultCompany } = useCompanyFilterScope()
    const lockedInitRef = React.useRef(false)

    React.useEffect(() => {
        organogramService.getFloors().then(setFloors).catch(console.error)
    }, [])

    React.useEffect(() => {
        if (!isCompanyLocked || !defaultCompany || lockedInitRef.current) return
        lockedInitRef.current = true
        setSelectedCompanyId(String(defaultCompany.id))
        setCompanyName(defaultCompany.companyNameEn)
    }, [isCompanyLocked, defaultCompany])

    // Fetch departments when company changes
    React.useEffect(() => {
        if (selectedCompanyId !== "all") {
            organogramService.getDepartments({ companyId: parseInt(selectedCompanyId) })
                .then(setDepartments)
                .catch(console.error)
        } else {
            setDepartments([])
            setDepartmentId("all")
        }
    }, [selectedCompanyId])

    // Fetch sections when department changes
    React.useEffect(() => {
        if (departmentId !== "all") {
            organogramService.getSections({ departmentId: parseInt(departmentId) })
                .then(setSections)
                .catch(console.error)
        } else {
            setSections([])
            setSectionId("all")
        }
    }, [departmentId])

    // Fetch designations when section changes
    React.useEffect(() => {
        if (sectionId !== "all") {
            organogramService.getDesignations({ sectionId: parseInt(sectionId) })
                .then(setDesignations)
                .catch(console.error)
        } else {
            setDesignations([])
            setDesignationId("all")
        }
    }, [sectionId])

    const serverPagingKey = serverTable.getAll
        ? "all"
        : `${serverTable.pageIndex}-${serverTable.pageSize}`

    const fetchManpower = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (departmentId !== "all") params.departmentId = parseInt(departmentId)
            if (sectionId !== "all") params.sectionId = parseInt(sectionId)
            if (designationId !== "all") params.designationId = parseInt(designationId)
            if (floorId !== "all") params.floorId = parseInt(floorId)
            if (selectedCompanyId !== "all") params.companyId = parseInt(selectedCompanyId)
            if (companyName !== "all") params.companyName = companyName
            if (gender !== "all") params.gender = gender
            if (dateRange?.from) params.joinDateFrom = dateRange.from.toISOString()
            if (dateRange?.to) params.joinDateTo = dateRange.to.toISOString()
            if (status !== "all") params.status = status
            if (searchTerm.trim()) params.searchTerm = searchTerm

            const page = await employeeService.getManpowerPage({
                ...params,
                page: serverTable.getAll ? 1 : serverTable.pageIndex + 1,
                pageSize: serverTable.pageSize,
                getAll: serverTable.getAll,
                sortBy: serverTable.sortBy,
                sortOrder: serverTable.sortOrder,
            })
            setManpower(page.items)
            serverTable.applyPaginationMeta({
                page: page.page,
                pageSize: page.pageSize,
                totalCount: page.totalCount,
                totalPages: page.totalPages,
                hasNextPage: page.hasNextPage ?? page.page < page.totalPages,
                hasPreviousPage: page.hasPreviousPage ?? page.page > 1,
                getAll: page.getAll ?? serverTable.getAll,
            })
        } catch (error) {
            toast.error("Failed to load manpower data")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [
        departmentId,
        sectionId,
        designationId,
        floorId,
        selectedCompanyId,
        companyName,
        gender,
        religion,
        dateRange,
        status,
        searchTerm,
        serverTable.getAll,
        serverTable.sortBy,
        serverTable.sortOrder,
        serverPagingKey,
    ])

    const exportParams = React.useMemo((): HrReportExportParams => {
        const params: HrReportExportParams = {}
        if (selectedCompanyId !== "all") {
            const company = companies.find((c) => c.id === parseInt(selectedCompanyId, 10))
            if (company) params.companyId = company.entityId
        }
        if (departmentId !== "all") {
            const dept = departments.find((d) => d.id === parseInt(departmentId, 10))
            if (dept) params.departmentId = dept.entityId
        }
        if (sectionId !== "all") {
            const section = sections.find((s) => s.id === parseInt(sectionId, 10))
            if (section) params.sectionId = section.entityId
        }
        if (designationId !== "all") {
            const designation = designations.find((d) => d.id === parseInt(designationId, 10))
            if (designation) params.designationId = designation.entityId
        }
        if (status !== "all") params.status = status
        if (gender !== "all") params.gender = gender
        if (religion !== "all") params.religion = religion
        if (dateRange?.from) params.joinDateFrom = dateRange.from.toISOString().slice(0, 10)
        if (dateRange?.to) params.joinDateTo = dateRange.to.toISOString().slice(0, 10)
        if (searchTerm.trim()) params.search = searchTerm.trim()
        return params
    }, [
        selectedCompanyId,
        departmentId,
        sectionId,
        designationId,
        status,
        gender,
        religion,
        dateRange,
        searchTerm,
        companies,
        departments,
        sections,
        designations,
    ])

    React.useEffect(() => {
        fetchManpower()
    }, [fetchManpower])

    React.useEffect(() => {
        serverTable.resetToFirstPage()
    }, [departmentId, sectionId, designationId, floorId, selectedCompanyId, companyName, gender, religion, dateRange?.from, dateRange?.to, status, searchTerm])

    const handleDelete = async (employee: Employee) => {
        try {
            if (!employee.companyId) {
                toast.error("Company information missing for this employee");
                return;
            }
            await employeeService.deleteEmployee(employee.employeeId, employee.companyId)
            toast.success("Employee deleted successfully")
            fetchManpower()
        } catch (error) {
            toast.error("Failed to delete employee")
            console.error(error)
        }
    }

    const columns: ColumnDef<Employee>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => (
                <button
                    onClick={() => router.push(`/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`)}
                    className="font-mono text-xs font-semibold text-foreground hover:text-erp-accent hover:underline text-left"
                >
                    {row.original.employeeId}
                </button>
            ),
        },
        {
            accessorKey: "fullNameEn",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                        {row.original.profileImageUrl ? (
                            <img src={getImageUrl(row.original.profileImageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                            <IconUserCircle className="size-5" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <button
                            onClick={() => router.push(`/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`)}
                            className="font-medium text-sm text-foreground hover:text-erp-accent hover:underline text-left"
                        >
                            {row.original.fullNameEn}
                        </button>
                        <span className="text-[10px] text-muted-foreground">{row.original.phoneNumber || row.original.email || 'No contact'}</span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.original.designationName}</span>
                    <span className="text-[10px] text-muted-foreground">{row.original.sectionName}</span>
                </div>
            )
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal bg-muted/50">
                    {row.original.departmentName}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const st = row.original.status
                return (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                        {st === "Active" ? (
                            <IconCircleCheckFilled className="size-3.5 text-green-500" />
                        ) : st === "On Leave" ? (
                            <IconClock className="size-3.5 text-amber-500" />
                        ) : (
                            <div className="size-2 rounded-full bg-muted-foreground/50" />
                        )}
                        {st}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "joinDate",
            header: "Join Date",
            cell: ({ row }) => (
                <span className="text-sm">
                    {new Date(row.original.joinDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </span>
            ),
        },
    ]

    const displayRecordCount =
        serverTable.rowCount > 0 ? serverTable.rowCount : manpower.length

    return (
        <HrPageShell>
            <HrPageHeader
                icon={<IconUsers className="size-7" />}
                title="Manpower List"
                description={`Workforce listing — ${displayRecordCount} records`}
                actions={
                    <>
                        <HrReportExportButtons
                            exportUrl="/api/v1/hr/reports/manpower-list"
                            params={exportParams}
                            filePrefix="manpower-list"
                            disabled={isLoading || manpower.length === 0}
                        />
                        <Button
                            size="sm"
                            className="h-9 px-4"
                            onClick={() =>
                                router.push("/management/human-resource/employee-info/create")
                            }
                        >
                            New Employee
                        </Button>
                    </>
                }
            />

            <HrFilterCard
                recordCount={displayRecordCount}
                isLoading={isLoading}
                onApply={fetchManpower}
                onReset={() => {
                    setSearchTerm("")
                    setDepartmentId("all")
                    setSectionId("all")
                    setDesignationId("all")
                    setFloorId("all")
                    if (isCompanyLocked && defaultCompany) {
                        setSelectedCompanyId(String(defaultCompany.id))
                        setCompanyName(defaultCompany.companyNameEn)
                    } else {
                        setCompanyName("all")
                        setSelectedCompanyId("all")
                    }
                    setGender("all")
                    setReligion("all")
                    setDateRange(undefined)
                    setStatus("all")
                }}
                className="bg-background/60 backdrop-blur-sm"
            >
                            {/* Search */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Employee</Label>
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Name, ID, Phone..."
                                        className="pl-9 h-10 bg-muted/30 border-none transition-all focus-visible:ring-1"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Department</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Section */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Section</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={sectionId}
                                    onChange={(e) => setSectionId(e.target.value)}
                                    disabled={departmentId === "all"}
                                >
                                    <option value="all">All Sections</option>
                                    {sections.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Designation</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={designationId}
                                    onChange={(e) => setDesignationId(e.target.value)}
                                    disabled={sectionId === "all"}
                                >
                                    <option value="all">All Designations</option>
                                    {designations.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Status</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Probation">Probation</option>
                                    <option value="Resigned">Resigned</option>
                                </NativeSelect>
                            </div>

                            {/* Company */}
                            <div className="flex flex-col gap-1.5 focus-within:z-20">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Company</Label>
                                <ManagementLegacyCompanySelect
                                    className="bg-muted/30 border-none"
                                    value={selectedCompanyId}
                                    allValue="all"
                                    onChange={(val) => {
                                        setSelectedCompanyId(val)
                                        if (val === "all") {
                                            setCompanyName("all")
                                        } else {
                                            const comp = companies.find((c) => c.id === parseInt(val, 10))
                                            setCompanyName(comp ? comp.companyNameEn : "all")
                                        }
                                        setDepartmentId("all")
                                        setSectionId("all")
                                        setDesignationId("all")
                                    }}
                                />
                            </div>

                            {/* Floor */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Floor</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={floorId}
                                    onChange={(e) => setFloorId(e.target.value)}
                                >
                                    <option value="all">All Floors</option>
                                    {floors.map((f) => (
                                        <option key={f.id} value={f.id}>{f.nameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gender</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="all">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                </NativeSelect>
                            </div>

                            {/* Religion */}
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Religion</Label>
                                <NativeSelect
                                    className="h-10 bg-muted/30 border-none"
                                    value={religion}
                                    onChange={(e) => setReligion(e.target.value)}
                                >
                                    <option value="all">All Religions</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Hinduism">Hinduism</option>
                                    <option value="Christianity">Christianity</option>
                                    <option value="Buddhism">Buddhism</option>
                                </NativeSelect>
                            </div>

                            {/* Date range picker */}
                            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Joining Date Range</Label>
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange}
                                />
                            </div>
            </HrFilterCard>

            <HrTableCard>
                        <DataTable
                            data={manpower}
                            columns={columns}
                            isLoading={isLoading}
                            paginationMode="server"
                            pageIndex={serverTable.pageIndex}
                            pageSize={serverTable.pageSize}
                            getAll={serverTable.getAll}
                            pageCount={serverTable.pageCount}
                            rowCount={serverTable.rowCount}
                            onPaginationChange={serverTable.handlePaginationChange}
                            onSortingChange={serverTable.onSortParamsChange}
                            onEditClick={(emp) => router.push(`/management/human-resource/employee-info/edit/${emp.employeeId}?companyId=${emp.companyId}`)}
                            onDelete={handleDelete}
                            onDeleteSelected={async (employees) => {
                                try {
                                    await Promise.all(employees.map(emp => {
                                        if (emp.companyId) {
                                            return employeeService.deleteEmployee(emp.employeeId, emp.companyId)
                                        }
                                        return Promise.resolve();
                                    }))
                                    toast.success(`Successfully deleted ${employees.length} employees`)
                                    fetchManpower()
                                } catch (error) {
                                    toast.error("Failed to delete some employees")
                                }
                            }}
                            showTabs={false}
                            showActions={true}
                            enableSelection={true}
                            searchKey="fullNameEn"
                        />
            </HrTableCard>
        </HrPageShell>
    )
}
