const LOCATION_FIELD_LABELS = {
  divisionId: 'বিভাগ',
  districtId: 'জেলা',
  upazilaId: 'উপজেলা',
  unionId: 'ইউনিয়ন',
};

const isServiceUnavailable = (status) => status === 503;

const getLocationSelectionError = (serverMessage) => {
  const match = String(serverMessage || '').match(/(divisionId|districtId|upazilaId|unionId) with value/i);
  if (!match) {
    return null;
  }

  const field = match[1];
  const readableField = LOCATION_FIELD_LABELS[field] || 'লোকেশন';
  return `নির্বাচিত ${readableField} সার্ভারে পাওয়া যাচ্ছে না। আবার লোকেশন নির্বাচন করে চেষ্টা করুন।`;
};

export const getAuthErrorMessage = ({
  mode,
  status,
  serverMessage,
  hasResponse,
  isTimeout,
}) => {
  const actionLabel = mode === 'register' ? 'নিবন্ধন' : 'লগইন';

  if (!hasResponse) {
    if (isTimeout) {
      return `${actionLabel} করতে বেশি সময় লাগছে। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।`;
    }

    return `${actionLabel} নেটওয়ার্ক সমস্যার কারণে ব্যর্থ হয়েছে। ইন্টারনেট দেখে আবার চেষ্টা করুন।`;
  }

  if (isServiceUnavailable(status)) {
    return 'সার্ভারের ডেটাবেস সংযোগ প্রস্তুত হচ্ছে। কয়েক সেকেন্ড পরে আবার চেষ্টা করুন।';
  }

  if (status === 400) {
    const locationErrorMessage = getLocationSelectionError(serverMessage);
    if (locationErrorMessage) {
      return locationErrorMessage;
    }

    return mode === 'register'
      ? serverMessage || 'তথ্যগুলো দেখে আবার চেষ্টা করুন।'
      : serverMessage || 'লগইন তথ্য ঠিক নেই। আবার চেষ্টা করুন।';
  }

  if (status === 401) {
    return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
  }

  if (status === 409 && mode === 'register') {
    return 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে। লগইন করুন।';
  }

  return serverMessage || (mode === 'register'
    ? 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
    : 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
};
