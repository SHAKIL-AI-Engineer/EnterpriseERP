"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { HrFilterCard, HrFilterField } from "@/components/hr/hr-filter-card"
import { HrPageHeader } from "@/components/hr/hr-page-header"
import { HrPageShell } from "@/components/hr/hr-page-shell"
import { HrTableCard } from "@/components/hr/hr-table-card"
import { HrIdLink, HrNameLink, HrCellText } from "@/components/hr/hr-table-cells"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    IconUserCircle,
    IconFilter,
    IconPlus,
    IconCircleCheckFilled,
    IconLoader,
    IconClock,
    IconFileSpreadsheet,
} from "@tabler/icons-react"
import { type ColumnDef } from "@tanstack/react-table"
import { employeeService, type Employee } from "@/lib/services/employee"
import { organogramService, type Department, type Section, type Designation, type Line, type Group, type Shift, type Floor } from "@/lib/services/organogram"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { format } from "date-fns"
import { getImageUrl } from "@/lib/utils"
import { useServerDataTable } from "@/hooks/use-server-data-table"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"
import type { HrReportExportParams } from "@/lib/services/hr-report-export"

type EmployeeListFilters = {
    empIdSearch: string
    statusFilter: string
    deptFilter: number | "All"
    sectionFilter: number | "All"
    designationFilter: number | "All"
    lineFilter: number | "All"
    groupFilter: number | "All"
    shiftFilter: number | "All"
    floorFilter: number | "All"
    selectedCompanyId: number | "All"
    genderFilter: string
    religionFilter: string
    dateRange: { from: Date | undefined; to: Date | undefined }
}

const defaultEmployeeListFilters = (): EmployeeListFilters => ({
    empIdSearch: "",
    statusFilter: "Active",
    deptFilter: "All",
    sectionFilter: "All",
    designationFilter: "All",
    lineFilter: "All",
    groupFilter: "All",
    shiftFilter: "All",
    floorFilter: "All",
    selectedCompanyId: "All",
    genderFilter: "All",
    religionFilter: "All",
    dateRange: { from: undefined, to: undefined },
})

function buildEmployeeQueryParams(filters: EmployeeListFilters): Record<string, unknown> {
    const params: Record<string, unknown> = {}
    if (filters.statusFilter !== "All") params.status = filters.statusFilter
    if (filters.deptFilter !== "All") params.departmentId = filters.deptFilter
    if (filters.sectionFilter !== "All") params.sectionId = filters.sectionFilter
    if (filters.designationFilter !== "All") params.designationId = filters.designationFilter
    if (filters.lineFilter !== "All") params.lineId = filters.lineFilter
    if (filters.groupFilter !== "All") params.groupId = filters.groupFilter
    if (filters.shiftFilter !== "All") params.shiftId = filters.shiftFilter
    if (filters.floorFilter !== "All") params.floorId = filters.floorFilter
    if (filters.selectedCompanyId !== "All") params.companyId = filters.selectedCompanyId
    if (filters.genderFilter !== "All") params.gender = filters.genderFilter
    if (filters.religionFilter !== "All") params.religion = filters.religionFilter
    if (filters.dateRange.from) params.joinDateFrom = filters.dateRange.from.toISOString()
    if (filters.dateRange.to) params.joinDateTo = filters.dateRange.to.toISOString()
    if (filters.empIdSearch.trim()) params.employeeId = filters.empIdSearch.trim()
    return params
}

