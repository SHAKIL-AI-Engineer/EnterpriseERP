import { attendanceApi, type AttendanceQuery, type DailyOtSheetRow, type DailyOtSummaryRow } from "./attendance-api";

export type { DailyOtSheetRow, DailyOtSummaryRow } from "./attendance-api";

export const overtimeService = {
  getDailyOTSheet: async (q: AttendanceQuery): Promise<DailyOtSheetRow[]> => {
    return attendanceApi.getDailyOTSheet(q);
  },

  getDailyOTSummary: async (q: AttendanceQuery): Promise<DailyOtSummaryRow[]> => {
    return attendanceApi.getDailyOTSummary(q);
  },

  exportDailyOTSheetExcel: async (q: AttendanceQuery) => {
    await attendanceApi.exportDailyReportCsv(q, `daily-ot-sheet-${q.fromDate}.csv`);
  },

  exportDailyOTSummaryExcel: async (q: AttendanceQuery) => {
    await attendanceApi.exportDailySummaryCsv(q, `daily-ot-summary-${q.fromDate}.csv`);
  },
};
