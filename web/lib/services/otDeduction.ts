import api from '../api';

export interface OTDeduction {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    deductionHours: number;
    reason: string;
    remarks: string | null;
    status: string;
    createdAt: string;
}

export interface CreateOTDeduction {
    employeeCard: number;
    date: string;
    deductionHours: number;
    reason: string;
    remarks: string | null;
    status: string;
}

export interface OTDeductionSummary {
    totalDeductedHours: number;
    totalEmployeesAffected: number;
    pendingRequests: number;
    averageDeduction: number;
}

export interface OTDeductionResponse {
    summary: OTDeductionSummary;
    records: OTDeduction[];
}

export const otDeductionService = {
    getOTDeductions: async (params: {
        fromDate?: string;
        toDate?: string;
        employeeCard?: number;
        departmentId?: number;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<OTDeductionResponse>('/OTDeduction', { params });
        return response.data;
    },

    getOTDeduction: async (id: number) => {
        const response = await api.get<OTDeduction>(`/OTDeduction/${id}`);
        return response.data;
    },

    createOTDeduction: async (data: CreateOTDeduction) => {
        const response = await api.post<OTDeduction>('/OTDeduction', data);
        return response.data;
    },

    updateOTDeduction: async (id: number, data: CreateOTDeduction) => {
        const response = await api.put(`/OTDeduction/${id}`, data);
        return response.data;
    },

    deleteOTDeduction: async (id: number) => {
        const response = await api.delete(`/OTDeduction/${id}`);
        return response.data;
    }
};
