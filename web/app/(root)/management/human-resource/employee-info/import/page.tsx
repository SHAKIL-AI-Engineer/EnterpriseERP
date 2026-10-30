"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconFileSpreadsheet,
    IconUpload,
    IconDownload,
    IconCircleCheck,
    IconLoader2,
    IconInfoCircle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getHttpErrorMessage } from "@/lib/api-response"
import {
    importExportService,
    importJobToEmployeeResult,
    type ImportPreviewResult,
} from "@/lib/services/import-export"

export default function EmployeeImportPage() {
    const router = useRouter()
    const [isDragging, setIsDragging] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null)
    const [importResult, setImportResult] = React.useState<ReturnType<typeof importJobToEmployeeResult> | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const reset = () => {
        setFile(null)
        setPreview(null)
        setImportResult(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const acceptFile = (f: File | undefined) => {
        if (!f) return
        if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
            toast.error("Please upload a valid Excel file (.xlsx or .xls)")
            return
        }
        setFile(f)
        setPreview(null)
        setImportResult(null)
    }

    const handleAnalyze = async () => {
        if (!file) return
        setIsLoading(true)
        try {
            const result = await importExportService.previewImport("employee", file)
            setPreview(result)
            toast[result.invalidRows === 0 ? "success" : "warning"](
                result.invalidRows === 0
                    ? `${result.validRows} row(s) ready to import`
                    : `${result.validRows} valid, ${result.invalidRows} invalid`,
            )
        } catch (e: unknown) {
            toast.error(getHttpErrorMessage(e, "Analyze failed"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!preview?.sessionId) return
        setIsLoading(true)
        try {
            let job = await importExportService.confirmImport("employee", preview.sessionId)
            const status = job.status?.toLowerCase() ?? ""
            if (status === "pending" || status === "processing") {
                job = await importExportService.waitForImportJob(job.id)
            }
            const mapped = importJobToEmployeeResult(job)
            setImportResult(mapped)
            if (job.failedRows === 0) {
                toast.success(`Imported ${mapped.createdCount} created, ${mapped.updatedCount} updated`)
            } else if (mapped.successCount > 0) {
                toast.warning(
                    `Partial: ${mapped.createdCount} created, ${mapped.updatedCount} updated, ${mapped.errorCount} failed`,
                )
            } else {
                toast.error("Import failed")
            }
        } catch (e: unknown) {
            toast.error(getHttpErrorMessage(e, "Import failed"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await importExportService.downloadTemplate("employee")
            toast.success("Template downloaded")
        } catch (e: unknown) {
            toast.error(getHttpErrorMessage(e, "Failed to download template"))
        }
    }

    const handleExportEmployees = async () => {
        setIsLoading(true)
        try {
            await importExportService.exportModule("employee")
            toast.success("Employee export downloaded")
        } catch (e: unknown) {
            toast.error(getHttpErrorMessage(e, "Export failed"))
        } finally {
            setIsLoading(false)
        }
    }

    const previewRate = preview && preview.totalRows > 0
        ? (preview.validRows / preview.totalRows) * 100
        : 0

    const importSuccessRate = importResult && importResult.totalRows > 0
        ? (importResult.successCount / importResult.totalRows) * 100
        : 0

    return (
        <div className="flex w-full flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 lg:px-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconFileSpreadsheet className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Import Employee Data</h1>
                        <p className="text-muted-foreground text-sm">
                            Full profile Excel import — same EmployeeID updates existing records
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={isLoading} className="gap-2">
                        <IconDownload className="size-4" />
                        Demo template
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportEmployees} disabled={isLoading} className="gap-2">
                        <IconFileSpreadsheet className="size-4" />
                        Export employees
                    </Button>
                </div>
            </div>

            <div className="px-4 lg:px-6 space-y-6">
                <Alert>
                    <IconInfoCircle className="size-4" />
                    <AlertTitle>Before you import</AlertTitle>
                    <AlertDescription className="text-sm space-y-1">
                        <p>Select the active company in hrhub. Fill the <strong>Template</strong> sheet (not Instructions).</p>
                        <p>Department and designation names must match your company organogram.</p>
                        <p>
                            Requires <strong>ImportExport</strong> on port <strong>8060</strong> and{" "}
                            <strong>Platform</strong> on port <strong>5000</strong>. Valid rows are written to the HR
                            database in one request (no Redis job queue). Keep this tab open until the summary appears.
                        </p>
                    </AlertDescription>
                </Alert>

                {!importResult && (
                    <Card>
                        <CardHeader className="border-b pb-6">
                            <CardTitle className="text-xl font-bold">
                                {preview ? "Review and confirm" : "Upload Excel"}
                            </CardTitle>
                            <CardDescription>
                                {preview
                                    ? "Fix invalid rows in your file and re-analyze, or import valid rows only."
                                    : "Use the demo template or export current employees, edit, then upload."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {!preview && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => acceptFile(e.target.files?.[0])}
                                    />
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            setIsDragging(false)
                                            acceptFile(e.dataTransfer.files[0])
                                        }}
                                        className={cn(
                                            "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                                            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                                            file && "border-primary bg-primary/5",
                                        )}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="flex flex-col items-center gap-4">
                                            <div className={cn(
                                                "size-16 rounded-full flex items-center justify-center",
                                                file ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40",
                                            )}>
                                                {isLoading ? (
                                                    <IconLoader2 className="size-8 animate-spin" />
                                                ) : file ? (
                                                    <IconCircleCheck className="size-8" />
                                                ) : (
                                                    <IconUpload className="size-8" />
                                                )}
                                            </div>
                                            {file ? (
                                                <div>
                                                    <p className="font-semibold">{file.name}</p>
                                                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-semibold">Drop .xlsx here or browse</p>
                                                    <p className="text-sm text-muted-foreground">Full employee profile columns</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {file && (
                                        <Button onClick={handleAnalyze} disabled={isLoading} className="w-full h-12 gap-2">
                                            {isLoading ? <IconLoader2 className="size-5 animate-spin" /> : null}
                                            {isLoading ? "Analyzing..." : "Analyze file"}
                                        </Button>
                                    )}
                                </>
                            )}

                            {preview && (
                                <>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl border text-center">
                                            <div className="text-2xl font-bold">{preview.totalRows}</div>
                                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total rows</div>
                                        </div>
                                        <div className="p-4 rounded-xl border bg-primary/5 text-center">
                                            <div className="text-2xl font-bold text-primary">{preview.validRows}</div>
                                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Valid</div>
                                        </div>
                                        <div className="p-4 rounded-xl border bg-destructive/5 text-center">
                                            <div className="text-2xl font-bold text-destructive">{preview.invalidRows}</div>
                                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Invalid</div>
                                        </div>
                                        <div className="p-4 rounded-xl border text-center flex flex-col justify-center">
                                            {preview.errorsTruncated && (
                                                <Badge variant="secondary" className="text-[10px]">Errors truncated</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Valid rate</span>
                                            <span>{previewRate.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={previewRate} className="h-2" />
                                    </div>
                                    {preview.errors.length > 0 && (
                                        <div className="max-h-48 overflow-y-auto rounded-lg border p-3 space-y-1 text-sm">
                                            {preview.errors.map((err, i) => (
                                                <p key={i} className="text-destructive">
                                                    Row {err.rowNumber}{err.field ? ` (${err.field})` : ""}: {err.message}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={handleConfirm}
                                            disabled={isLoading || preview.validRows === 0}
                                            className="gap-2"
                                        >
                                            {isLoading && <IconLoader2 className="size-4 animate-spin" />}
                                            {isLoading
                                                ? `Importing ${preview.validRows} into database…`
                                                : `Import ${preview.validRows} employee(s)`}
                                        </Button>
                                        <Button variant="outline" onClick={reset} disabled={isLoading}>
                                            Start over
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {importResult && (
                    <Card className="animate-in slide-in-from-top duration-500">
                        <CardHeader className="border-b pb-6">
                            <CardTitle className="text-xl font-bold">Import summary</CardTitle>
                            <CardDescription>
                                Processed {importResult.totalRows} row(s) from preview
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="p-4 rounded-xl border text-center">
                                    <div className="text-2xl font-bold">{importResult.totalRows}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-primary/5 text-center">
                                    <div className="text-2xl font-bold text-primary">{importResult.createdCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Created</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/50 text-center">
                                    <div className="text-2xl font-bold">{importResult.updatedCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Updated</div>
                                </div>
                                <div className="p-4 rounded-xl border text-center">
                                    <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Success</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-destructive/5 text-center">
                                    <div className="text-2xl font-bold text-destructive">{importResult.errorCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Failed</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Success rate</span>
                                    <span>{importSuccessRate.toFixed(0)}%</span>
                                </div>
                                <Progress value={importSuccessRate} className="h-2" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {importResult.errorFilePath && (
                                    <Button
                                        variant="outline"
                                        onClick={() => importExportService.downloadImportErrorFile(importResult.jobId)}
                                        className="gap-2"
                                    >
                                        <IconDownload className="size-4" />
                                        Download errors
                                    </Button>
                                )}
                                <Button onClick={() => router.push("/management/human-resource/employee-info")}>
                                    View employees
                                </Button>
                                <Button variant="outline" onClick={reset}>
                                    Import another file
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
