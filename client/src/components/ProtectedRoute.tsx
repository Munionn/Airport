import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, roles, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    roles: roles.map(r => r.role_name), 
    allowedRoles,
    pathname: location.pathname 
  });

  // Show loading while auth state is being initialized
  if (isLoading) {
    console.log('Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = roles.some((role) => 
      allowedRoles.includes(role.role_name)
    );
    console.log('Role check:', { hasRequiredRole, userRoles: roles.map(r => r.role_name), allowedRoles });
    if (!hasRequiredRole) {
      console.log('No required role, redirecting to home');
      // Redirect to unauthorized page or home
      return <Navigate to="/" replace />;
    }
  }

  console.log('Access granted');
  return <>{children}</>;
};
