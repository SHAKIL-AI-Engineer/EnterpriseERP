import { getActiveCompanyHeaderValue } from "@/lib/active-company-storage";
import { employeeService, type Employee } from "@/lib/services/employee";
import type {
  BackendLeaveApplication,
  BackendLeaveApplicationListItem,
  BackendLeaveBalance,
  BackendLeavePolicy,
  BackendLeaveType,
  Holiday,
} from "@/lib/services/leave";

export interface LeaveApplicationView {
  id: string;
  companyId: string;
  employeeEntityId: string;
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveCode?: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: string | null;
  reason: string;
  status: string;
  appliedDate: string;
  appliedBy: string;
  remarks?: string;
  attachmentUrl?: string;
  steps: BackendLeaveApplication["steps"];
  approvedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
}

export interface LeaveTypeWithPolicy {
  id: string;
  type: BackendLeaveType;
  policy?: BackendLeavePolicy;
  yearlyLimit: number;
}

export interface GroupedHoliday {
  id: string;
  groupKey: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  isPaid: boolean;
  isActive: boolean;
  entityIds: string[];
  rows: Holiday[];
}

export interface MonthlyLeaveReportRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  sickLeave: number;
  casualLeave: number;
  earnedLeave: number;
  paternityLeave: number;
  maternityLeave: number;
  lwp: number;
  otherLeave: number;
  totalDays: number;
}

/** Resolve active company GUID from storage (client-only). */
export function getActiveCompanyIdOrThrow(): string {
  const id = getActiveCompanyHeaderValue(true);
  if (!id) {
    throw new Error("No active company selected. Choose a company from the header.");
  }
  return id;
}

export function listItemToLeaveApplicationView(
  row: BackendLeaveApplicationListItem,
): LeaveApplicationView {
  return {
    id: row.id,
    companyId: row.companyId,
    employeeEntityId: row.employeeId,
    employeeCard: 0,
    employeeId: row.employeeCode,
    employeeName: row.employeeName,
    department: row.departmentName ?? "",
    designation: row.designationName ?? "",
    leaveTypeId: row.leaveTypeId,
    leaveTypeName: row.leaveTypeName ?? row.leaveCode ?? "Leave",
    leaveCode: row.leaveCode,
    startDate: row.fromDate,
    endDate: row.toDate,
    totalDays: row.totalDays,
    isHalfDay: row.isHalfDay,
    halfDayType: row.halfDayType,
    reason: row.reason ?? "",
    status: row.status,
    appliedDate: row.appliedAt,
    appliedBy: row.appliedBy,
    remarks: undefined,
    steps: [],
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    cancelledAt: row.cancelledAt,
  };
}

export function toLeaveApplicationView(
  app: BackendLeaveApplication,
  employee?: Employee | null,
  leaveType?: BackendLeaveType | null
): LeaveApplicationView {
  const remarks =
    app.steps?.find((s) => s.remarks)?.remarks ??
    app.steps?.[0]?.remarks ??
    undefined;

  return {
    id: app.id,
    companyId: app.companyId,
    employeeEntityId: app.employeeId,
    employeeCard: employee?.id ?? 0,
    employeeId: employee?.employeeId ?? "UNKNOWN",
    employeeName: employee?.fullNameEn ?? "Unknown Employee",
    department: employee?.departmentName ?? "",
    designation: employee?.designationName ?? "",
    leaveTypeId: app.leaveTypeId,
    leaveTypeName: leaveType?.leaveName ?? app.leaveCode ?? "Leave",
    leaveCode: app.leaveCode,
    startDate: app.fromDate,
    endDate: app.toDate,
    totalDays: app.totalDays,
    isHalfDay: app.isHalfDay,
    halfDayType: app.halfDayType,
    reason: app.reason ?? "",
    status: app.status,
    appliedDate: app.appliedAt,
    appliedBy: app.appliedBy,
    remarks,
    steps: app.steps ?? [],
    approvedAt: app.approvedAt,
    rejectedAt: app.rejectedAt,
    cancelledAt: app.cancelledAt,
  };
}

/** Maps API list rows (already enriched) to table views. */
export function mapLeaveApplicationListItems(
  items: BackendLeaveApplicationListItem[],
): LeaveApplicationView[] {
  return items.map(listItemToLeaveApplicationView);
}

/** @deprecated Prefer mapLeaveApplicationListItems when using paginated list API. */
export async function enrichApplications(
  apps: BackendLeaveApplication[] | BackendLeaveApplicationListItem[],
  companyId: string,
  leaveTypes?: BackendLeaveType[]
): Promise<LeaveApplicationView[]> {
  if (apps.length > 0 && "employeeName" in apps[0]) {
    return mapLeaveApplicationListItems(
      apps as BackendLeaveApplicationListItem[],
    );
  }

  const employeeIds = Array.from(
    new Set(
      (apps as BackendLeaveApplication[])
        .map((a) => a.employeeId)
        .map((x) => String(x).trim())
        .filter(Boolean),
    ),
  );
  const employees = await employeeService.getEmployeesByEntityIds(employeeIds);
  const employeeById = new Map(employees.map((e) => [e.entityId, e]));
  const { leaveService } = await import("@/lib/services/leave");
  const types = leaveTypes ?? (await leaveService.listLeaveTypes(companyId));

  return (apps as BackendLeaveApplication[]).map((app) => {
    const emp = employeeById.get(app.employeeId);
    const lt = types.find((t) => t.id === app.leaveTypeId);
    return toLeaveApplicationView(app, emp, lt);
  });
}

