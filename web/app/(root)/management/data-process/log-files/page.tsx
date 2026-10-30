"use client"

import * as React from "react"
import { format } from "date-fns"
import {
    IconDownload,
    IconFileText,
    IconLoader2,
    IconPlayerPlay,
    IconRefresh,
    IconUpload,
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    punchDataService,
    type PunchLogFile,
    type PunchRecord,
} from "@/lib/services/punch-data"
import { toast } from "sonner"

function formatDateTime(value?: string | null): string {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

export default function LogFilesPage() {
    const [companyEntityId, setCompanyEntityId] = React.useState("")
    const [punchCompanyId, setPunchCompanyId] = React.useState(1)
    const [logs, setLogs] = React.useState<PunchLogFile[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [uploadFile, setUploadFile] = React.useState<File | null>(null)
    const [deviceId, setDeviceId] = React.useState("")
    const [autoProcess, setAutoProcess] = React.useState(true)
    const [isUploading, setIsUploading] = React.useState(false)
    const [batchJson, setBatchJson] = React.useState("")
    const [detailId, setDetailId] = React.useState<string | null>(null)
    const [detail, setDetail] = React.useState<PunchLogFile | null>(null)
    const [records, setRecords] = React.useState<PunchRecord[]>([])
    const [detailLoading, setDetailLoading] = React.useState(false)

    const loadLogs = React.useCallback(async () => {
        if (!punchCompanyId) return
        setIsLoading(true)
        try {
            const page = await punchDataService.getLogs({
                companyId: punchCompanyId,
                page: 1,
                pageSize: 100,
            })
            setLogs(page.items)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load log files")
            setLogs([])
        } finally {
            setIsLoading(false)
        }
    }, [punchCompanyId])

    React.useEffect(() => {
        if (companyEntityId) loadLogs()
    }, [companyEntityId, loadLogs])

    const openDetail = async (id: string) => {
        setDetailId(id)
        setDetailLoading(true)
        try {
            const [log, recPage] = await Promise.all([
                punchDataService.getLog(id),
                punchDataService.getLogRecords(id, { page: 1, pageSize: 200 }),
            ])
            setDetail(log)
            setRecords(recPage.items)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load log detail")
        } finally {
            setDetailLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) {
            toast.error("Select a file")
            return
        }
        setIsUploading(true)
        try {
            await punchDataService.uploadLog(uploadFile, {
                companyId: punchCompanyId,
                deviceId: deviceId || undefined,
                autoProcess,
            })
            toast.success("File uploaded")
            setUploadFile(null)
            await loadLogs()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleBatch = async () => {
        setIsUploading(true)
        try {
            const payload = JSON.parse(batchJson)
            await punchDataService.createBatch(
                { ...payload, companyId: payload.companyId ?? punchCompanyId },
                autoProcess,
            )
            toast.success("Batch ingested")
            setBatchJson("")
            await loadLogs()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Batch ingest failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleProcessAll = async () => {
        try {
            const results = await punchDataService.processPending(50)
            toast.success(`Processed ${results.length} pending file(s)`)
            await loadLogs()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Process failed")
        }
    }

    const columns: ColumnDef<PunchLogFile>[] = [
        { accessorKey: "fileName", header: "File" },
        { accessorKey: "sourceType", header: "Source" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <PunchStatusBadge status={row.original.status} />,
        },
        { accessorKey: "rowCount", header: "Rows" },
        {
            accessorKey: "uploadedAt",
            header: "Uploaded",
            cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.uploadedAt)}</span>,
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex gap-1 justify-end" data-no-row-click="true">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openDetail(row.original.id)}>
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() =>
                            punchDataService.downloadLog(row.original.id, row.original.fileName).catch((e) =>
                                toast.error(e.message),
                            )
                        }
                    >
                        <IconDownload className="size-3.5" />
                    </Button>
                    {row.original.status === "Pending" && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={async () => {
                                try {
                                    await punchDataService.processLog(row.original.id)
                                    toast.success("Processed")
                                    await loadLogs()
                                } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "Process failed")
                                }
                            }}
                        >
                            <IconPlayerPlay className="size-3.5" />
                        </Button>
                    )}
                </div>
            ),
        },
    ]

    const recordColumns: ColumnDef<PunchRecord>[] = [
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
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <IconFileText className="size-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold">Log Files</h1>
                        <p className="text-sm text-muted-foreground">Upload and process raw punch payloads</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
                        <IconRefresh className="size-4" />
                    </Button>
                    <Button variant="secondary" onClick={handleProcessAll}>
                        <IconPlayerPlay className="size-4 mr-1" />
                        Process pending
                    </Button>
                </div>
            </div>

            <Card>
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

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">File upload</CardTitle>
                        <CardDescription>CSV or JSON — optional auto-process</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input type="file" accept=".csv,.json,.txt" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                        <div className="space-y-1.5">
                            <Label>Device id (optional)</Label>
                            <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="DEV-01" />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={autoProcess} onChange={(e) => setAutoProcess(e.target.checked)} />
                            Auto-process after upload
                        </label>
                        <Button onClick={handleUpload} disabled={isUploading} className="w-full gap-2">
                            {isUploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
                            Upload
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">JSON batch</CardTitle>
                        <CardDescription>POST /logs/batch body</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            className="min-h-[120px] font-mono text-xs"
                            value={batchJson}
                            onChange={(e) => setBatchJson(e.target.value)}
                            placeholder={'{"deviceId":"DEV-01","records":[{"punchNumber":1,"punchTime":"2026-05-13T08:00:00Z"}]}'}
                        />
                        <Button onClick={handleBatch} disabled={isUploading} variant="outline" className="w-full">
                            Ingest batch
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Uploaded log files</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={logs}
                        columns={columns}
                        showActions={false}
                        showTabs={false}
                        searchKey="fileName"
                        isLoading={isLoading}
                        getRowId={(r) => r.id}
                    />
                </CardContent>
            </Card>

            <Sheet open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{detail?.fileName ?? "Log file"}</SheetTitle>
                        <SheetDescription>
                            {detail && (
                                <>
                                    <PunchStatusBadge status={detail.status} /> · {detail.rowCount} rows
                                </>
                            )}
                        </SheetDescription>
                    </SheetHeader>
                    {detailLoading ? (
                        <div className="flex justify-center py-8">
                            <IconLoader2 className="size-6 animate-spin" />
                        </div>
                    ) : detail ? (
                        <div className="mt-4 space-y-4">
                            {detail.errorMessage && (
                                <p className="text-sm text-destructive">{detail.errorMessage}</p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        if (!detailId) return
                                        await punchDataService.processLog(detailId)
                                        toast.success("Processed")
                                        openDetail(detailId)
                                        loadLogs()
                                    }}
                                >
                                    Process
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => punchDataService.downloadLog(detail.id, detail.fileName)}
                                >
                                    Download
                                </Button>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Punch records</h3>
                                <DataTable
                                    data={records}
                                    columns={recordColumns}
                                    showActions={false}
                                    showTabs={false}
                                    showColumnCustomizer={false}
                                    getRowId={(r) => r.id}
                                />
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    )
}
