import api from "../api";
import { platformApiUrl, unwrapResponse, downloadBlob } from "./api-helpers";

/** Calendar date only (yyyy-MM-dd). */
function toDateOnlyParam(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.includes("T")) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date");
  return toDateOnlyParam(parsed);
}

export interface AttendanceQuery {
  companyId: string;
  fromDate: string;
  toDate: string;
  date?: string;
  departmentId?: string;
  sectionId?: string;
  designationId?: string;
  groupId?: string;
  lineName?: string;
  attendanceStatus?: string;
  employeeID?: string;
  searchTerm?: string;
}

export interface AttendanceRecord {
  id: number;
  employeeCard: number;
  employeeId: string;
  companyId: number;
  employeeName: string;
  department: string;
  section: string;
  designation: string;
  shift: string;
  date: string;
  inTime: string | null;
  outTime: string | null;
  status: string;
  otHours: number;
}

export interface AttendanceSummary {
  totalHeadcount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendanceRate: number;
}

export interface DepartmentDailySummary {
  id: number;
  departmentId: number;
  departmentName: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number;
}

export interface SectionDailySummary {
  id: number;
  sectionId: number;
  sectionName: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number;
}

export interface DesignationDailySummary {
  id: number;
  designationId: number;
  designationName: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number;
}

export interface DeptSectionDailySummary {
  id: string;
  departmentId: number;
  departmentName: string;
  sectionId: number;
  sectionName: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number;
}

export interface DailySummaryResponse {
  overallSummary: AttendanceSummary;
  departmentSummaries: DepartmentDailySummary[];
  sectionSummaries: SectionDailySummary[];
  deptSectionSummaries: DeptSectionDailySummary[];
  designationSummaries: DesignationDailySummary[];
  lineSummaries: { id: number; lineId: number; lineName: string; totalEmployees: number; present: number; absent: number; late: number; onLeave: number; attendanceRate: number }[];
  groupSummaries: { id: number; groupId: number; groupName: string; totalEmployees: number; present: number; absent: number; late: number; onLeave: number; attendanceRate: number }[];
}

export interface MissingEntry {
  id: number;
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  companyId?: number;
  department: string;
  designation: string;
  shift: string | null;
  date: string;
  inTime: string | null;
  outTime: string | null;
  missingType: string;
  status: string;
}

export interface MissingEntrySummary {
  totalMissing: number;
  missingInTime: number;
  missingOutTime: number;
  missingBoth: number;
  criticalCount: number;
}

export interface MissingEntryResponse {
  summary: MissingEntrySummary;
  entries: MissingEntry[];
}

export interface AbsenteeismRecord {
  id: number;
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  status: string;
  consecutiveDays: number;
  remarks: string | null;
}

export interface AbsenteeismSummary {
  totalAbsent: number;
  absentWithoutLeave: number;
  onLeave: number;
  criticalCases: number;
}

export interface AbsenteeismResponse {
  summary: AbsenteeismSummary;
  records: AbsenteeismRecord[];
}

export interface JobCardRecord {
  date: string;
  day: string;
  status: string;
  inTime: string | null;
  outTime: string | null;
  lateMinutes: number;
  earlyMinutes: number;
  otHours: number;
  totalHours: number;
  shift: string | null;
  shiftId: number | null;
  isOffDay: boolean;
  remarks: string | null;
}

export interface JobCardSummary {
  presentDays: number;
  absentDays: number;
  weekendDays: number;
  holidayDays: number;
  totalOTHours: number;
  totalLateMinutes: number;
  totalEarlyMinutes: number;
}

export interface EmployeeJobCard {
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  section: string;
  joiningDate: string | null;
  grade: string | null;
  shift: string | null;
}

export interface JobCardResponse {
  employee: EmployeeJobCard;
  summary: JobCardSummary;
  attendanceRecords: JobCardRecord[];
  fromDate: string;
  toDate: string;
}

