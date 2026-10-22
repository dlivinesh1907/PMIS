import api from './api';

export const alertService = {
  getAll: async (params) => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },

  getByMachine: async (machineId) => {
    const res = await api.get(`/alerts/${machineId}`);
    return res.data.data;
  },

  acknowledge: async (id) => {
    const res = await api.put(`/alerts/${id}/acknowledge`);
    return res.data.data;
  },

  resolve: async (id) => {
    const res = await api.put(`/alerts/${id}/resolve`);
    return res.data.data;
  }
};
