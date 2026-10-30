import api from '../api';

export interface EmployeePunishment {
    id: number;
    employeeId: number;
    employeeCard: string;
    employeeName: string;
    department: string;
    designation: string;
    punishmentType: string;
    reason: string;
    fineAmount: number;
    suspensionDays: number;
    punishmentDate: string;
    effectiveDate?: string;
    expiryDate?: string;
    status: string;
    remarks?: string;
    createdBy?: string;
    createdAt: string;
}

export interface CreateEmployeePunishmentDto {
    employeeId: number;
    punishmentType: string;
    reason: string;
    fineAmount: number;
    suspensionDays: number;
    punishmentDate: string;
    effectiveDate?: string;
    expiryDate?: string;
    status: string;
    remarks?: string;
}

export interface PunishmentSummary {
    totalRecords: number;
    activePunishments: number;
    warnings: number;
    fines: number;
    suspensions: number;
    totalFineAmount: number;
}

export interface PunishmentResponse {
    summary: PunishmentSummary;
    records: EmployeePunishment[];
}

export const punishmentService = {
    getPunishments: async (params?: {
        fromDate?: string;
        toDate?: string;
        employeeId?: number;
        departmentId?: number;
        punishmentType?: string;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<PunishmentResponse>('/EmployeePunishment', { params });
        return response.data;
    },

    getPunishment: async (id: number) => {
        const response = await api.get<EmployeePunishment>(`/EmployeePunishment/${id}`);
        return response.data;
    },

    createPunishment: async (data: CreateEmployeePunishmentDto) => {
        const response = await api.post<EmployeePunishment>('/EmployeePunishment', data);
        return response.data;
    },

    updatePunishment: async (id: number, data: CreateEmployeePunishmentDto) => {
        const response = await api.put(`/EmployeePunishment/${id}`, data);
        return response.data;
    },

    deletePunishment: async (id: number) => {
        const response = await api.delete(`/EmployeePunishment/${id}`);
        return response.data;
    },
};
