import { attendanceApi, type AttendanceQuery, type AbsenteeismResponse } from "./attendance-api";

export type { AbsenteeismRecord, AbsenteeismSummary, AbsenteeismResponse } from "./attendance-api";

export const absenteeismService = {
  getAbsenteeismRecords: async (q: AttendanceQuery): Promise<AbsenteeismResponse> => {
    return attendanceApi.getAbsenteeismRecords(q);
  },

  exportAbsenteeismExcel: async (_q: AttendanceQuery) => {
    // CSV export for absenteeism deferred; use report table export in Phase 2
  },

  exportAbsenteeismPdf: async (_q: AttendanceQuery) => {
    // PDF export deferred
  },
};
