import api from '../api';

export interface Roster {
    id: number;
    employeeCard: number;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    designationName: string;
    date: string;
    shiftId: number;
    shiftName: string;
    startTime: string;
    endTime: string;
    isOffDay: boolean;
}

export interface CreateRosterDto {
    employeeCard: number;
    date: string;
    shiftId: number;
    isOffDay: boolean;
}

export interface BulkRosterDto {
    employeeCards: number[];
    startDate: string;
    endDate: string;
    shiftId: number;
    isOffDay: boolean;
}

export const rosterService = {
    getRosters: async (params?: {
        fromDate?: string;
        toDate?: string;
        departmentId?: number;
        searchTerm?: string;
    }) => {
        const response = await api.get<Roster[]>('/roster', { params });
        return response.data;
    },

    createRoster: async (data: CreateRosterDto) => {
        const response = await api.post('/roster', data);
        return response.data;
    },

    createBulkRoster: async (data: BulkRosterDto) => {
        const response = await api.post('/roster/bulk', data);
        return response.data;
    },

    deleteRoster: async (id: number) => {
        const response = await api.delete(`/roster/${id}`);
        return response.data;
    },
};
