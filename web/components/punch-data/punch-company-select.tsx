"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select"
import type { Company } from "@/lib/services/company"
import { resolvePunchCompanyId } from "@/lib/punch-company"
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope"

type PunchCompanySelectProps = {
  value: string
  onValueChange: (entityId: string, punchCompanyId: number, company: Company | null) => void
  className?: string
}

export function PunchCompanySelect({ value, onValueChange, className }: PunchCompanySelectProps) {
  const { companies } = useCompanyFilterScope()

  const selected = companies.find((c) => c.entityId === value) ?? null
  const punchCompanyId = resolvePunchCompanyId(selected)

  return (
    <div className={className}>
      <Label className="text-xs font-bold uppercase text-muted-foreground">Company</Label>
      <ScopedCompanySelect
        value={value}
        onChange={(entityId, _legacyId) => {
          const company = companies.find((c) => c.entityId === entityId) ?? null
          onValueChange(entityId, resolvePunchCompanyId(company), company)
        }}
        className="mt-1.5 h-10"
      />
      <p className="mt-1 text-[11px] text-muted-foreground">
        Punch DB company id: <span className="font-mono font-semibold">{punchCompanyId}</span>
      </p>
    </div>
  )
}
