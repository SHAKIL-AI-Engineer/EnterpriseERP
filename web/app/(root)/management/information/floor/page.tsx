"use client"

import * as React from "react"
import { IconBuildingFactory2, IconPlus } from "@tabler/icons-react"
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
import { organogramService, Floor } from "@/lib/services/organogram"
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"

export default function FloorPage() {
    const [data, setData] = React.useState<Floor[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [currentFloor, setCurrentFloor] = React.useState<Partial<Floor>>({})
    const [isEditing, setIsEditing] = React.useState(false)
    const [selectedCompany, setSelectedCompany] = React.useState<string>("all")
    const { companies, isCompanyLocked } = useCompanyFilterScope()

    const fetchFloors = async () => {
        try {
            setLoading(true)
            const companyIdParam =
                selectedCompany !== "all" ? selectedCompany : undefined

            const floors = await organogramService.getFloors({
                companyId: companyIdParam
            })
            setData(floors)
        } catch (error) {
            console.error(error)
            toast.error("Failed to fetch floors")
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchFloors()
    }, [selectedCompany])

    const columns: ColumnDef<Floor>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: "nameEn",
            header: "Floor Name (EN)",
            cell: ({ row }) => <span className="font-medium">{row.getValue("nameEn")}</span>
        },
        {
            accessorKey: "nameBn",
            header: "Floor Name (BN)",
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
        setCurrentFloor({
            nameEn: "",
            nameBn: "",
            companyId: selected?.id,
            companyName: selected?.companyNameEn ?? "",
        })
        setIsSheetOpen(true)
    }

    const handleEditClick = (floor: Floor) => {
        setIsEditing(true)
        setCurrentFloor({ ...floor })
        setIsSheetOpen(true)
    }

    const handleDelete = async (floor: Floor) => {
        try {
            await organogramService.deleteFloor(floor.id)
            toast.success("Floor deleted successfully")
            fetchFloors()
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Failed to delete floor"
            toast.error(message)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const dto = {
                nameEn: currentFloor.nameEn || "",
                nameBn: currentFloor.nameBn,
                companyId: currentFloor.companyId!,
                companyName: currentFloor.companyName,
            }

            if (isEditing && currentFloor.id) {
                await organogramService.updateFloor(currentFloor.id, dto)
                toast.success("Floor updated successfully")
            } else {
                await organogramService.createFloor(dto)
                toast.success("New floor created successfully")
            }
            setIsSheetOpen(false)
            fetchFloors()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save floor")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <IconBuildingFactory2 className="size-6 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight">Floor Management</h1>
                    </div>
                    <p className="text-muted-foreground">Manage factory floors and workspace areas.</p>
                </div>
                <Button className="gap-2" onClick={handleAddClick}>
                    <IconPlus className="size-4" />
                    Create Floor
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
                        <SheetTitle>{isEditing ? "Edit Floor" : "Create New Floor"}</SheetTitle>
                        <SheetDescription>
                            {isEditing ? "Update existing floor details." : "Define a new factory floor."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nameEn">Floor Name (English)</Label>
                                <Input
                                    id="nameEn"
                                    value={currentFloor.nameEn || ""}
                                    onChange={e => setCurrentFloor(prev => ({ ...prev, nameEn: e.target.value }))}
                                    placeholder="e.g. Floor 1"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <NativeSelect
                                    id="companyName"
                                    value={currentFloor.companyId || ""}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        const comp = companies.find(c => c.id === id);
                                        setCurrentFloor(prev => ({
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
                                <Label htmlFor="nameBn">Floor Name (Bangla)</Label>
                                <Input
                                    id="nameBn"
                                    value={currentFloor.nameBn || ""}
                                    onChange={e => setCurrentFloor(prev => ({ ...prev, nameBn: e.target.value }))}
                                    placeholder="e.g. ১ তলা"
                                    className="font-sutonny text-lg"
                                />
                            </div>
                        </div>

                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">{isEditing ? "Update Floor" : "Create Floor"}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
}
