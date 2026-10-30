import api from '../api';
import { unwrapApiData } from '../api-response';

export type ShiftCategory = 'GeneralDuty' | 'Day' | 'Night';
export type BreakType = 'Lunch' | 'Other';

export interface Shift {
  id: string;
  companyId: string;
  shiftName: string;
  shiftType: string;
  shiftCategory: ShiftCategory;
  punchWindowBeforeMinutes: number;
  startTime: string;
  endTime: string;
  isCrossDay: boolean;
  isGeneralDuty: boolean;
  isDefault: boolean;
  isActive: boolean;
  weeklyOffDayOfWeek?: number | null;
}

export interface ShiftPolicy {
  id: string;
  shiftId: string;
  inGraceMinutes: number;
  outGraceMinutes: number;
  lateAfterMinutes: number;
  earlyOutBeforeMinutes: number;
  minimumWorkingMinutes: number;
  halfDayWorkingMinutes: number;
  allowOvertime: boolean;
  overtimeStartAfterMinutes: number;
  minimumOvertimeMinutes: number;
  maximumOvertimeMinutes: number;
  lunchBreakMinutes: number;
  deductLunchFromWorking: boolean;
  holidayWorkAllAsOvertime: boolean;
  weeklyOffWorkAllAsOvertime: boolean;
}

export interface ShiftBreak {
  id: string;
  shiftId: string;
  breakType: BreakType;
  breakName: string;
  breakStartTime: string;
  breakEndTime: string;
  breakMinutes: number;
  isPaidBreak: boolean;
  isActive: boolean;
}

export interface ShiftDetail {
  shift: Shift;
  policy: ShiftPolicy | null;
  breaks: ShiftBreak[];
}

export function createDefaultShiftPolicy(shiftId: string, category: ShiftCategory = 'GeneralDuty'): Omit<ShiftPolicy, 'id'> & { shiftId: string } {
  const late = category === 'Night' ? 15 : 10;
  return {
    shiftId,
    inGraceMinutes: late,
    outGraceMinutes: 5,
    lateAfterMinutes: late,
    earlyOutBeforeMinutes: 5,
    minimumWorkingMinutes: 480,
    halfDayWorkingMinutes: 240,
    allowOvertime: true,
    overtimeStartAfterMinutes: 30,
    minimumOvertimeMinutes: 30,
    maximumOvertimeMinutes: 240,
    lunchBreakMinutes: 60,
    deductLunchFromWorking: true,
    holidayWorkAllAsOvertime: true,
    weeklyOffWorkAllAsOvertime: true,
  };
}

export interface ShiftEvaluation {
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  shiftId: string;
  shiftName: string;
  shiftCategory: string;
  shiftStart: string;
  shiftEnd: string;
  isCrossDay: boolean;
  punchWindowStart: string;
  punchWindowEnd: string;
  calendarDayType: string;
  isWeeklyOff: boolean;
  isHoliday: boolean;
  isOffDayWorkEligibleForFullOt: boolean;
  policy: ShiftPolicy;
}

export interface CreateShiftDto {
  companyId: string;
  shiftName: string;
  shiftType: string;
  shiftCategory: ShiftCategory;
  punchWindowBeforeMinutes?: number;
  startTime: string;
  endTime: string;
  isCrossDay: boolean;
  isGeneralDuty: boolean;
  isDefault: boolean;
  weeklyOffDayOfWeek?: number | null;
}

export interface UpdateShiftDto extends CreateShiftDto {
  id: string;
}

export interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  shiftName: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages?: number;
}

export interface TemporaryShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  shiftName: string;
  shiftDate: string;
  reason?: string | null;
  companyId?: string;
}

export interface ShiftCalendarEntry {
  id: string;
  employeeId?: string | null;
  shiftId?: string | null;
  calendarDate: string;
  dayType: string;
  remarks?: string | null;
}

function unwrap<T>(response: { data: unknown }): T {
  return unwrapApiData<T>(response.data);
}

