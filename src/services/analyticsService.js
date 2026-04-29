import { apiClient } from './apiClient.js';
import { getLastUsedLocation } from '../utils/locationMemory.js';

const SESSION_KEY = 'bangla-blood:analytics-session-id';

const getSessionId = () => {
  try {
    if (typeof window === 'undefined') {
      return '';
    }

    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }

    const generated = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const normalizeLocation = () => {
  const location = getLastUsedLocation() || {};

  return {
    divisionId: location.divisionId || '',
    districtId: location.districtId || '',
    upazilaId: location.upazilaId || '',
    unionId: location.unionId || '',
  };
};

export const analyticsService = {
  trackVisit: async (path) => {
    const response = await apiClient.post('/analytics/track', {
      sessionId: getSessionId(),
      path,
      location: normalizeLocation(),
    });
    return response.data?.data;
  },

  getAdminSummary: async () => {
    const response = await apiClient.get('/analytics/admin-summary');
    return response.data?.data;
  },
};
