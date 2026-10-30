import api from '../api';

export interface OpeningBalance {
    id?: number;
    accountName: string;
    category: string;
    amount: number;
    date: string;
    remarks: string;
}

export const openingBalanceService = {
    getBalances: async () => {
        const response = await api.get<OpeningBalance[]>('/openingbalances');
        return response.data;
    },

    createBalance: async (data: OpeningBalance) => {
        const response = await api.post<OpeningBalance>('/openingbalances', data);
        return response.data;
    },

    updateBalance: async (id: number, data: OpeningBalance) => {
        const response = await api.put(`/openingbalances/${id}`, data);
        return response.data;
    },

    deleteBalance: async (id: number) => {
        const response = await api.delete(`/openingbalances/${id}`);
        return response.data;
    }
};
