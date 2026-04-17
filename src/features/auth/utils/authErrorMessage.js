const LOCATION_FIELD_LABELS = {
  divisionId: 'division',
  districtId: 'district',
  upazilaId: 'upazila',
  unionId: 'union',
};

const isServiceUnavailable = (status) => status === 503;

const getLocationSelectionError = (serverMessage) => {
  const match = String(serverMessage || '').match(/(divisionId|districtId|upazilaId|unionId) with value/i);
  if (!match) {
    return null;
  }

  const field = match[1];
  const readableField = LOCATION_FIELD_LABELS[field] || 'location';
  return `Selected ${readableField} is not available on server yet. Please reselect your location and try again.`;
};

export const getAuthErrorMessage = ({
  mode,
  status,
  serverMessage,
  hasResponse,
  isTimeout,
}) => {
  const actionLabel = mode === 'register' ? 'Registration' : 'Login';

  if (!hasResponse) {
    if (isTimeout) {
      return `${actionLabel} is taking too long. Server may be waking up, please try again in a few seconds.`;
    }

    return `${actionLabel} failed due to a network/CORS issue. Please check your internet and try again.`;
  }

  if (isServiceUnavailable(status)) {
    return serverMessage || 'Server is temporarily unavailable. Please try again in a few seconds.';
  }

  if (status === 400) {
    const locationErrorMessage = getLocationSelectionError(serverMessage);
    if (locationErrorMessage) {
      return locationErrorMessage;
    }

    return mode === 'register'
      ? serverMessage || 'Please check your information and try again.'
      : serverMessage || 'Login request is invalid. Please check your input and try again.';
  }

  if (status === 401) {
    return 'Invalid email or password.';
  }

  if (status === 409 && mode === 'register') {
    return 'An account with this email already exists. Please login instead.';
  }

  return serverMessage || (mode === 'register'
    ? 'Registration failed. Please try again.'
    : 'Login failed. Please check your credentials.');
};