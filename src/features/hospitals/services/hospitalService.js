import { apiClient } from '../../../services/apiClient.js';

export const hospitalService = {
  listHospitals: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.divisionId) {
      params.divisionId = filters.divisionId;
    }

    if (filters.districtId) {
      params.districtId = filters.districtId;
    }

    if (filters.upazilaId) {
      params.upazilaId = filters.upazilaId;
    }

    const response = await apiClient.get('/hospitals', { params });
    return {
      data: response.data?.data || [],
      meta: response.data?.meta || null,
    };
  },

  createHospital: async (payload) => {
    const response = await apiClient.post('/hospitals', payload);
    return response.data?.data || null;
  },
};
