"use client"

import * as React from "react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import {
    IconCloudDownload,
    IconEye,
    IconLoader2,
    IconRefresh,
    IconServer,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { PunchCompanySelect } from "@/components/punch-data/punch-company-select"
import {
    PunchDateRangeFilter,
    getCurrentMonthToTodayRange,
    punchRangeToIso,
} from "@/components/punch-data/punch-date-range-filter"
import { PunchStatusBadge } from "@/components/punch-data/punch-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    punchDataService,
    type PunchRecord,
    type RemoteCollectHistory,
    type RemoteCollectPreview,
    type RemoteCollectResult,
    type RemoteCollectStatus,
} from "@/lib/services/punch-data"
import { attendanceApi } from "@/lib/services/attendance-api"
import { toast } from "sonner"

function formatDateTime(value?: string | null): string {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

export default function RemoteCollectPage() {
    const [companyEntityId, setCompanyEntityId] = React.useState("")
    const [punchCompanyId, setPunchCompanyId] = React.useState(1)
    const [range, setRange] = React.useState<DateRange | undefined>(() =>
        getCurrentMonthToTodayRange(),
    )
    const [rangeIso, setRangeIso] = React.useState(() =>
        punchRangeToIso(getCurrentMonthToTodayRange()),
    )
    const [useWatermark, setUseWatermark] = React.useState(false)
    const [preview, setPreview] = React.useState<RemoteCollectPreview | null>(null)
    const [lastResult, setLastResult] = React.useState<RemoteCollectResult | null>(null)
    const [histories, setHistories] = React.useState<RemoteCollectHistory[]>([])
    const [punches, setPunches] = React.useState<PunchRecord[]>([])
    const [remoteStatus, setRemoteStatus] = React.useState<RemoteCollectStatus | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [isCollecting, setIsCollecting] = React.useState(false)
    const [progress, setProgress] = React.useState(0)

    const loadRemoteStatus = React.useCallback(async () => {
        try {
            const status = await punchDataService.getRemoteCollectStatus()
            setRemoteStatus(status)
        } catch {
            setRemoteStatus({
                configured: false,
                connected: false,
                readOnly: true,
                message:
                    "Cannot reach PunchDataService. Start it on port 5050 (or run backend/Infrastructure/Scripts/start-platform.ps1).",
            })
        }
    }, [])

    const loadHistoriesAndPunches = React.useCallback(async () => {
        if (!punchCompanyId) return
        setIsLoading(true)
        try {
            const [histPage, punchPage] = await Promise.all([
                punchDataService.listRemoteCollectHistories({ companyId: punchCompanyId, page: 1, pageSize: 20 }),
                punchDataService.getPunches({
                    companyId: punchCompanyId,
                    from: rangeIso.fromIso,
                    to: rangeIso.toIso,
                    page: 1,
                    pageSize: 100,
                }),
            ])
            setHistories(histPage.items)
            setPunches(punchPage.items)
        } catch {
            setHistories([])
            setPunches([])
        } finally {
            setIsLoading(false)
        }
    }, [punchCompanyId, rangeIso.fromIso, rangeIso.toIso])

    React.useEffect(() => {
        void loadRemoteStatus()
    }, [loadRemoteStatus])

    React.useEffect(() => {
        if (companyEntityId && rangeIso.fromIso) loadHistoriesAndPunches()
    }, [companyEntityId, rangeIso.fromIso, rangeIso.toIso, loadHistoriesAndPunches])

    const handlePreview = async () => {
        try {
            const result = await punchDataService.previewRemoteCollect({
                from: rangeIso.fromIso,
                to: rangeIso.toIso,
            })
            setPreview(result)
            toast.success(`Preview: ${result.remoteRows} mappable rows`)
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Preview failed"
            toast.error(msg)
            await loadRemoteStatus()
        }
    }

    const handleCollect = async () => {
        setIsCollecting(true)
        setProgress(10)
        const timer = setInterval(() => setProgress((p) => Math.min(p + 8, 90)), 400)
        try {
            const result = await punchDataService.collectRemote({
                companyId: punchCompanyId,
                from: rangeIso.fromIso,
                to: rangeIso.toIso,
                useWatermark,
            })
            setLastResult(result)
            toast.success(`Collected ${result.inserted} new punch(es), ${result.duplicates} duplicate(s)`)

            if (companyEntityId && result.inserted > 0 && rangeIso.fromIso && rangeIso.toIso) {
                try {
                    const batch = await attendanceApi.processRange({
                        companyId: companyEntityId,
                        startDate: rangeIso.fromIso.slice(0, 10),
                        endDate: rangeIso.toIso.slice(0, 10),
                    })
                    toast.success(
                        `Attendance updated: ${batch.createdCount ?? 0} created, ${batch.updatedCount ?? 0} updated`,
                    )
                } catch (processError) {
                    console.error(processError)
                    toast.warning(
                        "Punches saved, but daily attendance process failed. Run Data Process → Daily Process for this date range.",
                    )
                }
            }

            await loadHistoriesAndPunches()
            await loadRemoteStatus()
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Collect failed"
            toast.error(msg)
            await loadRemoteStatus()
        } finally {
            clearInterval(timer)
            setProgress(100)
            setTimeout(() => {
                setIsCollecting(false)
                setProgress(0)
            }, 400)
        }
    }

    const historyColumns: ColumnDef<RemoteCollectHistory>[] = [
        {
            accessorKey: "startedAt",
            header: "Started",
            cell: ({ row }) => formatDateTime(row.original.startedAt),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <PunchStatusBadge status={row.original.status} variant="sync" />,
        },
        {
            id: "window",
            header: "Window",
            cell: ({ row }) => (
                <span className="text-[10px] text-muted-foreground">
                    {format(new Date(row.original.fromTime), "dd MMM")} –{" "}
                    {format(new Date(row.original.toTime), "dd MMM yyyy")}
                </span>
            ),
        },
        {
            id: "stats",
            header: "Result",
            cell: ({ row }) => (
                <span className="text-xs tabular-nums">
                    +{row.original.inserted} / {row.original.remoteRows} remote
                </span>
            ),
        },
    ]

    const punchColumns: ColumnDef<PunchRecord>[] = [
        { accessorKey: "punchNumber", header: "Punch #" },
        { accessorKey: "deviceId", header: "Device" },
        {
            accessorKey: "punchTime",
            header: "Time",
            cell: ({ row }) => formatDateTime(row.original.punchTime),
        },
        { accessorKey: "source", header: "Source" },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 min-h-screen">
            <div className="flex items-center gap-3">
                <IconServer className="size-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Remote Collect</h1>
                    <p className="text-sm text-muted-foreground">
                        Read-only import from public ZKTeco SQL into PunchRecords
                    </p>
                </div>
            </div>

            {remoteStatus && !remoteStatus.configured && (
                <Card className="border-amber-200 bg-amber-50/80">
                    <CardContent className="p-4 text-sm text-amber-950">
                        {remoteStatus.message ??
                            "Remote collect is not configured. Set ConnectionStrings.RemoteZktecoDb in backend/Configuration/connectionstrings.json (or appsettings.Development.json) and restart PunchDataService on port 5050."}
                    </CardContent>
                </Card>
            )}
            {remoteStatus?.configured && !remoteStatus.connected && (
                <Card className="border-amber-200 bg-amber-50/80">
                    <CardContent className="p-4 text-sm text-amber-950">
                        Remote ZKTeco SQL is configured but not reachable:{" "}
                        {remoteStatus.message ?? "check SQL Server (SHAKIL\\SQLEXPRESS), database zkteco, and that PunchDataService is running on port 5050."}
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                preset="currentMonthToToday"
                                label="Collect window"
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={useWatermark}
                                    onChange={(e) => setUseWatermark(e.target.checked)}
                                />
                                Use watermark (incremental from last run)
                            </label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePreview}
                                    disabled={!remoteStatus?.configured}
                                    className="gap-2"
                                >
                                    <IconEye className="size-4" />
                                    Preview count
                                </Button>
                                <Button
                                    onClick={handleCollect}
                                    disabled={!remoteStatus?.configured || isCollecting}
                                    className="gap-2"
                                >
                                    {isCollecting ? (
                                        <IconLoader2 className="size-4 animate-spin" />
                                    ) : (
                                        <IconCloudDownload className="size-4" />
                                    )}
                                    Collect punches
                                </Button>
                                <Button variant="ghost" size="sm" onClick={loadHistoriesAndPunches} disabled={isLoading}>
                                    <IconRefresh className="size-4 mr-1" />
                                    Refresh
                                </Button>
                            </div>
                            {isCollecting && <Progress value={progress} className="h-1.5" />}
                        </CardContent>
                    </Card>

                    {preview && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Preview</CardTitle>
                                <CardDescription>Read-only count in window</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p>
                                    Mappable rows: <strong>{preview.remoteRows}</strong>
                                </p>
                                <p>
                                    Unmapped: <strong>{preview.unmappedRemote}</strong>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {lastResult && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Last collect</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-1 tabular-nums">
                                <p>Inserted: {lastResult.inserted}</p>
                                <p>Duplicates: {lastResult.duplicates}</p>
                                <p>Skipped (no badge): {lastResult.skippedNoBadge}</p>
                                <p>Pages: {lastResult.pages}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="py-3 border-b">
                            <CardTitle className="text-sm">Collect history</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={histories}
                                columns={historyColumns}
                                showActions={false}
                                showTabs={false}
                                isLoading={isLoading}
                                getRowId={(r) => r.id}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3 border-b">
                            <CardTitle className="text-sm">Punches in window</CardTitle>
                            <CardDescription>From PunchDataDB for selected company and dates</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={punches}
                                columns={punchColumns}
                                showActions={false}
                                showTabs={false}
                                searchKey="punchNumber"
                                isLoading={isLoading}
                                getRowId={(r) => r.id}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
