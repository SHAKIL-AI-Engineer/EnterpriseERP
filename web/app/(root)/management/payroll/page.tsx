"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCash, IconPlayerPlay } from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"
import { format, addMonths, startOfMonth } from "date-fns"
import { payrollService } from "@/lib/services/payroll"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection } from "@/lib/payroll-utils"
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge"

export default function PayrollPage() {
  const nextPayDay = startOfMonth(addMonths(new Date(), 1))
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  const [companies, setCompanies] = React.useState<Company[]>([])
  const [summary, setSummary] = React.useState<{
    totalEmployees: number
    grossSalary: number
    totalDeduction: number
    netSalary: number
    status: string
  } | null>(null)
  React.useEffect(() => {
    companyService.getAll().then(async (list) => {
      setCompanies(list)
      const first = list[0]
      if (!first) return
      const guid = first.entityId
      try {
        const s = await payrollService.getPayrollSummary(guid, year, month)
        setSummary({
          totalEmployees: s.totalEmployees,
          grossSalary: s.grossSalary,
          totalDeduction: s.totalDeduction,
          netSalary: s.netSalary,
          status: s.status,
        })
      } catch {
        setSummary(null)
      }
    })
  }, [year, month])

  const progress =
    summary && summary.totalEmployees > 0
      ? summary.status === "Processed"
        ? 100
        : 25
      : 0

  return (
    <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground text-sm">Overview of payroll activities and status</p>
        </div>
        <Link href="/management/payroll/salary-process">
          <Button className="gap-2">
            <IconPlayerPlay className="size-4" />
            Run Payroll
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Next Pay Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{format(nextPayDay, "MMMM d, yyyy")}</p>
            <p className="text-sm text-muted-foreground mt-1">Scheduled Date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              Payroll Status
              {summary ? <PayrollStatusBadge status={summary.status} /> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IconCash className="size-5" />
              Payroll Summary — {format(new Date(), "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Gross Salary</p>
                <p className="text-2xl font-bold">৳{(summary?.grossSalary ?? 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold text-rose-600">৳{(summary?.totalDeduction ?? 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-2xl font-bold text-emerald-600">৳{(summary?.netSalary ?? 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{summary?.totalEmployees ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
