"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconBuilding,
    IconBuildingSkyscraper,
    IconLayoutGrid,
    IconIdBadge2,
    IconGitCommit,
    IconPlus,
    IconRefresh,
    IconUpload,
    IconFileSpreadsheet
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { organogramService, loadOrganogramLookup, Department, Section, Designation, Line } from "@/lib/services/organogram"
import { importExportService } from "@/lib/services/import-export"
import { companyService, Company } from "@/lib/services/company"
import { toast } from "sonner"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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

export default function CompanyOrganogramPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("company")
    const [isLoading, setIsLoading] = React.useState(true)

    // Data states
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [departments, setDepartments] = React.useState<Department[]>([])
    const [sections, setSections] = React.useState<Section[]>([])
    const [designations, setDesignations] = React.useState<Designation[]>([])
    const [lines, setLines] = React.useState<Line[]>([])

    // Options for modals and filters (unfiltered)
    const [allCompanies, setAllCompanies] = React.useState<Company[]>([])
    const [allDepartments, setAllDepartments] = React.useState<Department[]>([])
    const [allSections, setAllSections] = React.useState<Section[]>([])

    // Selection states for filtering
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("all")
    const [selectedDeptId, setSelectedDeptId] = React.useState<string>("all")
    const [selectedSectionId, setSelectedSectionId] = React.useState<string>("all")

    // CRUD Modal states
    const [isDeptModalOpen, setIsDeptModalOpen] = React.useState(false)
    const [isSectModalOpen, setIsSectModalOpen] = React.useState(false)
    const [isDesigModalOpen, setIsDesigModalOpen] = React.useState(false)
    const [isLineModalOpen, setIsLineModalOpen] = React.useState(false)

    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Modal dependent selection state
    const [modalCompanyId, setModalCompanyId] = React.useState<string>("")
    const [modalDeptId, setModalDeptId] = React.useState<string>("")
    const [modalSectionId, setModalSectionId] = React.useState<string>("")

    // Reset modal selections when modals open/close
    React.useEffect(() => {
        if (!editingItem) {
            setModalCompanyId(selectedCompanyId !== "all" ? selectedCompanyId : "")
            setModalDeptId(selectedDeptId !== "all" ? selectedDeptId : "")
            setModalSectionId(selectedSectionId !== "all" ? selectedSectionId : "")
            return
        }
        if ("sectionId" in editingItem && editingItem.sectionId) {
            const sec = allSections.find((s) => s.entityId === editingItem.sectionId)
            const dept = sec ? allDepartments.find((d) => d.entityId === sec.departmentId) : undefined
            setModalSectionId(editingItem.sectionId)
            setModalDeptId(sec?.departmentId ?? "")
            setModalCompanyId(dept?.companyId ?? "")
            return
        }
        if ("departmentId" in editingItem && editingItem.departmentId) {
            const dept = allDepartments.find((d) => d.entityId === editingItem.departmentId)
            setModalCompanyId(dept?.companyId ?? "")
            setModalDeptId(editingItem.departmentId)
            setModalSectionId("")
            return
        }
        if ("companyId" in editingItem && editingItem.companyId) {
            setModalCompanyId(String(editingItem.companyId))
            setModalDeptId("")
            setModalSectionId("")
        }
    }, [
        editingItem,
        isDeptModalOpen,
        isSectModalOpen,
        isDesigModalOpen,
        isLineModalOpen,
        selectedCompanyId,
        selectedDeptId,
        selectedSectionId,
        allSections,
        allDepartments,
    ])

    // Delete Alert state
    const [deleteItem, setDeleteItem] = React.useState<{ entityId: string; type: string } | null>(null)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const companiesData = await companyService.getAll()
            const { departments: depsData, sections: sectionsData } = await loadOrganogramLookup(
                companiesData.map((c) => ({ entityId: c.entityId, companyNameEn: c.companyNameEn })),
            )
            setCompanies(companiesData)
            setDepartments(depsData)
            setSections(sectionsData)

            setAllCompanies(companiesData)
            setAllDepartments(depsData)
            setAllSections(sectionsData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load organogram data")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    // Fetch related data when selections change
    React.useEffect(() => {
        const fetchRelated = async () => {
            try {
                const compId = selectedCompanyId === "all" ? undefined : selectedCompanyId
                const deptId = selectedDeptId === "all" ? undefined : selectedDeptId
                const sectId = selectedSectionId === "all" ? undefined : selectedSectionId

                if (activeTab === "department") {
                    const data = compId ? await organogramService.getDepartments({ companyId: compId }) : []
                    setDepartments(data)
                } else if (activeTab === "section") {
                    const data = deptId ? await organogramService.getSections({ departmentId: deptId }) : []
                    setSections(data)
                } else if (activeTab === "designation" || activeTab === "line") {
                    const [sectionsData, tabData] = await Promise.all([
                        deptId ? organogramService.getSections({ departmentId: deptId }) : Promise.resolve([] as Section[]),
                        sectId
                            ? activeTab === "designation"
                                ? organogramService.getDesignations({ sectionId: sectId })
                                : organogramService.getLines({ sectionId: sectId })
                            : Promise.resolve([] as Designation[] | Line[]),
                    ])

                    setSections(sectionsData)
                    if (activeTab === "designation") {
                        setDesignations(tabData as Designation[])
                    } else {
                        setLines(tabData as Line[])
                    }
                }
            } catch (error) {
                console.error(error)
                toast.error("Failed to load filtered organogram data")
            }
        }
        fetchRelated()
    }, [activeTab, selectedCompanyId, selectedDeptId, selectedSectionId])

    const handleSaveDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("nameEn") as string
        const nameBn = formData.get("nameBn") as string
        const companyId = formData.get("companyId") as string
        const codeRaw = (formData.get("code") as string)?.trim()
        const code = codeRaw ? codeRaw : null

        try {
            if (editingItem) {
                await organogramService.updateDepartment(editingItem.entityId, { nameEn, nameBn, companyId, code })
                toast.success("Department updated")
            } else {
                await organogramService.createDepartment({ nameEn, nameBn, companyId, code })
                toast.success("Department created")
            }
            setIsDeptModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save department")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveSection = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("nameEn") as string
        const nameBn = formData.get("nameBn") as string
        const departmentId = formData.get("departmentId") as string
        const codeRaw = (formData.get("code") as string)?.trim()
        const code = codeRaw ? codeRaw : null

        try {
            if (editingItem) {
                await organogramService.updateSection(editingItem.entityId, { nameEn, nameBn, departmentId, code })
                toast.success("Section updated")
            } else {
                await organogramService.createSection({ nameEn, nameBn, departmentId, code })
                toast.success("Section created")
            }
            setIsSectModalOpen(false)
            const data = await organogramService.getSections({
                departmentId: selectedDeptId === "all" ? undefined : selectedDeptId,
            })
            setSections(data)
        } catch (error) {
            toast.error("Failed to save section")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveDesignation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("nameEn") as string
        const nameBn = formData.get("nameBn") as string
        const sectionId = formData.get("sectionId") as string
        const codeRaw = (formData.get("code") as string)?.trim()
        const code = codeRaw ? codeRaw : null

        try {
            if (editingItem) {
                await organogramService.updateDesignation(editingItem.entityId, { nameEn, nameBn, sectionId, code })
                toast.success("Designation updated")
            } else {
                await organogramService.createDesignation({ nameEn, nameBn, sectionId, code })
                toast.success("Designation created")
            }
            setIsDesigModalOpen(false)
            const data = await organogramService.getDesignations({
                sectionId: selectedSectionId === "all" ? undefined : selectedSectionId,
            })
            setDesignations(data)
        } catch (error) {
            toast.error("Failed to save designation")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveLine = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("nameEn") as string
        const nameBn = formData.get("nameBn") as string
        const sectionId = formData.get("sectionId") as string
        const codeRaw = (formData.get("code") as string)?.trim()
        const code = codeRaw ? codeRaw : null

        try {
            if (editingItem) {
                await organogramService.updateLine(editingItem.entityId, { nameEn, nameBn, sectionId, code })
                toast.success("Line updated")
            } else {
                await organogramService.createLine({ nameEn, nameBn, sectionId, code })
                toast.success("Line created")
            }
            setIsLineModalOpen(false)
            const data = await organogramService.getLines({
                sectionId: selectedSectionId === "all" ? undefined : selectedSectionId,
            })
            setLines(data)
        } catch (error) {
            toast.error("Failed to save line")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteItem) return
        try {
            const { entityId, type } = deleteItem
            if (type === "dept") await organogramService.deleteDepartment(entityId)
            else if (type === "sect") await organogramService.deleteSection(entityId)
            else if (type === "desig") await organogramService.deleteDesignation(entityId)
            else if (type === "line") await organogramService.deleteLine(entityId)

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`)
            fetchData()
            setDeleteItem(null)
        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    const companyColumns: ColumnDef<Company>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "companyNameEn", header: "Company Name (EN)" },
        {
            accessorKey: "companyNameBn",
            header: "Company Name (BN)",
            cell: ({ row }) => <div className="font-sutonny">{row.getValue("companyNameBn")}</div>
        },
        { accessorKey: "registrationNo", header: "Reg No" },
        { accessorKey: "industry", header: "Industry" },
        { accessorKey: "email", header: "Email" },
    ]

    const deptColumns: ColumnDef<Department>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "nameEn", header: "Department Name (EN)" },
        {
            accessorKey: "nameBn",
            header: "Department Name (BN)",
            cell: ({ row }) => <div className="font-sutonny">{row.getValue("nameBn")}</div>
        },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "code", header: "Code" },
    ]

    const sectionColumns: ColumnDef<Section>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "nameEn", header: "Section Name (EN)" },
        {
            accessorKey: "nameBn",
            header: "Section Name (BN)",
            cell: ({ row }) => <div className="font-sutonny">{row.getValue("nameBn")}</div>
        },
        { accessorKey: "departmentName", header: "Department" },
        { accessorKey: "companyName", header: "Company" },
    ]

    const designationColumns: ColumnDef<Designation>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "nameEn", header: "Title (EN)" },
        {
            accessorKey: "nameBn",
            header: "Title (BN)",
            cell: ({ row }) => <div className="font-sutonny">{row.getValue("nameBn")}</div>
        },
        { accessorKey: "sectionName", header: "Section" },
        { accessorKey: "departmentName", header: "Department" },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "code", header: "Code" },
    ]

    const lineColumns: ColumnDef<Line>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "nameEn", header: "Line Name (EN)" },
        {
            accessorKey: "nameBn",
            header: "Line Name (BN)",
            cell: ({ row }) => <div className="font-sutonny">{row.getValue("nameBn")}</div>
        },
        { accessorKey: "sectionName", header: "Section" },
        { accessorKey: "departmentName", header: "Department" },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "code", header: "Code" },
    ]

    return (
        <div className="flex flex-col gap-6 p-6 font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold">Company Organogram</h1>
                    <p className="text-sm text-gray-500">Manage organizational hierarchy and structure</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push('/management/information/company-organogram/import')}>
                        <IconUpload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            try {
                                await importExportService.downloadOrganogramDemo()
                                toast.success("Template downloaded")
                            } catch (e) {
                                toast.error("Failed to download")
                            }
                        }}
                    >
                        <IconFileSpreadsheet className="mr-2 h-4 w-4" /> Excel Demo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconRefresh className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Refresh
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b rounded-none h-auto p-0 mb-6 flex justify-start gap-4">
                    {[
                        { val: "company", icon: IconBuilding, label: "Company" },
                        { val: "department", icon: IconBuildingSkyscraper, label: "Department" },
                        { val: "section", icon: IconLayoutGrid, label: "Section" },
                        { val: "designation", icon: IconIdBadge2, label: "Designation" },
                        { val: "line", icon: IconGitCommit, label: "Line" },
                    ].map((tab) => (
                        <TabsTrigger
                            key={tab.val}
                            value={tab.val}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-semibold text-gray-500 data-[state=active]:text-primary hover:text-gray-700 h-full"
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="flex flex-wrap gap-4">
                            {activeTab === "department" && (
                                <div className="space-y-1">
                                    <Label className="text-xs uppercase font-bold text-gray-400">Company</Label>
                                    <NativeSelect value={selectedCompanyId} onChange={(e) => {
                                        setSelectedCompanyId(e.target.value)
                                        setSelectedDeptId("all")
                                        setSelectedSectionId("all")
                                    }} className="w-[180px]">
                                        <option value="all">Select Company</option>
                                        {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                    </NativeSelect>
                                </div>
                            )}
                            {activeTab === "section" && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-400">Company</Label>
                                        <NativeSelect value={selectedCompanyId} onChange={(e) => {
                                            setSelectedCompanyId(e.target.value)
                                            setSelectedDeptId("all")
                                            setSelectedSectionId("all")
                                        }} className="w-[180px]">
                                            <option value="all">Select Company</option>
                                            {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                        </NativeSelect>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-400">Department</Label>
                                        <NativeSelect
                                            value={selectedDeptId}
                                            onChange={(e) => setSelectedDeptId(e.target.value)}
                                            className="w-[180px]"
                                            disabled={selectedCompanyId === "all"}
                                        >
                                            <option value="all">Select Department</option>
                                            {allDepartments
                                                .filter(d => d.companyId === selectedCompanyId)
                                                .map(d => <option key={d.entityId} value={d.entityId}>{d.nameEn}</option>)
                                            }
                                        </NativeSelect>
                                    </div>
                                </>
                            )}
                            {(activeTab === "designation" || activeTab === "line") && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-400">Company</Label>
                                        <NativeSelect value={selectedCompanyId} onChange={(e) => {
                                            setSelectedCompanyId(e.target.value)
                                            setSelectedDeptId("all")
                                            setSelectedSectionId("all")
                                        }} className="w-[180px]">
                                            <option value="all">Select Company</option>
                                            {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                        </NativeSelect>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-400">Department</Label>
                                        <NativeSelect
                                            value={selectedDeptId}
                                            onChange={(e) => {
                                                setSelectedDeptId(e.target.value)
                                                setSelectedSectionId("all")
                                            }}
                                            className="w-[180px]"
                                            disabled={selectedCompanyId === "all"}
                                        >
                                            <option value="all">Select Department</option>
                                            {allDepartments
                                                .filter(d => d.companyId === selectedCompanyId)
                                                .map(d => <option key={d.entityId} value={d.entityId}>{d.nameEn}</option>)
                                            }
                                        </NativeSelect>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-400">Section</Label>
                                        <NativeSelect
                                            value={selectedSectionId}
                                            onChange={(e) => setSelectedSectionId(e.target.value)}
                                            className="w-[180px]"
                                            disabled={selectedDeptId === "all"}
                                        >
                                            <option value="all">Select Section</option>
                                            {allSections
                                                .filter(s => s.departmentId === selectedDeptId)
                                                .map(s => <option key={s.entityId} value={s.entityId}>{s.nameEn}</option>)
                                            }
                                        </NativeSelect>
                                    </div>
                                </>
                            )}
                        </div>
                        {activeTab !== "company" && (
                            <Button
                                onClick={() => {
                                    setEditingItem(null)
                                    if (activeTab === "department") setIsDeptModalOpen(true)
                                    else if (activeTab === "section") setIsSectModalOpen(true)
                                    else if (activeTab === "designation") setIsDesigModalOpen(true)
                                    else if (activeTab === "line") setIsLineModalOpen(true)
                                }}
                                className="gap-2"
                            >
                                <IconPlus size={18} /> Add {activeTab === "designation" ? "Title" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </Button>
                        )}
                    </div>

                    <Card className="border shadow-none overflow-hidden min-h-[400px]">
                        <TabsContent value="company" className="m-0 border-none shadow-none">
                            <DataTable
                                data={companies}
                                columns={companyColumns}
                                showTabs={false}
                                isLoading={isLoading}
                                onEditClick={(item) => router.push(`/management/information/company-information/edit/${(item as Company).entityId}`)}
                            />
                        </TabsContent>
                        <TabsContent value="department" className="m-0 border-none shadow-none">
                            {selectedCompanyId !== "all" ? (
                                <DataTable
                                    data={departments}
                                    columns={deptColumns}
                                    showTabs={false}
                                    isLoading={isLoading}
                                    onEditClick={(item) => { setEditingItem(item); setIsDeptModalOpen(true); }}
                                    onDelete={(item: any) => setDeleteItem({ entityId: item.entityId, type: "dept" })}
                                />
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/5">
                                    <div className="text-center">
                                        <IconBuilding className="size-10 mx-auto mb-2 opacity-20" />
                                        <p>Please select a company to view departments</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="section" className="m-0 border-none shadow-none">
                            {selectedDeptId !== "all" ? (
                                <DataTable
                                    data={sections}
                                    columns={sectionColumns}
                                    showTabs={false}
                                    isLoading={isLoading}
                                    onEditClick={(item) => { setEditingItem(item); setIsSectModalOpen(true); }}
                                    onDelete={(item: any) => setDeleteItem({ entityId: item.entityId, type: "sect" })}
                                />
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/5">
                                    <div className="text-center">
                                        <IconBuildingSkyscraper className="size-10 mx-auto mb-2 opacity-20" />
                                        <p>Please select a department to view sections</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="designation" className="m-0 border-none shadow-none">
                            {selectedSectionId !== "all" ? (
                                <DataTable
                                    data={designations}
                                    columns={designationColumns}
                                    showTabs={false}
                                    isLoading={isLoading}
                                    onEditClick={(item) => { setEditingItem(item); setIsDesigModalOpen(true); }}
                                    onDelete={(item: any) => setDeleteItem({ entityId: item.entityId, type: "desig" })}
                                />
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/5">
                                    <div className="text-center">
                                        <IconLayoutGrid className="size-10 mx-auto mb-2 opacity-20" />
                                        <p>Please select a section to view designations</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="line" className="m-0 border-none shadow-none">
                            {selectedSectionId !== "all" ? (
                                <DataTable
                                    data={lines}
                                    columns={lineColumns}
                                    showTabs={false}
                                    isLoading={isLoading}
                                    onEditClick={(item) => { setEditingItem(item); setIsLineModalOpen(true); }}
                                    onDelete={(item: any) => setDeleteItem({ entityId: item.entityId, type: "line" })}
                                />
                            ) : (
                                <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-muted/5">
                                    <div className="text-center">
                                        <IconLayoutGrid className="size-10 mx-auto mb-2 opacity-20" />
                                        <p>Please select a section to view lines</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Card>
                </div>

            </Tabs>

            {/* Modals */}
            {/* Department Modal */}
            <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveDepartment}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Department" : "New Department"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>Company</Label>
                                <NativeSelect
                                    name="companyId"
                                    value={modalCompanyId}
                                    onChange={(e) => setModalCompanyId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (English)</Label>
                                <Input name="nameEn" defaultValue={editingItem?.nameEn} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (Bangla)</Label>
                                <Input name="nameBn" defaultValue={editingItem?.nameBn} className="font-sutonny" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Code (optional)</Label>
                                <Input name="code" defaultValue={editingItem?.code ?? ""} placeholder="e.g. DEPT-01" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Section Modal */}
            <Dialog open={isSectModalOpen} onOpenChange={setIsSectModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveSection}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Section" : "New Section"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>Company</Label>
                                <NativeSelect
                                    name="companyId"
                                    value={modalCompanyId}
                                    onChange={(e) => {
                                        setModalCompanyId(e.target.value)
                                        setModalDeptId("") // Reset department when company changes
                                    }}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Department</Label>
                                <NativeSelect
                                    name="departmentId"
                                    value={modalDeptId}
                                    onChange={(e) => setModalDeptId(e.target.value)}
                                    required
                                    disabled={!modalCompanyId}
                                >
                                    <option value="">Select Department</option>
                                    {allDepartments
                                        .filter(d => !modalCompanyId || d.companyId === modalCompanyId)
                                        .map(d => <option key={d.entityId} value={d.entityId}>{d.nameEn}</option>)
                                    }
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (English)</Label>
                                <Input name="nameEn" defaultValue={editingItem?.nameEn} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (Bangla)</Label>
                                <Input name="nameBn" defaultValue={editingItem?.nameBn} className="font-sutonny" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Code (optional)</Label>
                                <Input name="code" defaultValue={editingItem?.code ?? ""} placeholder="e.g. SEC-01" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsSectModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Designation Modal */}
            <Dialog open={isDesigModalOpen} onOpenChange={setIsDesigModalOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSaveDesignation}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Designation" : "New Designation"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Company</Label>
                                    <NativeSelect
                                        name="companyId"
                                        value={modalCompanyId}
                                        onChange={(e) => {
                                            setModalCompanyId(e.target.value)
                                            setModalDeptId("")
                                            setModalSectionId("")
                                        }}
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <NativeSelect
                                        name="departmentId"
                                        value={modalDeptId}
                                        onChange={(e) => {
                                            setModalDeptId(e.target.value)
                                            setModalSectionId("")
                                        }}
                                        required
                                        disabled={!modalCompanyId}
                                    >
                                        <option value="">Select Department</option>
                                        {allDepartments
                                            .filter(d => !modalCompanyId || d.companyId === modalCompanyId)
                                            .map(d => <option key={d.entityId} value={d.entityId}>{d.nameEn}</option>)
                                        }
                                    </NativeSelect>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Section</Label>
                                <NativeSelect
                                    name="sectionId"
                                    value={modalSectionId}
                                    onChange={(e) => setModalSectionId(e.target.value)}
                                    required
                                    disabled={!modalDeptId}
                                >
                                    <option value="">Select Section</option>
                                    {allSections
                                        .filter(s => !modalDeptId || s.departmentId === modalDeptId)
                                        .map(s => <option key={s.entityId} value={s.entityId}>{s.nameEn}</option>)
                                    }
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Title (English)</Label>
                                <Input name="nameEn" defaultValue={editingItem?.nameEn} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Title (Bangla)</Label>
                                <Input name="nameBn" defaultValue={editingItem?.nameBn} className="font-sutonny" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Code (optional)</Label>
                                <Input name="code" defaultValue={editingItem?.code ?? ""} placeholder="Internal code" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDesigModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Line Modal */}
            <Dialog open={isLineModalOpen} onOpenChange={setIsLineModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveLine}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Line" : "New Line"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Company</Label>
                                    <NativeSelect
                                        name="companyId"
                                        value={modalCompanyId}
                                        onChange={(e) => {
                                            setModalCompanyId(e.target.value)
                                            setModalDeptId("")
                                            setModalSectionId("")
                                        }}
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {allCompanies.map(c => <option key={c.entityId} value={c.entityId}>{c.companyNameEn}</option>)}
                                    </NativeSelect>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <NativeSelect
                                        name="departmentId"
                                        value={modalDeptId}
                                        onChange={(e) => {
                                            setModalDeptId(e.target.value)
                                            setModalSectionId("")
                                        }}
                                        required
                                        disabled={!modalCompanyId}
                                    >
                                        <option value="">Select Department</option>
                                        {allDepartments
                                            .filter(d => !modalCompanyId || d.companyId === modalCompanyId)
                                            .map(d => <option key={d.entityId} value={d.entityId}>{d.nameEn}</option>)
                                        }
                                    </NativeSelect>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Section</Label>
                                <NativeSelect
                                    name="sectionId"
                                    value={modalSectionId}
                                    onChange={(e) => setModalSectionId(e.target.value)}
                                    required
                                    disabled={!modalDeptId}
                                >
                                    <option value="">Select Section</option>
                                    {allSections
                                        .filter(s => !modalDeptId || s.departmentId === modalDeptId)
                                        .map(s => <option key={s.entityId} value={s.entityId}>{s.nameEn}</option>)
                                    }
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (English)</Label>
                                <Input name="nameEn" defaultValue={editingItem?.nameEn} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Name (Bangla)</Label>
                                <Input name="nameBn" defaultValue={editingItem?.nameBn} className="font-sutonny" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Code (optional)</Label>
                                <Input name="code" defaultValue={editingItem?.code ?? ""} placeholder="e.g. LINE-01" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsLineModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={deleteItem !== null} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the <b>{deleteItem?.type}</b> permanently.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
