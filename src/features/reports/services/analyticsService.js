import { apiClient } from '../../../services/apiClient.js';

export const analyticsService = {
  getStats: async () => {
    const response = await apiClient.get('/analytics/visits');
    return response.data?.data || null;
  },
};
