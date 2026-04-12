export const getRoleDefaultPath = (role) => {
  if (role === 'donor') {
    return '/donors';
  }

  return '/dashboard';
};