export interface JobCardRosterItem {
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  section: string;
  designation: string;
}

export interface PagedJobCardRoster {
  items: JobCardRosterItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DailyOtSheetRow {
  id: number;
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  section: string;
  designation: string;
  shift: string;
  date: string;
  inTime: string | null;
  outTime: string | null;
  otHours: number;
  status: string;
}

export interface DailyOtSummaryRow {
  id: number;
  name: string;
  employeeCount: number;
  totalOtHours: number;
  departmentName?: string;
  sectionName?: string;
}

export interface BackendDailyAttendance {
  id: string;
  employeeID: string;
  punchNumber: number;
  attendanceDate: string;
  inTime: string | null;
  outTime: string | null;
  shiftName: string | null;
  lateMinutes: number;
  otMinutes: number;
  workingMinutes: number;
  status: string;
  remarks: string | null;
}

export interface ProcessDailyAttendanceResult {
  recordsProcessed: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  createdCount: number;
  updatedCount: number;
  skippedLockedCount: number;
}

export interface ProcessRangeResult {
  daysProcessed: number;
  recordsProcessed: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  createdCount: number;
  updatedCount: number;
  skippedLockedCount: number;
  batchId: string;
  errors: { date: string; message: string }[];
}

export interface BulkAdjustEntry {
  dailyAttendanceId?: string;
  employeeID?: string;
  date?: string;
  inTime?: string | null;
  outTime?: string | null;
  remarks?: string | null;
}

export interface BulkAdjustResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

export function toAttendanceExportParams(
  q: AttendanceQuery,
  extra?: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const params = { ...buildReportParams(q) };
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined && value !== "") {
        params[key] = String(value);
      }
    }
  }
  return params;
}

function buildReportParams(q: AttendanceQuery): Record<string, string> {
  const params: Record<string, string> = {
    companyId: q.companyId,
    fromDate: toDateOnlyParam(q.fromDate),
    toDate: toDateOnlyParam(q.toDate),
  };
  if (q.date) params.date = toDateOnlyParam(q.date);
  if (q.departmentId) params.departmentId = q.departmentId;
  if (q.sectionId) params.sectionId = q.sectionId;
  if (q.designationId) params.designationId = q.designationId;
  if (q.groupId) params.groupId = q.groupId;
  if (q.lineName?.trim()) params.lineName = q.lineName.trim();
  if (q.attendanceStatus?.trim() && q.attendanceStatus !== "all") {
    params.attendanceStatus = q.attendanceStatus.trim();
  }
  if (q.employeeID?.trim()) params.employeeID = q.employeeID.trim();
  if (q.searchTerm?.trim()) params.searchTerm = q.searchTerm.trim();
  return params;
}

type SummaryBucketRaw = {
  id?: number;
  Id?: number;
  name?: string;
  Name?: string;
  departmentId?: number;
  DepartmentId?: number;
  sectionId?: number;
  SectionId?: number;
  designationId?: number;
  DesignationId?: number;
  totalEmployees?: number;
  TotalEmployees?: number;
  present?: number;
  Present?: number;
  absent?: number;
  Absent?: number;
  late?: number;
  Late?: number;
  onLeave?: number;
  OnLeave?: number;
  attendanceRate?: number;
  AttendanceRate?: number;
};

function pickSummaryBucket(b: SummaryBucketRaw) {
  return {
    id: Number(b.id ?? b.Id ?? 0),
    name: String(b.name ?? b.Name ?? ""),
    departmentId: b.departmentId ?? b.DepartmentId,
    sectionId: b.sectionId ?? b.SectionId,
    designationId: b.designationId ?? b.DesignationId,
    totalEmployees: Number(b.totalEmployees ?? b.TotalEmployees ?? 0),
    present: Number(b.present ?? b.Present ?? 0),
    absent: Number(b.absent ?? b.Absent ?? 0),
    late: Number(b.late ?? b.Late ?? 0),
    onLeave: Number(b.onLeave ?? b.OnLeave ?? 0),
    attendanceRate: Number(b.attendanceRate ?? b.AttendanceRate ?? 0),
  };
}

