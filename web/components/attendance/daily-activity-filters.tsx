"use client";

import * as React from "react";
import { format } from "date-fns";
import { IconFilter, IconLoader2 } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  organogramService,
  type Department,
  type Section,
  type Line,
  type Group,
} from "@/lib/services/organogram";
import { useCompanyFilterScope } from "@/hooks/use-company-filter-scope";

export type AttendanceStatusFilter = "all" | "present" | "late" | "absent" | "leave";

export interface DailyActivityFilterState {
  date: string;
  companyEntityId: string;
  legacyCompanyId?: number;
  departmentEntityId: string;
  sectionEntityId: string;
  legacyDepartmentId?: number;
  legacySectionId?: number;
  legacyLineId?: number;
  legacyGroupId?: number;
  groupEntityId?: string;
  lineName?: string;
  attendanceStatus: AttendanceStatusFilter;
}

export const defaultDailyActivityFilters = (): DailyActivityFilterState => ({
  date: format(new Date(), "yyyy-MM-dd"),
  companyEntityId: "",
  departmentEntityId: "",
  sectionEntityId: "",
  attendanceStatus: "all",
});

interface DailyActivityFiltersProps {
  recordCount: number;
  isLoading?: boolean;
  onApply: (filters: DailyActivityFilterState) => void;
  onReset: () => void;
}

export function DailyActivityFilters({
  recordCount,
  isLoading = false,
  onApply,
  onReset,
}: DailyActivityFiltersProps) {
  const { companies, isCompanyLocked, defaultCompany, loading: companiesLoading } =
    useCompanyFilterScope();
  const isCompanyDisabled = isCompanyLocked;
  const autoAppliedRef = React.useRef(false);

  const [filters, setFilters] = React.useState<DailyActivityFilterState>(defaultDailyActivityFilters);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [sections, setSections] = React.useState<Section[]>([]);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);

  React.useEffect(() => {
    if (companiesLoading || !defaultCompany) return;
    setFilters((f) => {
      if (f.companyEntityId === defaultCompany.entityId) return f;
      return {
        ...f,
        companyEntityId: defaultCompany.entityId,
        legacyCompanyId: defaultCompany.id,
      };
    });
  }, [companiesLoading, defaultCompany]);

  React.useEffect(() => {
    if (companiesLoading || autoAppliedRef.current || !isCompanyLocked || !defaultCompany) {
      return;
    }
    autoAppliedRef.current = true;
    const next: DailyActivityFilterState = {
      ...defaultDailyActivityFilters(),
      companyEntityId: defaultCompany.entityId,
      legacyCompanyId: defaultCompany.id,
    };
    setFilters(next);
    onApply(next);
  }, [companiesLoading, isCompanyLocked, defaultCompany, onApply]);

  React.useEffect(() => {
    if (!filters.companyEntityId) {
      setDepartments([]);
      setSections([]);
      setLines([]);
      setGroups([]);
      return;
    }
    organogramService.getDepartments({ companyId: filters.companyEntityId }).then(setDepartments);
    organogramService
      .getGroups({ companyId: filters.companyEntityId })
      .then(setGroups)
      .catch(() => setGroups([]));
  }, [filters.companyEntityId, companies]);

  React.useEffect(() => {
    if (!filters.legacyDepartmentId || !filters.companyEntityId) {
      setSections([]);
      return;
    }
    organogramService
      .getSections({ departmentId: filters.legacyDepartmentId })
      .then(setSections);
  }, [filters.legacyDepartmentId, filters.companyEntityId]);

  React.useEffect(() => {
    if (!filters.legacySectionId || !filters.companyEntityId) {
      setLines([]);
      return;
    }
    organogramService
      .getLines({ sectionId: filters.legacySectionId })
      .then(setLines);
  }, [filters.legacySectionId, filters.legacyDepartmentId, filters.companyEntityId]);

  const handleCompanyChange = (entityId: string) => {
    const company = companies.find((c) => c.entityId === entityId);
    setFilters((f) => ({
      ...f,
      companyEntityId: entityId,
      legacyCompanyId: company?.id,
      departmentEntityId: "",
      sectionEntityId: "",
      legacyDepartmentId: undefined,
      legacySectionId: undefined,
      legacyLineId: undefined,
      legacyGroupId: undefined,
      groupEntityId: undefined,
      lineName: undefined,
    }));
  };

  const handleDepartmentChange = (value: string) => {
    if (value === "all") {
      setFilters((f) => ({
        ...f,
        departmentEntityId: "",
        sectionEntityId: "",
        legacyDepartmentId: undefined,
        legacySectionId: undefined,
        legacyLineId: undefined,
        lineName: undefined,
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
      legacySectionId: undefined,
        legacyLineId: undefined,
        lineName: undefined,
    }));
  };

  const handleSectionChange = (value: string) => {
    if (value === "all") {
      setFilters((f) => ({
        ...f,
        sectionEntityId: "",
        legacySectionId: undefined,
        legacyLineId: undefined,
        lineName: undefined,
      }));
      return;
    }
    const id = parseInt(value, 10);
    const sec = sections.find((s) => s.id === id);
    setFilters((f) => ({
      ...f,
      legacySectionId: id,
      sectionEntityId: sec?.entityId ?? "",
      legacyLineId: undefined,
    }));
  };

  const handleReset = () => {
    const next = defaultDailyActivityFilters();
    if (isCompanyLocked && defaultCompany) {
      next.companyEntityId = defaultCompany.entityId;
      next.legacyCompanyId = defaultCompany.id;
    } else if (defaultCompany && !next.companyEntityId) {
      next.companyEntityId = defaultCompany.entityId;
      next.legacyCompanyId = defaultCompany.id;
    }
    setFilters(next);
    onReset();
  };

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
              {recordCount} Records Found
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date</Label>
            <DatePicker
              date={filters.date ? new Date(`${filters.date}T00:00:00`) : undefined}
              setDate={(d) =>
                setFilters((f) => ({ ...f, date: d ? format(d, "yyyy-MM-dd") : f.date }))
              }
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
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.entityId} value={c.entityId}>
                  {c.companyNameEn}
                </option>
              ))}
            </NativeSelect>
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
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Line</Label>
            <NativeSelect
              value={filters.legacyLineId ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setFilters((f) => ({
                    ...f,
                    legacyLineId: undefined,
                    lineName: undefined,
                  }));
                  return;
                }
                const id = parseInt(v, 10);
                const line = lines.find((l) => l.id === id);
                setFilters((f) => ({
                  ...f,
                  legacyLineId: id,
                  lineName: line?.nameEn,
                }));
              }}
              className="h-9"
              disabled={!filters.legacySectionId || isLoading}
            >
              <option value="all">All Lines</option>
              {lines.map((l) => (
                <option key={l.entityId} value={l.id}>
                  {l.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Group</Label>
            <NativeSelect
              value={filters.legacyGroupId ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  setFilters((f) => ({
                    ...f,
                    legacyGroupId: undefined,
                    groupEntityId: undefined,
                  }));
                  return;
                }
                const id = parseInt(v, 10);
                const group = groups.find((g) => g.id === id);
                setFilters((f) => ({
                  ...f,
                  legacyGroupId: id,
                  groupEntityId: group?.entityId,
                }));
              }}
              className="h-9"
              disabled={!filters.companyEntityId || isLoading}
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
            <NativeSelect
              value={filters.attendanceStatus}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  attendanceStatus: e.target.value as AttendanceStatusFilter,
                }))
              }
              className="h-9"
              disabled={isLoading}
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </NativeSelect>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
