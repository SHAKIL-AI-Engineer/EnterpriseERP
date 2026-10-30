"use client"

import * as React from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { IconLoader2, IconPlus, IconRefresh, IconUsers } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DataTable } from "@/components/data-table"
import { PunchCompanySelect } from "@/components/punch-data/punch-company-select"
import { PunchDateRangeFilter, punchRangeToIso } from "@/components/punch-data/punch-date-range-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { punchDataService, type PunchRecord } from "@/lib/services/punch-data"
import { toast } from "sonner"

function formatDateTime(value?: string | null): string {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

export default function PunchRecordsPage() {
    const [companyEntityId, setCompanyEntityId] = React.useState("")
    const [punchCompanyId, setPunchCompanyId] = React.useState(1)
    const [range, setRange] = React.useState<DateRange | undefined>()
    const [rangeIso, setRangeIso] = React.useState(punchRangeToIso(undefined))
    const [punchNumber, setPunchNumber] = React.useState("")
    const [deviceId, setDeviceId] = React.useState("")
    const [logFileId, setLogFileId] = React.useState("")
    const [rows, setRows] = React.useState<PunchRecord[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [manualOpen, setManualOpen] = React.useState(false)
    const [manualPunch, setManualPunch] = React.useState({ punchNumber: "", deviceId: "", punchTime: "", source: "Manual" })
    const [saving, setSaving] = React.useState(false)

    const loadPunches = React.useCallback(async () => {
        if (!punchCompanyId) return
        setIsLoading(true)
        try {
            const pn = parseInt(punchNumber, 10)
            const page = await punchDataService.getPunches({
                companyId: punchCompanyId,
                punchNumber: Number.isFinite(pn) && pn > 0 ? pn : undefined,
                deviceId: deviceId || undefined,
                logFileId: logFileId || undefined,
                from: rangeIso.fromIso,
                to: rangeIso.toIso,
                page: 1,
                pageSize: 200,
            })
            setRows(page.items)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load punches")
            setRows([])
        } finally {
            setIsLoading(false)
        }
    }, [punchCompanyId, punchNumber, deviceId, logFileId, rangeIso.fromIso, rangeIso.toIso])

    React.useEffect(() => {
        if (companyEntityId && rangeIso.fromIso) loadPunches()
    }, [companyEntityId, rangeIso.fromIso, rangeIso.toIso, loadPunches])

    const handleManual = async () => {
        const pn = parseInt(manualPunch.punchNumber, 10)
        if (!Number.isFinite(pn) || pn <= 0) {
            toast.error("Valid punch number required")
            return
        }
        setSaving(true)
        try {
            const result = await punchDataService.createManualPunch({
                companyId: punchCompanyId,
                punchNumber: pn,
                deviceId: manualPunch.deviceId || undefined,
                punchTime: manualPunch.punchTime || undefined,
                source: manualPunch.source || "Manual",
            })
            if (result.duplicate) {
                toast.warning("Duplicate punch — not inserted")
            } else {
                toast.success("Manual punch saved")
            }
            setManualOpen(false)
            setManualPunch({ punchNumber: "", deviceId: "", punchTime: "", source: "Manual" })
            await loadPunches()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save punch")
        } finally {
            setSaving(false)
        }
    }

    const columns: ColumnDef<PunchRecord>[] = [
        { accessorKey: "punchNumber", header: "Punch #" },
        { accessorKey: "deviceId", header: "Device" },
        {
            accessorKey: "punchTime",
            header: "Punch time",
            cell: ({ row }) => formatDateTime(row.original.punchTime),
        },
        { accessorKey: "source", header: "Source" },
        {
            accessorKey: "logFileId",
            header: "Log file",
            cell: ({ row }) => (
                <Link
                    href={`/management/data-process/log-files?log=${row.original.logFileId}`}
                    className="text-xs font-mono text-primary hover:underline truncate max-w-[120px] block"
                >
                    {row.original.logFileId.slice(0, 8)}…
                </Link>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <IconUsers className="size-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Punch Records</h1>
                        <p className="text-sm text-muted-foreground">Normalized raw punches in PunchDataDB</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadPunches} disabled={isLoading}>
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button onClick={() => setManualOpen(true)} className="gap-2">
                        <IconPlus className="size-4" />
                        Manual punch
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <PunchCompanySelect
                        value={companyEntityId}
                        onValueChange={(entityId, punchId) => {
                            setCompanyEntityId(entityId)
                            setPunchCompanyId(punchId)
                        }}
                    />
                    <PunchDateRangeFilter
                        value={range}
                        onChange={(r, iso) => {
                            setRange(r)
                            setRangeIso(iso)
                        }}
                        defaultDays={30}
                    />
                    <div className="space-y-1.5">
                        <Label className="text-xs">Punch number</Label>
                        <Input value={punchNumber} onChange={(e) => setPunchNumber(e.target.value)} placeholder="Badge #" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Device id</Label>
                        <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Log file id</Label>
                        <Input value={logFileId} onChange={(e) => setLogFileId(e.target.value)} placeholder="UUID" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Records</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={rows}
                        columns={columns}
                        showActions={false}
                        showTabs={false}
                        searchKey="punchNumber"
                        isLoading={isLoading}
                        getRowId={(r) => r.id}
                    />
                </CardContent>
            </Card>

            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manual punch</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="space-y-1.5">
                            <Label>Punch number *</Label>
                            <Input
                                value={manualPunch.punchNumber}
                                onChange={(e) => setManualPunch((p) => ({ ...p, punchNumber: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Device id</Label>
                            <Input
                                value={manualPunch.deviceId}
                                onChange={(e) => setManualPunch((p) => ({ ...p, deviceId: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Punch time (ISO, optional)</Label>
                            <Input
                                value={manualPunch.punchTime}
                                onChange={(e) => setManualPunch((p) => ({ ...p, punchTime: e.target.value }))}
                                placeholder="2026-05-13T08:00:00Z"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Source</Label>
                            <Input
                                value={manualPunch.source}
                                onChange={(e) => setManualPunch((p) => ({ ...p, source: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManualOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleManual} disabled={saving}>
                            {saving ? <IconLoader2 className="size-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
