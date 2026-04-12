import { apiClient } from './apiClient';

export const userService = {
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  createUser: async (payload) => {
    const response = await apiClient.post('/users', payload);
    return response.data;
  },
};
