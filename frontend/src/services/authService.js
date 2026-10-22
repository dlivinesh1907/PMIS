import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('pmis_token', res.data.token);
      localStorage.setItem('pmis_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.token) {
      localStorage.setItem('pmis_token', res.data.token);
      localStorage.setItem('pmis_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  logout: () => {
    localStorage.removeItem('pmis_token');
    localStorage.removeItem('pmis_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('pmis_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
};
