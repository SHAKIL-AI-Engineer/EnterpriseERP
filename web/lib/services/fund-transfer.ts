import api from '../api';

export interface FundTransfer {
    id?: number;
    fromBranch: string;
    toBranch: string;
    requestedAmount: number;
    approvedAmount?: number;
    reason: string;
    status: string;
    requestDate: string;
    approvedDate?: string;
    completedDate?: string;
}

export const fundTransferService = {
    getTransfers: async (params?: { branch?: string; status?: string }) => {
        const response = await api.get<FundTransfer[]>('/fundtransfers', { params });
        return response.data;
    },

    getTransfer: async (id: number) => {
        const response = await api.get<FundTransfer>(`/fundtransfers/${id}`);
        return response.data;
    },

    createTransfer: async (data: FundTransfer) => {
        const response = await api.post<FundTransfer>('/fundtransfers', data);
        return response.data;
    },

    updateTransfer: async (id: number, data: Partial<FundTransfer>) => {
        const response = await api.put(`/fundtransfers/${id}`, data);
        return response.data;
    },

    deleteTransfer: async (id: number) => {
        const response = await api.delete(`/fundtransfers/${id}`);
        return response.data;
    }
};
