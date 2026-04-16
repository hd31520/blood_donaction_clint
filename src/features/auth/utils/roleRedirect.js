export const getRoleDefaultPath = (role) => {
  if (role === 'donor' || role === 'finder') {
    return '/donors';
  }

  return '/dashboard';
};
