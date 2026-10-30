import api from '../api';

export interface CounselingRecord {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    counselingDate: string;
    issueType: string;
    description: string;
    actionTaken: string | null;
    followUpNotes: string | null;
    status: string;
    severity: string;
    followUpDate: string | null;
    createdBy: string | null;
    createdAt: string;
}

export interface CreateCounselingRecord {
    employeeCard: number;
    counselingDate: string;
    issueType: string;
    description: string;
    actionTaken?: string;
    followUpNotes?: string;
    status?: string;
    severity?: string;
    followUpDate?: string;
}

export interface CounselingSummary {
    totalRecords: number;
    openCases: number;
    closedCases: number;
    highSeverity: number;
    requiringFollowUp: number;
}

export interface CounselingResponse {
    summary: CounselingSummary;
    records: CounselingRecord[];
}

export const counselingService = {
    getCounselingRecords: async (params?: {
        fromDate?: string;
        toDate?: string;
        employeeCard?: number;
        departmentId?: number;
        issueType?: string;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<CounselingResponse>('/counseling', { params });
        return response.data;
    },

    getCounselingRecord: async (id: number) => {
        const response = await api.get<CounselingRecord>(`/counseling/${id}`);
        return response.data;
    },

    createCounselingRecord: async (data: CreateCounselingRecord) => {
        const response = await api.post<CounselingRecord>('/counseling', data);
        return response.data;
    },

    updateCounselingRecord: async (id: number, data: CreateCounselingRecord) => {
        const response = await api.put(`/counseling/${id}`, data);
        return response.data;
    },

    deleteCounselingRecord: async (id: number) => {
        const response = await api.delete(`/counseling/${id}`);
        return response.data;
    }
};
