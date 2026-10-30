"use client";

import * as React from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import { entityIdFromFilterValue } from "@/lib/company-filter-scope";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (entityId: string, legacyId?: number) => void;
  disabled?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  isLoading?: boolean;
  placeholder?: string;
};

export function ScopedCompanySelect({
  value,
  onChange,
  disabled = false,
  showAllOption = false,
  allOptionLabel = "All Companies",
  className,
  isLoading = false,
  placeholder = "Select company",
}: Props) {
  const { companies, loading, isCompanyLocked, lockedCompany, defaultCompany } =
    useCompanyFilterScope();

  const effectiveValue = React.useMemo(() => {
    if (isCompanyLocked && lockedCompany) return lockedCompany.entityId;
    if (value) return entityIdFromFilterValue(value, companies) || value;
    return defaultCompany?.entityId ?? "";
  }, [isCompanyLocked, lockedCompany, value, companies, defaultCompany]);

  const didInitRef = React.useRef(false);

  React.useEffect(() => {
    if (loading || isLoading || didInitRef.current) return;
    if (isCompanyLocked && lockedCompany && effectiveValue !== value) {
      didInitRef.current = true;
      onChange(lockedCompany.entityId, lockedCompany.id);
      return;
    }
    if (!value && defaultCompany && !showAllOption) {
      didInitRef.current = true;
      onChange(defaultCompany.entityId, defaultCompany.id);
    }
  }, [
    loading,
    isLoading,
    isCompanyLocked,
    lockedCompany,
    effectiveValue,
    value,
    defaultCompany,
    showAllOption,
    onChange,
  ]);

  const selectDisabled = disabled || isLoading || loading || isCompanyLocked;

  return (
    <NativeSelect
      value={effectiveValue || (showAllOption ? "all" : "")}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "all") {
          onChange("", undefined);
          return;
        }
        const company = companies.find((c) => c.entityId === raw);
        onChange(raw, company?.id);
      }}
      className={cn("h-9", className)}
      disabled={selectDisabled}
    >
      {showAllOption ? <option value="all">{allOptionLabel}</option> : null}
      {!showAllOption && !effectiveValue ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {companies.map((c) => (
        <option key={c.entityId} value={c.entityId}>
          {c.companyNameEn}
        </option>
      ))}
    </NativeSelect>
  );
}
