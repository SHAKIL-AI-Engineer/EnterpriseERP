"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  IconId,
  IconPrinter,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconFileCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  jobCardService,
  type JobCardResponse,
  type JobCardRosterItem,
  type JobCardParams,
} from "@/lib/services/jobcard";
import {
  JobCardFilters,
  type JobCardFilterState,
} from "@/components/attendance/job-card-filters";
import { toast } from "sonner";
import { toAttendanceQuery, toAttendanceExportParams } from "@/lib/services/attendance-api";
import { HrReportExportButtons } from "@/components/reports/hr-report-export-buttons";

function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toJobCardParams(filters: JobCardFilterState): JobCardParams {
  return {
    companyEntityId: filters.companyEntityId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    departmentId: filters.departmentEntityId || undefined,
    sectionId: filters.sectionEntityId || undefined,
    designationId: filters.designationEntityId || undefined,
    employeeID: filters.employeeID || undefined,
  };
}

export default function JobCardPage() {
  const [hasSearched, setHasSearched] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<JobCardFilterState | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [rosterItem, setRosterItem] = React.useState<JobCardRosterItem | null>(null);
  const [jobCardData, setJobCardData] = React.useState<JobCardResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadPage = React.useCallback(
    async (filters: JobCardFilterState, targetPage: number) => {
      if (!filters.companyEntityId || !isGuid(filters.companyEntityId)) {
        toast.error("Select a valid company");
        return;
      }
      if (!filters.startDate || !filters.endDate) {
        toast.error("Please select a date range");
        return;
      }

      setIsLoading(true);
      try {
        const params = toJobCardParams(filters);
        const roster = await jobCardService.getJobCardRoster(params, {
          page: targetPage,
          pageSize: 1,
        });

        setTotalCount(roster.totalCount);
        setPage(targetPage);

        if (roster.totalCount === 0 || roster.items.length === 0) {
          setRosterItem(null);
          setJobCardData(null);
          toast.error("No employees found with the selected filters");
          return;
        }

        const employee = roster.items[0];
        setRosterItem(employee);

        const card = await jobCardService.getJobCard(params, {
          employeeCard: employee.employeeCard > 0 ? employee.employeeCard : undefined,
          employeeId: employee.employeeId,
        });
        setJobCardData(card);
        setActiveFilters(filters);
        setHasSearched(true);
      } catch (error: unknown) {
        console.error(error);
        setRosterItem(null);
        setJobCardData(null);
        toast.error(error instanceof Error ? error.message : "Failed to load job card");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleApply = (filters: JobCardFilterState) => {
    void loadPage(filters, 1);
  };

  const handleReset = () => {
    setHasSearched(false);
    setActiveFilters(null);
    setPage(1);
    setTotalCount(0);
    setRosterItem(null);
    setJobCardData(null);
  };

  const handleNext = () => {
    if (!activeFilters || page >= totalCount) return;
    void loadPage(activeFilters, page + 1);
  };

  const handlePrevious = () => {
    if (!activeFilters || page <= 1) return;
    void loadPage(activeFilters, page - 1);
  };

  const periodLabel =
    activeFilters?.startDate && activeFilters?.endDate
      ? format(new Date(`${activeFilters.startDate}T00:00:00`), "MMMM yyyy") ===
        format(new Date(`${activeFilters.endDate}T00:00:00`), "MMMM yyyy")
        ? format(new Date(`${activeFilters.startDate}T00:00:00`), "MMMM yyyy")
        : `${format(new Date(`${activeFilters.startDate}T00:00:00`), "MMM dd, yy")} - ${format(new Date(`${activeFilters.endDate}T00:00:00`), "MMM dd, yy")}`
      : "";

  return (
    <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Card</h1>
          <p className="text-muted-foreground text-sm">Employee Monthly Audit Report</p>
        </div>
        <div className="flex items-center gap-2">
          {hasSearched && activeFilters && jobCardData && (
            <>
              <HrReportExportButtons
                exportUrl="/api/v1/attendance/reports/job-card"
                params={toAttendanceExportParams(
                  toAttendanceQuery(activeFilters.companyEntityId, {
                    startDate: activeFilters.startDate,
                    endDate: activeFilters.endDate,
                    departmentId: activeFilters.departmentEntityId || undefined,
                    sectionId: activeFilters.sectionEntityId || undefined,
                    designationId: activeFilters.designationEntityId || undefined,
                  }),
                  {
                    ...(rosterItem?.employeeCard && rosterItem.employeeCard > 0
                      ? { employeeCard: rosterItem.employeeCard }
                      : {}),
                    employeeId: rosterItem?.employeeId ?? activeFilters.employeeID,
                  },
                )}
                filePrefix={`job-card-${rosterItem?.employeeId ?? "export"}`}
                disabled={isLoading}
              />
              <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => window.print()}>
                <IconPrinter className="mr-2 size-4" />
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      <main className="px-6 space-y-6">
        <JobCardFilters
          totalCount={totalCount}
          currentPage={hasSearched ? page : 0}
          isLoading={isLoading}
          onApply={handleApply}
          onReset={handleReset}
        />

        {hasSearched && totalCount > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-dashed">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Navigation
                </span>
                <span className="text-sm font-semibold">Employee Job Cards</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={page <= 1 || isLoading}
                  className="h-8"
                >
                  <IconChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
                <div className="bg-background px-3 py-1 rounded-md border text-xs font-bold min-w-[80px] text-center shadow-sm tabular-nums">
                  {page} / {totalCount}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={page >= totalCount || isLoading}
                  className="h-8"
                >
                  Next
                  <IconChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
            {rosterItem && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Current Employee
                </span>
                <span className="text-sm font-medium text-primary">
                  {rosterItem.employeeName} ({rosterItem.employeeId})
                </span>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <IconLoader2 className="size-12 text-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Loading job card...</p>
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed">
            <div className="h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
              <IconId className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold">No Report Generated</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select filters and click Apply Filters to view job cards
            </p>
          </div>
        )}

        {!isLoading && hasSearched && !jobCardData && (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed">
            <h3 className="text-sm font-semibold">No employees found</h3>
            <p className="text-xs text-muted-foreground mt-1">Adjust filters and try again</p>
          </div>
        )}

        {!isLoading && jobCardData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="print-report border-none shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Monthly Job Card</h2>
                    <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-slate-700 bg-slate-50"
                  >
                    Processed attendance
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 pt-4 border-t">
                  <InfoItem label="Name" value={jobCardData.employee.employeeName} />
                  <InfoItem label="ID" value={jobCardData.employee.employeeId} />
                  <InfoItem label="Department" value={jobCardData.employee.department} />
                  <InfoItem label="Designation" value={jobCardData.employee.designation} />
                  <InfoItem label="Section" value={jobCardData.employee.section} />
                  <InfoItem label="Joining Date" value={jobCardData.employee.joiningDate || "N/A"} />
                  <InfoItem label="Grade" value={jobCardData.employee.grade || "N/A"} />
                  <InfoItem label="Shift" value={jobCardData.employee.shift || "N/A"} />
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                  <StatCard
                    label="Present"
                    value={jobCardData.summary.presentDays}
                    color="bg-emerald-50 text-emerald-700 border-emerald-100"
                  />
                  <StatCard
                    label="Absent"
                    value={jobCardData.summary.absentDays}
                    color="bg-rose-50 text-rose-700 border-rose-100"
                  />
                  <StatCard
                    label="Weekend"
                    value={jobCardData.summary.weekendDays}
                    color="bg-slate-50 text-slate-700 border-slate-100"
                  />
                  <StatCard
                    label="Holiday"
                    value={jobCardData.summary.holidayDays}
                    color="bg-blue-50 text-blue-700 border-blue-100"
                  />
                  <StatCard
                    label="Total OT"
                    value={`${jobCardData.summary.totalOTHours}h`}
                    color="bg-amber-50 text-amber-700 border-amber-100"
                  />
                  <StatCard
                    label="Late"
                    value={`${jobCardData.summary.totalLateMinutes}m`}
                    color="bg-orange-50 text-orange-700 border-orange-100"
                  />
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Day</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Shift</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">In</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Out</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Late</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">OT</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobCardData.attendanceRecords.map((row, idx) => (
                        <tr
                          key={idx}
                          className={cn(
                            "border-b last:border-0 hover:bg-muted/50 transition-colors",
                            row.isOffDay && "bg-slate-100/80 font-medium",
                            row.status === "Absent" && !row.isOffDay && "bg-rose-50/30",
                            row.status === "Holiday" && !row.isOffDay && "bg-blue-50/30",
                          )}
                        >
                          <td className="px-4 py-2.5 font-medium">{row.date}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">{row.day}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold">{row.shift || "-"}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.inTime}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-xs">{row.outTime}</td>
                          <td className="px-4 py-2.5 text-center">
                            {row.lateMinutes > 0 ? (
                              <span className="text-xs font-semibold text-rose-600">
                                {row.lateMinutes}m
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.otHours > 0 ? (
                              <span className="text-xs font-semibold text-emerald-600">
                                +{row.otHours}h
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center font-semibold text-xs">
                            {row.totalHours > 0 ? `${row.totalHours}h` : "-"}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-normal text-xs",
                                row.status === "Present" &&
                                  "bg-emerald-50 text-emerald-700 border-emerald-200",
                                row.status === "Absent" &&
                                  "bg-rose-50 text-rose-700 border-rose-200",
                                row.status === "Weekend" &&
                                  "bg-slate-100 text-slate-700 border-slate-200",
                                row.status === "WeeklyOffPresent" &&
                                  "bg-amber-50 text-amber-800 border-amber-200",
                                row.status === "Holiday" &&
                                  "bg-blue-50 text-blue-700 border-blue-200",
                                row.status === "HolidayPresent" &&
                                  "bg-blue-50 text-blue-700 border-blue-200",
                              )}
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">
                            {row.remarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              <div className="p-6 border-t mt-6">
                <div className="grid grid-cols-3 gap-12 pt-16">
                  <div className="text-center border-t border-slate-300 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Employee Signature</p>
                  </div>
                  <div className="text-center border-t border-slate-300 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Department Head</p>
                  </div>
                  <div className="text-center border-t border-slate-300 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">HR Authority</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-report,
          .print-report * {
            visibility: visible;
          }
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            shadow: none;
          }
          header,
          button,
          nav,
          aside {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={cn("p-4 rounded-lg border", color)}>
      <p className="text-xs opacity-80 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
