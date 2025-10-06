/**
 * Meta-Level Protected Route Component
 * Guards protected pages with immediate unauthorized user redirection
 */

import { Navigate } from "react-router-dom";
import { useWarehouseGuard } from "../hooks/useWarehouseGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireSuperAdmin = false }: ProtectedRouteProps) => {
  const { isAuthorized, isLoading, hasSuperAdminAccess } = useWarehouseGuard();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Check basic authorization
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && !hasSuperAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Super Admin Access Required</h2>
          <p className="text-red-600">This section requires super administrator privileges.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
