import { apiClient } from '../../../services/apiClient.js';

export const upazilaSettingsService = {
  getImgbbSettings: async () => {
    const response = await apiClient.get('/upazila-settings/imgbb');
    return response.data?.data || null;
  },

  saveImgbbApiKey: async (imgbbApiKey) => {
    const response = await apiClient.put('/upazila-settings/imgbb', { imgbbApiKey });
    return response.data?.data || null;
  },
};
