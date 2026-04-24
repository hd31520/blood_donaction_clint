const LAST_USED_LOCATION_KEY = 'bangla-blood:last-used-location';

export const saveLastUsedLocation = (locationValue) => {
  try {
    if (!locationValue || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LAST_USED_LOCATION_KEY, JSON.stringify(locationValue));
  } catch {
    // Ignore storage errors.
  }
};

export const getLastUsedLocation = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(LAST_USED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearLastUsedLocation = () => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAST_USED_LOCATION_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
};
