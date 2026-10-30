"use client";

import * as React from "react";
import {
  IconSearch,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconAdjustmentsHorizontal,
  IconLoader,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/components/providers/auth-provider";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import { cn } from "@/lib/utils";
import {
  leaveFiltersFromCompany,
  pickDefaultLeaveCompany,
  type LeaveFilterParams,
} from "@/lib/leave-filter";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type { LeaveFilterParams };

interface LeaveAdvancedFilterProps {
  onFilterChange: (filters: LeaveFilterParams) => void;
  className?: string;
  showYear?: boolean;
  showMonth?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
  isLoading?: boolean;
  statusOptions?: { label: string; value: string }[];
  initialYear?: number;
  initialMonth?: number;
}

export function LeaveAdvancedFilter({
  onFilterChange,
  className,
  showYear = false,
  showMonth = false,
  showStatus = false,
  showSearch = false,
  isLoading = false,
  statusOptions = [
    { label: "All statuses", value: "all" },
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Cancelled", value: "Cancelled" },
  ],
  initialYear,
  initialMonth,
}: LeaveAdvancedFilterProps) {
  const { user } = useAuth();
  const { companies, isCompanyLocked, defaultCompany, loading: companiesLoading } =
    useCompanyFilterScope();
  const isCompanyDisabled = isCompanyLocked;
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const [filters, setFilters] = React.useState<LeaveFilterParams>(() => ({
    year: initialYear ?? new Date().getFullYear(),
    month: initialMonth ?? new Date().getMonth() + 1,
    status: "all",
  }));

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - 2 + i);
  }, []);

  const onFilterChangeRef = React.useRef(onFilterChange);

  React.useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  React.useEffect(() => {
    if (companiesLoading || initialized || companies.length === 0) return;
    const picked = pickDefaultLeaveCompany(companies, user?.defaultCompanyId);
    const next = leaveFiltersFromCompany(picked, {
      year: initialYear ?? new Date().getFullYear(),
      month: initialMonth ?? new Date().getMonth() + 1,
      status: "all",
    });
    setFilters(next);
    onFilterChangeRef.current(next);
    setInitialized(true);
  }, [
    companiesLoading,
    companies,
    initialized,
    initialYear,
    initialMonth,
    user?.defaultCompanyId,
  ]);

  const handleFilterChange = (key: keyof LeaveFilterParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanyChange = (entityId: string) => {
    const company = companies.find((c) => c.entityId === entityId);
    setFilters((prev) =>
      leaveFiltersFromCompany(company, {
        year: prev.year,
        month: prev.month,
        status: prev.status,
        searchTerm: prev.searchTerm,
      }),
    );
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  const clearFilters = () => {
    const defaultCompany = pickDefaultLeaveCompany(companies, user?.defaultCompanyId);
    const cleared = leaveFiltersFromCompany(defaultCompany, {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      status: "all",
      searchTerm: undefined,
    });
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <Card className={cn("border-none shadow-sm bg-muted/20 overflow-hidden", className)}>
      <CardHeader className="pb-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <IconAdjustmentsHorizontal className="size-4" />
            </div>
            Leave Filters
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <IconRefresh className="size-3.5 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <IconChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <IconChevronDown className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("p-6 transition-all", !isExpanded && "hidden")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Company
            </Label>
            <NativeSelect
              value={filters.companyEntityId ?? ""}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="h-10 rounded-xl"
              disabled={isCompanyDisabled || companies.length === 0}
            >
              {companies.length === 0 ? (
                <option value="">Loading companies…</option>
              ) : (
                companies.map((c) => (
                  <option key={c.entityId} value={c.entityId}>
                    {c.companyNameEn}
                  </option>
                ))
              )}
            </NativeSelect>
          </div>

          {showYear && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Year
              </Label>
              <NativeSelect
                value={String(filters.year ?? new Date().getFullYear())}
                onChange={(e) => handleFilterChange("year", Number(e.target.value))}
                className="h-10 rounded-xl"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {showMonth && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Month
              </Label>
              <NativeSelect
                value={String(filters.month ?? 1)}
                onChange={(e) => handleFilterChange("month", Number(e.target.value))}
                className="h-10 rounded-xl"
              >
                {MONTHS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {showStatus && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Status
              </Label>
              <NativeSelect
                value={filters.status ?? "all"}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="h-10 rounded-xl"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {showSearch && (
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Quick search
              </Label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Employee name or ID…"
                  className="pl-10 h-10 rounded-xl"
                  value={filters.searchTerm ?? ""}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </div>
            </div>
          )}

          <div className="flex items-end lg:col-start-4 xl:col-start-5">
            <Button
              className="w-full h-10 rounded-xl font-bold gap-2"
              onClick={applyFilters}
              disabled={isLoading || !filters.companyEntityId}
            >
              {isLoading ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconSearch className="size-4" />
              )}
              {isLoading ? "Loading…" : "Apply filters"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
