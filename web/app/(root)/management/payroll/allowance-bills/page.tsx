"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { payrollService } from "@/lib/services/payroll"
import type { AllowanceBillDto } from "@/lib/services/payroll-types"
import { companyService, type Company } from "@/lib/services/company"
import { companyGuidFromSelection } from "@/lib/payroll-utils"
import { PayrollPageHeader } from "@/components/payroll/payroll-page-header"
import { PayrollStatusBadge } from "@/components/payroll/payroll-status-badge"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function AllowanceBillsPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [companyId, setCompanyId] = React.useState("")
  const [rows, setRows] = React.useState<AllowanceBillDto[]>([])

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
      setRows(await payrollService.getAllowanceBills({ companyId: guid }))
    } catch {
      toast.error("Failed to load allowance bills")
    }
  }

  React.useEffect(() => {
    if (companyId) load()
  }, [companyId])

  const columns: ColumnDef<AllowanceBillDto>[] = [
    { accessorKey: "allowanceType", header: "Type" },
    { accessorKey: "billDate", header: "Date" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => `৳${row.original.amount.toLocaleString()}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <PayrollStatusBadge status={row.original.status} /> },
    {
      id: "approve",
      header: "",
      cell: ({ row }) =>
        row.original.status === "Pending" && user?.id ? (
          <Button
            size="sm"
            onClick={async () => {
              await payrollService.approveAllowanceBill(row.original.id, { userId: user.id })
              load()
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="py-6 flex flex-col gap-6">
      <PayrollPageHeader title="Allowance Bills" description="Tiffin, night bill, and other allowance requests" />
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
