import api from './api';

export const maintenanceService = {
  getAll: async (params) => {
    const res = await api.get('/maintenance', { params });
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/maintenance', data);
    return res.data.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/maintenance/${id}`, data);
    return res.data.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/maintenance/${id}`);
    return res.data;
  }
};
