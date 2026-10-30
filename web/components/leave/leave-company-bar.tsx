"use client";

import * as React from "react";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCompanyContext } from "@/components/providers/company-context";

interface LeaveCompanyBarProps {
  year?: number;
  onYearChange?: (year: number) => void;
  showYear?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function LeaveCompanyBar({
  year,
  onYearChange,
  showYear = true,
  onRefresh,
  isLoading,
  children,
}: LeaveCompanyBarProps) {
  const { activeCompanyId, companies, loading: companyLoading } = useCompanyContext();
  const activeName =
    companies.find((c) => c.entityId === activeCompanyId)?.companyNameEn ?? "No company";

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - 2 + i);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Active company</p>
        <p className="text-sm font-medium">
          {companyLoading ? "Loading…" : activeName}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {showYear && onYearChange && year !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <NativeSelect
              value={String(year)}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="w-[120px]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        {children}
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRefresh}
            disabled={isLoading || !activeCompanyId}
          >
            <IconRefresh className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
