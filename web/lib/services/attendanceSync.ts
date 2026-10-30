import api from "@/lib/api";
import { CommonFilterParams } from "./attendance";

export interface AttendanceLog {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    logTime: string;
    deviceId: string;
    verificationMode: string;
    createdAt: string;
}

export interface SyncLogsParams {
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    companyId?: number;
}

export const attendanceSyncService = {
    getLogs: async (params: SyncLogsParams) => {
        const response = await api.get<AttendanceLog[]>("/AttendanceSync/logs", { params });
        return response.data;
    },

    deleteLogs: async (ids: number[]) => {
        const response = await api.delete("/AttendanceSync/logs", { data: { ids } });
        return response.data;
    },

    syncDeviceData: async (data: { dbPath?: string; startDate?: string; endDate?: string; companyId?: number }) => {
        const response = await api.post("/AttendanceSync/sync", data);
        return response.data;
    },

    processAttendance: async (data: {
        date?: string;
        startDate?: string;
        endDate?: string;
        employeeCodes?: string[];
        departmentId?: number;
        sectionId?: number;
        companyId?: number;
    }) => {
        const response = await api.post("/AttendanceSync/process-daily", data);
        return response.data;
    },

    cleanupData: async (confirmationCode: string) => {
        const response = await api.post("/AttendanceSync/cleanup-data", { confirmationCode });
        return response.data;
    }
};
