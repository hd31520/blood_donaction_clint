import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const requestCache = new Map();

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is missing. Check your client environment file.');
}

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
});

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