export async function enrichApplication(
  app: BackendLeaveApplication,
  companyId: string
): Promise<LeaveApplicationView> {
  const { leaveService } = await import("@/lib/services/leave");
  const [employees, types] = await Promise.all([
    employeeService.getEmployeesByEntityIds([app.employeeId]),
    leaveService.listLeaveTypes(companyId),
  ]);
  const emp = employees[0];
  const lt = types.find((t) => t.id === app.leaveTypeId);
  return toLeaveApplicationView(app, emp, lt);
}

export function mergeLeaveTypesWithPolicies(
  types: BackendLeaveType[],
  policies: BackendLeavePolicy[]
): LeaveTypeWithPolicy[] {
  return types.map((type) => {
    const policy = policies.find((p) => p.leaveTypeId === type.id);
    return {
      id: type.id,
      type,
      policy,
      yearlyLimit: policy?.yearlyEntitlement ?? 0,
    };
  });
}

export function groupHolidaysByRange(rows: Holiday[]): GroupedHoliday[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
  );
  const grouped: GroupedHoliday[] = [];

  for (const item of sorted) {
    const last = grouped[grouped.length - 1];
    const itemDate = new Date(item.holidayDate);

    if (last) {
      const lastEnd = new Date(last.endDate);
      const diffDays =
        (itemDate.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24);
      if (
        diffDays === 1 &&
        last.name === item.holidayName &&
        last.type === item.holidayType &&
        last.isPaid === item.isPaid
      ) {
        last.endDate = item.holidayDate;
        last.entityIds.push(item.id);
        last.rows.push(item);
        continue;
      }
    }

    grouped.push({
      id: item.id,
      groupKey: item.id,
      name: item.holidayName,
      startDate: item.holidayDate,
      endDate: item.holidayDate,
      type: item.holidayType,
      isPaid: item.isPaid,
      isActive: item.isActive,
      entityIds: [item.id],
      rows: [item],
    });
  }

  return grouped;
}

export function buildMonthlyLeaveReport(
  apps: BackendLeaveApplicationListItem[],
  employees: Employee[],
  leaveTypes: BackendLeaveType[],
  params: { year: number; month: number }
): MonthlyLeaveReportRow[] {
  const agg: Record<string, MonthlyLeaveReportRow> = {};

  for (const app of apps) {
    if (app.status !== "Approved") continue;

    const start = new Date(app.fromDate);
    if (
      start.getFullYear() !== params.year ||
      start.getMonth() + 1 !== params.month
    ) {
      continue;
    }

    const emp = employees.find((e) => e.entityId === app.employeeId);
    const employeeCode = app.employeeCode || emp?.employeeId || app.employeeId;
    const employeeName = app.employeeName || emp?.fullNameEn || "Unknown";
    const department = app.departmentName ?? emp?.departmentName ?? "";

    if (!agg[app.employeeId]) {
      agg[app.employeeId] = {
        id: app.employeeId,
        employeeId: employeeCode,
        employeeName,
        department,
        sickLeave: 0,
        casualLeave: 0,
        earnedLeave: 0,
        paternityLeave: 0,
        maternityLeave: 0,
        lwp: 0,
        otherLeave: 0,
        totalDays: 0,
      };
    }

    const item = agg[app.employeeId];
    const lt = leaveTypes.find((t) => t.id === app.leaveTypeId);
    const code = (lt?.leaveCode ?? app.leaveCode ?? "").toUpperCase();

    if (code === "SL" || code === "SICK") {
      item.sickLeave += app.totalDays;
    } else if (code === "CL" || code === "CASUAL") {
      item.casualLeave += app.totalDays;
    } else if (
      code === "EL" ||
      code === "AL" ||
      code === "EARNED" ||
      code === "ANNUAL"
    ) {
      item.earnedLeave += app.totalDays;
    } else if (code === "PL" || code === "PATERNITY") {
      item.paternityLeave += app.totalDays;
    } else if (code === "ML" || code === "MATERNITY") {
      item.maternityLeave += app.totalDays;
    } else if (code === "LWP") {
      item.lwp += app.totalDays;
    } else {
      item.otherLeave += app.totalDays;
    }
    item.totalDays += app.totalDays;
  }

  return Object.values(agg);
}

export function exportApplicationsCsv(
  apps: BackendLeaveApplicationListItem[],
): void {
  const headers = [
    "Application ID",
    "Employee ID",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Status",
    "Applied At",
  ];
  const rows = apps.map((app) => [
    app.id,
    app.employeeCode || app.employeeId,
    app.leaveTypeName || app.leaveCode || "Leave",
    app.fromDate,
    app.toDate,
    String(app.totalDays),
    app.status,
    app.appliedAt,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join(
    "\n"
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Leave_Applications.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function mapBalanceSummary(balances: BackendLeaveBalance[]) {
  const totalEntitled = balances.reduce((s, b) => s + b.entitledDays, 0);
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalBalance = balances.reduce((s, b) => s + b.balanceDays, 0);
  return { totalEntitled, totalUsed, totalBalance };
}
