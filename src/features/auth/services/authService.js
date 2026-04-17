import { apiClient } from '../../../services/apiClient.js';

const AUTH_REQUEST_TIMEOUT_MS = 25000;
const MAX_AUTH_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const shouldRetryAuthError = (error) => {
  const status = error?.response?.status;
  const code = error?.code;

  if (status === 503 || status === 502 || status === 504) {
    return true;
  }

  if (!error?.response && code !== 'ERR_CANCELED') {
    return true;
  }

  return code === 'ECONNABORTED';
};

const requestWithRetry = async (requestFn) => {
  let lastError;

  for (let attempt = 0; attempt <= MAX_AUTH_RETRIES; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (attempt >= MAX_AUTH_RETRIES || !shouldRetryAuthError(error)) {
        break;
      }

      if (import.meta.env.DEV) {
        console.warn('[AUTH][RETRYING_REQUEST]', {
          attempt: attempt + 1,
          maxRetries: MAX_AUTH_RETRIES,
          status: error?.response?.status,
          code: error?.code,
          message: error?.message,
        });
      }

      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError;
};

export const authService = {
  login: async (payload) => {
    const response = await requestWithRetry(() => {
      return apiClient.post('/auth/login', payload, {
        timeout: AUTH_REQUEST_TIMEOUT_MS,
      });
    });

    return response.data?.data;
  },

  register: async (payload) => {
    const response = await requestWithRetry(() => {
      return apiClient.post('/auth/register', payload, {
        timeout: AUTH_REQUEST_TIMEOUT_MS,
      });
    });

    return response.data?.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data?.data;
  },

  updateMe: async (payload) => {
    const response = await apiClient.put('/auth/me', payload);
    return response.data?.data;
  },

  uploadProfileImage: async (payload) => {
    const response = await apiClient.post('/auth/me/profile-image', payload);
    return response.data?.data;
  },
};
