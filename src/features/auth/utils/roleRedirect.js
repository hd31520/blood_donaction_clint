export const getRoleDefaultPath = (role) => {
  if (role === 'donor' || role === 'finder') {
    return '/patients';
  }

  return '/dashboard';
};
