import { apiClient } from './apiClient';

export const userService = {
  getUserManagementMeta: async () => {
    const response = await apiClient.get('/users/meta');
    return response.data;
  },
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  createUser: async (payload) => {
    const response = await apiClient.post('/users', payload);
    return response.data;
  },
  updateUserRole: async (userId, payload) => {
    const response = await apiClient.patch(`/users/${userId}/role`, payload);
    return response.data;
  },
};
