"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconArrowLeft,
    IconUpload,
    IconFileSpreadsheet,
    IconAlertCircle,
    IconCircleCheck,
    IconInfoCircle,
    IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { importExportService, type ImportResult } from "@/lib/services/import-export"

export default function ImportOrganogramPage() {
    const router = useRouter()
    const [file, setFile] = React.useState<File | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const [result, setResult] = React.useState<ImportResult | null>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile)
            setResult(null)
        } else {
            toast.error("Please upload a valid Excel file (.xlsx or .xls)")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setResult(null)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await importExportService.downloadOrganogramDemo()
            toast.success("Template downloaded successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to download template")
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file to upload")
            return
        }

        setIsUploading(true)
        try {
            const importResult = await importExportService.importOrganogram(file)
            setResult(importResult)

            if (importResult.errorCount === 0 && importResult.warningCount === 0) {
                toast.success(`Import successful! Created ${importResult.createdCount}, Updated ${importResult.updatedCount}`)
            } else if (importResult.errorCount > 0) {
                toast.error(`Import completed with ${importResult.errorCount} errors`)
            } else {
                toast.success(`Import completed with ${importResult.warningCount} warnings`)
            }
        } catch (error: any) {
            console.error(error)
            const message = error.response?.data?.message || "Failed to import data"
            toast.error(message)
        } finally {
            setIsUploading(false)
        }
    }

    const successRate = result ? (result.successCount / result.totalRows) * 100 : 0

    return (
        <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <IconUpload className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Organogram Data Import</h1>
                        <p className="text-muted-foreground text-sm">Bulk import departments, sections, and more</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="gap-2"
                    >
                        <IconFileSpreadsheet className="size-4" />
                        Download Template
                    </Button>
                </div>
            </div>

            <div className="px-6 space-y-6">
                <Card>
                    <CardHeader className="border-b pb-6">
                        <CardTitle className="text-xl font-bold">Import Data</CardTitle>
                        <CardDescription>Upload your completed organogram Excel file</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                                file && "border-primary bg-primary/5"
                            )}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className={cn(
                                    "size-16 rounded-full flex items-center justify-center transition-colors",
                                    file ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                                )}>
                                    {isUploading ? (
                                        <IconLoader2 className="size-8 animate-spin" />
                                    ) : file ? (
                                        <IconCircleCheck className="size-8" />
                                    ) : (
                                        <IconUpload className="size-8" />
                                    )}
                                </div>

                                {file ? (
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFile(null)
                                            }}
                                            className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            Remove File
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold">Drop your Excel file here</p>
                                        <p className="text-sm text-muted-foreground">or click to browse your computer</p>
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="w-full h-12 text-base gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <IconLoader2 className="size-5 animate-spin" />
                                    Importing Data...
                                </>
                            ) : (
                                <>
                                    <IconUpload className="size-5" />
                                    Start Import
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>


                {/* Results */}
                {result && (
                    <Card className="animate-in slide-in-from-top duration-500">
                        <CardHeader className="border-b pb-6">
                            <CardTitle className="text-xl font-bold">Import Summary</CardTitle>
                            <CardDescription>Processed {result.totalRows} rows from your file</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl border bg-muted/50 text-center">
                                    <div className="text-2xl font-bold">{result.totalRows}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-primary/5 text-center">
                                    <div className="text-2xl font-bold text-primary">{result.createdCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Created</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/50 text-center">
                                    <div className="text-2xl font-bold">{result.updatedCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Updated</div>
                                </div>
                                <div className="p-4 rounded-xl border bg-destructive/5 text-center">
                                    <div className="text-2xl font-bold text-destructive">{result.errorCount}</div>
                                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Errors</div>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Success Rate</span>
                                    <span>{successRate.toFixed(1)}%</span>
                                </div>
                                <Progress value={successRate} className="h-2" />
                            </div>

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                                        <IconAlertCircle className="size-4" />
                                        Validation Errors
                                    </h3>
                                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                                        <AlertDescription>
                                            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                                                {result.errors.map((error, idx) => (
                                                    <li key={idx} className="flex gap-2 items-start border-b border-destructive/10 pb-2 last:border-0 last:pb-0">
                                                        <Badge variant="outline" className="shrink-0">Row {error.rowNumber}</Badge>
                                                        <span className="text-muted-foreground"><span className="font-semibold text-destructive">{error.field}:</span> {error.message}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Warnings */}
                            {result.warnings.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                                        <IconAlertCircle className="size-4" />
                                        Import Warnings
                                    </h3>
                                    <Alert className="bg-amber-50/50 border-amber-200">
                                        <AlertDescription>
                                            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                                                {result.warnings.map((warning, idx) => (
                                                    <li key={idx} className="flex gap-2 items-start border-b border-amber-100 pb-2 last:border-0 last:pb-0">
                                                        <Badge variant="outline" className="shrink-0 border-amber-200 text-amber-700">Row {warning.rowNumber}</Badge>
                                                        <span className="text-amber-800">{warning.message}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Success Message */}
                            {result.errorCount === 0 && (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <IconCircleCheck className="size-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary">Import completed successfully!</p>
                                        <p className="text-sm text-muted-foreground">All organizational units have been processed.</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t font-semibold">
                                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                                    Done
                                </Button>
                                <Button
                                    onClick={() => {
                                        setFile(null)
                                        setResult(null)
                                    }}
                                    className="flex-1"
                                >
                                    Import Another File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
