import api from '../api';

export const databaseService = {
  backup: async () => {
    const response = await api.post('/database/backup');
    return response.data;
  },

  restore: async (fileName: string) => {
    const response = await api.post('/database/restore', { fileName });
    return response.data;
  },

  uploadBak: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/database/upload-bak', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadBackup: async (fileName: string) => {
    const response = await api.get(`/database/download-backup/${fileName}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
