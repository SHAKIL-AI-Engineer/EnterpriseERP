"use client";

import { useCompanyContext } from "@/components/providers/company-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GlobalCompanySelect() {
  const { companies, activeCompanyId, setActiveCompanyId, loading, isCompanyLocked } =
    useCompanyContext();

  if (loading || companies.length === 0) {
    return null;
  }

  if (isCompanyLocked && activeCompanyId) {
    const only = companies[0];
    return (
      <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:inline">
        {only.companyNameEn || only.entityId.slice(0, 8)}
      </span>
    );
  }

  return (
    <Select
      value={activeCompanyId ?? undefined}
      onValueChange={(value) => setActiveCompanyId(value)}
    >
      <SelectTrigger className="h-9 w-[160px] border-border bg-card/80 text-xs lg:w-[200px]">
        <SelectValue placeholder="Select company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.entityId} value={company.entityId}>
            {company.companyNameEn || company.entityId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