function normalizeDailySummaryRaw(raw: Record<string, unknown>) {
  const overallRaw = (raw.overallSummary ?? raw.OverallSummary) as Record<string, unknown> | undefined;
  const overallSummary: AttendanceSummary = {
    totalHeadcount: Number(overallRaw?.totalHeadcount ?? overallRaw?.TotalHeadcount ?? 0),
    presentCount: Number(overallRaw?.presentCount ?? overallRaw?.PresentCount ?? 0),
    absentCount: Number(overallRaw?.absentCount ?? overallRaw?.AbsentCount ?? 0),
    lateCount: Number(overallRaw?.lateCount ?? overallRaw?.LateCount ?? 0),
    leaveCount: Number(overallRaw?.leaveCount ?? overallRaw?.LeaveCount ?? 0),
    attendanceRate: Number(overallRaw?.attendanceRate ?? overallRaw?.AttendanceRate ?? 0),
  };
  const list = (key: string, alt: string) =>
    ((raw[key] ?? raw[alt]) as SummaryBucketRaw[] | undefined) ?? [];
  return {
    overallSummary,
    departmentSummaries: list("departmentSummaries", "DepartmentSummaries").map(pickSummaryBucket),
    sectionSummaries: list("sectionSummaries", "SectionSummaries").map(pickSummaryBucket),
    deptSectionSummaries: list("deptSectionSummaries", "DeptSectionSummaries").map(pickSummaryBucket),
    designationSummaries: list("designationSummaries", "DesignationSummaries").map(pickSummaryBucket),
    lineSummaries: list("lineSummaries", "LineSummaries") as DailySummaryResponse["lineSummaries"],
    groupSummaries: list("groupSummaries", "GroupSummaries") as DailySummaryResponse["groupSummaries"],
  };
}

function mapDailySummary(raw: ReturnType<typeof normalizeDailySummaryRaw>): DailySummaryResponse {
  return {
    overallSummary: raw.overallSummary,
    departmentSummaries: raw.departmentSummaries.map((d) => ({
      id: d.id,
      departmentId: d.departmentId ?? d.id,
      departmentName: d.name,
      totalEmployees: d.totalEmployees,
      present: d.present,
      absent: d.absent,
      late: d.late,
      onLeave: d.onLeave,
      attendanceRate: d.attendanceRate,
    })),
    sectionSummaries: raw.sectionSummaries.map((s) => ({
      id: s.id,
      sectionId: s.sectionId ?? s.id,
      sectionName: s.name,
      totalEmployees: s.totalEmployees,
      present: s.present,
      absent: s.absent,
      late: s.late,
      onLeave: s.onLeave,
      attendanceRate: s.attendanceRate,
    })),
    deptSectionSummaries: raw.deptSectionSummaries.map((ds, i) => ({
      id: String(ds.id || i),
      departmentId: ds.departmentId ?? 0,
      departmentName: ds.name.split("/")[0]?.trim() ?? ds.name,
      sectionId: ds.sectionId ?? 0,
      sectionName: ds.name.split("/")[1]?.trim() ?? "",
      totalEmployees: ds.totalEmployees,
      present: ds.present,
      absent: ds.absent,
      late: ds.late,
      onLeave: ds.onLeave,
      attendanceRate: ds.attendanceRate,
    })),
    designationSummaries: raw.designationSummaries.map((d) => ({
      id: d.id,
      designationId: d.designationId ?? d.id,
      designationName: d.name,
      totalEmployees: d.totalEmployees,
      present: d.present,
      absent: d.absent,
      late: d.late,
      onLeave: d.onLeave,
      attendanceRate: d.attendanceRate,
    })),
    lineSummaries: raw.lineSummaries ?? [],
    groupSummaries: raw.groupSummaries ?? [],
  };
}

