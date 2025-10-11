import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWarehouseAuth } from '../hooks/useWarehouseAuth';
import type { WarehousePermission } from '../types/warehouse';
import { ROLE_PERMISSIONS } from '../types/warehouse';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission: WarehousePermission;
  redirectTo?: string;
}

/**
 * RouteGuard Component
 *
 * Protects routes based on user permissions with role-based access control.
 * Uses proper permission checking based on role definitions.
 * Redirects unauthorized users to /unauthorized page.
 *
 * @param children - The component to render if authorized
 * @param requiredPermission - The permission required to access this route
 * @param redirectTo - Optional custom redirect path
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredPermission,
  redirectTo = '/unauthorized'
}) => {
  const { isAuthenticated, user, isLoading } = useWarehouseAuth();
  const location = useLocation();

  // Show loading if we're initializing auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required permission based on their role
  const userPermissions = ROLE_PERMISSIONS[user?.role as keyof typeof ROLE_PERMISSIONS] || [];
  const hasAccess = userPermissions.includes(requiredPermission);

  if (!hasAccess) {
    // Log unauthorized access attempt
    const logUnauthorizedAccess = (window as { __logUnauthorizedAccess?: (resource: string) => void }).__logUnauthorizedAccess;
    if (logUnauthorizedAccess) {
      logUnauthorizedAccess(location.pathname);
    }

    // Redirect to unauthorized page with state
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location,
          requiredPermission,
          userRole: user?.role,
          attemptedPath: location.pathname
        }}
        replace
      />
    );
  }

  // User is authorized, render the protected component
  return <>{children}</>;
};

export default RouteGuard;
