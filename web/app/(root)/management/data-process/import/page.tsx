"use client"

import * as React from "react"
import { format } from "date-fns"
import { IconFileImport, IconLoader2, IconRefresh, IconUpload } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { PunchCompanySelect } from "@/components/punch-data/punch-company-select"
import { PunchStatusBadge } from "@/components/punch-data/punch-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    punchDataService,
    type PunchImportBatch,
    type PunchImportError,
} from "@/lib/services/punch-data"
import { toast } from "sonner"

function formatDateTime(value?: string | null): string {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy, hh:mm aa")
}

export default function FileImportPage() {
    const [companyEntityId, setCompanyEntityId] = React.useState("")
    const [punchCompanyId, setPunchCompanyId] = React.useState(1)
    const [batches, setBatches] = React.useState<PunchImportBatch[]>([])
    const [errors, setErrors] = React.useState<PunchImportError[]>([])
    const [selectedBatch, setSelectedBatch] = React.useState<PunchImportBatch | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [uploadFile, setUploadFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [errorsLoading, setErrorsLoading] = React.useState(false)

    const loadBatches = React.useCallback(async () => {
        if (!punchCompanyId) return
        setIsLoading(true)
        try {
            const page = await punchDataService.listImportBatches({
                companyId: punchCompanyId,
                page: 1,
                pageSize: 100,
            })
            setBatches(page.items)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load import batches")
            setBatches([])
        } finally {
            setIsLoading(false)
        }
    }, [punchCompanyId])

    React.useEffect(() => {
        if (companyEntityId) loadBatches()
    }, [companyEntityId, loadBatches])

    const openErrors = async (batch: PunchImportBatch) => {
        setSelectedBatch(batch)
        setErrorsLoading(true)
        try {
            const page = await punchDataService.listImportErrors(batch.id, { page: 1, pageSize: 200 })
            setErrors(page.items)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load errors")
            setErrors([])
        } finally {
            setErrorsLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) {
            toast.error("Select a CSV or Excel file")
            return
        }
        setIsUploading(true)
        try {
            await punchDataService.uploadLog(uploadFile, { companyId: punchCompanyId, autoProcess: true })
            toast.success("Import uploaded and processed")
            setUploadFile(null)
            await loadBatches()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const batchColumns: ColumnDef<PunchImportBatch>[] = [
        { accessorKey: "fileName", header: "File" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <PunchStatusBadge status={row.original.status} variant="import" />,
        },
        {
            id: "rows",
            header: "Rows",
            cell: ({ row }) => (
                <span className="text-xs tabular-nums">
                    {row.original.insertedRows} ins / {row.original.invalidRows} err / {row.original.totalRows} total
                </span>
            ),
        },
        {
            accessorKey: "uploadedAt",
            header: "Uploaded",
            cell: ({ row }) => formatDateTime(row.original.uploadedAt),
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openErrors(row.original)}>
                    Errors
                </Button>
            ),
        },
    ]

    const errorColumns: ColumnDef<PunchImportError>[] = [
        { accessorKey: "rowNumber", header: "Row" },
        {
            accessorKey: "errorMessage",
            header: "Error",
            cell: ({ row }) => <span className="text-xs">{row.original.errorMessage}</span>,
        },
        {
            accessorKey: "rawRow",
            header: "Raw",
            cell: ({ row }) => (
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px] block">
                    {row.original.rawRow}
                </span>
            ),
        },
    ]

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6">
            <div className="flex items-center gap-3">
                <IconFileImport className="size-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">File Import</h1>
                    <p className="text-sm text-muted-foreground">Import batch history and validation errors</p>
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Upload import file</CardTitle>
                    <CardDescription>CSV/JSON — creates import batch and punch log file</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-3">
                    <Input type="file" accept=".csv,.json,.xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                    <Button onClick={handleUpload} disabled={isUploading} className="gap-2">
                        {isUploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
                        Upload & process
                    </Button>
                    <Button variant="outline" onClick={loadBatches} disabled={isLoading}>
                        <IconRefresh className="size-4" />
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Import batches</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={batches}
                        columns={batchColumns}
                        showActions={false}
                        showTabs={false}
                        searchKey="fileName"
                        isLoading={isLoading}
                        getRowId={(r) => r.id}
                    />
                </CardContent>
            </Card>

            <Sheet open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Import errors</SheetTitle>
                        <SheetDescription>{selectedBatch?.fileName}</SheetDescription>
                    </SheetHeader>
                    {errorsLoading ? (
                        <div className="flex justify-center py-8">
                            <IconLoader2 className="size-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="mt-4">
                            <DataTable
                                data={errors}
                                columns={errorColumns}
                                showActions={false}
                                showTabs={false}
                                showColumnCustomizer={false}
                                getRowId={(r) => r.id}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
