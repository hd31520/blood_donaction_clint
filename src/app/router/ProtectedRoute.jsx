import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../features/auth/context/AuthContext.jsx';
import { getRoleDefaultPath } from '../../features/auth/utils/roleRedirect.js';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="page-loader">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDefaultPath(user?.role)} replace />;
  }

  return children;
};
