import { apiClient, cachedGet, invalidateCacheByPrefix } from '../../../services/apiClient.js';

export const notificationService = {
  getMyNotifications: async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
    const response = await cachedGet('/notifications/me', {
      params: { page, limit, unreadOnly },
      ttlMs: 15000,
    });

    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/me/${notificationId}/read`);
    invalidateCacheByPrefix('/notifications/me');
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/me/read-all');
    invalidateCacheByPrefix('/notifications/me');
    return response.data;
  },

  seedDemoNotifications: async () => {
    const response = await apiClient.post('/notifications/me/seed-demo');
    invalidateCacheByPrefix('/notifications/me');
    return response.data;
  },
};
