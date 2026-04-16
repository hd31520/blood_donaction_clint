import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_BASE_URL;
const requestCache = new Map();

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const PRODUCTION_API_BASE_URL = 'https://blood-donaction-server.vercel.app/api/v1';
const LOCAL_API_BASE_URL = '/api/v1';

const isLocalHostname = (value) => LOCAL_HOSTNAMES.has(String(value || '').toLowerCase());

const getDefaultBaseURL = () => {
  if (typeof window === 'undefined') {
    return PRODUCTION_API_BASE_URL;
  }

  return isLocalHostname(window.location.hostname) ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
};

const normalizeBaseURL = (value) => {
  const fallbackBaseURL = getDefaultBaseURL();
  const trimmed = String(value || '').trim();
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (!trimmed) {
    return fallbackBaseURL;
  }

  // Guard against accidental localhost API in production builds.
  if (typeof window !== 'undefined') {
    try {
      const currentHost = window.location.hostname;
      const parsed = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed)
        : null;

      if (parsed && isLocalHostname(parsed.hostname) && !isLocalHostname(currentHost)) {
        return fallbackBaseURL;
      }
    } catch {
      // Ignore URL parsing errors and continue normalization below.
    }
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    if (trimmed.startsWith('/') && !isLocalHostname(currentHostname)) {
      return fallbackBaseURL;
    }

    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `${window.location.protocol}${trimmed}`;
  }

  if (trimmed.startsWith(':')) {
    return `${window.location.protocol}//${window.location.hostname}${trimmed}`;
  }

  return `${window.location.protocol}//${trimmed}`;
};

const baseURL = normalizeBaseURL(rawBaseURL);

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.info('[API][REQUEST]', {
        method: config.method,
        baseURL: config.baseURL,
        url: config.url,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API][REQUEST_ERROR]', {
      message: error?.message,
    });
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message;
    const method = error?.config?.method;
    const url = error?.config?.url;

    if (!error?.response) {
      console.error('[API][NETWORK_OR_CORS_ERROR]', {
        method,
        url,
        message,
        hint: 'No response received. Check server availability, CORS, and HTTPS URL.',
      });
    } else {
      console.error('[API][RESPONSE_ERROR]', {
        method,
        url,
        status,
        message,
        payload: error?.response?.data,
      });
    }

    return Promise.reject(error);
  },
);

const buildCacheKey = (url, params = {}) => {
  return `${url}:${JSON.stringify(params)}`;
};

export const cachedGet = async (url, { params = {}, ttlMs = 30000 } = {}) => {
  const cacheKey = buildCacheKey(url, params);
  const cached = requestCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await apiClient.get(url, { params });
  requestCache.set(cacheKey, {
    value: response,
    expiresAt: Date.now() + ttlMs,
  });

  return response;
};

export const invalidateCacheByPrefix = (prefix) => {
  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix)) {
      requestCache.delete(key);
    }
  }
};

export const setApiAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};
