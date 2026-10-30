"use client";

import * as React from "react";
import {
  IconFingerprint,
  IconRefresh,
  IconUserCheck,
  IconUserX,
  IconClock,
  IconUsers,
  IconLoader2,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  attendanceApi,
  type AttendanceQuery,
  type AttendanceRecord,
  toAttendanceExportParams,
} from "@/lib/services/attendance-api";
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons";
import {
  DailyActivityFilters,
  type DailyActivityFilterState,
} from "@/components/attendance/daily-activity-filters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatAttendanceDate, formatPunchTime } from "@/lib/format-attendance-time";

type AttendanceRow = AttendanceRecord & {
  sequence: number;
};

function filtersToAttendanceQuery(filters: DailyActivityFilterState): AttendanceQuery {
  return {
    companyId: filters.companyEntityId,
    fromDate: filters.date,
    toDate: filters.date,
    date: filters.date,
    departmentId: filters.departmentEntityId || undefined,
    sectionId: filters.sectionEntityId || undefined,
    groupId: filters.groupEntityId || undefined,
    lineName: filters.lineName || undefined,
    attendanceStatus:
      filters.attendanceStatus !== "all" ? filters.attendanceStatus : undefined,
  };
}

interface ReportSummary {
  totalHeadcount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendanceRate: number;
}

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildSummary(rows: AttendanceRecord[]): ReportSummary {
  const employeeIDs = new Set(rows.map((r) => r.employeeId).filter(Boolean));
  const totalHeadcount = employeeIDs.size || rows.length;

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;

  for (const row of rows) {
    const status = row.status.toLowerCase();
    if (status.includes("absent")) absentCount += 1;
    else if (status.includes("leave")) leaveCount += 1;
    else if (
      status.includes("present") ||
      status.includes("late") ||
      status.includes("early")
    ) {
      presentCount += 1;
    }
    if (status.includes("late")) lateCount += 1;
  }

  const attendanceRate =
    totalHeadcount > 0 ? Math.round((presentCount / totalHeadcount) * 100) : 0;

  return {
    totalHeadcount,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendanceRate,
  };
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("present"))
    return "bg-primary/10 text-primary hover:bg-primary/20";
  if (normalized.includes("late"))
    return "bg-amber-100 text-amber-700 hover:bg-amber-200";
  if (normalized.includes("absent"))
    return "bg-destructive/10 text-destructive hover:bg-destructive/20";
  if (normalized.includes("leave"))
    return "bg-blue-100 text-blue-700 hover:bg-blue-200";
  if (normalized.includes("holiday"))
    return "bg-blue-600/10 text-blue-600 hover:bg-blue-600/20";
  return "bg-muted text-muted-foreground";
}

