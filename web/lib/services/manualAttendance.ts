import api from '../api';

export interface ManualAttendanceEntry {
    employeeId: string;
    companyId: number;
    date: string;
    inTime: string | null;
    outTime: string | null;
    reason: string;
    remarks: string;
    status: string;
}

export interface ManualAttendanceResponse {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    status: string;
    reason: string;
    remarks: string;
    createdBy: string;
    createdAt: string;
}

export interface ManualAttendanceHistory {
    id: number;
    employeeId: string;
    companyId: number;
    employeeName: string;
    date: string;
    inTime: string | null;
    outTime: string | null;
    status: string;
    reason: string;
    createdBy: string;
    createdAt: string;
}

export const manualAttendanceService = {
    createEntry: async (data: ManualAttendanceEntry) => {
        const response = await api.post<ManualAttendanceResponse>('/attendance/manual-entry', data);
        return response.data;
    },

    getHistory: async (params?: {
        employeeId?: string;
        companyId?: number;
        fromDate?: string;
        toDate?: string;
        pageSize?: number;
    }) => {
        const response = await api.get<ManualAttendanceHistory[]>('/attendance/manual-entry/history', { params });
        return response.data;
    }
};
