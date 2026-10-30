'use client'

import * as React from "react"
import {
  IconLayoutDashboard,
  IconUsers,
  IconUserCheck,
  IconUserOff,
  IconBriefcase,
  IconTarget,
  IconRefresh,
  IconUserPlus,
  IconCalendar,
  IconGift
} from "@tabler/icons-react"
import { SummaryCard } from "@/components/summary-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { cn } from "@/lib/utils"
import {
  getDashboardSummary,
  getAttendanceStats,
  getDepartmentStats,
  getRecentHires,
  getUpcomingEvents,
  DashboardSummary,
  AttendanceStat,
  DepartmentStat,
  RecentHire,
  UpcomingEvent
} from "@/lib/services/dashboard"
import { toast } from "sonner"
import axios from "axios"
import { useAuth } from "@/components/providers/auth-provider"
import { isLogoutInProgress } from "@/lib/logout"

export default function Page() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [attendanceData, setAttendanceData] = React.useState<AttendanceStat[]>([])
  const [deptData, setDeptData] = React.useState<DepartmentStat[]>([])
  const [recentHires, setRecentHires] = React.useState<RecentHire[]>([])
  const [upcomingEvents, setUpcomingEvents] = React.useState<UpcomingEvent[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = async () => {
    if (isLogoutInProgress() || !isAuthenticated || !user) {
      return
    }
    setLoading(true)
    try {
      const [summaryRes, attendanceRes, deptRes, hiresRes, eventsRes] = await Promise.all([
        getDashboardSummary(),
        getAttendanceStats(),
        getDepartmentStats(),
        getRecentHires(),
        getUpcomingEvents()
      ])

      setSummary(summaryRes)
      setAttendanceData(attendanceRes)

      // Add colors to dept data
      const COLORS = ["var(--primary)", "#6366f1", "#a855f7", "#f43f5e", "#ec4899", "#10b981", "#f59e0b"];
      setDeptData(deptRes.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })))

      setRecentHires(hiresRes)
      setUpcomingEvents(eventsRes)
    } catch (error) {
      if (isLogoutInProgress() || axios.isCancel(error)) return
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 401) return
      console.error("Failed to fetch dashboard data", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (authLoading || !isAuthenticated || !user) {
      if (!authLoading) setLoading(false)
      return
    }
    void fetchData()
  }, [user, isAuthenticated, authLoading])

  const getEventIcon = (type: string) => {
    switch (type) {
      case "Birthday": return IconGift
      case "Work Anniversary": return IconCalendar
      default: return IconBriefcase
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "Birthday": return "text-pink-500 bg-pink-500/10"
      case "Work Anniversary": return "text-blue-500 bg-blue-500/10"
      default: return "text-emerald-500 bg-emerald-500/10"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Management Dashboard</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Enterprise Pulse • Session Active</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <IconRefresh className={cn("mr-2 size-4", loading && "animate-spin")} />
            Reload
          </Button>
          <Button size="sm">
            <IconUserPlus className="mr-2 size-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="grid place-items-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading dashboard metrics...</p>
        </div>
      ) : (
        <>
          {/* 1. KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Total Workforce"
              value={summary?.totalWorkforce.toLocaleString() || "0"}
              icon={IconUsers}
              trend={{ value: "0%", label: "stable", isUp: true }}
              status="primary"
              chartData={[40, 45, 42, 50, 48, 55, 60, 65].map((v) => ({ value: v }))}
            />
            <SummaryCard
              title="Attendance"
              value={summary ? Math.round((summary.presentToday / (summary.totalWorkforce || 1)) * 100) + "%" : "0%"}
              icon={IconUserCheck}
              trend={{ value: "0%", label: "today", isUp: true }}
              status="success"
              chartData={[90, 92, 94, 91, 95, 96, 97, 98].map((v) => ({ value: v }))}
            />
            <SummaryCard
              title="On Leave"
              value={summary?.onLeaveToday.toString() || "0"}
              icon={IconUserOff}
              trend={{ value: "0", label: "today", isUp: false }}
              status="warning"
              chartData={[10, 15, 12, 14, 18, 16, 14, 12].map((v) => ({ value: v }))}
            />
            <SummaryCard
              title="Open Positions"
              value={summary?.openPositions.toString() || "0"}
              icon={IconBriefcase}
              trend={{ value: "0", label: "vacancies", isUp: true }}
              status="info"
              chartData={[30, 32, 35, 38, 40, 39, 41, 42].map((v) => ({ value: v }))}
            />
          </div>

          {/* 2. Primary Analytics & Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Attendance Analysis */}
            <Card className="xl:col-span-2 rounded-md">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                  <CardTitle className="text-lg font-bold">Attendance Statistics</CardTitle>
                  <CardDescription>Daily workplace presence tracking (Last 7 Days).</CardDescription>
                </div>
                <SelectGroup />
              </CardHeader>
              <CardContent className="h-[350px] w-full min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 640, height: 350 }}
                >
                  <AreaChart data={attendanceData.map(d => ({ name: d.date, present: d.presentCount, target: d.targetCount }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="var(--primary)"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="var(--muted-foreground)"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Mix */}
            <div className="space-y-6">
              <Card className="rounded-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Workforce Allocation</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="h-[220px] w-full min-w-0 relative flex items-center justify-center">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 320, height: 220 }}
                    >
                      <PieChart>
                        <Pie
                          data={deptData.map(d => ({ name: d.departmentName, value: d.employeeCount, color: d.color }))}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {deptData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{summary?.totalWorkforce || 0}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Total Staff</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 w-full gap-2 mt-4">
                    {deptData.slice(0, 6).map((item) => (
                      <div key={item.departmentName} className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-muted-foreground truncate" title={item.departmentName}>{item.departmentName}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <IconTarget className="size-4 text-primary" />
                    System Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-sm font-semibold">
                    Utilization at <span className="text-primary">94%</span> capacity
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Resources are highly optimized this quarter. Recommend reviewing open headcount for upcoming Q3 projects to avoid burnout.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Operational Details Row */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Recent Joiners Table */}
            <Card className="xl:col-span-3 rounded-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Recent Hires</CardTitle>
                    <CardDescription>Latest employee onboarding records.</CardDescription>
                  </div>
                  <Button variant="link" size="sm" className="text-xs">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentHires.length === 0 ? <p className="text-sm text-muted-foreground">No recent hires found.</p> : recentHires.map((hire) => (
                    <div key={hire.name} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={hire.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hire.name}`} />
                          <AvatarFallback>{hire.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-semibold">{hire.name}</h4>
                          <p className="text-xs text-muted-foreground">{hire.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-[10px]">{hire.department}</Badge>
                        <span className="text-[10px] text-muted-foreground">{hire.joinDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Milestones & Events */}
            <Card className="xl:col-span-2 rounded-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
                <CardDescription>Organization milestones and celebrations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming events.</p> : upcomingEvents.map((event, idx) => {
                  const Icon = getEventIcon(event.eventType);
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className={cn("size-8 rounded-md flex items-center justify-center shrink-0 border", getEventColor(event.eventType))}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-semibold">{event.name}</h4>
                            <p className="text-xs text-muted-foreground">{event.eventType}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{event.date}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full text-xs">
                  View Calendar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

/* --- Styled Components & Helpers --- */

function SelectGroup() {
  return (
    <div className="flex bg-muted/50 p-1 rounded-full border">
      <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter bg-background rounded-full shadow-sm text-primary">Week</button>
      <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-foreground">Month</button>
      <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-muted-foreground hover:text-foreground">Year</button>
    </div>
  )
}

interface TooltipPayload {
  value: number;
  payload: { name: string; present: number; target: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border bg-background/95 p-4 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{payload[0].payload.name}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs font-bold text-muted-foreground">Active Staff</span>
            <span className="text-sm font-black text-primary">{payload[0].value}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs font-bold text-muted-foreground">Target</span>
            <span className="text-sm font-black">{payload[1].value}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}
