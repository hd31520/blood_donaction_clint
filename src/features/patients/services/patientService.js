import { apiClient } from '../../../services/apiClient.js';

export const patientService = {
  list: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.patientName) {
      params.patientName = filters.patientName;
    }

    if (filters.bloodGroup) {
      params.bloodGroup = filters.bloodGroup;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    if (filters.divisionId) {
      params.divisionId = filters.divisionId;
    }

    if (filters.districtId) {
      params.districtId = filters.districtId;
    }

    if (filters.upazilaId) {
      params.upazilaId = filters.upazilaId;
    }

    const response = await apiClient.get('/patients', { params });

    return {
      data: response.data?.data || [],
      meta: response.data?.meta || null,
    };
  },

  listHospitals: async (filters = {}) => {
    const params = {
      page: 1,
      limit: 200,
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

    return response.data?.data || [];
  },

  create: async (payload) => {
    const response = await apiClient.post('/blood-needs', payload);
    return response.data?.data || null;
  },
};
