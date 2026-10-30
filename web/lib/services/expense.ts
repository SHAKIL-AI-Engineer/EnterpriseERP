import api from '../api';

export interface Expense {
    id?: number;
    expenseDate: string;
    category: string;
    amount: number;
    paymentMethod?: string;
    referenceNumber?: string;
    description?: string;
    branch?: string;
    createdAt?: string;
}

export const expenseService = {
    getAll: async (params?: { fromDate?: string; toDate?: string; category?: string; branch?: string }) => {
        const response = await api.get<Expense[]>('/expense', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Expense>(`/expense/${id}`);
        return response.data;
    },

    create: async (data: Expense) => {
        const response = await api.post<Expense>('/expense', data);
        return response.data;
    },

    update: async (id: number, data: Expense) => {
        const response = await api.put(`/expense/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete(`/expense/${id}`);
        return response.data;
    },

    exportExcel: async (params?: { fromDate?: string; toDate?: string; category?: string; branch?: string }) => {
        const response = await api.get('/expense/export/excel', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