export default function EmployeeInfoPage() {
    const router = useRouter()

    const employeeColumns: ColumnDef<Employee>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
        },
        {
            accessorKey: "employeeId",
            header: "ID",
            cell: ({ row }) => (
                <HrIdLink
                    onClick={() =>
                        router.push(
                            `/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`,
                        )
                    }
                >
                    {row.original.employeeId}
                </HrIdLink>
            ),
        },
        {
            accessorKey: "fullNameEn",
            header: "Employee Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full overflow-hidden bg-muted shrink-0 border border-primary/10">
                        {row.original.profileImageUrl ? (
                            <img src={getImageUrl(row.original.profileImageUrl)} alt="" className="size-full object-cover" />
                        ) : (
                            <IconUserCircle className="size-full text-muted-foreground/40" />
                        )}
                    </div>
                    <HrNameLink
                        onClick={() =>
                            router.push(
                                `/management/human-resource/employee-info/${row.original.employeeId}?companyId=${row.original.companyId}`,
                            )
                        }
                    >
                        {row.original.fullNameEn}
                    </HrNameLink>
                </div>
            ),
        },
        {
            accessorKey: "designationName",
            header: "Designation",
            cell: ({ row }) => <HrCellText>{row.original.designationName}</HrCellText>,
        },
        {
            accessorKey: "departmentName",
            header: "Department",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {row.original.departmentName || 'N/A'}
                </Badge>
            ),
        },
        {
            accessorKey: "companyName",
            header: "Company",
            cell: ({ row }) => (
                <span className="text-xs text-foreground">{row.original.companyName || '-'}</span>
            ),
        },
        {
            accessorKey: "bloodGroup",
            header: "Blood Group",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 border-primary/30 bg-primary/10 text-foreground">
                    {row.original.bloodGroup || '-'}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge variant="outline" className="flex items-center gap-1.5 w-fit font-normal">
                        {status === "Active" ? (
                            <IconCircleCheckFilled className="size-3.5 text-green-500" />
                        ) : status === "On Leave" ? (
                            <IconClock className="size-3.5 text-amber-500" />
                        ) : (
                            <IconLoader className="size-3.5 text-muted-foreground animate-spin-slow" />
                        )}
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "joinDate",
            header: "Join Date",
            cell: ({ row }) => (
                <span className="text-sm text-foreground">
                    {new Date(row.original.joinDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            accessorKey: "isOtEnabled",
            header: "OT Status",
            cell: ({ row }) => (
                <Badge variant={row.original.isOtEnabled ? "default" : "secondary"} className="font-normal">
                    {row.original.isOtEnabled ? "Enabled" : "Disabled"}
                </Badge>
            ),
        },
    ]

    // Filter States
    const [empIdSearch, setEmpIdSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("Active")
    const [deptFilter, setDeptFilter] = React.useState<number | "All">("All")
    const [sectionFilter, setSectionFilter] = React.useState<number | "All">("All")
    const [designationFilter, setDesignationFilter] = React.useState<number | "All">("All")
    const [lineFilter, setLineFilter] = React.useState<number | "All">("All")
    const [groupFilter, setGroupFilter] = React.useState<number | "All">("All")
    const [shiftFilter, setShiftFilter] = React.useState<number | "All">("All")
    const [floorFilter, setFloorFilter] = React.useState<number | "All">("All")
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<number | "All">("All")
    const [companyFilter, setCompanyFilter] = React.useState<string>("All")
    const [genderFilter, setGenderFilter] = React.useState<string>("All")
    const [religionFilter, setReligionFilter] = React.useState<string>("All")
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    })

    /** Filters sent to the employee list API — updated only via Apply / Reset / initial load */
    const [appliedFilters, setAppliedFilters] = React.useState<EmployeeListFilters>(defaultEmployeeListFilters)

    // Data States
    const [employees, setEmployees] = React.useState<Employee[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const serverTable = useServerDataTable()

    // Option Lists
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [lines, setLines] = React.useState<Line[]>([])
    const [groups, setGroupList] = React.useState<Group[]>([])
    const [shifts, setShiftList] = React.useState<Shift[]>([])
    const [floors, setFloors] = React.useState<Floor[]>([])
    const { companies, isCompanyLocked, defaultCompany } = useCompanyFilterScope()
    const lockedInitRef = React.useRef(false)

    // Load initial reference data
    React.useEffect(() => {
        const loadRefs = async () => {
            try {
                const [grps, shfts, flrs] = await Promise.all([
                    organogramService.getGroups(),
                    organogramService.getShifts(),
                    organogramService.getFloors(),
                ])
                setGroupList(grps)
                setShiftList(shfts)
                setFloors(flrs)
            } catch (error) {
                console.error("Failed to load reference data", error)
            }
        }
        loadRefs()
    }, [])

    React.useEffect(() => {
        if (!isCompanyLocked || !defaultCompany || lockedInitRef.current) return
        lockedInitRef.current = true
        setSelectedCompanyId(defaultCompany.id)
        setCompanyFilter(defaultCompany.companyNameEn)
        setAppliedFilters((prev) => ({
            ...prev,
            selectedCompanyId: defaultCompany.id,
        }))
    }, [isCompanyLocked, defaultCompany])

    // Fetch departments when company changes
    React.useEffect(() => {
        if (selectedCompanyId !== "All") {
            organogramService.getDepartments({ companyId: selectedCompanyId as number })
                .then(setDepartments)
                .catch(console.error)
        } else {
            setDepartments([])
            setDeptFilter("All")
        }
    }, [selectedCompanyId])

    // Cascading dropdowns
    React.useEffect(() => {
        if (deptFilter !== "All") {
            organogramService.getSections({ departmentId: deptFilter }).then(setSections)
        } else {
            setSections([])
            setSectionFilter("All")
        }
    }, [deptFilter])

    React.useEffect(() => {
        if (sectionFilter !== "All") {
            organogramService.getDesignations({ sectionId: sectionFilter }).then(setDesignations)
            organogramService.getLines({ sectionId: sectionFilter }).then(setLines)
        } else {
            setDesignations([])
            setDesignationFilter("All")
            setLines([])
            setLineFilter("All")
        }
    }, [sectionFilter])


    const serverPagingKey = serverTable.getAll
        ? "all"
        : `${serverTable.pageIndex}-${serverTable.pageSize}`

    const snapshotDraftFilters = React.useCallback(
        (): EmployeeListFilters => ({
            empIdSearch,
            statusFilter,
            deptFilter,
            sectionFilter,
            designationFilter,
            lineFilter,
            groupFilter,
            shiftFilter,
            floorFilter,
            selectedCompanyId,
            genderFilter,
            religionFilter,
            dateRange,
        }),
        [
            empIdSearch,
            statusFilter,
            deptFilter,
            sectionFilter,
            designationFilter,
            lineFilter,
            groupFilter,
            shiftFilter,
            floorFilter,
            selectedCompanyId,
            genderFilter,
            religionFilter,
            dateRange,
        ],
    )

    const fetchEmployees = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const page = await employeeService.getEmployeesPage({
                ...buildEmployeeQueryParams(appliedFilters),
                page: serverTable.getAll ? 1 : serverTable.pageIndex + 1,
                pageSize: serverTable.pageSize,
                getAll: serverTable.getAll,
                sortBy: serverTable.sortBy,
                sortOrder: serverTable.sortOrder,
            })
            setEmployees(page.items)
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
            toast.error("Failed to load employees")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [
        appliedFilters,
        serverTable.getAll,
        serverTable.sortBy,
        serverTable.sortOrder,
        serverPagingKey,
    ])

    React.useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    const handleApplyFilters = () => {
        serverTable.resetToFirstPage()
        setAppliedFilters(snapshotDraftFilters())
    }

    const handleDelete = async (employee: Employee) => {
        try {
            if (!employee.companyId) {
                toast.error("Company information missing for this employee");
                return;
            }
            await employeeService.deleteEmployee(employee.employeeId, employee.companyId)
            toast.success("Employee deleted successfully")
            fetchEmployees()
        } catch (error) {
            toast.error("Failed to delete employee")
            console.error(error)
        }
    }

    const resetFilters = () => {
        const defaults = defaultEmployeeListFilters()
        setStatusFilter(defaults.statusFilter)
        setDeptFilter(defaults.deptFilter)
        setSectionFilter(defaults.sectionFilter)
        setDesignationFilter(defaults.designationFilter)
        setLineFilter(defaults.lineFilter)
        setGroupFilter(defaults.groupFilter)
        setShiftFilter(defaults.shiftFilter)
        setFloorFilter(defaults.floorFilter)
        if (isCompanyLocked && defaultCompany) {
            setSelectedCompanyId(defaultCompany.id)
            setCompanyFilter(defaultCompany.companyNameEn)
        } else {
            setCompanyFilter("All")
            setSelectedCompanyId(defaults.selectedCompanyId)
        }
        setGenderFilter(defaults.genderFilter)
        setReligionFilter(defaults.religionFilter)
        setDateRange(defaults.dateRange)
        setEmpIdSearch(defaults.empIdSearch)
        serverTable.resetToFirstPage()
        const nextApplied = { ...defaults }
        if (isCompanyLocked && defaultCompany) {
            nextApplied.selectedCompanyId = defaultCompany.id
        }
        setAppliedFilters(nextApplied)
    }

    const exportParams = React.useMemo((): HrReportExportParams => {
        const params: HrReportExportParams = {}
        if (appliedFilters.selectedCompanyId !== "All") {
            const company = companies.find((c) => c.id === appliedFilters.selectedCompanyId)
            if (company) params.companyId = company.entityId
        }
        if (appliedFilters.deptFilter !== "All") {
            const dept = departments.find((d) => d.id === appliedFilters.deptFilter)
            if (dept) params.departmentId = dept.entityId
        }
        if (appliedFilters.sectionFilter !== "All") {
            const section = sections.find((s) => s.id === appliedFilters.sectionFilter)
            if (section) params.sectionId = section.entityId
        }
        if (appliedFilters.designationFilter !== "All") {
            const designation = designations.find((d) => d.id === appliedFilters.designationFilter)
            if (designation) params.designationId = designation.entityId
        }
        if (appliedFilters.statusFilter !== "All") params.status = appliedFilters.statusFilter
        if (appliedFilters.genderFilter !== "All") params.gender = appliedFilters.genderFilter
        if (appliedFilters.religionFilter !== "All") params.religion = appliedFilters.religionFilter
        if (appliedFilters.dateRange.from) {
            params.joinDateFrom = appliedFilters.dateRange.from.toISOString().slice(0, 10)
        }
        if (appliedFilters.dateRange.to) {
            params.joinDateTo = appliedFilters.dateRange.to.toISOString().slice(0, 10)
        }
        if (appliedFilters.empIdSearch.trim()) params.employeeId = appliedFilters.empIdSearch.trim()
        return params
    }, [appliedFilters, companies, departments, sections, designations])

    const displayRecordCount = serverTable.rowCount > 0 ? serverTable.rowCount : employees.length

    return (
        <HrPageShell>
            <HrPageHeader
                icon={<IconUserCircle className="size-7" />}
                title="Employee Information"
                description="Search, filter, and manage employee records."
                actions={
                    <>
                        <HrReportExportButtons
                            exportUrl="/api/v1/hr/reports/employees"
                            params={exportParams}
                            filePrefix="employees"
                            disabled={isLoading || displayRecordCount === 0}
                        />
                        <Button
                            variant="outline"
                            className="w-fit"
                            onClick={() => router.push("/management/human-resource/employee-info/import")}
                        >
                            <IconFileSpreadsheet className="mr-2 size-4" />
                            Import Employee Data
                        </Button>
                        <Button
                            className="w-fit"
                            onClick={() => router.push("/management/human-resource/employee-info/create")}
                        >
                            <IconPlus className="mr-2 size-4" />
                            New Employee
                        </Button>
                    </>
                }
            />

            <HrFilterCard
                recordCount={displayRecordCount}
                isLoading={isLoading}
                onApply={handleApplyFilters}
                onReset={resetFilters}
            >
                            <HrFilterField label="Company" htmlFor="company-filter">
                                <ManagementLegacyCompanySelect
                                    value={selectedCompanyId === "All" ? "All" : String(selectedCompanyId)}
                                    allValue="All"
                                    allOptionLabel="All Companies"
                                    onChange={(val) => {
                                        if (val === "All") {
                                            setSelectedCompanyId("All")
                                            setCompanyFilter("All")
                                        } else {
                                            const id = parseInt(val, 10)
                                            setSelectedCompanyId(id)
                                            const comp = companies.find((c) => c.id === id)
                                            setCompanyFilter(comp ? comp.companyNameEn : "All")
                                        }
                                        setDeptFilter("All")
                                        setSectionFilter("All")
                                        setDesignationFilter("All")
                                        setLineFilter("All")
                                    }}
                                    className="h-9"
                                />
                            </HrFilterField>

                            <HrFilterField label="Department" htmlFor="dept-filter">
                                <NativeSelect
                                    id="dept-filter"
                                    value={deptFilter.toString()}
                                    onChange={(e) => setDeptFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Section" htmlFor="sec-filter">
                                <NativeSelect
                                    id="sec-filter"
                                    value={sectionFilter.toString()}
                                    onChange={(e) => setSectionFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={deptFilter === "All"}
                                >
                                    <option value="All">All Sections</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Line" htmlFor="line-filter">
                                <NativeSelect
                                    id="line-filter"
                                    value={lineFilter.toString()}
                                    onChange={(e) => setLineFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={sectionFilter === "All"}
                                >
                                    <option value="All">All Lines</option>
                                    {lines.map(l => <option key={l.id} value={l.id}>{l.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Designation" htmlFor="desig-filter">
                                <NativeSelect
                                    id="desig-filter"
                                    value={designationFilter.toString()}
                                    onChange={(e) => setDesignationFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                    disabled={sectionFilter === "All"}
                                >
                                    <option value="All">All Designations</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Group" htmlFor="group-filter">
                                <NativeSelect
                                    id="group-filter"
                                    value={groupFilter.toString()}
                                    onChange={(e) => setGroupFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Groups</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Shift" htmlFor="shift-filter">
                                <NativeSelect
                                    id="shift-filter"
                                    value={shiftFilter.toString()}
                                    onChange={(e) => setShiftFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Shifts</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.nameEn} ({s.inTime}-{s.outTime})</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Status" htmlFor="status-filter">
                                <NativeSelect
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Probation">Probation</option>
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Floor" htmlFor="floor-filter">
                                <NativeSelect
                                    id="floor-filter"
                                    value={floorFilter.toString()}
                                    onChange={(e) => setFloorFilter(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                                    className="h-9"
                                >
                                    <option value="All">All Floors</option>
                                    {floors.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Gender" htmlFor="gender-filter">
                                <NativeSelect
                                    id="gender-filter"
                                    value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Others">Others</option>
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Religion" htmlFor="religion-filter">
                                <NativeSelect
                                    id="religion-filter"
                                    value={religionFilter}
                                    onChange={(e) => setReligionFilter(e.target.value)}
                                    className="h-9"
                                >
                                    <option value="All">All Religions</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Hinduism">Hinduism</option>
                                    <option value="Christianity">Christianity</option>
                                    <option value="Buddhism">Buddhism</option>
                                </NativeSelect>
                            </HrFilterField>

                            <HrFilterField label="Joining Date Range" className="lg:col-span-2">
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange as any}
                                />
                            </HrFilterField>

                            <HrFilterField label="Search by Employee ID" htmlFor="id-search">
                                <Input
                                    id="id-search"
                                    placeholder="Type Employee ID..."
                                    className="h-9 bg-background"
                                    value={empIdSearch}
                                    onChange={(e) => setEmpIdSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                                />
                            </HrFilterField>
            </HrFilterCard>

            <HrTableCard>
            <DataTable
                data={employees}
                columns={employeeColumns}
                showTabs={false}
                showActions={true}
                enableSelection={true}
                searchKey="fullNameEn"
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
                        fetchEmployees()
                    } catch (error) {
                        toast.error("Failed to delete some employees")
                    }
                }}
            />
            </HrTableCard>
        </HrPageShell>
    )
}
