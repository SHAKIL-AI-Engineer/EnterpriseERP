"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconHierarchy2,
    IconWorld,
    IconMapPin,
    IconBuildingCommunity,
    IconHome2,
    IconMailbox,
    IconPlus,
    IconLoader,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
    addressService,
    parseOptionalEntityId,
    Country,
    Division,
    District,
    Thana,
    PostOffice,
} from "@/lib/services/address"
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

export default function AddressManagementPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = React.useState("country")
    const [isLoading, setIsLoading] = React.useState(true)

    // Data states
    const [countries, setCountries] = React.useState<Country[]>([])
    const [divisions, setDivisions] = React.useState<Division[]>([])
    const [districts, setDistricts] = React.useState<District[]>([])
    const [thanas, setThanas] = React.useState<Thana[]>([])
    const [postOffices, setPostOffices] = React.useState<PostOffice[]>([])

    // Selection states for filtering
    const [selectedCountryId, setSelectedCountryId] = React.useState<string>("all")
    const [selectedDivisionId, setSelectedDivisionId] = React.useState<string>("all")
    const [selectedDistrictId, setSelectedDistrictId] = React.useState<string>("all")
    const [selectedThanaId, setSelectedThanaId] = React.useState<string>("all")

    // CRUD Modal states
    const [isCountryModalOpen, setIsCountryModalOpen] = React.useState(false)
    const [isDivisionModalOpen, setIsDivisionModalOpen] = React.useState(false)
    const [isDistrictModalOpen, setIsDistrictModalOpen] = React.useState(false)
    const [isThanaModalOpen, setIsThanaModalOpen] = React.useState(false)
    const [isPostOfficeModalOpen, setIsPostOfficeModalOpen] = React.useState(false)

    const [editingItem, setEditingItem] = React.useState<any>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Delete Alert state (Removed redundant state to avoid double confirm dialog)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [countriesData] = await Promise.all([
                addressService.getCountries()
            ])
            setCountries(countriesData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load address data")
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
                if (activeTab === "division") {
                    const cId = selectedCountryId === "all" ? undefined : parseOptionalEntityId(selectedCountryId)
                    const data = await addressService.getDivisions(cId)
                    setDivisions(data)
                } else if (activeTab === "district") {
                    const dId = selectedDivisionId === "all" ? undefined : parseOptionalEntityId(selectedDivisionId)
                    const data = await addressService.getDistricts(dId)
                    setDistricts(data)
                } else if (activeTab === "thana") {
                    const dId = selectedDistrictId === "all" ? undefined : parseOptionalEntityId(selectedDistrictId)
                    const data = await addressService.getThanas(dId)
                    setThanas(data)
                } else if (activeTab === "postoffice") {
                    const tId = selectedThanaId === "all" ? undefined : parseOptionalEntityId(selectedThanaId)
                    const data = await addressService.getPostOffices(tId != null ? { upazilaId: tId } : undefined)
                    setPostOffices(data)
                }
            } catch (error) {
                console.error(error)
                toast.error("Failed to load address data")
            }
        }
        fetchRelated()
    }, [activeTab, selectedCountryId, selectedDivisionId, selectedDistrictId, selectedThanaId])

    // --- CRUD Handlers ---

    const handleSaveCountry = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("nameEn") as string
        const code = (formData.get("code") as string).trim().toUpperCase()

        try {
            if (editingItem) {
                await addressService.updateCountry(editingItem.id, { nameEn, nameBn: editingItem.nameBn, code })
                toast.success("Country updated")
            } else {
                await addressService.createCountry({ nameEn, code })
                toast.success("Country created")
            }
            setIsCountryModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save country")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveDivision = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const countryId = formData.get("countryId") as string

        try {
            if (editingItem) {
                await addressService.updateDivision(editingItem.id, { nameEn: name, countryId })
                toast.success("Division updated")
            } else {
                await addressService.createDivision({ nameEn: name, countryId })
                toast.success("Division created")
            }
            setIsDivisionModalOpen(false)
            const data = await addressService.getDivisions(selectedCountryId === "all" ? undefined : parseOptionalEntityId(selectedCountryId))
            setDivisions(data)
        } catch (error) {
            toast.error("Failed to save division")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveDistrict = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const divisionId = formData.get("divisionId") as string

        try {
            if (editingItem) {
                await addressService.updateDistrict(editingItem.id, { nameEn: name, divisionId })
                toast.success("District updated")
            } else {
                await addressService.createDistrict({ nameEn: name, divisionId })
                toast.success("District created")
            }
            setIsDistrictModalOpen(false)
            const data = await addressService.getDistricts(selectedDivisionId === "all" ? undefined : parseOptionalEntityId(selectedDivisionId))
            setDistricts(data)
        } catch (error) {
            toast.error("Failed to save district")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveThana = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name") as string
        const districtId = formData.get("districtId") as string

        try {
            if (editingItem) {
                await addressService.updateThana(editingItem.id, { nameEn: name, districtId })
                toast.success("Thana updated")
            } else {
                await addressService.createThana({ nameEn: name, districtId })
                toast.success("Thana created")
            }
            setIsThanaModalOpen(false)
            const data = await addressService.getThanas(selectedDistrictId === "all" ? undefined : parseOptionalEntityId(selectedDistrictId))
            setThanas(data)
        } catch (error) {
            toast.error("Failed to save thana")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSavePostOffice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        const nameEn = formData.get("name") as string
        const postalCode = formData.get("postalCode") as string
        const upazilaId = formData.get("upazilaId") as string

        try {
            if (editingItem) {
                await addressService.updatePostOffice(editingItem.id, { nameEn, postalCode, upazilaId })
                toast.success("Post Office updated")
            } else {
                await addressService.createPostOffice({ nameEn, postalCode, upazilaId })
                toast.success("Post Office created")
            }
            setIsPostOfficeModalOpen(false)
            const filterUpazilaId = parseOptionalEntityId(selectedThanaId)
            const data = await addressService.getPostOffices(
                filterUpazilaId ? { upazilaId: filterUpazilaId } : undefined,
            )
            setPostOffices(data)
        } catch (error) {
            toast.error("Failed to save post office")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string, type: string) => {
        try {
            if (type === "country") await addressService.deleteCountry(id)
            else if (type === "division") await addressService.deleteDivision(id)
            else if (type === "district") await addressService.deleteDistrict(id)
            else if (type === "thana") await addressService.deleteThana(id)
            else if (type === "postoffice") await addressService.deletePostOffice(id)

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`)

            // Reload current view
            if (type === "country") fetchData()
            else if (type === "division") {
                const data = await addressService.getDivisions(selectedCountryId === "all" ? undefined : parseOptionalEntityId(selectedCountryId))
                setDivisions(data)
            }
            else if (type === "district") {
                const data = await addressService.getDistricts(selectedDivisionId === "all" ? undefined : parseOptionalEntityId(selectedDivisionId))
                setDistricts(data)
            }
            else if (type === "thana") {
                const data = await addressService.getThanas(selectedDistrictId === "all" ? undefined : parseOptionalEntityId(selectedDistrictId))
                setThanas(data)
            }
            else if (type === "postoffice") {
                const data = await addressService.getPostOffices(
                    parseOptionalEntityId(selectedThanaId)
                        ? { upazilaId: parseOptionalEntityId(selectedThanaId)! }
                        : undefined,
                )
                setPostOffices(data)
            }

        } catch (error) {
            toast.error("Failed to delete item")
        }
    }

    // --- Columns ---
    const countryColumns: ColumnDef<Country>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
            size: 40,
        },
        { accessorKey: "nameEn", header: "Country Name" },
        { accessorKey: "code", header: "Code" },
    ]

    const divisionColumns: ColumnDef<Division>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
            size: 40,
        },
        { accessorKey: "nameEn", header: "Division Name" },
        { accessorKey: "countryName", header: "Country" },
    ]

    const districtColumns: ColumnDef<District>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
            size: 40,
        },
        { accessorKey: "nameEn", header: "District Name" },
        { accessorKey: "divisionName", header: "Division" },
    ]

    const thanaColumns: ColumnDef<Thana>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
            size: 40,
        },
        { accessorKey: "nameEn", header: "Thana Name" },
        { accessorKey: "districtName", header: "District" },
    ]

    const postOfficeColumns: ColumnDef<PostOffice>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-center font-medium">{row.index + 1}</div>,
            size: 40,
        },
        { accessorKey: "nameEn", header: "Post Office Name" },
        { accessorKey: "code", header: "Post Code" },
        { accessorKey: "thanaName", header: "Thana" },
    ]

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-muted/20 min-h-screen">
            <div className="flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <IconHierarchy2 className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Address Management</h1>
                        <p className="text-sm text-muted-foreground">Manage geographical structure.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchData()}>
                        <IconLoader className={cn("size-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="px-4 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                    <div className="flex justify-center flex-col items-center">
                        <div className="bg-card p-0 rounded-full border shadow-sm sticky top-4 z-20 w-full max-w-5xl mx-auto flex items-center h-[44px] overflow-hidden">
                            <TabsList className="flex w-full h-full p-0 bg-transparent gap-0">
                                {[
                                    { val: "country", icon: IconWorld, label: "Country" },
                                    { val: "division", icon: IconMapPin, label: "Division" },
                                    { val: "district", icon: IconBuildingCommunity, label: "District" },
                                    { val: "thana", icon: IconHome2, label: "Thana" },
                                    { val: "postoffice", icon: IconMailbox, label: "Post Office" },
                                ].map((t) => (
                                    <TabsTrigger
                                        key={t.val}
                                        value={t.val}
                                        className="flex-1 h-full rounded-full data-[state=active]:bg-[#108545] data-[state=active]:text-white transition-all duration-300 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium p-0"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <t.icon className="size-4.5" />
                                            <span className="text-sm leading-none">{t.label}</span>
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    </div>

                    <Card className="border-muted/40 shadow-xl overflow-hidden rounded-3xl bg-background/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/30 border-b pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Address Data</CardTitle>
                                    <CardDescription>View and manage {activeTab} information.</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    className="rounded-full bg-[#108545] hover:bg-[#0d6e39] text-white shadow-md gap-2 px-4 h-9"
                                    onClick={() => {
                                        setEditingItem(null)
                                        if (activeTab === "country") setIsCountryModalOpen(true)
                                        else if (activeTab === "division") setIsDivisionModalOpen(true)
                                        else if (activeTab === "district") setIsDistrictModalOpen(true)
                                        else if (activeTab === "thana") setIsThanaModalOpen(true)
                                        else if (activeTab === "postoffice") setIsPostOfficeModalOpen(true)
                                    }}
                                >
                                    <IconPlus className="size-4" />
                                    <span>Add {activeTab === "postoffice" ? "Post Office" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Filter Bar */}
                            {(activeTab !== "country") && (
                                <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 items-end">
                                    {activeTab === "division" && (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <Label className="text-xs font-medium text-muted-foreground">Country Filter</Label>
                                            <NativeSelect
                                                value={selectedCountryId}
                                                onChange={(e) => setSelectedCountryId(e.target.value)}
                                            >
                                                <option value="all">All Countries</option>
                                                {countries.map(c => (
                                                    <option key={c.id} value={c.id.toString()}>{c.nameEn}</option>
                                                ))}
                                            </NativeSelect>
                                        </div>
                                    )}
                                    {activeTab === "district" && (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <Label className="text-xs font-medium text-muted-foreground">Division Filter</Label>
                                            <NativeSelect
                                                value={selectedDivisionId}
                                                onChange={(e) => setSelectedDivisionId(e.target.value)}
                                            >
                                                <option value="all">All Divisions</option>
                                                {divisions.map(d => (
                                                    <option key={d.id} value={d.id.toString()}>{d.nameEn}</option>
                                                ))}
                                            </NativeSelect>
                                        </div>
                                    )}
                                    {activeTab === "thana" && (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <Label className="text-xs font-medium text-muted-foreground">District Filter</Label>
                                            <NativeSelect
                                                value={selectedDistrictId}
                                                onChange={(e) => setSelectedDistrictId(e.target.value)}
                                            >
                                                <option value="all">All Districts</option>
                                                {districts.map(d => (
                                                    <option key={d.id} value={d.id.toString()}>{d.nameEn}</option>
                                                ))}
                                            </NativeSelect>
                                        </div>
                                    )}
                                    {activeTab === "postoffice" && (
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                            <Label className="text-xs font-medium text-muted-foreground">Thana Filter</Label>
                                            <NativeSelect
                                                value={selectedThanaId}
                                                onChange={(e) => setSelectedThanaId(e.target.value)}
                                            >
                                                <option value="all">All Thanas</option>
                                                {thanas.map(t => (
                                                    <option key={t.id} value={t.id.toString()}>{t.nameEn}</option>
                                                ))}
                                            </NativeSelect>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="px-1">
                                <TabsContent value="country" className="m-0">
                                    <DataTable
                                        data={countries}
                                        columns={countryColumns}
                                        showTabs={false}
                                        isLoading={isLoading}
                                        enableSelection={true}
                                        enableDrag={true}
                                        onEditClick={(item) => { setEditingItem(item); setIsCountryModalOpen(true); }}
                                        onDelete={(item: any) => handleDelete(item.id, "country")}
                                    />
                                </TabsContent>
                                <TabsContent value="division" className="m-0">
                                    <DataTable
                                        data={divisions}
                                        columns={divisionColumns}
                                        showTabs={false}
                                        isLoading={isLoading}
                                        enableSelection={true}
                                        enableDrag={true}
                                        onEditClick={(item) => { setEditingItem(item); setIsDivisionModalOpen(true); }}
                                        onDelete={(item: any) => handleDelete(item.id, "division")}
                                    />
                                </TabsContent>
                                <TabsContent value="district" className="m-0">
                                    <DataTable
                                        data={districts}
                                        columns={districtColumns}
                                        showTabs={false}
                                        isLoading={isLoading}
                                        enableSelection={true}
                                        enableDrag={true}
                                        onEditClick={(item) => { setEditingItem(item); setIsDistrictModalOpen(true); }}
                                        onDelete={(item: any) => handleDelete(item.id, "district")}
                                    />
                                </TabsContent>
                                <TabsContent value="thana" className="m-0">
                                    <DataTable
                                        data={thanas}
                                        columns={thanaColumns}
                                        showTabs={false}
                                        isLoading={isLoading}
                                        enableSelection={true}
                                        enableDrag={true}
                                        onEditClick={(item) => { setEditingItem(item); setIsThanaModalOpen(true); }}
                                        onDelete={(item: any) => handleDelete(item.id, "thana")}
                                    />
                                </TabsContent>
                                <TabsContent value="postoffice" className="m-0">
                                    <DataTable
                                        data={postOffices}
                                        columns={postOfficeColumns}
                                        showTabs={false}
                                        isLoading={isLoading}
                                        enableSelection={true}
                                        enableDrag={true}
                                        onEditClick={(item) => { setEditingItem(item); setIsPostOfficeModalOpen(true); }}
                                        onDelete={(item: any) => handleDelete(item.id, "postoffice")}
                                    />
                                </TabsContent>
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>

            {/* --- Modals --- */}

            {/* Country Modal */}
            <Dialog open={isCountryModalOpen} onOpenChange={setIsCountryModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveCountry}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Country" : "New Country"}</DialogTitle>
                            <DialogDescription>Add a country to your address book.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="country-name">Country Name</Label>
                                <Input id="country-name" name="nameEn" defaultValue={editingItem?.nameEn} placeholder="e.g. Bangladesh" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country-code">Code (ISO)</Label>
                                <Input
                                    id="country-code"
                                    name="code"
                                    defaultValue={editingItem?.code}
                                    placeholder="e.g. BD"
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsCountryModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Country"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Division Modal */}
            <Dialog open={isDivisionModalOpen} onOpenChange={setIsDivisionModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveDivision}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Division" : "New Division"}</DialogTitle>
                            <DialogDescription>Create a division under a country.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="div-country">Country</Label>
                                <NativeSelect id="div-country" name="countryId" defaultValue={editingItem?.countryId} required>
                                    <option value="">Select Country</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="div-name">Division Name</Label>
                                <Input id="div-name" name="name" defaultValue={editingItem?.nameEn} placeholder="e.g. Dhaka" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDivisionModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Division"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* District Modal */}
            <Dialog open={isDistrictModalOpen} onOpenChange={setIsDistrictModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveDistrict}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit District" : "New District"}</DialogTitle>
                            <DialogDescription>Create a district under a division.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dist-div">Division</Label>
                                <NativeSelect id="dist-div" name="divisionId" defaultValue={editingItem?.divisionId} required>
                                    <option value="">Select Division</option>
                                    {divisions.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dist-name">District Name</Label>
                                <Input id="dist-name" name="name" defaultValue={editingItem?.nameEn} placeholder="e.g. Gazipur" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDistrictModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save District"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Thana Modal */}
            <Dialog open={isThanaModalOpen} onOpenChange={setIsThanaModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSaveThana}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Thana" : "New Thana"}</DialogTitle>
                            <DialogDescription>Create a thana under a district.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="thana-dist">District</Label>
                                <NativeSelect id="thana-dist" name="districtId" defaultValue={editingItem?.districtId} required>
                                    <option value="">Select District</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="thana-name">Thana Name</Label>
                                <Input id="thana-name" name="name" defaultValue={editingItem?.nameEn} placeholder="e.g. Tongi" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsThanaModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Thana"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Post Office Modal */}
            <Dialog open={isPostOfficeModalOpen} onOpenChange={setIsPostOfficeModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSavePostOffice}>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit Post Office" : "New Post Office"}</DialogTitle>
                            <DialogDescription>Create a post office under a thana.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="po-thana">Thana</Label>
                                <NativeSelect id="po-thana" name="upazilaId" defaultValue={editingItem?.upazilaId} required>
                                    <option value="">Select Thana</option>
                                    {thanas.map(t => <option key={t.id} value={t.id}>{t.nameEn}</option>)}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="po-name">Post Office Name</Label>
                                <Input id="po-name" name="name" defaultValue={editingItem?.nameEn} placeholder="e.g. Tongi College Gate" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="po-code">Post Code</Label>
                                <Input id="po-code" name="postalCode" defaultValue={editingItem?.postalCode ?? editingItem?.code} placeholder="e.g. 1711" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsPostOfficeModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Post Office"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    )
}
