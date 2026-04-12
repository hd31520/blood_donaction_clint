import { Navigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { getRoleDefaultPath } from '../../features/auth/utils/roleRedirect.js';

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="page-loader">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleDefaultPath(user?.role)} replace />;
  }

  return children;
};
