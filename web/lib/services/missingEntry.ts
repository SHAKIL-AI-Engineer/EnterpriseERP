import { attendanceApi, type AttendanceQuery, type MissingEntryResponse } from "./attendance-api";

export type { MissingEntry, MissingEntrySummary, MissingEntryResponse } from "./attendance-api";

export const missingEntryService = {
  getMissingEntries: async (q: AttendanceQuery): Promise<MissingEntryResponse> => {
    return attendanceApi.getMissingEntries(q);
  },
};
