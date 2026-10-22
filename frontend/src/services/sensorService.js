import api from './api';

export const sensorService = {
  ingest: async (readingData) => {
    const res = await api.post('/sensors/readings', readingData);
    return res.data;
  },

  getHistory: async (machineId, limit = 40) => {
    const res = await api.get(`/sensors/${machineId}?limit=${limit}`);
    return res.data.data;
  },

  getLatest: async (machineId) => {
    const res = await api.get(`/sensors/${machineId}/latest`);
    return res.data.data;
  }
};
