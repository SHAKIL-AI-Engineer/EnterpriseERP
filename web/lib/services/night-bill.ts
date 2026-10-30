import api from '../api';

export interface NightBill {
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

export interface NightBillSummary {
    totalAmount: number;
    totalEmployees: number;
    totalRecords: number;
}

export interface NightBillResponse {
    summary: NightBillSummary;
    records: NightBill[];
}

export interface BillProcessRequest {
    fromDate: string;
    toDate: string;
    companyId?: number;
    departmentId?: number;
}

export const nightBillService = {
    getNightBills: async (params?: {
        fromDate?: string;
        toDate?: string;
        employeeId?: number;
        departmentId?: number;
        status?: string;
        searchTerm?: string;
    }) => {
        const response = await api.get<NightBillResponse>('/nightbill', { params });
        return response.data;
    },

    processNightBills: async (request: BillProcessRequest) => {
        const response = await api.post('/nightbill/process', request);
        return response.data;
    },

    deleteNightBill: async (id: number) => {
        const response = await api.delete(`/nightbill/${id}`);
        return response.data;
    }
};
