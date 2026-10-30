"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconCloudDownload,
    IconDeviceDesktop,
    IconInfoCircle,
    IconLoader2,
    IconPlugConnected,
    IconPlugConnectedX,
    IconPlus,
    IconRefresh,
    IconRouter,
    IconStack2,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { PunchCompanySelect } from "@/components/punch-data/punch-company-select"
import { PunchStatusBadge } from "@/components/punch-data/punch-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    punchDataService,
    type CreatePunchMachinePayload,
    type DeviceSyncHistory,
    type PunchMachine,
} from "@/lib/services/punch-data"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

function formatDateTime(value?: string | null): string {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

const defaultMachineForm = {
    deviceCode: "",
    deviceName: "",
    machineNo: "",
    ipAddress: "",
    port: "4370",
    useTcp: false,
    password: "0",
}

export default function PunchMachinesPage() {
    const { user, loading: authLoading } = useAuth()
    const [companyEntityId, setCompanyEntityId] = React.useState("")
    const [punchCompanyId, setPunchCompanyId] = React.useState(1)
    const [machines, setMachines] = React.useState<PunchMachine[]>([])
    const [histories, setHistories] = React.useState<DeviceSyncHistory[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [busyMachineId, setBusyMachineId] = React.useState<string | null>(null)
    const [addOpen, setAddOpen] = React.useState(false)
    const [bulkOpen, setBulkOpen] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [form, setForm] = React.useState(defaultMachineForm)
    const [bulkJson, setBulkJson] = React.useState("")

    const loadData = React.useCallback(async () => {
        if (!punchCompanyId) return
        setIsLoading(true)
        try {
            const [machinePage, historyPage] = await Promise.all([
                punchDataService.listMachines({ companyId: punchCompanyId, page: 1, pageSize: 100 }),
                punchDataService.listSyncHistories({ companyId: punchCompanyId, page: 1, pageSize: 20 }),
            ])
            setMachines(machinePage.items)
            setHistories(historyPage.items)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Failed to load devices")
            setMachines([])
            setHistories([])
        } finally {
            setIsLoading(false)
        }
    }, [punchCompanyId])

    React.useEffect(() => {
        if (authLoading || !user || !companyEntityId) return
        void loadData()
    }, [authLoading, user, companyEntityId, loadData])

    const stats = React.useMemo(() => {
        const connected = machines.filter(
            (m) =>
                m.lastConnectionStatus?.toLowerCase().includes("connected") &&
                !m.lastConnectionStatus?.toLowerCase().includes("dis"),
        ).length
        const active = machines.filter((m) => m.isActive).length
        const lastSync = machines
            .map((m) => m.lastSyncedAt)
            .filter(Boolean)
            .sort()
            .pop()
        return { total: machines.length, connected, active, lastSync }
    }, [machines])

    const handleTest = async (machine: PunchMachine) => {
        setBusyMachineId(machine.id)
        try {
            const result = await punchDataService.testConnection(machine.id)
            toast[result.connected ? "success" : "error"](
                `${machine.deviceName}: ${result.connected ? "device is online" : "connection failed"}`,
            )
            await loadData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Connection test failed")
            await loadData()
        } finally {
            setBusyMachineId(null)
        }
    }

    const reSaveAsUdp = async (machine: PunchMachine) => {
        setBusyMachineId(machine.id)
        try {
            await punchDataService.saveMachine({
                companyId: machine.companyId,
                deviceCode: machine.deviceCode,
                deviceName: machine.deviceName,
                machineNo: machine.machineNo,
                ipAddress: machine.ipAddress,
                port: machine.port,
                useTcp: false,
                password: 0,
                isActive: machine.isActive,
            })
            toast.success(`${machine.deviceName} updated to UDP mode`)
            await loadData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update device")
        } finally {
            setBusyMachineId(null)
        }
    }

    const handleSync = async (machine: PunchMachine, useRemote = false) => {
        setBusyMachineId(machine.id)
        try {
            const result = await punchDataService.syncMachine(machine.id, { useRemote })
            const h = result.history
            toast.success(
                `${useRemote ? "Remote" : "LAN"} sync ${machine.deviceName}: ${h.newLogs} new, ${h.duplicateLogs} duplicate`,
            )
            await loadData()
        } catch (error) {
            const message = error instanceof Error ? error.message : "Sync failed"
            toast.error(
                message.toLowerCase().includes("rwb")
                    ? "LAN bulk read not supported by this firmware. Try Remote collect or Use UDP."
                    : message,
            )
            await loadData()
        } finally {
            setBusyMachineId(null)
        }
    }

    const handleSaveMachine = async () => {
        const machineNo = parseInt(form.machineNo, 10)
        const port = parseInt(form.port, 10)
        if (!form.deviceCode.trim() || !form.deviceName.trim() || !form.ipAddress.trim()) {
            toast.error("Device code, name, and IP are required")
            return
        }
        if (!Number.isFinite(machineNo) || machineNo <= 0) {
            toast.error("Machine number must be a positive integer")
            return
        }
        if (!Number.isFinite(port) || port <= 0) {
            toast.error("Port must be a positive integer")
            return
        }

        setIsSaving(true)
        try {
            const commPassword = parseInt(form.password, 10)
            await punchDataService.saveMachine({
                companyId: punchCompanyId,
                deviceCode: form.deviceCode.trim(),
                deviceName: form.deviceName.trim(),
                machineNo,
                ipAddress: form.ipAddress.trim(),
                port,
                useTcp: form.useTcp,
                password: Number.isFinite(commPassword) ? commPassword : 0,
                isActive: true,
            })
            toast.success("Device saved")
            setAddOpen(false)
            setForm(defaultMachineForm)
            await loadData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save device")
        } finally {
            setIsSaving(false)
        }
    }

    const handleBulkSave = async () => {
        setIsSaving(true)
        try {
            const parsed = JSON.parse(bulkJson) as { machines?: CreatePunchMachinePayload[] } | CreatePunchMachinePayload[]
            const list = Array.isArray(parsed) ? parsed : parsed.machines
            if (!list?.length) {
                toast.error("Provide a JSON array or { machines: [...] }")
                return
            }
            const withCompany = list.map((m) => ({ ...m, companyId: m.companyId || punchCompanyId }))
            await punchDataService.saveMachinesBulk(withCompany)
            toast.success(`Registered ${withCompany.length} device(s)`)
            setBulkOpen(false)
            setBulkJson("")
            await loadData()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Invalid JSON or bulk save failed")
        } finally {
            setIsSaving(false)
        }
    }

    const machineColumns: ColumnDef<PunchMachine>[] = [
        {
            accessorKey: "deviceName",
            header: "Device",
            cell: ({ row }) => (
                <div className="min-w-[140px]">
                    <p className="text-sm font-semibold">{row.original.deviceName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.original.deviceCode}</p>
                </div>
            ),
        },
        {
            id: "endpoint",
            header: "LAN",
            cell: ({ row }) => (
                <div className="text-xs font-mono tabular-nums">
                    <p>
                        {row.original.ipAddress}:{row.original.port}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                        {row.original.useTcp ? "TCP" : "UDP"}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: "lastConnectionStatus",
            header: "Status",
            cell: ({ row }) => (
                <PunchStatusBadge status={row.original.lastConnectionStatus || "Unknown"} variant="connection" />
            ),
        },
        {
            accessorKey: "lastSyncedAt",
            header: "Last Sync",
            cell: ({ row }) => (
                <div className="text-xs">
                    <p>{formatDateTime(row.original.lastSyncedAt)}</p>
                    {row.original.lastSyncRecordCount > 0 && (
                        <p className="text-muted-foreground">{row.original.lastSyncRecordCount} records</p>
                    )}
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const busy = busyMachineId === row.original.id
                return (
                    <div className="flex flex-wrap justify-end gap-1" data-no-row-click="true">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            disabled={busy || !row.original.isActive}
                            onClick={() => handleTest(row.original)}
                        >
                            {busy ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconRouter className="size-3.5" />}
                            Test
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            disabled={busy || !row.original.isActive}
                            onClick={() => handleSync(row.original, false)}
                        >
                            {busy ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconCloudDownload className="size-3.5" />}
                            Collect
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[10px] px-2"
                            disabled={busy || !row.original.isActive}
                            onClick={() => handleSync(row.original, true)}
                        >
                            Remote
                        </Button>
                        {row.original.useTcp && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-[10px] px-2"
                                disabled={busy}
                                onClick={() => reSaveAsUdp(row.original)}
                            >
                                UDP
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    const historyColumns: ColumnDef<DeviceSyncHistory>[] = [
        {
            accessorKey: "syncStartedAt",
            header: "Started",
            cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.syncStartedAt)}</span>,
        },
        {
            accessorKey: "triggerType",
            header: "Trigger",
            cell: ({ row }) => (
                <span className="text-[10px] uppercase font-medium text-muted-foreground">
                    {row.original.triggerType}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Result",
            cell: ({ row }) => <PunchStatusBadge status={row.original.status} variant="sync" />,
        },
        {
            id: "counts",
            header: "Punches",
            cell: ({ row }) => (
                <span className="text-xs tabular-nums">
                    <span className="text-emerald-700 font-semibold">{row.original.newLogs}</span> new /{" "}
                    {row.original.totalLogs} total
                </span>
            ),
        },
        {
            accessorKey: "errorMessage",
            header: "Message",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                    {row.original.errorMessage || "—"}
                </span>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <IconDeviceDesktop className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Punch Machines</h1>
                        <p className="text-sm text-muted-foreground">
                            ZKTeco LAN devices — test connection and collect punches
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2" onClick={loadData} disabled={isLoading}>
                        {isLoading ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                        Refresh
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)}>
                        <IconStack2 className="size-4" />
                        Bulk register
                    </Button>
                    <Button className="gap-2" onClick={() => setAddOpen(true)}>
                        <IconPlus className="size-4" />
                        Add device
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                    <PunchCompanySelect
                        value={companyEntityId}
                        onValueChange={(entityId, punchId) => {
                            setCompanyEntityId(entityId)
                            setPunchCompanyId(punchId)
                        }}
                    />
                </CardContent>
            </Card>

            {stats.connected === 0 && stats.total > 0 && (
                <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
                    <CardContent className="flex gap-3 p-4 text-sm text-amber-950">
                        <IconInfoCircle className="size-5 shrink-0 mt-0.5" />
                        <p>
                            PunchDataService (port 5050) must reach devices on LAN. Use <strong>Test</strong> first,
                            then <strong>Collect</strong>. If LAN fails, try <strong>Remote</strong> when cloud ZKTeco
                            SQL is configured.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Devices" value={stats.total} icon={IconDeviceDesktop} />
                <StatCard title="Online" value={stats.connected} icon={IconPlugConnected} accent="text-emerald-600" />
                <StatCard title="Active" value={stats.active} icon={IconPlugConnectedX} />
                <StatCard
                    title="Last Sync"
                    value={stats.lastSync ? format(new Date(stats.lastSync), "dd MMM HH:mm") : "—"}
                    icon={IconCloudDownload}
                    small
                />
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-base font-bold">Registered machines</CardTitle>
                    <CardDescription>Per-device LAN collect and optional remote fallback sync</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={machines}
                        columns={machineColumns}
                        showActions={false}
                        showTabs={false}
                        searchKey="deviceName"
                        isLoading={isLoading}
                        getRowId={(row) => row.id}
                    />
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b pb-4">
                    <CardTitle className="text-base font-bold">Sync history</CardTitle>
                    <CardDescription>Recent device sync attempts</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={histories}
                        columns={historyColumns}
                        showActions={false}
                        showTabs={false}
                        searchKey="status"
                        isLoading={isLoading}
                        getRowId={(row) => row.id}
                    />
                </CardContent>
            </Card>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Register punch device</DialogTitle>
                        <DialogDescription>Saves to PunchData for company {punchCompanyId}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <div className="space-y-1.5">
                            <Label>Device code</Label>
                            <Input
                                value={form.deviceCode}
                                onChange={(e) => setForm((f) => ({ ...f, deviceCode: e.target.value }))}
                                placeholder="101"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Device name</Label>
                            <Input
                                value={form.deviceName}
                                onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))}
                                placeholder="Gate IN"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Machine no</Label>
                                <Input
                                    value={form.machineNo}
                                    onChange={(e) => setForm((f) => ({ ...f, machineNo: e.target.value }))}
                                    placeholder="1"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Port</Label>
                                <Input
                                    value={form.port}
                                    onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                                    placeholder="4370"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>IP address</Label>
                            <Input
                                value={form.ipAddress}
                                onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                                placeholder="192.168.1.201"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Comm. password</Label>
                                <Input
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex items-end gap-2 pb-2">
                                <input
                                    id="useTcp"
                                    type="checkbox"
                                    checked={form.useTcp}
                                    onChange={(e) => setForm((f) => ({ ...f, useTcp: e.target.checked }))}
                                    className="size-4 rounded border-input"
                                />
                                <Label htmlFor="useTcp" className="text-sm font-normal cursor-pointer">
                                    Use TCP (off = UDP, recommended for F18)
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveMachine} disabled={isSaving}>
                            {isSaving ? <IconLoader2 className="size-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Bulk register devices</DialogTitle>
                        <DialogDescription>
                            JSON array or {"{ machines: [...] }"}. companyId defaults to {punchCompanyId}.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        className="min-h-[200px] font-mono text-xs"
                        value={bulkJson}
                        onChange={(e) => setBulkJson(e.target.value)}
                        placeholder={'{\n  "machines": [\n    { "deviceCode": "101", "deviceName": "Gate", "machineNo": 1, "ipAddress": "192.168.1.1", "port": 4370 }\n  ]\n}'}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkSave} disabled={isSaving}>
                            {isSaving ? <IconLoader2 className="size-4 animate-spin" /> : "Save all"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StatCard({
    title,
    value,
    icon: Icon,
    accent,
    small,
}: {
    title: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    accent?: string
    small?: boolean
}) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${accent ?? ""}`}>
                    <Icon className="size-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
                    <p className={`font-bold tabular-nums ${small ? "text-sm" : "text-2xl"}`}>{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
