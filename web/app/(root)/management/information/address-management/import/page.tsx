"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    IconFileUpload,
    IconDownload,
    IconArrowLeft,
    IconFileSpreadsheet,
    IconAlertCircle,
    IconCircleCheck,
    IconCloudUpload,
    IconX,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { importExportService, type ImportResult } from "@/lib/services/import-export"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function AddressImportPage() {
    const router = useRouter()
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [isImporting, setIsImporting] = React.useState(false)
    const [importProgress, setImportProgress] = React.useState(0)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [importResult, setImportResult] = React.useState<ImportResult | null>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setImportResult(null)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file)
            setImportResult(null)
        } else {
            toast.error("Please drop a valid Excel file (.xlsx or .xls)")
        }
    }

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first")
            return
        }

        setIsImporting(true)
        setImportProgress(0)

        // Simulate progress
        const progressInterval = setInterval(() => {
            setImportProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval)
                    return prev
                }
                return prev + 10
            })
        }, 200)

        try {
            const result = await importExportService.importAddress(selectedFile)
            clearInterval(progressInterval)
            setImportProgress(100)
            setImportResult(result)

            if (result.errorCount > 0) {
                toast.warning(`Import completed with ${result.errorCount} errors. Created: ${result.createdCount}, Updated: ${result.updatedCount}`)
            } else {
                toast.success(`Import successful! Created: ${result.createdCount}, Updated: ${result.updatedCount}`)
            }
        } catch (error: any) {
            clearInterval(progressInterval)
            console.error(error)
            toast.error(error.response?.data?.errors?.[0]?.message || "Failed to import data")
            setImportResult(null)
        } finally {
            setIsImporting(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await importExportService.downloadAddressDemo()
            toast.success("Template downloaded successfully")
        } catch (error) {
            toast.error("Failed to download template")
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setImportResult(null)
        setImportProgress(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 bg-muted/20 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-xl"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <IconFileUpload className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Address Data Import</h1>
                        <p className="text-sm text-muted-foreground">Bulk import address data from Excel</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="gap-2"
                    >
                        <IconDownload className="size-4" />
                        Template
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                            try {
                                await importExportService.downloadAddressDemo()
                                toast.success("Demo file downloaded successfully")
                            } catch (error) {
                                toast.error("Failed to download demo file")
                            }
                        }}
                        className="gap-2 bg-[#108545] hover:bg-[#0d6e39]"
                    >
                        <IconFileSpreadsheet className="size-4" />
                        Demo Data
                    </Button>
                </div>
            </div>

            <div className="px-4 lg:px-8 space-y-6">
                {/* Upload Card */}
                <Card className="border-muted/40 shadow-xl overflow-hidden rounded-3xl bg-background/50 backdrop-blur-sm">
                    <CardHeader className="bg-muted/30 border-b pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <IconFileSpreadsheet className="size-5" />
                            Upload Excel File
                        </CardTitle>
                        <CardDescription>
                            Select or drag & drop your Excel file containing address data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />

                        {/* Drag & Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                                selectedFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
                            )}
                        >
                            {selectedFile ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <IconCircleCheck className="size-16 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold">{selectedFile.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(selectedFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            clearFile()
                                        }}
                                        className="gap-2"
                                    >
                                        <IconX className="size-4" />
                                        Clear
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <IconCloudUpload className="size-16 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold">
                                            Drop your Excel file here, or click to browse
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Supports .xlsx and .xls files
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Import Progress */}
                        {isImporting && (
                            <div className="mt-6 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Importing...</span>
                                    <span className="text-muted-foreground">{importProgress}%</span>
                                </div>
                                <Progress value={importProgress} className="h-2" />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isImporting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!selectedFile || isImporting}
                                className="bg-[#108545] hover:bg-[#0d6e39] gap-2"
                            >
                                <IconFileUpload className="size-4" />
                                {isImporting ? "Importing..." : "Import Data"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Import Results */}
                {importResult && (
                    <Card className="border-muted/40 shadow-xl overflow-hidden rounded-3xl bg-background/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/30 border-b pb-6">
                            <CardTitle className="flex items-center gap-2">
                                <IconAlertCircle className="size-5" />
                                Import Results
                            </CardTitle>
                            <CardDescription>
                                Summary of the import process
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold">{importResult.totalRows}</div>
                                    <div className="text-xs text-muted-foreground">Total Rows</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                                    <div className="text-xs text-muted-foreground">Success</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{importResult.createdCount}</div>
                                    <div className="text-xs text-muted-foreground">Created</div>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{importResult.updatedCount}</div>
                                    <div className="text-xs text-muted-foreground">Updated</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">{importResult.errorCount}</div>
                                    <div className="text-xs text-muted-foreground">Errors</div>
                                </div>
                            </div>

                            {/* Errors Table */}
                            {importResult.errors.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <IconAlertCircle className="size-4 text-red-500" />
                                        Errors ({importResult.errors.length})
                                    </h3>
                                    <div className="border rounded-xl overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Row</TableHead>
                                                    <TableHead>Field</TableHead>
                                                    <TableHead>Message</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importResult.errors.map((error, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <Badge variant="destructive">{error.rowNumber}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{error.field}</TableCell>
                                                        <TableCell className="text-sm">{error.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Warnings Table */}
                            {importResult.warnings && importResult.warnings.length > 0 && (
                                <div className="space-y-3 mt-6">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <IconAlertCircle className="size-4 text-yellow-500" />
                                        Warnings ({importResult.warnings.length})
                                    </h3>
                                    <div className="border rounded-xl overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Row</TableHead>
                                                    <TableHead>Field</TableHead>
                                                    <TableHead>Message</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importResult.warnings.map((warning, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                                                {warning.rowNumber}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">—</TableCell>
                                                        <TableCell className="text-sm">{warning.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {importResult.errorCount === 0 && (
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-4 flex items-center gap-3">
                                    <IconCircleCheck className="size-5 text-green-600 shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100">
                                            Import Completed Successfully!
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            All rows were processed without errors.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Instructions Card */}
                <Card className="border-muted/40 shadow-xl overflow-hidden rounded-3xl bg-background/50 backdrop-blur-sm">
                    <CardHeader className="bg-muted/30 border-b pb-6">
                        <CardTitle>Import Instructions</CardTitle>
                        <CardDescription>Follow these steps for a successful import</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ol className="space-y-3 list-decimal list-inside text-sm">
                            <li>
                                <strong>Download the template</strong> - Click the "Download Template" button to get the Excel template with proper column headers.
                            </li>
                            <li>
                                <strong>Fill in your data</strong> - Enter address data with both English and Bangla names:
                                <ul className="ml-8 mt-2 space-y-1 list-disc">
                                    <li>Country Name (EN) & Country Name (BN)</li>
                                    <li>Division Name (EN) & Division Name (BN)</li>
                                    <li>District Name (EN) & District Name (BN)</li>
                                    <li>Thana Name (EN) & Thana Name (BN)</li>
                                    <li>Post Office Name (EN) & Post Office Name (BN)</li>
                                    <li>Post Code</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Hierarchical structure</strong> - The system will automatically create parent records if they don't exist (e.g., if a country is new, it will be created).
                            </li>
                            <li>
                                <strong>Upload and import</strong> - Select or drag your filled Excel file and click "Import Data".
                            </li>
                            <li>
                                <strong>Review results</strong> - Check the import summary for any errors or warnings.
                            </li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
