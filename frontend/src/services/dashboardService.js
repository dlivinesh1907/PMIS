import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data.data;
  }
};

export const simulationService = {
  getStatus: async () => {
    const res = await api.get('/simulation/status');
    return res.data.data;
  },

  start: async () => {
    const res = await api.post('/simulation/start');
    return res.data;
  },

  stop: async () => {
    const res = await api.post('/simulation/stop');
    return res.data;
  },

  degrade: async (machineId = 'CNC-004') => {
    const res = await api.post(`/simulation/degrade/${machineId}`);
    return res.data;
  },

  reset: async (machineId = 'CNC-004') => {
    const res = await api.post(`/simulation/reset/${machineId}`);
    return res.data;
  }
};
