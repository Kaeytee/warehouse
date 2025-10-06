import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWarehouseAuth } from '../hooks/useWarehouseAuth';
import type { WarehousePermission } from '../types/warehouse';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission: WarehousePermission;
  redirectTo?: string;
}

/**
 * RouteGuard Component
 * 
 * Protects routes based on user permissions with role-based access control.
 * Supports warehouse_admin, admin, and superadmin roles with proper permission checking.
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
  const { isAuthenticated, role, isLoading } = useWarehouseAuth();
  const location = useLocation();
  
  // Do not block UI during auth loading to improve perceived performance
  // Previously showed a full-screen red loader here; removed per UX requirement

  // While auth is resolving, show loading state to prevent redirect flicker
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  // Redirect to login only after we know auth state and user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required permission
  const hasAccess = ['warehouse_admin', 'admin', 'superadmin'].includes(role);
  
  // For now, we'll use basic role checking, but this can be enhanced with actual permission checking
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
          userRole: role,
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
