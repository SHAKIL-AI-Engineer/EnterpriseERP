"use client";

import { useAccountsCompany } from "./accounts-company-context";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function CompanySelect({ className }: { className?: string }) {
  const { companies, companyId, setCompanyId, loading } = useAccountsCompany();

  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase text-muted-foreground">Company</Label>
      <NativeSelect
        className="mt-1 h-9 min-w-[200px]"
        value={companyId ?? ""}
        disabled={loading || companies.length === 0}
        onChange={(e) => setCompanyId(e.target.value || null)}
      >
        {companies.length === 0 ? (
          <NativeSelectOption value="">No companies</NativeSelectOption>
        ) : (
          companies.map((c) => (
            <NativeSelectOption key={c.entityId} value={c.entityId}>
              {c.companyNameEn}
            </NativeSelectOption>
          ))
        )}
      </NativeSelect>
    </div>
  );
}
