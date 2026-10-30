"use client";

import * as React from "react";
import { ScopedCompanySelect } from "@/components/hr/scoped-company-select";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import { cn } from "@/lib/utils";

type Props = {
  /** Legacy numeric id as string, or sentinel (e.g. `"all"` / `"All"`). */
  value: string;
  onChange: (value: string) => void;
  allValue?: string;
  allOptionLabel?: string;
  className?: string;
  isLoading?: boolean;
};

/** Company dropdown for pages that filter by legacy numeric `companyId`. */
export function ManagementLegacyCompanySelect({
  value,
  onChange,
  allValue = "all",
  allOptionLabel = "All Companies",
  className,
  isLoading = false,
}: Props) {
  const { companies, isCompanyLocked } = useCompanyFilterScope();

  const entityValue = React.useMemo(() => {
    if (value === allValue) return "";
    const company = companies.find((c) => String(c.id) === value);
    return company?.entityId ?? "";
  }, [value, allValue, companies]);

  return (
    <ScopedCompanySelect
      value={entityValue}
      onChange={(entityId, legacyId) => {
        if (!entityId) {
          onChange(allValue);
          return;
        }
        onChange(legacyId != null ? String(legacyId) : allValue);
      }}
      showAllOption={!isCompanyLocked}
      allOptionLabel={allOptionLabel}
      className={cn("h-10", className)}
      isLoading={isLoading}
    />
  );
}
