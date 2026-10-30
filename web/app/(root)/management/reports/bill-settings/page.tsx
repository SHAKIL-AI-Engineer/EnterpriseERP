"use client"

import * as React from "react"
import { IconSettings, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { billConfigService, NightBillConfig } from "@/lib/services/bill-config"
import { ManagementLegacyCompanySelect } from "@/components/hr/management-legacy-company-select"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

export default function BillSettingsPage() {
    const [configs, setConfigs] = React.useState<NightBillConfig[]>([])
    const { defaultCompany } = useCompanyFilterScope()
    const [formCompanyId, setFormCompanyId] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(true)
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [editingConfig, setEditingConfig] = React.useState<NightBillConfig | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const configsData = await billConfigService.getNightConfigs()
            setConfigs(configsData)
        } catch (error) {
            toast.error("Failed to load configuration data")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    React.useEffect(() => {
        if (!isModalOpen) return
        if (editingConfig?.companyId) {
            setFormCompanyId(String(editingConfig.companyId))
        } else if (defaultCompany) {
            setFormCompanyId(String(defaultCompany.id))
        } else {
            setFormCompanyId("")
        }
    }, [isModalOpen, editingConfig, defaultCompany])

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        
        const configData: NightBillConfig = {
            id: editingConfig?.id || 0,
            companyId: parseInt(formCompanyId, 10),
            eligibleTimeThreshold: formData.get("eligibleTimeThreshold") as string,
            defaultAmount: parseFloat(formData.get("defaultAmount") as string)
        }

        try {
            await billConfigService.saveNightConfig(configData)
            toast.success("Configuration saved successfully")
            setIsModalOpen(false)
            fetchData()
        } catch (error) {
            toast.error("Failed to save configuration")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this configuration?")) return
        try {
            await billConfigService.deleteNightConfig(id)
            toast.success("Configuration deleted")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete configuration")
        }
    }

    const columns: ColumnDef<NightBillConfig>[] = [
        {
            id: "sl",
            header: "SL",
            cell: ({ row }) => <div className="text-left font-medium">{row.index + 1}</div>,
        },
        { accessorKey: "companyName", header: "Company" },
        { accessorKey: "eligibleTimeThreshold", header: "Night Threshold" },
        { accessorKey: "defaultAmount", header: "Default Amount" },
    ]

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex justify-between items-center border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <IconSettings className="text-primary" /> Bill Configuration
                    </h1>
                    <p className="text-sm text-gray-500">Manage thresholds and rates for automated bill generation</p>
                </div>
                <Button onClick={() => { setEditingConfig(null); setIsModalOpen(true); }} className="gap-2">
                    <IconPlus size={18} /> Add Config
                </Button>
            </div>

            <Card className="border shadow-none">
                <CardHeader>
                    <CardTitle>Night Bill Settings</CardTitle>
                    <CardDescription>Configure rules for Night Bill eligibility and amounts</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={configs}
                        columns={columns}
                        showTabs={false}
                        isLoading={isLoading}
                        onEditClick={(item) => { setEditingConfig(item); setIsModalOpen(true); }}
                        onDelete={(item: any) => handleDelete(item.id)}
                    />
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>{editingConfig ? "Edit Configuration" : "New Configuration"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid gap-2">
                                <Label>Company</Label>
                                <ManagementLegacyCompanySelect
                                    value={formCompanyId || "all"}
                                    onChange={(v) => setFormCompanyId(v === "all" ? "" : v)}
                                    allValue="all"
                                    allOptionLabel="Select company"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Eligible Time Threshold (HH:mm)</Label>
                                <Input name="eligibleTimeThreshold" defaultValue={editingConfig?.eligibleTimeThreshold || "23:45"} placeholder="23:45" required />
                                <p className="text-xs text-muted-foreground">Employees working after this time will be eligible.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Bill Amount</Label>
                                <Input name="defaultAmount" type="number" step="0.01" defaultValue={editingConfig?.defaultAmount || 0} required />
                                <p className="text-xs text-muted-foreground">This amount will be used if designation-wise amount is 0.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