export const shiftService = {
  getShifts: async (params?: { companyId?: string }) => {
    const url = params?.companyId ? `shifts?companyId=${params.companyId}` : 'shifts';
    const response = await api.get(url);
    return unwrap<Shift[]>(response) ?? [];
  },

  getShift: async (id: string) => {
    const response = await api.get(`shifts/${id}`);
    return unwrap<Shift>(response);
  },

  getShiftDetail: async (id: string) => {
    const response = await api.get(`shifts/${id}/detail`);
    return unwrap<ShiftDetail>(response);
  },

  createShift: async (shift: CreateShiftDto) => {
    const response = await api.post('shifts', shift);
    return unwrap<string>(response);
  },

  updateShift: async (id: string, shift: UpdateShiftDto) => {
    const response = await api.put(`shifts/${id}`, shift);
    return unwrap<boolean>(response);
  },

  activateShift: async (id: string) => {
    const response = await api.patch(`shifts/${id}/activate`);
    return unwrap<boolean>(response);
  },

  deactivateShift: async (id: string) => {
    const response = await api.patch(`shifts/${id}/deactivate`);
    return unwrap<boolean>(response);
  },

  deleteShift: async (id: string) => shiftService.deactivateShift(id),

  getPolicy: async (shiftId: string) => {
    const response = await api.get(`shifts/${shiftId}/policy`);
    return unwrap<ShiftPolicy>(response);
  },

  upsertPolicy: async (shiftId: string, policy: Omit<ShiftPolicy, 'id' | 'shiftId'> & { shiftId: string }) => {
    const response = await api.put(`shifts/${shiftId}/policy`, policy);
    return unwrap<ShiftPolicy>(response);
  },

  getBreaks: async (shiftId: string) => {
    const response = await api.get(`shifts/${shiftId}/breaks`);
    return unwrap<ShiftBreak[]>(response) ?? [];
  },

  createBreak: async (shiftId: string, body: {
    companyId: string;
    shiftId: string;
    breakType: BreakType;
    breakName: string;
    breakStartTime: string;
    breakEndTime: string;
    breakMinutes: number;
    isPaidBreak: boolean;
  }) => {
    const response = await api.post(`shifts/${shiftId}/breaks`, body);
    return unwrap<string>(response);
  },

  updateBreak: async (shiftId: string, breakId: string, body: {
    id: string;
    breakName: string;
    breakStartTime: string;
    breakEndTime: string;
    breakMinutes: number;
    isPaidBreak: boolean;
  }) => {
    const response = await api.put(`shifts/${shiftId}/breaks/${breakId}`, body);
    return unwrap<boolean>(response);
  },

  deleteBreak: async (shiftId: string, breakId: string) => {
    const response = await api.delete(`shifts/${shiftId}/breaks/${breakId}`);
    return unwrap<boolean>(response);
  },

  assignEmployeeShift: async (body: {
    companyId: string;
    employeeId: string;
    shiftId: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    assignedBy?: string | null;
  }) => {
    const response = await api.post('employee-shifts/assign', body);
    return unwrap<string>(response);
  },

  getCurrentAssignment: async (employeeId: string, companyId: string) => {
    const response = await api.get(`employee-shifts/${employeeId}/current`, { params: { companyId } });
    return unwrap<EmployeeShiftAssignment>(response);
  },

  getAssignmentHistory: async (employeeId: string, companyId: string) => {
    const response = await api.get(`employee-shifts/${employeeId}/history`, { params: { companyId } });
    return unwrap<EmployeeShiftAssignment[]>(response) ?? [];
  },

  assignTemporaryShift: async (body: {
    companyId: string;
    employeeId: string;
    shiftId: string;
    shiftDate: string;
    reason?: string | null;
    createdBy?: string | null;
  }) => {
    const response = await api.post('temporary-shifts', body);
    return unwrap<string>(response);
  },

  listTemporaryShifts: async (params: {
    companyId: string;
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
  }) => {
    const response = await api.get('temporary-shifts/list', { params });
    const page = unwrap<PagedResult<TemporaryShiftAssignment>>(response);
    if (page?.items) return page.items;
    // Backward compatibility if API still returns array
    return unwrap<TemporaryShiftAssignment[]>(response) ?? [];
  },

  listTemporaryShiftsPage: async (params: {
    companyId: string;
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    page?: number;
    pageSize?: number; // 0 = All
  }) => {
    const response = await api.get('temporary-shifts/list', { params });
    return unwrap<PagedResult<TemporaryShiftAssignment>>(response);
  },

  getTemporaryShift: async (companyId: string, employeeId: string, date: string) => {
    const response = await api.get('temporary-shifts', { params: { companyId, employeeId, date } });
    return unwrap<TemporaryShiftAssignment>(response);
  },

  getTemporaryShiftById: async (id: string) => {
    const response = await api.get(`temporary-shifts/${id}`);
    return unwrap<TemporaryShiftAssignment>(response);
  },

  updateTemporaryShift: async (id: string, body: {
    id: string;
    companyId: string;
    employeeId: string;
    shiftId: string;
    shiftDate: string;
    reason?: string | null;
    updatedBy?: string | null;
  }) => {
    const response = await api.put(`temporary-shifts/${id}`, body);
    return unwrap<boolean>(response);
  },

  deleteTemporaryShift: async (id: string) => {
    const response = await api.delete(`temporary-shifts/${id}`);
    return unwrap<boolean>(response);
  },

  createCalendarEntry: async (body: {
    companyId: string;
    employeeId?: string | null;
    shiftId?: string | null;
    calendarDate: string;
    dayType: string;
    remarks?: string | null;
  }) => {
    const response = await api.post('shift-calendars', body);
    return unwrap<string>(response);
  },

  getCalendarEntries: async (companyId: string, fromDate: string, toDate: string) => {
    const response = await api.get('shift-calendars', { params: { companyId, fromDate, toDate } });
    return unwrap<ShiftCalendarEntry[]>(response) ?? [];
  },

  evaluate: async (companyId: string, employeeId: string, date: string) => {
    const response = await api.get('shifts/evaluation', { params: { companyId, employeeId, date } });
    return unwrap<ShiftEvaluation>(response);
  },
};
