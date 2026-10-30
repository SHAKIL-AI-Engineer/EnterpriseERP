"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { organogramService, type Department, type Section, type Designation } from "@/lib/services/organogram";
import { type AttendanceQuery } from "@/lib/services/attendance-api";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import { cn } from "@/lib/utils";

export interface AttendanceFilterPayload {
  query: AttendanceQuery;
  legacy?: {
    companyId?: number;
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
  };
}

interface AttendanceCompanyFilterProps {
  onFilterChange: (payload: AttendanceFilterPayload) => void;
  initialDate?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  className?: string;
  showDate?: boolean;
  showDateRange?: boolean;
  showMonth?: boolean;
  isLoading?: boolean;
}

export function AttendanceCompanyFilter({
  onFilterChange,
  initialDate,
  initialStartDate,
  initialEndDate,
  className,
  showDate = true,
  showDateRange = false,
  showMonth = false,
  isLoading = false,
}: AttendanceCompanyFilterProps) {
  const { companies, isCompanyLocked, defaultCompany, loading: companiesLoading } =
    useCompanyFilterScope();
  const isCompanyDisabled = isCompanyLocked;

  const [isExpanded, setIsExpanded] = React.useState(true);
  const [companyEntityId, setCompanyEntityId] = React.useState("");
  const [date, setDate] = React.useState(initialDate ?? format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = React.useState(initialStartDate ?? format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = React.useState(initialEndDate ?? format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = React.useState("");
  const [departmentEntityId, setDepartmentEntityId] = React.useState("");
  const [sectionEntityId, setSectionEntityId] = React.useState("");
  const [designationEntityId, setDesignationEntityId] = React.useState("");
  const [legacyDeptId, setLegacyDeptId] = React.useState<number | undefined>();
  const [legacySectionId, setLegacySectionId] = React.useState<number | undefined>();
  const [legacyDesigId, setLegacyDesigId] = React.useState<number | undefined>();
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [designations, setDesignations] = React.useState<Designation[]>([]);
  React.useEffect(() => {
    if (companiesLoading || !defaultCompany) return;
    setCompanyEntityId((current) => current || defaultCompany.entityId);
  }, [companiesLoading, defaultCompany]);

  React.useEffect(() => {
    if (!companyEntityId) {
      setDepartments([]);
      return;
    }
    organogramService.getDepartments({ companyId: companyEntityId }).then(setDepartments);
  }, [companyEntityId]);

  React.useEffect(() => {
    if (!companyEntityId || !legacyDeptId) {
      setSections([]);
      return;
    }
    organogramService.getSections({ departmentId: legacyDeptId }).then(setSections);
  }, [companyEntityId, legacyDeptId]);

  React.useEffect(() => {
    if (!companyEntityId || !legacySectionId) {
      setDesignations([]);
      return;
    }
    organogramService
      .getDesignations({ departmentId: legacyDeptId, sectionId: legacySectionId })
      .then(setDesignations);
  }, [companyEntityId, legacyDeptId, legacySectionId]);

  const applyFilters = React.useCallback(() => {
    if (!companyEntityId) return;
    const from = showDateRange ? startDate : date;
    const to = showDateRange ? endDate : date;
    const legacyCompany = companies.find((c) => c.entityId === companyEntityId);
    onFilterChange({
      query: {
        companyId: companyEntityId,
        fromDate: from,
        toDate: to,
        date: showDate && !showDateRange ? date : undefined,
        departmentId: departmentEntityId || undefined,
        sectionId: sectionEntityId || undefined,
        designationId: designationEntityId || undefined,
        searchTerm: searchTerm.trim() || undefined,
      },
      legacy: {
        companyId: legacyCompany?.id,
        departmentId: legacyDeptId,
        sectionId: legacySectionId,
        designationId: legacyDesigId,
      },
    });
  }, [
    companyEntityId,
    companies,
    date,
    departmentEntityId,
    designationEntityId,
    endDate,
    legacyDeptId,
    legacyDesigId,
    legacySectionId,
    onFilterChange,
    searchTerm,
    sectionEntityId,
    showDate,
    showDateRange,
    startDate,
  ]);

  const applyFiltersRef = React.useRef(applyFilters);

  React.useEffect(() => {
    applyFiltersRef.current = applyFilters;
  }, [applyFilters]);

  React.useEffect(() => {
    if (!companyEntityId) return;
    applyFiltersRef.current();
  }, [companyEntityId]);

  const clearFilters = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setDate(today);
    setStartDate(today);
    setEndDate(today);
    setSearchTerm("");
    setDepartmentEntityId("");
    setSectionEntityId("");
    setDesignationEntityId("");
    setLegacyDeptId(undefined);
    setLegacySectionId(undefined);
    setLegacyDesigId(undefined);
    if (!isCompanyDisabled) setCompanyEntityId("");
  };

  return (
    <Card className={cn("border-none shadow-sm bg-muted/20 overflow-hidden", className)}>
      <CardHeader className="pb-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <IconAdjustmentsHorizontal className="size-4" />
          </div>
          Attendance Filters
        </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-semibold">
              <IconRefresh className="size-3.5 mr-1" />
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
              {isExpanded ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("p-6", !isExpanded && "hidden")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {showDate && !showDateRange && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Target Date
              </Label>
              <DatePicker
                date={date ? new Date(`${date}T00:00:00`) : undefined}
                setDate={(d) => setDate(d ? format(d, "yyyy-MM-dd") : date)}
              />
            </div>
          )}

          {showDateRange && (
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Date Range
              </Label>
              <DateRangePicker
                date={{
                  from: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
                  to: endDate ? new Date(`${endDate}T00:00:00`) : undefined,
                }}
                setDate={(range: { from?: Date; to?: Date } | undefined) => {
                  setStartDate(range?.from ? format(range.from, "yyyy-MM-dd") : startDate);
                  setEndDate(range?.to ? format(range.to, "yyyy-MM-dd") : endDate);
                }}
              />
            </div>
          )}

          {showMonth && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Month
              </Label>
              <NativeSelect
                value={date.substring(0, 7)}
                onChange={(e) => setDate(`${e.target.value}-01`)}
                className="h-10 rounded-xl"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const d = new Date(new Date().getFullYear(), i, 1);
                  const val = format(d, "yyyy-MM");
                  return (
                    <option key={val} value={val}>
                      {format(d, "MMMM yyyy")}
                    </option>
                  );
                })}
              </NativeSelect>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company</Label>
            <NativeSelect
              value={companyEntityId || "all"}
              onChange={(e) => setCompanyEntityId(e.target.value === "all" ? "" : e.target.value)}
              className="h-10 rounded-xl"
              disabled={isCompanyDisabled}
            >
              <option value="all">Select company</option>
              {companies.map((c) => (
                <option key={c.entityId} value={c.entityId}>
                  {c.companyNameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Department</Label>
            <NativeSelect
              value={legacyDeptId ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setLegacyDeptId(undefined);
                  setDepartmentEntityId("");
                  setLegacySectionId(undefined);
                  setSectionEntityId("");
                  setLegacyDesigId(undefined);
                  setDesignationEntityId("");
                  return;
                }
                const id = parseInt(v, 10);
                const dept = departments.find((d) => d.id === id);
                setLegacyDeptId(id);
                setDepartmentEntityId(dept?.entityId ?? "");
              }}
              className="h-10 rounded-xl"
              disabled={!companyEntityId}
            >
              <option value="all">Every Department</option>
              {departments.map((d) => (
                <option key={d.entityId} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Section</Label>
            <NativeSelect
              value={legacySectionId ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setLegacySectionId(undefined);
                  setSectionEntityId("");
                  setLegacyDesigId(undefined);
                  setDesignationEntityId("");
                  return;
                }
                const id = parseInt(v, 10);
                const sec = sections.find((s) => s.id === id);
                setLegacySectionId(id);
                setSectionEntityId(sec?.entityId ?? "");
              }}
              className="h-10 rounded-xl"
              disabled={!legacyDeptId}
            >
              <option value="all">Every Section</option>
              {sections.map((s) => (
                <option key={s.entityId} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Designation</Label>
            <NativeSelect
              value={legacyDesigId ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setLegacyDesigId(undefined);
                  setDesignationEntityId("");
                  return;
                }
                const id = parseInt(v, 10);
                const des = designations.find((d) => d.id === id);
                setLegacyDesigId(id);
                setDesignationEntityId(des?.entityId ?? "");
              }}
              className="h-10 rounded-xl"
              disabled={!legacySectionId}
            >
              <option value="all">Every Designation</option>
              {designations.map((d) => (
                <option key={d.entityId} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Search</Label>
            <Input
              placeholder="Employee ID, name, or card..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={applyFilters} disabled={isLoading || !companyEntityId} className="rounded-xl px-8">
            <IconSearch className="size-4 mr-2" />
            {isLoading ? "Loading..." : "Apply Filters"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
