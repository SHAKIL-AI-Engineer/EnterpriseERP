"use client"

import * as React from "react"
import { IconUsersGroup, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { organogramService, Group } from "@/lib/services/organogram"
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"

export default function GroupPage() {
    const [data, setData] = React.useState<Group[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [currentGroup, setCurrentGroup] = React.useState<Partial<Group>>({})
    const [isEditing, setIsEditing] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState<string>("all")
    const { companies, isCompanyLocked } = useCompanyFilterScope()

    const fetchGroups = async () => {
        try {
            setLoading(true)
            const companyIdParam =
                selectedCompany !== "all" ? selectedCompany : undefined

            const groups = await organogramService.getGroups({
                companyId: companyIdParam
            })
            setData(groups)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch groups")
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchGroups()
    }, [selectedCompany])

    const columns: ColumnDef<Group>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "nameEn",
            header: "Group Name (EN)",
            cell: ({ row }) => <span className="font-medium">{row.getValue("nameEn")}</span>
        },
        {
            accessorKey: "nameBn",
            header: "Group Name (BN)",
            cell: ({ row }) => <span className="font-sutonny text-lg">{row.getValue("nameBn")}</span>
        },
        {
            accessorKey: "companyName",
            header: "Company",
            cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue("companyName") || "N/A"}</span>
        },
    ]

    const handleAddClick = () => {
        setIsEditing(false)
        const selected = selectedCompany !== "all" ? companies.find(c => c.entityId === selectedCompany) : undefined
        setCurrentGroup({
            nameEn: "",
            nameBn: "",
            companyId: selected?.id,
            companyName: selected?.companyNameEn ?? "",
        })
        setIsSheetOpen(true)
    }

    const handleEditClick = (group: Group) => {
        setIsEditing(true)
        setCurrentGroup({ ...group })
        setIsSheetOpen(true)
    }

    const handleDelete = async (group: Group) => {
        try {
            await organogramService.deleteGroup(group.id)
            toast.success("Group deleted successfully")
            fetchGroups()
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Failed to delete group"
            toast.error(message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const dto = {
                nameEn: currentGroup.nameEn || "",
                nameBn: currentGroup.nameBn,
                companyId: currentGroup.companyId!,
                companyName: currentGroup.companyName,
            }

            if (isEditing && currentGroup.id) {
                await organogramService.updateGroup(currentGroup.id, dto)
                toast.success("Group updated successfully")
            } else {
                await organogramService.createGroup(dto)
                toast.success("New group created successfully")
            }
            setIsSheetOpen(false)
            fetchGroups()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save group")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <IconUsersGroup className="size-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Group Management</h1>
                    </div>
                    <p className="text-muted-foreground">Manage employee functional groups for better organization.</p>
                </div>
                <Button className="gap-2" onClick={handleAddClick}>
                    <IconPlus className="size-4" />
                    Create Group
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-64">
                    <Label className="text-xs uppercase font-bold text-gray-400 mb-1 block">Filter by Company</Label>
                    <ScopedCompanySelect
                        value={selectedCompany === "all" ? "" : selectedCompany}
                        onChange={(entityId) => setSelectedCompany(entityId || "all")}
                        showAllOption={!isCompanyLocked}
                        className="h-10"
                    />
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                onEditClick={handleEditClick}
                onDelete={handleDelete}
                showColumnCustomizer={false}
                isLoading={loading}
                enableSelection={true}
                enableDrag={true}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{isEditing ? "Edit Group" : "Create New Group"}</SheetTitle>
                        <SheetDescription>
                            {isEditing ? "Update existing group details." : "Define a new group."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nameEn">Group Name (English)</Label>
                                <Input
                                    id="nameEn"
                                    value={currentGroup.nameEn || ""}
                                    onChange={e => setCurrentGroup(prev => ({ ...prev, nameEn: e.target.value }))}
                                    placeholder="e.g. Production Group A"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <NativeSelect
                                    id="companyName"
                                    value={currentGroup.companyId || ""}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        const comp = companies.find(c => c.id === id);
                                        setCurrentGroup(prev => ({
                                            ...prev,
                                            companyId: id,
                                            companyName: comp?.companyNameEn
                                        }))
                                    }}
                                    required
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.companyNameEn}</option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nameBn">Group Name (Bangla)</Label>
                                <Input
                                    id="nameBn"
                                    value={currentGroup.nameBn || ""}
                                    onChange={e => setCurrentGroup(prev => ({ ...prev, nameBn: e.target.value }))}
                                    placeholder="e.g. উৎপাদন গ্রুপ এ"
                                    className="font-sutonny text-lg"
                                />
                            </div>
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">{isEditing ? "Update Group" : "Create Group"}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
