const TOKEN_KEY = 'bangla_blood_token';
let memoryToken = null;

const decodePayload = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodePayload(token);
  if (!payload?.exp) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds;
};

export const tokenStorage = {
  get: () => {
    const token = sessionStorage.getItem(TOKEN_KEY) || memoryToken;
    if (!token) {
      return null;
    }

    if (isTokenExpired(token)) {
      sessionStorage.removeItem(TOKEN_KEY);
      memoryToken = null;
      return null;
    }

    return token;
  },

  set: (token) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    memoryToken = token;
  },

  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    memoryToken = null;
  },
};
