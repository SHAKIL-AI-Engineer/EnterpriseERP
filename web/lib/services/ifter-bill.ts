import api from '../api';

export interface IfterBill {
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

export interface IfterBillSummary {
    totalAmount: number;
    totalEmployees: number;
    totalRecords: number;
}

export interface IfterBillResponse {
    summary: IfterBillSummary;
    records: IfterBill[];
}

export interface IfterBillProcessRequest {
    fromDate: string;
    toDate: string;
    companyId?: number;
    departmentId?: number;
}

export const ifterBillService = {
    getIfterBills: async (params?: {
        fromDate?: string;
        toDate?: string;
        employeeId?: number;
        departmentId?: number;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<IfterBillResponse>('/ifterbill', { params });
        return response.data;
    },

    processIfterBills: async (request: IfterBillProcessRequest) => {
        const response = await api.post('/ifterbill/process', request);
        return response.data;
    },

    deleteIfterBill: async (id: number) => {
        const response = await api.delete(`/ifterbill/${id}`);
        return response.data;
    }
};
