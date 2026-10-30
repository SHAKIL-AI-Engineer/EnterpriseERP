"use client"

import * as React from "react"
import { IconScale } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { leaveService } from "@/lib/services/leave"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { LeaveBalanceTable } from "@/components/leave/leave-balance-table"
import {
    EmployeeLeavePicker,
    type EmployeeLeaveSelection,
} from "@/components/leave/employee-leave-picker"
import { NativeSelect } from "@/components/ui/native-select"
import { mergeLeaveTypesWithPolicies } from "@/lib/services/leave-helpers"
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons"

export default function LeaveBalancesPage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const { user } = useAuth()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [employee, setEmployee] = React.useState<EmployeeLeaveSelection | null>(null)
    const [balances, setBalances] = React.useState<Awaited<ReturnType<typeof leaveService.getEmployeeBalances>>>([])
    const [leaveTypes, setLeaveTypes] = React.useState<{ id: string; name: string }[]>([])
    const [adjustTypeId, setAdjustTypeId] = React.useState("")
    const [adjustDays, setAdjustDays] = React.useState("0")
    const [adjustRemarks, setAdjustRemarks] = React.useState("")
    const [dayTypeDate, setDayTypeDate] = React.useState("")
    const [dayTypeResult, setDayTypeResult] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (!selectedCompanyId) return
        Promise.all([
            leaveService.listLeaveTypes(selectedCompanyId),
            leaveService.listLeavePolicies(selectedCompanyId),
        ]).then(([types, policies]) => {
            setLeaveTypes(
                mergeLeaveTypesWithPolicies(types, policies).map((x) => ({
                    id: x.type.id,
                    name: x.type.leaveName,
                }))
            )
        })
    }, [selectedCompanyId])

    const loadBalances = React.useCallback(async () => {
        if (!selectedCompanyId || !employee?.entityId) {
            setBalances([])
            return
        }
        setIsLoading(true)
        try {
            setBalances(
                await leaveService.getEmployeeBalances(employee.entityId, {
                    companyId: selectedCompanyId,
                    year,
                })
            )
        } catch {
            toast.error("Failed to load balances")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, employee, year])

    React.useEffect(() => {
        loadBalances()
    }, [loadBalances])

    const runGenerateYearly = async () => {
        if (!selectedCompanyId) return
        try {
            const n = await leaveService.generateYearlyBalances({
                companyId: selectedCompanyId,
                yearNo: year,
                triggeredBy: user?.id ?? null,
            })
            toast.success(`Generated balances for ${n} records`)
            loadBalances()
        } catch {
            toast.error("Generate yearly failed")
        }
    }

    const runAccrueMonthly = async () => {
        if (!selectedCompanyId) return
        try {
            const n = await leaveService.accrueMonthlyBalances({
                companyId: selectedCompanyId,
                yearNo: year,
                month: new Date().getMonth() + 1,
                triggeredBy: user?.id ?? null,
            })
            toast.success(`Accrued ${n} records`)
            loadBalances()
        } catch {
            toast.error("Accrue monthly failed")
        }
    }

    const runAdjust = async () => {
        if (!selectedCompanyId || !employee?.entityId || !adjustTypeId) return
        try {
            await leaveService.adjustLeaveBalance({
                companyId: selectedCompanyId,
                employeeId: employee.entityId,
                leaveTypeId: adjustTypeId,
                yearNo: year,
                adjustmentDays: parseFloat(adjustDays) || 0,
                remarks: adjustRemarks || "Manual adjustment",
            })
            toast.success("Balance adjusted")
            loadBalances()
        } catch {
            toast.error("Adjust failed")
        }
    }

    const lookupDayType = async () => {
        if (!selectedCompanyId || !employee?.entityId || !dayTypeDate) return
        try {
            const r = await leaveService.getDayType({
                companyId: selectedCompanyId,
                employeeId: employee.entityId,
                date: dayTypeDate,
            })
            setDayTypeResult(JSON.stringify(r, null, 2))
        } catch {
            toast.error("Day type lookup failed")
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconScale className="size-7" /> Leave Balances
            </h1>
            {selectedCompanyId && employee?.entityId && (
                <HrReportExportButtons
                    exportUrl="/api/v1/leave/reports/balances"
                    params={{ companyId: selectedCompanyId, employeeId: employee.entityId, year }}
                    filePrefix={`leave-balances-${year}`}
                    disabled={isLoading || balances.length === 0}
                />
            )}
            <LeaveAdvancedFilter
                showYear
                onFilterChange={(filters: LeaveFilterParams) => {
                    setSelectedCompanyId(filters.companyEntityId)
                    if (filters.year) setYear(filters.year)
                }}
                isLoading={isLoading}
                initialYear={year}
            />
            <Card>
                <CardContent className="pt-6">
                    <EmployeeLeavePicker value={employee} onChange={setEmployee} />
                </CardContent>
            </Card>
            <LeavePermissionGate permission="LEAVE_BALANCE_ADJUST">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Company operations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={runGenerateYearly}>Generate yearly</Button>
                        <Button variant="outline" onClick={runAccrueMonthly}>Accrue monthly</Button>
                    </CardContent>
                </Card>
            </LeavePermissionGate>
            {employee && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Balances ({year})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LeaveBalanceTable balances={balances} />
                        </CardContent>
                    </Card>
                    <LeavePermissionGate permission="LEAVE_BALANCE_ADJUST">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Adjust balance</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 max-w-xl">
                                <div className="space-y-1">
                                    <Label>Leave type</Label>
                                    <NativeSelect value={adjustTypeId} onChange={(e) => setAdjustTypeId(e.target.value)}>
                                        <option value="">Select</option>
                                        {leaveTypes.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="space-y-1">
                                    <Label>Days (+/-)</Label>
                                    <Input value={adjustDays} onChange={(e) => setAdjustDays(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label>Remarks</Label>
                                    <Input value={adjustRemarks} onChange={(e) => setAdjustRemarks(e.target.value)} />
                                </div>
                                <Button onClick={runAdjust}>Apply adjustment</Button>
                            </CardContent>
                        </Card>
                    </LeavePermissionGate>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Day type lookup</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-1">
                                <Label>Date (yyyy-MM-dd)</Label>
                                <Input value={dayTypeDate} onChange={(e) => setDayTypeDate(e.target.value)} placeholder="2026-05-20" />
                            </div>
                            <Button variant="outline" onClick={lookupDayType}>Lookup</Button>
                            {dayTypeResult && (
                                <pre className="text-xs bg-muted p-3 rounded-md w-full overflow-auto">{dayTypeResult}</pre>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
