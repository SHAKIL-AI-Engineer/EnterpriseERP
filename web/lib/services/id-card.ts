import api from '../api';

export const idCardService = {
    generateIDCards: async (employeeIds: number[], design: string = "modern") => {
        const response = await api.post('/idcard/generate', {
            employeeIds,
            design
        }, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `IDCards_${new Date().getTime()}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
