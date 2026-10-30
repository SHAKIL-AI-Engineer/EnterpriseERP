"use client"

import * as React from "react"
import { IconRefresh, IconShieldCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { toast } from "sonner"
import { payrollService } from "@/lib/services/payroll"
import type {
    PayrollPolicyTemplateDto,
    CompanyPayrollPolicyAssignmentDto,
} from "@/lib/services/payroll-types"
import { companyService, type Company } from "@/lib/services/company"
import { useAuth } from "@/components/providers/auth-provider"
import { getHttpErrorMessage } from "@/lib/api-response"
import { LoadingOverlay } from "@/components/loading-state"

export default function PayrollPoliciesPage() {
    const { user } = useAuth()
    const [templates, setTemplates] = React.useState<PayrollPolicyTemplateDto[]>([])
    const [companies, setCompanies] = React.useState<Company[]>([])
    const [assignments, setAssignments] = React.useState<Record<string, CompanyPayrollPolicyAssignmentDto | null>>({})
    const [loading, setLoading] = React.useState(true)
    const [refreshing, setRefreshing] = React.useState(false)
    const [assigning, setAssigning] = React.useState(false)

    const [selectedCompanyId, setSelectedCompanyId] = React.useState("")
    const [selectedPolicyCode, setSelectedPolicyCode] = React.useState("")
    const [effectiveFrom, setEffectiveFrom] = React.useState(() => new Date().toISOString().slice(0, 10))
    const [fixedOvertimeRate, setFixedOvertimeRate] = React.useState("")

    const selectedTemplate = templates.find((t) => t.policyCode === selectedPolicyCode)
    const showFixedOtRate = selectedPolicyCode === "BDT_NONCOMPLIANCE_FIXED_OT_V1"
    const currentAssignment = selectedCompanyId ? assignments[selectedCompanyId] : null

    const loadData = React.useCallback(async () => {
        const [templateList, companyList] = await Promise.all([
            payrollService.getPayrollPolicyTemplates(),
            companyService.getAll(),
        ])
        setTemplates(templateList)
        setCompanies(companyList)

        const assignmentEntries = await Promise.all(
            companyList.map(async (c) => {
                try {
                    const assignment = await payrollService.getAdminCompanyPayrollPolicy(c.entityId)
                    return [c.entityId, assignment] as const
                } catch {
                    return [c.entityId, null] as const
                }
            }),
        )
        setAssignments(Object.fromEntries(assignmentEntries))

        if (!selectedCompanyId && companyList[0]?.entityId) {
            setSelectedCompanyId(companyList[0].entityId)
        }
        if (!selectedPolicyCode && templateList[0]?.policyCode) {
            setSelectedPolicyCode(templateList[0].policyCode)
        }
    }, [selectedCompanyId, selectedPolicyCode])

    React.useEffect(() => {
        setLoading(true)
        loadData()
            .catch((err) => toast.error(getHttpErrorMessage(err, "Failed to load payroll policies")))
            .finally(() => setLoading(false))
    }, [loadData])

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await loadData()
            toast.success("Refreshed")
        } catch (err) {
            toast.error(getHttpErrorMessage(err, "Failed to refresh"))
        } finally {
            setRefreshing(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedCompanyId || !selectedPolicyCode) {
            toast.error("Select a company and policy template")
            return
        }
        if (showFixedOtRate && !fixedOvertimeRate) {
            toast.error("Fixed OT rate is required for this policy")
            return
        }

        setAssigning(true)
        try {
            const result = await payrollService.assignCompanyPayrollPolicy({
                companyId: selectedCompanyId,
                policyCode: selectedPolicyCode,
                effectiveFrom,
                assignedBy: user?.id ?? null,
                fixedOvertimeRate:
                    showFixedOtRate && fixedOvertimeRate ? parseFloat(fixedOvertimeRate) : null,
            })
            setAssignments((prev) => ({ ...prev, [selectedCompanyId]: result }))
            toast.success("Payroll policy assigned")
        } catch (err) {
            toast.error(getHttpErrorMessage(err, "Failed to assign policy"))
        } finally {
            setAssigning(false)
        }
    }

    if (loading) {
        return <LoadingOverlay message="Loading payroll policies..." />
    }

    return (
        <div className="container py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <IconShieldCheck className="size-7 text-primary" />
                        Payroll Policies
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        SuperAdmin only. Assign company payroll calculation templates — users cannot override at process time.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    <IconRefresh className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Policy Templates</CardTitle>
                    <CardDescription>Seeded BDT salary structure and calculation rules</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">Code</th>
                                    <th className="py-2 pr-4 font-medium">Name</th>
                                    <th className="py-2 pr-4 font-medium">Compliance</th>
                                    <th className="py-2 pr-4 font-medium">OT</th>
                                    <th className="py-2 pr-4 font-medium">Absent</th>
                                    <th className="py-2 font-medium">Summary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((t) => (
                                    <tr key={t.id} className="border-b last:border-0">
                                        <td className="py-3 pr-4 font-mono text-xs">{t.policyCode}</td>
                                        <td className="py-3 pr-4">{t.policyName}</td>
                                        <td className="py-3 pr-4">
                                            <Badge variant={t.complianceMode === "FullCompliance" ? "default" : "secondary"}>
                                                {t.complianceMode}
                                            </Badge>
                                        </td>
                                        <td className="py-3 pr-4 text-xs">
                                            {t.otBase} ÷ {t.otDivisor} × {t.otMultiplier}
                                        </td>
                                        <td className="py-3 pr-4 text-xs">
                                            {t.absentBase} ÷ {t.absentDayDivisor}
                                        </td>
                                        <td className="py-3 text-xs text-muted-foreground">{t.summary}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Company Assignment</CardTitle>
                    <CardDescription>Bind a company to one active policy template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Company</Label>
                            <NativeSelect
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                            >
                                <option value="">Select company</option>
                                {companies.map((c) => (
                                    <option key={c.entityId} value={c.entityId}>
                                        {c.companyNameEn}
                                    </option>
                                ))}
                            </NativeSelect>
                            {currentAssignment && (
                                <p className="text-xs text-muted-foreground">
                                    Current: {currentAssignment.policyName} (v{currentAssignment.policyVersion}) from{" "}
                                    {currentAssignment.effectiveFrom.slice(0, 10)}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Policy template</Label>
                            <NativeSelect
                                value={selectedPolicyCode}
                                onChange={(e) => setSelectedPolicyCode(e.target.value)}
                            >
                                <option value="">Select policy</option>
                                {templates.map((t) => (
                                    <option key={t.policyCode} value={t.policyCode}>
                                        {t.policyName}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>
                        <div className="space-y-2">
                            <Label>Effective from</Label>
                            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                        </div>
                        {showFixedOtRate && (
                            <div className="space-y-2">
                                <Label>Fixed OT rate (per hour)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={fixedOvertimeRate}
                                    onChange={(e) => setFixedOvertimeRate(e.target.value)}
                                    placeholder="Required for fixed OT policy"
                                />
                            </div>
                        )}
                    </div>

                    {selectedTemplate && (
                        <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
                            {selectedTemplate.summary}
                        </div>
                    )}

                    <Button onClick={handleAssign} disabled={assigning} className="w-full md:w-auto">
                        {assigning ? "Assigning..." : "Assign policy to company"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Current Assignments</CardTitle>
                    <CardDescription>Active policy per company</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">Company</th>
                                    <th className="py-2 pr-4 font-medium">Policy</th>
                                    <th className="py-2 pr-4 font-medium">Effective</th>
                                    <th className="py-2 font-medium">Fixed OT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies.map((c) => {
                                    const a = assignments[c.entityId]
                                    return (
                                        <tr key={c.entityId} className="border-b last:border-0">
                                            <td className="py-3 pr-4">{c.companyNameEn}</td>
                                            <td className="py-3 pr-4">
                                                {a ? (
                                                    <span>
                                                        {a.policyName}{" "}
                                                        <span className="text-muted-foreground font-mono text-xs">
                                                            ({a.policyCode})
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <Badge variant="outline">Not assigned</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-xs">
                                                {a ? a.effectiveFrom.slice(0, 10) : "—"}
                                            </td>
                                            <td className="py-3 text-xs">
                                                {a?.fixedOvertimeRate != null ? a.fixedOvertimeRate : "—"}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
