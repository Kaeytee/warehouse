/**
 * Meta-Level Role Management Utilities
 * Centralized role definitions and permission checks
 */

export type WarehouseRole = 'warehouse_admin' | 'admin' | 'superadmin';

export const WAREHOUSE_ROLES = {
  WAREHOUSE_ADMIN: 'warehouse_admin' as const,
  ADMIN: 'admin' as const,
  SUPERADMIN: 'superadmin' as const,
} as const;

export const ROLE_HIERARCHY = {
  warehouse_admin: 1,
  admin: 2,
  superadmin: 3,
} as const;

export const ROLE_PERMISSIONS = {
  warehouse_admin: [
    'dashboard_view',
    'package_intake',
    'package_management',
    'shipment_creation',
    'inventory_view',
  ],
  admin: [
    'dashboard_view',
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'inventory_view',
    'analytics_view',
    'staff_management',
  ],
  superadmin: [
    'dashboard_view',
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'inventory_view',
    'analytics_view',
    'analytics_report',
    'staff_management',
    'user_management',
    'system_settings',
  ],
} as const;

/**
 * Check if user has specific permission
 */
export const hasPermission = (role: WarehouseRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission as any) || false;
};

/**
 * Check if role has higher or equal hierarchy level
 */
export const hasRoleLevel = (userRole: WarehouseRole, requiredRole: WarehouseRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: WarehouseRole): string => {
  switch (role) {
    case 'warehouse_admin': return 'Warehouse Administrator';
    case 'admin': return 'Administrator';
    case 'superadmin': return 'Super Administrator';
    default: return 'Unknown Role';
  }
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role: WarehouseRole): string => {
  switch (role) {
    case 'warehouse_admin': return 'bg-blue-600';
    case 'admin': return 'bg-red-600';
    case 'superadmin': return 'bg-purple-600';
    default: return 'bg-gray-600';
  }
};
