"use client"

import * as React from "react"
import Link from "next/link"
import { IconCheck, IconPlayerPlay, IconRefresh, IconShield } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { payrollService } from "@/lib/services/payroll"
import type { CompanyPayrollPolicySummaryDto } from "@/lib/services/payroll-types"
import { payrollMonthKey } from "@/lib/payroll-utils"
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select"
import { useAuth } from "@/components/providers/auth-provider"
import { getHttpErrorMessage } from "@/lib/api-response"

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
]

export default function SalaryProcessPage() {
    const { user } = useAuth()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [selectedCompanyEntityId, setSelectedCompanyEntityId] = React.useState("")
    const [companyPolicy, setCompanyPolicy] = React.useState<CompanyPayrollPolicySummaryDto | null>(null)
    const [policyLoading, setPolicyLoading] = React.useState(false)

    const [status, setStatus] = React.useState<"idle" | "processing" | "success">("idle")
    const [progress, setProgress] = React.useState(0)
    const [message, setMessage] = React.useState("")
    const [lastMonthKey, setLastMonthKey] = React.useState<string | null>(null)
    const [showReprocess, setShowReprocess] = React.useState(false)
    const [monthStatus, setMonthStatus] = React.useState<string | null>(null)
    const [statusLoading, setStatusLoading] = React.useState(false)

    React.useEffect(() => {
        if (!selectedCompanyEntityId) {
            setMonthStatus(null)
            setCompanyPolicy(null)
            return
        }
        let cancelled = false
        setStatusLoading(true)
        setPolicyLoading(true)
        Promise.all([
            payrollService.getPayrollSummary(selectedCompanyEntityId, year, month),
            payrollService.getCompanyPayrollPolicy(selectedCompanyEntityId),
        ])
            .then(([summary, policy]) => {
                if (!cancelled) {
                    setMonthStatus(summary.status)
                    setShowReprocess(summary.status === "Processed")
                    setCompanyPolicy(policy)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setMonthStatus(null)
                    setCompanyPolicy(null)
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setStatusLoading(false)
                    setPolicyLoading(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [selectedCompanyEntityId, year, month])

    const runProcess = async (forceReprocess: boolean) => {
        setStatus("processing")
        setProgress(10)
        setMessage(forceReprocess ? "Reprocessing payroll..." : "Initializing payroll engine...")
        setShowReprocess(false)

        try {
            const companyGuid = selectedCompanyEntityId
            if (!companyGuid) {
                toast.error("Select a company to process payroll")
                setStatus("idle")
                return
            }

            if (!companyPolicy) {
                toast.error("Salary policy not assigned. Contact Super Admin.")
                setStatus("idle")
                return
            }

            setLastMonthKey(payrollMonthKey(companyGuid, year, month))

            const body = {
                companyId: companyGuid,
                yearNo: year,
                monthNo: month,
                processedBy: user?.id ?? null,
                forceReprocess,
            }

            const result = forceReprocess ? await payrollService.reprocessPayroll(body) : await payrollService.processPayroll(body)
            if (result && typeof result === "object" && "success" in result && result.success === false) throw new Error("Payroll processing was rejected by the server.")

            setProgress(100)
            setStatus("success")
            setMessage("Payroll processed successfully")
            toast.success(forceReprocess ? "Payroll reprocessed" : "Payroll processed successfully")
            setMonthStatus("Processed")
            setShowReprocess(true)
        } catch (error: unknown) {
            setStatus("idle")
            const msg = getHttpErrorMessage(error, "Failed to process payroll")
            toast.error(msg)
            if (msg.toLowerCase().includes("already processed") || msg.toLowerCase().includes("reprocess")) {
                setShowReprocess(true)
            }
        }
    }

    return (
        <div className="container max-w-2xl mx-auto py-10 animate-in fade-in duration-500">
            <div className="space-y-1 mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Salary Processing</h1>
                <p className="text-muted-foreground text-sm">
                    Run payroll for a company and month. Calculation rules come from the assigned company policy.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Process Configuration</CardTitle>
                    <CardDescription>Company and month — policy is assigned by Super Admin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <NativeSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                                {MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <NativeSelect value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Company</Label>
                            <ScopedCompanySelect
                                value={selectedCompanyEntityId}
                                onChange={(entityId) => setSelectedCompanyEntityId(entityId)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    {selectedCompanyEntityId && (
                        <div className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconShield className="size-4 text-primary" />
                                Assigned payroll policy
                            </div>
                            {policyLoading ? (
                                <p className="text-xs text-muted-foreground">Loading policy…</p>
                            ) : companyPolicy ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{companyPolicy.policyName}</Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {companyPolicy.policyCode} v{companyPolicy.version}
                                    </span>
                                    {companyPolicy.fixedOvertimeRate != null && (
                                        <span className="text-xs text-muted-foreground">
                                            Fixed OT: {companyPolicy.fixedOvertimeRate}/hr
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-destructive">
                                    No salary policy assigned for this company. Contact Super Admin to assign a policy
                                    before processing.
                                </p>
                            )}
                        </div>
                    )}

                    {selectedCompanyEntityId && (
                        <div className="text-xs text-muted-foreground">
                            {statusLoading
                                ? "Checking payroll status…"
                                : monthStatus === "Processed"
                                  ? "Payroll already processed for this month. Use Reprocess to overwrite."
                                  : "No payroll run for this month yet."}
                        </div>
                    )}

                    {status === "idle" && (
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={() => runProcess(false)}
                                disabled={!companyPolicy}
                            >
                                <IconPlayerPlay className="size-4" />
                                Run Processing
                            </Button>
                            {showReprocess && (
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => runProcess(true)}
                                    disabled={!companyPolicy}
                                >
                                    <IconRefresh className="size-4" />
                                    Reprocess (overwrite existing)
                                </Button>
                            )}
                        </div>
                    )}

                    {status === "processing" && (
                        <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium animate-pulse">{message}</span>
                                <span className="font-bold">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <IconCheck className="size-6" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Processing Complete</h3>
                                <p className="text-sm text-muted-foreground">{message}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {lastMonthKey && (
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={`/management/payroll/salary-sheet?companyId=${encodeURIComponent(selectedCompanyEntityId)}&year=${year}&month=${month}`}
                                        >
                                            Salary sheet
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <Button variant="ghost" onClick={() => setStatus("idle")}>
                                Process another
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
