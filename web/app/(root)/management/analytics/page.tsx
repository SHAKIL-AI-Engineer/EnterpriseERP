"use client"

import * as React from "react"
import {
    IconActivity,
    IconBriefcase,
    IconCalendar,
    IconLoader,
    IconRefresh,
    IconUsers,
    IconUserCheck,
} from "@tabler/icons-react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    getAttendanceStats,
    getDashboardSummary,
    getDepartmentStats,
    getRecentHires,
    getUpcomingEvents,
    type AttendanceStat,
    type DashboardSummary,
    type DepartmentStat,
    type RecentHire,
    type UpcomingEvent,
} from "@/lib/services/dashboard"
import { cn } from "@/lib/utils"

const chartColors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#4b5563"]

export default function AnalyticsPage() {
    const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
    const [attendanceStats, setAttendanceStats] = React.useState<AttendanceStat[]>([])
    const [departmentStats, setDepartmentStats] = React.useState<DepartmentStat[]>([])
    const [recentHires, setRecentHires] = React.useState<RecentHire[]>([])
    const [upcomingEvents, setUpcomingEvents] = React.useState<UpcomingEvent[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const loadDashboard = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [summaryData, attendanceData, departmentData, hiresData, eventsData] = await Promise.all([
                getDashboardSummary(),
                getAttendanceStats(),
                getDepartmentStats(),
                getRecentHires(),
                getUpcomingEvents(),
            ])
            setSummary(summaryData)
            setAttendanceStats(attendanceData)
            setDepartmentStats(departmentData)
            setRecentHires(hiresData)
            setUpcomingEvents(eventsData)
        } catch (error) {
            console.error("Failed to load HR analytics", error)
            toast.error("Failed to load HR analytics")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    const departmentPie = React.useMemo(() => {
        const total = departmentStats.reduce((sum, item) => sum + item.employeeCount, 0) || 1
        return departmentStats.map((item, index) => ({
            name: item.departmentName,
            value: item.employeeCount,
            percentage: Math.round((item.employeeCount / total) * 100),
            color: item.color || chartColors[index % chartColors.length],
        }))
    }, [departmentStats])

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workforce Analytics</h1>
                    <p className="text-sm text-muted-foreground">Live HR dashboard data from the platform API.</p>
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 self-start md:self-auto" onClick={loadDashboard} disabled={isLoading}>
                    {isLoading ? <IconLoader className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Workforce"
                    value={(summary?.totalWorkforce ?? 0).toLocaleString()}
                    description={`${summary?.workforceGrowth ?? 0}% growth`}
                    icon={IconUsers}
                    className="text-blue-600"
                />
                <KPICard
                    title="Present Today"
                    value={(summary?.presentToday ?? 0).toLocaleString()}
                    description={`${summary?.attendanceTrend ?? 0}% attendance trend`}
                    icon={IconUserCheck}
                    className="text-emerald-600"
                />
                <KPICard
                    title="On Leave"
                    value={(summary?.onLeaveToday ?? 0).toLocaleString()}
                    description="Approved leave today"
                    icon={IconCalendar}
                    className="text-amber-600"
                />
                <KPICard
                    title="Open Positions"
                    value={(summary?.openPositions ?? 0).toLocaleString()}
                    description="From manpower planning"
                    icon={IconBriefcase}
                    className="text-violet-600"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Attendance Trend</CardTitle>
                        <CardDescription>Present count against workforce target</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[330px] w-full min-w-0">
                        {isLoading ? (
                            <LoadingPanel />
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                                initialDimension={{ width: 640, height: 330 }}
                            >
                                <BarChart data={attendanceStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="targetCount" fill="var(--muted)" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="presentCount" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Department Distribution</CardTitle>
                        <CardDescription>{departmentStats.length} department(s)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-[220px] min-w-0">
                            {isLoading ? (
                                <LoadingPanel />
                            ) : (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                    initialDimension={{ width: 320, height: 220 }}
                                >
                                    <PieChart>
                                        <Pie data={departmentPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                                            {departmentPie.map((entry) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <div className="space-y-2">
                            {departmentPie.slice(0, 6).map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="truncate font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{item.value} ({item.percentage}%)</span>
                                </div>
                            ))}
                            {!isLoading && departmentPie.length === 0 && (
                                <p className="text-sm text-muted-foreground">No department data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Recent Hires</CardTitle>
                        <CardDescription>Latest employees from HR records</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoading ? (
                            <LoadingPanel />
                        ) : recentHires.length > 0 ? (
                            recentHires.map((hire) => (
                                <div key={`${hire.name}-${hire.joinDate}`} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">{hire.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{hire.position} - {hire.department}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">{hire.joinDate}</Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No recent hires found.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
                        <CardDescription>HR events published by the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isLoading ? (
                            <LoadingPanel />
                        ) : upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                                <div key={`${event.name}-${event.date}`} className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                            <IconActivity className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">{event.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">{event.eventType}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">{event.date}</Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming events found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function LoadingPanel() {
    return (
        <div className="flex h-full min-h-32 items-center justify-center">
            <IconLoader className="size-6 animate-spin text-muted-foreground" />
        </div>
    )
}

function KPICard({
    title,
    value,
    description,
    icon: Icon,
    className,
}: {
    title: string
    value: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    className?: string
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
                    <div className={cn("rounded-lg bg-muted/50 p-2", className)}>
                        <Icon className="size-4" />
                    </div>
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <p className="mt-2 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
