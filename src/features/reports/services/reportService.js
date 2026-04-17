import { apiClient } from '../../../services/apiClient.js';

export const reportService = {
  getMonthlyDonorReport: async ({ year, month }) => {
    const response = await apiClient.get('/reports/monthly-donor', {
      params: {
        year,
        month,
        format: 'json',
      },
    });

    return response.data?.data || null;
  },

  exportMonthlyDonorReportCsv: async ({ year, month }) => {
    const response = await apiClient.get('/reports/monthly-donor', {
      params: {
        year,
        month,
        format: 'csv',
      },
      responseType: 'blob',
    });

    return response.data;
  },
};