/**
 * Meta-Level Warehouse Route Guard Hook
 * Provides route-level authorization checks with immediate redirection
 */

import { useWarehouseAuth } from "./useWarehouseAuth";

export const useWarehouseGuard = () => {
  const { isAuthenticated, user, isLoading } = useWarehouseAuth();

  // Meta-style: Strict authorization check
  const canAccess = !isLoading && isAuthenticated && ['warehouse_admin', 'admin', 'superadmin'].includes(user?.role || '');

  return {
    isAuthorized: canAccess,
    isLoading,
    role: user?.role,
    hasAdminAccess: user?.role === 'admin' || user?.role === 'superadmin',
    hasSuperAdminAccess: user?.role === 'superadmin'
  };
};
