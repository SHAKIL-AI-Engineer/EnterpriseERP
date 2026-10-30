"use client"

import * as React from "react"
import { IconCoin } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { leaveService } from "@/lib/services/leave"
import { mergeLeaveTypesWithPolicies } from "@/lib/services/leave-helpers"
import { toast } from "sonner"
import { LeaveAdvancedFilter, type LeaveFilterParams } from "@/components/leave/leave-advanced-filter"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"
import { LeaveBalanceTable } from "@/components/leave/leave-balance-table"
import {
    EmployeeLeavePicker,
    type EmployeeLeaveSelection,
} from "@/components/leave/employee-leave-picker"

export default function EarnLeavePage() {
    const [selectedCompanyId, setSelectedCompanyId] = React.useState<string | undefined>()
    const [year, setYear] = React.useState(new Date().getFullYear())
    const [month, setMonth] = React.useState(new Date().getMonth() + 1)
    const [employee, setEmployee] = React.useState<EmployeeLeaveSelection | null>(null)
    const [leaveTypeId, setLeaveTypeId] = React.useState("")
    const [leaveTypes, setLeaveTypes] = React.useState<{ id: string; name: string }[]>([])
    const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof leaveService.getEarnLeaveSummary>>>([])
    const [isLoading, setIsLoading] = React.useState(false)

    React.useEffect(() => {
        if (!selectedCompanyId) return
        Promise.all([
            leaveService.listLeaveTypes(selectedCompanyId),
            leaveService.listLeavePolicies(selectedCompanyId),
        ]).then(([types, policies]) => {
            const merged = mergeLeaveTypesWithPolicies(types, policies)
            setLeaveTypes(merged.map((x) => ({ id: x.type.id, name: x.type.leaveName })))
            if (merged[0]) setLeaveTypeId(merged[0].type.id)
        })
    }, [selectedCompanyId])

    const loadSummary = React.useCallback(async () => {
        if (!selectedCompanyId || !employee?.entityId) {
            setSummary([])
            return
        }
        setIsLoading(true)
        try {
            setSummary(
                await leaveService.getEarnLeaveSummary(employee.entityId, {
                    companyId: selectedCompanyId,
                    year,
                })
            )
        } catch {
            toast.error("Failed to load earn leave summary")
        } finally {
            setIsLoading(false)
        }
    }, [selectedCompanyId, employee, year])

    React.useEffect(() => {
        loadSummary()
    }, [loadSummary])

    const handleGenerate = async () => {
        if (!selectedCompanyId || !employee?.entityId || !leaveTypeId) return
        try {
            const result = await leaveService.generateEarnLeave({
                companyId: selectedCompanyId,
                employeeId: employee.entityId,
                leaveTypeId,
                yearNo: year,
                month,
            })
            toast.success(`Earned ${result.earnedDays} days`)
            loadSummary()
        } catch {
            toast.error("Generate earn leave failed")
        }
    }

    return (
        <div className="flex flex-col gap-6 py-6 px-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <IconCoin className="size-7" /> Earn Leave
            </h1>
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
            {employee && (
                <>
                    <LeavePermissionGate permission="EARN_LEAVE_GENERATE">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Generate for month</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-4 items-end">
                                <div className="space-y-1">
                                    <Label>Leave type</Label>
                                    <NativeSelect value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
                                        {leaveTypes.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <div className="space-y-1">
                                    <Label>Month</Label>
                                    <NativeSelect value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </NativeSelect>
                                </div>
                                <Button onClick={handleGenerate}>Generate</Button>
                            </CardContent>
                        </Card>
                    </LeavePermissionGate>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Summary ({year})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LeaveBalanceTable balances={summary} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
