"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { payrollService } from "@/lib/services/payroll"
import type { DeductionDto } from "@/lib/services/payroll-types"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection } from "@/lib/payroll-utils"
import { PayrollPageHeader } from "@/components/payroll/payroll-page-header"
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function DeductionsPage() {
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [companyId, setCompanyId] = React.useState("")
  const [rows, setRows] = React.useState<DeductionDto[]>([])

  React.useEffect(() => {
    companyService.getAll().then((c) => {
      setCompanies(c)
      if (c[0]) setCompanyId(String(c[0].id))
    })
  }, [])

  const load = async () => {
    const guid = companyGuidFromSelection(companies, companyId)
    if (!guid) return
    try {
      setRows(await payrollService.getDeductions({ companyId: guid }))
    } catch {
      toast.error("Failed to load deductions")
    }
  }

  React.useEffect(() => {
    if (companyId) load()
  }, [companyId])

  const columns: ColumnDef<DeductionDto>[] = [
    { accessorKey: "deductionType", header: "Type" },
    { accessorKey: "yearNo", header: "Year" },
    { accessorKey: "monthNo", header: "Month" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => `৳${row.original.amount.toLocaleString()}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <PayrollStatusBadge status={row.original.status} /> },
  ]

  return (
    <div className="py-6 flex flex-col gap-6">
      <PayrollPageHeader title="Payroll Deductions" description="Manual and recurring payroll deductions" />
      <div className="px-6 flex gap-4 items-end">
        <div className="space-y-1">
          <Label>Company</Label>
          <NativeSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="min-w-[200px]">
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.companyNameEn}</option>
            ))}
          </NativeSelect>
        </div>
        <Button onClick={load}>Refresh</Button>
      </div>
      <div className="px-6">
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  )
}