export default function DailyAttendanceReportPage() {
  const [activeFilters, setActiveFilters] = React.useState<DailyActivityFilterState | null>(
    null,
  );
  const [hasSearched, setHasSearched] = React.useState(false);
  const [records, setRecords] = React.useState<AttendanceRow[]>([]);
  const [summary, setSummary] = React.useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fetchData = React.useCallback(async (filters: DailyActivityFilterState) => {
    if (!filters.companyEntityId) {
      toast.error("Select a company");
      return;
    }
    if (!isGuid(filters.companyEntityId)) {
      toast.error("Company id must be a valid GUID");
      return;
    }

    setIsLoading(true);
    try {
      const rows = await attendanceApi.getDailyReport(filtersToAttendanceQuery(filters));

      const mapped: AttendanceRow[] = rows.map((row, index) => ({
        ...row,
        sequence: index + 1,
      }));

      setRecords(mapped);
      setSummary(buildSummary(rows));
      setActiveFilters(filters);
      setHasSearched(true);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch attendance data",
      );
      setRecords([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApply = (filters: DailyActivityFilterState) => {
    void fetchData(filters);
  };

  const handleReset = () => {
    setHasSearched(false);
    setActiveFilters(null);
    setRecords([]);
    setSummary(null);
  };

  const runProcess = async () => {
    const filters = activeFilters;
    if (!filters?.companyEntityId || !isGuid(filters.companyEntityId)) {
      toast.error("Apply filters with a company first, or select a company in filters");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await attendanceApi.processRange({
        companyId: filters.companyEntityId,
        startDate: filters.date,
        endDate: filters.date,
      });
      if (result.errors.length > 0) {
        toast.warning(
          `Processed ${result.daysProcessed} day(s), ${result.recordsProcessed} record(s). ${result.errors.length} day(s) failed — see console.`,
        );
        console.warn("Attendance process range errors:", result.errors);
      } else {
        toast.success(
          `Processed ${result.recordsProcessed} employee-day(s) (${result.presentCount} present, ${result.absentCount} absent)`,
        );
      }
      if (hasSearched) {
        await fetchData(filters);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    if (!hasSearched || !activeFilters) return;
    void fetchData(activeFilters);
  };

  const selectedDateLabel = activeFilters?.date
    ? format(new Date(`${activeFilters.date}T00:00:00`), "dd MMM yyyy")
    : format(new Date(), "dd MMM yyyy");

  const columns: ColumnDef<AttendanceRow>[] = [
    {
      accessorKey: "sequence",
      header: "SL",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {row.original.sequence.toString().padStart(2, "0")}
        </span>
      ),
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      cell: ({ row }) => (
        <span className="font-bold text-xs tabular-nums text-foreground max-w-[140px] truncate block">
          {row.original.employeeId || "—"}
        </span>
      ),
    },
    {
      accessorKey: "employeeName",
      header: "Name",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.original.employeeName || "—"}</span>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold">{row.original.department || "—"}</span>
          <span className="text-[10px] text-muted-foreground uppercase">
            {row.original.section || ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{formatAttendanceDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "shift",
      header: "Shift",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-bold text-[10px] uppercase py-0">
          {row.original.shift || "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "inTime",
      header: "Check-In",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            !row.original.inTime && "text-destructive",
          )}
        >
          {row.original.inTime
            ? formatPunchTime(row.original.inTime, row.original.date)
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "outTime",
      header: "Check-Out",
      cell: ({ row }) => (
        <span className="text-xs font-bold tabular-nums">
          {row.original.outTime
            ? formatPunchTime(row.original.outTime, row.original.date)
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "otHours",
      header: "OT (h)",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            row.original.otHours > 0 ? "text-primary" : "text-muted-foreground opacity-50",
          )}
        >
          {row.original.otHours}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "font-bold text-[10px] uppercase h-6 px-2.5 rounded-full border-none shadow-sm",
            statusClass(row.original.status),
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const tableData = hasSearched ? records : [];
  const displaySummary = hasSearched ? summary : null;

  return (
    <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <IconFingerprint className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Activity</h1>
            <p className="text-muted-foreground text-sm">
              Platform attendance for {selectedDateLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            className="gap-2 h-9"
            onClick={runProcess}
            disabled={isProcessing || isLoading || !activeFilters?.companyEntityId}
          >
            {isProcessing ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconRefresh className="size-4" />
            )}
            Run Process
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 h-9"
            onClick={handleRefresh}
            disabled={isLoading || isProcessing || !hasSearched}
          >
            {isLoading ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconRefresh className="size-4" />
            )}
            Refresh
          </Button>
          {hasSearched && activeFilters?.companyEntityId && (
            <HrReportExportButtons
              exportUrl="/api/v1/attendance/reports/daily-report"
              params={toAttendanceExportParams(filtersToAttendanceQuery(activeFilters))}
              filePrefix={`daily-report-${activeFilters.date ?? "export"}`}
              disabled={isLoading || isProcessing}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        <StatCard
          title="Headcount"
          value={displaySummary?.totalHeadcount ?? 0}
          subtitle={hasSearched ? "Employees in result" : "Apply filters to load"}
          icon={IconUsers}
        />
        <StatCard
          title="Present"
          value={displaySummary?.presentCount ?? 0}
          subtitle={
            hasSearched
              ? `${displaySummary?.attendanceRate ?? 0}% participation`
              : "—"
          }
          icon={IconUserCheck}
          className="text-primary"
        />
        <StatCard
          title="Away"
          value={displaySummary?.absentCount ?? 0}
          subtitle={
            hasSearched ? `${displaySummary?.leaveCount ?? 0} on leave` : "—"
          }
          icon={IconUserX}
          className="text-destructive"
        />
        <StatCard
          title="Delayed"
          value={displaySummary?.lateCount ?? 0}
          subtitle={hasSearched ? "Late status" : "—"}
          icon={IconClock}
          className="text-amber-600"
        />
      </div>

      <div className="px-6">
        <DailyActivityFilters
          recordCount={hasSearched ? records.length : 0}
          isLoading={isLoading}
          onApply={handleApply}
          onReset={handleReset}
        />
      </div>

      <div className="px-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-base font-bold">Detailed Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasSearched && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <IconFilterPlaceholder />
                <p className="mt-4 text-sm font-medium">No data loaded yet</p>
                <p className="text-xs mt-1 max-w-sm">
                  Select company, date, and other filters, then click Apply Filters to load
                  attendance records.
                </p>
              </div>
            ) : (
              <DataTable
                data={tableData}
                columns={columns}
                showActions={false}
                showTabs={false}
                searchKey="employeeId"
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IconFilterPlaceholder() {
  return (
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
      <IconFingerprint className="size-6 text-muted-foreground/50" />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className="border-none shadow-sm group hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <h3 className={cn("text-3xl font-black mt-2 tracking-tight", className)}>{value}</h3>
          <p className="text-[10px] font-semibold text-muted-foreground mt-1 flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-primary/40" />
            {subtitle}
          </p>
        </div>
        <div className="p-3 bg-muted/50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
          <Icon className="size-6 text-muted-foreground group-hover:text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
