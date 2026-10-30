import api from '../api';

export interface TiffinBill {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    date: string;
    amount: number;
    status: string;
    createdAt: string;
    shiftName?: string;
    companyName?: string;
}

export interface TiffinBillSummary {
    totalAmount: number;
    totalEmployees: number;
    totalRecords: number;
}

export interface TiffinBillResponse {
    summary: TiffinBillSummary;
    records: TiffinBill[];
}

export interface BillProcessRequest {
    fromDate: string;
    toDate: string;
    companyId?: number;
    departmentId?: number;
}

export const tiffinBillService = {
    getTiffinBills: async (params?: {
        fromDate?: string;
        toDate?: string;
        employeeId?: number;
        departmentId?: number;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<TiffinBillResponse>('/tiffinbill', { params });
        return response.data;
    },

    processTiffinBills: async (request: BillProcessRequest) => {
        const response = await api.post('/tiffinbill/process', request);
        return response.data;
    },

    deleteTiffinBill: async (id: number) => {
        const response = await api.delete(`/tiffinbill/${id}`);
        return response.data;
    }
};