export const attendanceApi = {
  processDaily: async (data: { companyId: string; date: string | Date }) => {
    const response = await api.post<unknown>(platformApiUrl("/api/v1/Attendance/process"), {
      companyId: data.companyId,
      date: toDateOnlyParam(data.date),
    });
    return unwrapResponse<ProcessDailyAttendanceResult>(response);
  },

  processRange: async (data: {
    companyId: string;
    startDate: string | Date;
    endDate: string | Date;
    employeeIDs?: string[];
  }) => {
    const response = await api.post<unknown>(platformApiUrl("/api/v1/Attendance/process/range"), {
      companyId: data.companyId,
      startDate: toDateOnlyParam(data.startDate),
      endDate: toDateOnlyParam(data.endDate),
      employeeIDs: data.employeeIDs,
    });
    return unwrapResponse<ProcessRangeResult>(response);
  },

  getDailyAttendance: async (params: {
    companyId: string;
    fromDate: string;
    toDate: string;
    employeeID?: string;
  }) => {
    const query: Record<string, string> = {
      companyId: params.companyId,
      fromDate: toDateOnlyParam(params.fromDate),
      toDate: toDateOnlyParam(params.toDate),
    };
    if (params.employeeID?.trim()) query.employeeID = params.employeeID.trim();
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance"), { params: query });
    return unwrapResponse<BackendDailyAttendance[]>(response);
  },

  getDailyReport: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/daily-report"), {
      params: buildReportParams(q),
    });
    return unwrapResponse<AttendanceRecord[]>(response);
  },

  getDailySummary: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/daily-summary"), {
      params: buildReportParams(q),
    });
    const raw = unwrapResponse<Record<string, unknown>>(response);
    return mapDailySummary(normalizeDailySummaryRaw(raw));
  },

  getJobCard: async (
    q: AttendanceQuery,
    opts: { employeeCard?: number; employeeId?: string },
  ) => {
    const params = {
      ...buildReportParams(q),
      ...(opts.employeeCard != null ? { employeeCard: String(opts.employeeCard) } : {}),
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
    };
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/job-card"), { params });
    return unwrapResponse<JobCardResponse>(response);
  },

  getJobCardRoster: async (
    q: AttendanceQuery,
    opts: { page?: number; pageSize?: number } = {},
  ) => {
    const params = {
      ...buildReportParams(q),
      page: String(opts.page ?? 1),
      pageSize: String(opts.pageSize ?? 1),
    };
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/job-card/roster"), {
      params,
    });
    const raw = unwrapResponse<Record<string, unknown>>(response);
    const itemsRaw = (raw.items ?? raw.Items) as unknown[] | undefined;
    const items = (itemsRaw ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        employeeCard: Number(r.employeeCard ?? r.EmployeeCard ?? 0),
        employeeId: String(r.employeeId ?? r.EmployeeId ?? ""),
        employeeName: String(r.employeeName ?? r.EmployeeName ?? ""),
        department: String(r.department ?? r.Department ?? ""),
        section: String(r.section ?? r.Section ?? ""),
        designation: String(r.designation ?? r.Designation ?? ""),
      };
    });
    return {
      items,
      page: Number(raw.page ?? raw.Page ?? 1),
      pageSize: Number(raw.pageSize ?? raw.PageSize ?? 1),
      totalCount: Number(raw.totalCount ?? raw.TotalCount ?? 0),
    } satisfies PagedJobCardRoster;
  },

  getMissingEntries: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/missing-entries"), {
      params: buildReportParams(q),
    });
    return unwrapResponse<MissingEntryResponse>(response);
  },

  getAbsenteeismRecords: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/absenteeism-records"), {
      params: buildReportParams(q),
    });
    return unwrapResponse<AbsenteeismResponse>(response);
  },

  getDailyOTSheet: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/daily-ot-sheet"), {
      params: buildReportParams(q),
    });
    return unwrapResponse<DailyOtSheetRow[]>(response);
  },

  getDailyOTSummary: async (q: AttendanceQuery) => {
    const response = await api.get<unknown>(platformApiUrl("/api/v1/Attendance/daily-ot-summary"), {
      params: buildReportParams(q),
    });
    return unwrapResponse<DailyOtSummaryRow[]>(response);
  },

  bulkAdjust: async (data: {
    companyId: string;
    adminId: string;
    entries: BulkAdjustEntry[];
  }) => {
    const response = await api.post<unknown>(platformApiUrl("/api/v1/Attendance/bulk-adjust"), data);
    return unwrapResponse<BulkAdjustResult>(response);
  },

  deleteAttendance: async (id: string, companyId: string) => {
    const response = await api.delete<unknown>(platformApiUrl(`/api/v1/Attendance/${encodeURIComponent(id)}`), {
      params: { companyId },
    });
    return unwrapResponse<boolean>(response);
  },

  adjustAttendance: async (data: {
    id: string;
    inTime?: string | null;
    outTime?: string | null;
    remarks?: string | null;
    adminId: string;
  }) => {
    const response = await api.patch<unknown>(platformApiUrl("/api/v1/Attendance/adjust"), data);
    return unwrapResponse<boolean>(response);
  },

  approveAttendance: async (id: string, adminId: string) => {
    const response = await api.patch<unknown>(
      platformApiUrl(`/api/v1/Attendance/${encodeURIComponent(id)}/approve`),
      null,
      { params: { adminId } },
    );
    return unwrapResponse<boolean>(response);
  },

  exportDailyReportCsv: async (q: AttendanceQuery, fileName?: string) => {
    const response = await api.get(platformApiUrl("/api/v1/Attendance/daily-report/export/csv"), {
      params: buildReportParams(q),
      responseType: "blob",
    });
    downloadBlob(response.data, fileName ?? `daily-report-${q.fromDate}.csv`, "text/csv");
  },

  exportReport: async (
    reportKey: string,
    q: AttendanceQuery,
    format: "xlsx" | "pdf",
    fileName: string,
    extraParams?: Record<string, string | number | undefined>,
  ) => {
    const response = await api.get(
      platformApiUrl(`/api/v1/attendance/reports/${reportKey}/export.${format}`),
      {
        params: { ...buildReportParams(q), ...extraParams },
        responseType: "blob",
      },
    );
    downloadBlob(
      response.data,
      `${fileName}.${format}`,
      format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  },

  exportDailySummaryCsv: async (q: AttendanceQuery, fileName?: string) => {
    const response = await api.get(platformApiUrl("/api/v1/Attendance/daily-summary/export/csv"), {
      params: buildReportParams(q),
      responseType: "blob",
    });
    downloadBlob(response.data, fileName ?? `daily-summary-${q.fromDate}.csv`, "text/csv");
  },
};

/** Build AttendanceQuery from legacy CommonFilterParams + company GUID. */
export function toAttendanceQuery(
  companyEntityId: string,
  filters: {
    date?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    sectionId?: string;
    designationId?: string;
    groupId?: string;
    lineName?: string;
    attendanceStatus?: string;
    searchTerm?: string;
    employeeCard?: number;
  },
): AttendanceQuery {
  const date = filters.date;
  const fromDate = filters.startDate ?? date ?? new Date().toISOString().slice(0, 10);
  const toDate = filters.endDate ?? date ?? fromDate;
  return {
    companyId: companyEntityId,
    fromDate,
    toDate,
    date,
    departmentId: filters.departmentId,
    sectionId: filters.sectionId,
    designationId: filters.designationId,
    groupId: filters.groupId,
    lineName: filters.lineName,
    attendanceStatus: filters.attendanceStatus,
    searchTerm: filters.searchTerm,
    employeeID: filters.employeeCard ? String(filters.employeeCard) : undefined,
  };
}
