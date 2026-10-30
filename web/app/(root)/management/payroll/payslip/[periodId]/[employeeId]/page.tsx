"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { IconPrinter, IconLoader, IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { payrollService, type Payslip } from "@/lib/services/payroll"
import { toast } from "sonner"
import Link from "next/link"

export default function PayslipDetailPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const employeeId = params.employeeId as string

  const [isLoading, setIsLoading] = React.useState(true)
  const [data, setData] = React.useState<Payslip | null>(null)

  React.useEffect(() => {
    if (periodId && employeeId) {
      payrollService
        .getLegacyPayslip(periodId, employeeId)
        .then(setData)
        .catch(() => toast.error("Failed to load payslip"))
        .finally(() => setIsLoading(false))
    }
  }, [periodId, employeeId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <IconLoader className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p>Payslip not found</p>
        <Link href="/management/payroll/pay-slip">
          <Button variant="link">Back to Pay Slip</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-6 max-w-3xl mx-auto print:max-w-none">
      <div className="flex items-center justify-between px-6 print:hidden">
        <Link href="/management/payroll/pay-slip">
          <Button variant="ghost" size="sm" className="gap-2">
            <IconArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="gap-2">
          <IconPrinter className="size-4" />
          Print
        </Button>
      </div>

      <Card className="mx-6 print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Payslip</h1>
            <p className="text-muted-foreground text-sm">Employee: {data.employeeId}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Gross Salary</p>
              <p className="font-semibold">৳{data.grossSalary.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Payable</p>
              <p className="font-bold text-emerald-700 text-lg">৳{data.netPayable.toLocaleString()}</p>
            </div>
          </div>

          {data.earnings.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Earnings</h3>
              <ul className="space-y-1 text-sm">
                {data.earnings.map((e, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{e.name}</span>
                    <span>৳{e.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.deductions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Deductions</h3>
              <ul className="space-y-1 text-sm">
                {data.deductions.map((d, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{d.name}</span>
                    <span>৳{d.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
