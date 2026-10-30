"use client";

import { useEffect, useState } from "react";
import { accountsService } from "@/lib/services/accounts";
import type { ChartOfAccountDto } from "@/lib/services/accounts-types";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function AccountPicker({
  companyId,
  value,
  onChange,
  label = "Account",
  cashOnly,
  bankOnly,
  required,
}: {
  companyId: string | null;
  value: string;
  onChange: (accountId: string) => void;
  label?: string;
  cashOnly?: boolean;
  bankOnly?: boolean;
  required?: boolean;
}) {
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);

  useEffect(() => {
    if (!companyId) return;
    accountsService
      .getChartOfAccounts(companyId)
      .then((list) => {
        let filtered = list.filter((a) => a.isActive);
        if (cashOnly) filtered = filtered.filter((a) => a.isCashAccount);
        if (bankOnly) filtered = filtered.filter((a) => a.isBankAccount);
        setAccounts(filtered);
      })
      .catch(() => setAccounts([]));
  }, [companyId, cashOnly, bankOnly]);

  const displayAccounts = companyId ? accounts : [];

  return (
    <div className="space-y-1">
      <Label>{label}{required ? " *" : ""}</Label>
      <NativeSelect
        value={value}
        required={required}
        disabled={!companyId}
        onChange={(e) => onChange(e.target.value)}
      >
        <NativeSelectOption value="" disabled>
          Select account…
        </NativeSelectOption>
        {displayAccounts.map((a) => (
          <NativeSelectOption key={a.id} value={a.id}>
            {a.accountCode} — {a.accountName}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
