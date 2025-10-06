/**
 * Meta-Level Warehouse Route Guard Hook
 * Provides route-level authorization checks with immediate redirection
 */

import { useWarehouseAuth } from "./useWarehouseAuth";

export const useWarehouseGuard = () => {
  const { isAuthenticated, role, isLoading } = useWarehouseAuth();
  
  // Meta-style: Strict authorization check
  const canAccess = !isLoading && isAuthenticated && ['warehouse_admin', 'admin', 'superadmin'].includes(role);

  return { 
    isAuthorized: canAccess, 
    isLoading, 
    role,
    hasAdminAccess: role === 'admin' || role === 'superadmin',
    hasSuperAdminAccess: role === 'superadmin'
  };
};
