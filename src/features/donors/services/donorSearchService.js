import { apiClient } from '../../../services/apiClient.js';

export const donorSearchService = {
  search: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.bloodGroup) {
      params.bloodGroup = filters.bloodGroup;
    }

    if (filters.availabilityStatus) {
      params.availabilityStatus = filters.availabilityStatus;
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

    if (filters.unionId) {
      params.unionId = filters.unionId;
    }

    // Try public search endpoint first (works for everyone)
    try {
      const response = await apiClient.get('/donor-profiles/public/search', { params });
      return {
        data: response.data?.data || [],
        meta: response.data?.meta || null,
      };
    } catch (error) {
      // Fall back to authenticated search if available
      try {
        const response = await apiClient.get('/donor-profiles/search', { params });
        return {
          data: response.data?.data || [],
          meta: response.data?.meta || null,
        };
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  searchAuthenticated: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    if (filters.bloodGroup) {
      params.bloodGroup = filters.bloodGroup;
    }

    if (filters.availabilityStatus) {
      params.availabilityStatus = filters.availabilityStatus;
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

    if (filters.unionId) {
      params.unionId = filters.unionId;
    }

    const response = await apiClient.get('/donor-profiles/search', { params });

    return {
      data: response.data?.data || [],
      meta: response.data?.meta || null,
    };
  },

  getByUserId: async (userId) => {
    const response = await apiClient.get(`/donor-profiles/user/${userId}`);

    return response.data?.data || null;
  },

  getPublicByUserId: async (userId) => {
    const response = await apiClient.get(`/donor-profiles/public/${userId}`);

    return response.data?.data || null;
  },
};
