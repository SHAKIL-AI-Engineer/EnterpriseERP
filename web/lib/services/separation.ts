import api from '../api';

export interface Separation {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    departmentName: string;
    designationName: string;
    lastWorkingDate: string;
    type: string;
    reason: string;
    status: string;
    adminRemark?: string;
    isSettled: boolean;
    createdAt: string;
}

export interface CreateSeparationDto {
    employeeId: number;
    lastWorkingDate: string;
    type: string;
    reason: string;
}

export const separationService = {
    getSeparations: async () => {
        const response = await api.get<Separation[]>('/separation');
        return response.data;
    },

    createSeparation: async (data: CreateSeparationDto) => {
        const response = await api.post('/separation', data);
        return response.data;
    },

    updateStatus: async (id: number, status: string, adminRemark?: string) => {
        const response = await api.put(`/separation/${id}/status`, { status, adminRemark });
        return response.data;
    },

    deleteSeparation: async (id: number) => {
        await api.delete(`/separation/${id}`);
    }
};
