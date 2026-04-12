import { apiClient } from '../../../services/apiClient.js';

export const authService = {
  login: async (payload) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data?.data;
  },

  register: async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data?.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data?.data;
  },
};
