import api from '../api';

export interface NightBillConfig {
    id: number;
    companyId: number;
    companyName?: string;
    eligibleTimeThreshold: string; // "23:45"
    defaultAmount: number;
}

export const billConfigService = {
    getNightConfigs: async () => {
        const response = await api.get<NightBillConfig[]>('/nightbillconfig');
        return response.data;
    },
    saveNightConfig: async (data: NightBillConfig) => {
        if (data.id > 0) {
            return (await api.put(`/nightbillconfig/${data.id}`, data)).data;
        } else {
            return (await api.post<NightBillConfig>('/nightbillconfig', data)).data;
        }
    },
    deleteNightConfig: async (id: number) => {
        return (await api.delete(`/nightbillconfig/${id}`)).data;
    }
};
