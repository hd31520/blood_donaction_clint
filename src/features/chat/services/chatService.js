import { apiClient } from '../../../services/apiClient.js';

export const chatService = {
  getThreads: async () => {
    const response = await apiClient.get('/chats/threads');
    return response.data?.data || [];
  },

  createOrGetThread: async (payload) => {
    const response = await apiClient.post('/chats/threads', payload);
    return response.data?.data || null;
  },

  getMessages: async (threadId, { page = 1, limit = 50 } = {}) => {
    const response = await apiClient.get(`/chats/threads/${threadId}/messages`, {
      params: { page, limit },
    });

    return {
      data: response.data?.data || [],
      meta: response.data?.meta || null,
    };
  },

  sendMessage: async (threadId, payload) => {
    const response = await apiClient.post(`/chats/threads/${threadId}/messages`, payload);
    return response.data?.data || null;
  },
};
