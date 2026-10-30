"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    IconCalendar,
    IconUser,
    IconNote,
    IconClock,
    IconArrowLeft,
    IconLoader,
    IconPrinter,
    IconCheck,
    IconX,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { leaveService } from "@/lib/services/leave"
import { enrichApplication, type LeaveApplicationView } from "@/lib/services/leave-helpers"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "@/components/providers/auth-provider"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { LeaveApprovalSteps } from "@/components/leave/leave-approval-steps"
import { LeavePermissionGate } from "@/components/leave/leave-permission-gate"

export default function LeaveApplicationDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const { user } = useAuth()

    const [application, setApplication] = React.useState<LeaveApplicationView | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isActionLoading, setIsActionLoading] = React.useState(false)

    const loadApplication = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const app = await leaveService.getLeaveApplicationById(id)
            setApplication(await enrichApplication(app, app.companyId))
        } catch {
            toast.error("Failed to load leave application")
            router.push("/management/leave")
        } finally {
            setIsLoading(false)
        }
    }, [id, router])

    React.useEffect(() => {
        loadApplication()
    }, [loadApplication])

    const actorId = user?.id ?? ""

    const handleAction = async (status: "Approved" | "Rejected") => {
        if (!actorId) return
        setIsActionLoading(true)
        try {
            if (status === "Approved") {
                await leaveService.approveLeaveApplication(id, { approvedBy: actorId, approverUserId: actorId })
            } else {
                await leaveService.rejectLeaveApplication(id, {
                    rejectedBy: actorId,
                    remarks: "Rejected via UI",
                    approverUserId: actorId,
                })
            }
            toast.success(`Leave ${status.toLowerCase()}`)
            loadApplication()
        } catch {
            toast.error("Action failed")
        } finally {
            setIsActionLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!actorId) return
        setIsActionLoading(true)
        try {
            await leaveService.cancelLeaveApplication(id, actorId)
            toast.success("Application cancelled")
            loadApplication()
        } catch {
            toast.error("Cancel failed")
        } finally {
            setIsActionLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <IconLoader className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!application) return null

    return (
        <div className="flex flex-col gap-6 py-6 max-w-5xl mx-auto px-6">
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <Button variant="ghost" className="gap-2 pl-0" onClick={() => router.back()}>
                    <IconArrowLeft className="size-4" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => router.push(`/management/leave/application/${id}/export`)}>
                        <IconPrinter className="size-4" /> Print Form
                    </Button>
                    {application.status === "Pending" && (
                        <>
                            <LeavePermissionGate permission="LEAVE_APPROVE">
                                <Button className="gap-2" disabled={isActionLoading} onClick={() => handleAction("Approved")}>
                                    <IconCheck className="size-4" /> Approve
                                </Button>
                            </LeavePermissionGate>
                            <LeavePermissionGate permission="LEAVE_REJECT">
                                <Button variant="destructive" className="gap-2" disabled={isActionLoading} onClick={() => handleAction("Rejected")}>
                                    <IconX className="size-4" /> Reject
                                </Button>
                            </LeavePermissionGate>
                            <LeavePermissionGate permission="LEAVE_CANCEL">
                                <Button variant="outline" disabled={isActionLoading} onClick={handleCancel}>Cancel</Button>
                            </LeavePermissionGate>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="border-b">
                            <LeaveStatusBadge status={application.status} />
                            <h1 className="text-2xl font-bold mt-2">{application.leaveTypeName} Request</h1>
                            <p className="text-sm text-muted-foreground">
                                Applied {format(new Date(application.appliedDate), "dd MMM yyyy")}
                            </p>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Start</p>
                                    <p className="font-medium">{format(new Date(application.startDate), "dd MMM yyyy")}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">End</p>
                                    <p className="font-medium">{format(new Date(application.endDate), "dd MMM yyyy")}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                                <p className="text-sm bg-muted/50 p-3 rounded-md border">{application.reason}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <IconNote className="size-4" /> Approval steps
                                </p>
                                <LeaveApprovalSteps steps={application.steps} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <IconUser className="size-4" /> Applicant
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <p className="font-semibold">{application.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{application.employeeId}</p>
                        <p className="text-sm">{application.department}</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/management/human-resource/employee-info/${application.employeeId}`)}
                        >
                            View profile
                        </Button>
                        <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconClock className="size-3" /> {application.totalDays} day(s)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
