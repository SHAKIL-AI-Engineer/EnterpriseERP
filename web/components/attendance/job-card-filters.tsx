"use client";

import * as React from "react";
import { format } from "date-fns";
import { IconFilter, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  organogramService,
  type Department,
  type Section,
  type Designation,
} from "@/lib/services/organogram";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";
import type { DateRange } from "react-day-picker";

export interface JobCardFilterState {
  startDate: string;
  endDate: string;
  companyEntityId: string;
  departmentEntityId: string;
  sectionEntityId: string;
  designationEntityId: string;
  legacyDepartmentId?: number;
  legacySectionId?: number;
  legacyDesignationId?: number;
  employeeID: string;
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export const defaultJobCardFilters = (): JobCardFilterState => {
  const { start, end } = currentMonthRange();
  return {
    startDate: start,
    endDate: end,
    companyEntityId: "",
    departmentEntityId: "",
    sectionEntityId: "",
    designationEntityId: "",
    employeeID: "",
  };
};

interface JobCardFiltersProps {
  totalCount: number;
  currentPage: number;
  isLoading?: boolean;
  onApply: (filters: JobCardFilterState) => void;
  onReset: () => void;
}

export function JobCardFilters({
  totalCount,
  currentPage,
  isLoading = false,
  onApply,
  onReset,
}: JobCardFiltersProps) {
  const { companies, isCompanyLocked, defaultCompany, loading: companiesLoading } =
    useCompanyFilterScope();
  const isCompanyDisabled = isCompanyLocked;
  const autoAppliedRef = React.useRef(false);

  const [filters, setFilters] = React.useState<JobCardFilterState>(defaultJobCardFilters);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [designations, setDesignations] = React.useState<Designation[]>([]);

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!filters.startDate) return undefined;
    const from = new Date(`${filters.startDate}T00:00:00`);
    const to = filters.endDate ? new Date(`${filters.endDate}T00:00:00`) : from;
    return { from, to };
  }, [filters.startDate, filters.endDate]);

  React.useEffect(() => {
    if (companiesLoading || !defaultCompany) return;
    setFilters((f) => {
      if (f.companyEntityId === defaultCompany.entityId) return f;
      return { ...f, companyEntityId: defaultCompany.entityId };
    });
  }, [companiesLoading, defaultCompany]);

  React.useEffect(() => {
    if (companiesLoading || autoAppliedRef.current || !isCompanyLocked || !defaultCompany) {
      return;
    }
    autoAppliedRef.current = true;
    const next: JobCardFilterState = {
      ...defaultJobCardFilters(),
      companyEntityId: defaultCompany.entityId,
    };
    setFilters(next);
    onApply(next);
  }, [companiesLoading, isCompanyLocked, defaultCompany, onApply]);

  React.useEffect(() => {
    if (!filters.companyEntityId) {
      setDepartments([]);
      setSections([]);
      setDesignations([]);
      return;
    }
    organogramService.getDepartments({ companyId: filters.companyEntityId }).then(setDepartments);
  }, [filters.companyEntityId]);

  React.useEffect(() => {
    if (!filters.legacyDepartmentId) {
      setSections([]);
      return;
    }
    organogramService.getSections({ departmentId: filters.legacyDepartmentId }).then(setSections);
  }, [filters.legacyDepartmentId]);

  React.useEffect(() => {
    if (!filters.legacySectionId) {
      setDesignations([]);
      return;
    }
    organogramService
      .getDesignations({
        departmentId: filters.legacyDepartmentId,
        sectionId: filters.legacySectionId,
      })
      .then(setDesignations);
  }, [filters.legacySectionId, filters.legacyDepartmentId]);

  const handleCompanyChange = (entityId: string) => {
    setFilters((f) => ({
      ...f,
      companyEntityId: entityId,
      departmentEntityId: "",
      sectionEntityId: "",
      designationEntityId: "",
      legacyDepartmentId: undefined,
      legacySectionId: undefined,
      legacyDesignationId: undefined,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    if (value === "all") {
      setFilters((f) => ({
        ...f,
        departmentEntityId: "",
        sectionEntityId: "",
        designationEntityId: "",
        legacyDepartmentId: undefined,
        legacySectionId: undefined,
        legacyDesignationId: undefined,
      }));
      return;
    }
    const id = parseInt(value, 10);
    const dept = departments.find((d) => d.id === id);
    setFilters((f) => ({
      ...f,
      legacyDepartmentId: id,
      departmentEntityId: dept?.entityId ?? "",
      sectionEntityId: "",
      designationEntityId: "",
      legacySectionId: undefined,
      legacyDesignationId: undefined,
    }));
  };

  const handleSectionChange = (value: string) => {
    if (value === "all") {
      setFilters((f) => ({
        ...f,
        sectionEntityId: "",
        designationEntityId: "",
        legacySectionId: undefined,
        legacyDesignationId: undefined,
      }));
      return;
    }
    const id = parseInt(value, 10);
    const sec = sections.find((s) => s.id === id);
    setFilters((f) => ({
      ...f,
      legacySectionId: id,
      sectionEntityId: sec?.entityId ?? "",
      designationEntityId: "",
      legacyDesignationId: undefined,
    }));
  };

  const handleDesignationChange = (value: string) => {
    if (value === "all") {
      setFilters((f) => ({
        ...f,
        designationEntityId: "",
        legacyDesignationId: undefined,
      }));
      return;
    }
    const id = parseInt(value, 10);
    const des = designations.find((d) => d.id === id);
    setFilters((f) => ({
      ...f,
      legacyDesignationId: id,
      designationEntityId: des?.entityId ?? "",
    }));
  };

  const handleReset = () => {
    const next = defaultJobCardFilters();
    if (isCompanyLocked && defaultCompany) {
      next.companyEntityId = defaultCompany.entityId;
    } else if (defaultCompany && !next.companyEntityId) {
      next.companyEntityId = defaultCompany.entityId;
    }
    setFilters(next);
    onReset();
  };

  const rosterLabel =
    totalCount > 0 ? `${currentPage} / ${totalCount} employees` : "0 employees";

  return (
    <Card className="border-none shadow-sm bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
            </div>
            <Badge
              variant="secondary"
              className="h-5 px-1.5 font-mono text-[10px] bg-primary/10 text-primary border-primary/20"
            >
              {rosterLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1.5 px-4 shadow-sm shadow-primary/20"
              onClick={() => onApply(filters)}
              disabled={isLoading || !filters.companyEntityId}
            >
              {isLoading ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : (
                <IconFilter className="size-3.5" />
              )}
              Apply Filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 text-xs hover:text-destructive hover:bg-destructive/10"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Period</Label>
            <DateRangePicker
              date={dateRange}
              setDate={(range) => {
                if (!range?.from) return;
                setFilters((f) => ({
                  ...f,
                  startDate: format(range.from!, "yyyy-MM-dd"),
                  endDate: format(range.to ?? range.from!, "yyyy-MM-dd"),
                }));
              }}
              className="h-9 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Company</Label>
            <NativeSelect
              value={filters.companyEntityId || ""}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="h-9"
              disabled={isCompanyDisabled || isLoading}
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.entityId} value={c.entityId}>
                  {c.companyNameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Employee ID</Label>
            <Input
              value={filters.employeeID}
              onChange={(e) => setFilters((f) => ({ ...f, employeeID: e.target.value.trim() }))}
              placeholder="Exact employee code"
              className="h-9"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Department</Label>
            <NativeSelect
              value={filters.legacyDepartmentId ?? "all"}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="h-9"
              disabled={!filters.companyEntityId || isLoading}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.entityId} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Section</Label>
            <NativeSelect
              value={filters.legacySectionId ?? "all"}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="h-9"
              disabled={!filters.legacyDepartmentId || isLoading}
            >
              <option value="all">All Sections</option>
              {sections.map((s) => (
                <option key={s.entityId} value={s.id}>
                  {s.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Designation</Label>
            <NativeSelect
              value={filters.legacyDesignationId ?? "all"}
              onChange={(e) => handleDesignationChange(e.target.value)}
              className="h-9"
              disabled={!filters.legacySectionId || isLoading}
            >
              <option value="all">All Designations</option>
              {designations.map((d) => (
                <option key={d.entityId} value={d.id}>
                  {d.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
