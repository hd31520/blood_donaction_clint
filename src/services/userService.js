import { apiClient } from './apiClient';

export const userService = {
  getPublicLocalAdmins: async (filters = {}) => {
    const params = {};

    if (filters.divisionId) {
      params.divisionId = filters.divisionId;
    }

    if (filters.districtId) {
      params.districtId = filters.districtId;
    }

    if (filters.upazilaId) {
      params.upazilaId = filters.upazilaId;
    }

    if (filters.unionId) {
      params.unionId = filters.unionId;
    }

    const response = await apiClient.get('/users/public/local-admins', { params });
    return response.data?.data || [];
  },
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
