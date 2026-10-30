"use client"

import * as React from "react"
import {
    IconFingerprint,
    IconLoader2,
    IconPlayerPlay,
    IconUpload,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { attendanceService, type PunchLogUploadItem } from "@/lib/services/attendance"
import { companyService, type Company } from "@/lib/services/company"
import { toast } from "sonner"

const today = new Date().toISOString().slice(0, 10)

function samplePayload() {
    const base = today
    return JSON.stringify(
        [
            {
                punchNumber: 1,
                employeeID: "EMP-0001",
                punchTime: `${base}T09:00:00`,
                deviceSerial: "ZK-01",
            },
            {
                punchNumber: 1,
                employeeID: "EMP-0001",
                punchTime: `${base}T18:05:00`,
                deviceSerial: "ZK-01",
            },
        ],
        null,
        2,
    )
}

interface ParsedLogs {
    logs: PunchLogUploadItem[]
    error: string | null
}

function parseLogs(value: string): ParsedLogs {
    if (!value.trim()) return { logs: [], error: null }

    try {
        const parsed = JSON.parse(value) as unknown
        if (!Array.isArray(parsed)) {
            return { logs: [], error: "JSON must be an array of punch log rows." }
        }

        const logs = parsed.map((row, index) => {
            const item = row as Record<string, unknown>
            const punchRaw = item.punchNumber ?? item.employeeCode
            const punchNumber =
                typeof punchRaw === "number"
                    ? punchRaw
                    : parseInt(String(punchRaw ?? "").trim(), 10)
            const employeeID =
                typeof item.employeeID === "string"
                    ? item.employeeID.trim()
                    : typeof item.employeeCode === "string"
                      ? item.employeeCode.trim()
                      : ""
            const punchTime = typeof item.punchTime === "string" ? item.punchTime.trim() : ""
            const deviceSerial = typeof item.deviceSerial === "string" ? item.deviceSerial.trim() : null

            if (!Number.isFinite(punchNumber) || punchNumber <= 0) {
                throw new Error(`Row ${index + 1}: punchNumber is required (device badge).`)
            }
            if (!punchTime || Number.isNaN(new Date(punchTime).getTime())) {
                throw new Error(`Row ${index + 1}: punchTime must be a valid date time.`)
            }

            return {
                id: typeof item.id === "string" ? item.id : undefined,
                punchNumber,
                employeeID: employeeID || null,
                punchTime,
                deviceSerial: deviceSerial || null,
            }
        })

        return { logs, error: null }
    } catch (error) {
        return {
            logs: [],
            error: error instanceof Error ? error.message : "Unable to parse punch logs.",
        }
    }
}

function formatPunchTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
}

export default function AttendanceLogsPage() {
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = React.useState("")
    const [payload, setPayload] = React.useState(samplePayload)
    const [processDate, setProcessDate] = React.useState(today)
    const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true)
    const [isUploading, setIsUploading] = React.useState(false)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [lastUploadCount, setLastUploadCount] = React.useState<number | null>(null)

    const parsed = React.useMemo(() => parseLogs(payload), [payload])
    const previewRows = parsed.logs.slice(0, 10)
    const uniqueEmployees = new Set(parsed.logs.map((log) => log.punchNumber)).size
    const uniqueDevices = new Set(parsed.logs.map((log) => log.deviceSerial).filter(Boolean)).size

    React.useEffect(() => {
        const loadCompanies = async () => {
            setIsLoadingCompanies(true)
            try {
                const data = await companyService.getAll()
                setCompanies(data)
                setSelectedCompanyId((current) => current || data[0]?.entityId || "")
            } catch (error) {
                console.error("Failed to load companies", error)
                toast.error("Failed to load companies")
            } finally {
                setIsLoadingCompanies(false)
            }
        }
        loadCompanies()
    }, [])

    const uploadLogs = async () => {
        if (!selectedCompanyId) {
            toast.error("Select a company")
            return
        }
        if (parsed.error) {
            toast.error(parsed.error)
            return
        }
        if (parsed.logs.length === 0) {
            toast.error("Add at least one punch log row")
            return
        }

        setIsUploading(true)
        try {
            const count = await attendanceService.uploadPunchLogs({
                companyId: selectedCompanyId,
                logs: parsed.logs,
            })
            setLastUploadCount(count)
            toast.success(`Uploaded ${count} punch log(s)`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const processAttendance = async () => {
        if (!selectedCompanyId) {
            toast.error("Select a company")
            return
        }
        setIsProcessing(true)
        try {
            const result = await attendanceService.processDaily({
                companyId: selectedCompanyId,
                date: processDate,
            })
            toast.success(
                `Processed ${result.recordsProcessed} rows (${result.presentCount} present, ${result.absentCount} absent)`,
            )
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Processing failed")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black tracking-tight">Attendance Punch Logs</h1>
                <p className="text-sm text-muted-foreground">
                    Upload raw device punches by badge number (<code className="font-mono">punchNumber</code>), then run daily processing.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-black">Company &amp; Payload</CardTitle>
                    <CardDescription>
                        JSON array with <code className="font-mono">punchNumber</code>, optional{" "}
                        <code className="font-mono">employeeID</code>, <code className="font-mono">punchTime</code>,{" "}
                        <code className="font-mono">deviceSerial</code>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Company</Label>
                            <NativeSelect
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                disabled={isLoadingCompanies}
                            >
                                {companies.map((c) => (
                                    <option key={c.entityId ?? c.id} value={c.entityId ?? ""}>
                                        {c.companyNameEn}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label>Process date</Label>
                            <input
                                type="date"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={processDate}
                                onChange={(e) => setProcessDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Punch logs JSON</Label>
                        <Textarea
                            value={payload}
                            onChange={(e) => setPayload(e.target.value)}
                            className="min-h-[220px] font-mono text-xs"
                        />
                        {parsed.error ? (
                            <p className="text-sm text-destructive">{parsed.error}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {parsed.logs.length} row(s) · {uniqueEmployees} badge(s) · {uniqueDevices} device(s)
                                {lastUploadCount !== null ? ` · last upload: ${lastUploadCount}` : ""}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={uploadLogs} disabled={isUploading} className="gap-2">
                            {isUploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
                            Upload logs
                        </Button>
                        <Button variant="secondary" onClick={processAttendance} disabled={isProcessing} className="gap-2">
                            {isProcessing ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />}
                            Process daily attendance
                        </Button>
                        <Button variant="outline" onClick={() => setPayload(samplePayload())}>
                            Reset sample
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {previewRows.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-black">Preview</CardTitle>
                        <CardDescription>First {previewRows.length} rows</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Punch #</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Device</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewRows.map((log, index) => (
                                    <TableRow key={`${log.punchNumber}-${log.punchTime}-${index}`}>
                                        <TableCell className="font-mono text-xs">{log.punchNumber}</TableCell>
                                        <TableCell className="font-mono text-xs">{log.employeeID ?? "—"}</TableCell>
                                        <TableCell className="text-xs">{formatPunchTime(log.punchTime)}</TableCell>
                                        <TableCell className="font-mono text-xs">{log.deviceSerial ?? "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-black">
                        <IconFingerprint className="size-5 text-primary" />
                        Matching rule
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Attendance processing groups punches by <strong>punchNumber</strong> (ZKTeco badge) and joins HR on{" "}
                    <code className="font-mono">Employees.PunchNumber</code>. Display code <code className="font-mono">EMP-0001</code> lives in{" "}
                    <code className="font-mono">employeeID</code> only.
                </CardContent>
            </Card>
        </div>
    )
}
