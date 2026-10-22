import api from './api';

export const predictionService = {
  analyzeMachine: async (machineId) => {
    const res = await api.post(`/predictions/analyze/${machineId}`);
    return res.data.data;
  },

  getLatest: async (machineId) => {
    const res = await api.get(`/predictions/${machineId}/latest`);
    return res.data.data;
  },

  getHistory: async (machineId, limit = 30) => {
    const res = await api.get(`/predictions/${machineId}/history?limit=${limit}`);
    return res.data.data;
  }
};
