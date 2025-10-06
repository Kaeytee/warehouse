/**
 * Permission Utilities
 *
 * Centralized permission checking system for warehouse operations.
 * Defines role-based access control with clear permission hierarchies.
 * 
 * Permission Levels:
 * - superadmin: Full access to all features (same as admin)
 * - admin: Full access to all features including user management
 * - warehouse_admin: Restricted access - package operations only
 * 
 * @author Senior Software Engineer
 * @version 2.0.0
 */

// import { hasAdminAccess, hasRestrictedAccess } from '../config/supabase';

/**
 * Permission interface for feature access control
 */
export interface PermissionSet {
  // Core warehouse operations
  canViewDashboard: boolean;
  canManagePackages: boolean;
  canProcessIntake: boolean;
  canUpdatePackageStatus: boolean;
  canViewInventory: boolean;
  
  // Advanced operations
  canCreateShipments: boolean;
  canManageShipments: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  
  // Administrative functions
  canManageUsers: boolean;
  canViewUserManagement: boolean;
  canAccessSystemSettings: boolean;
  canViewReports: boolean;
  
  // Bulk operations
  canBulkUpdatePackages: boolean;
  canBulkCreateShipments: boolean;
}

/**
 * Get user permissions based on role
 * @param userRole - User role string
 * @returns PermissionSet object with all permissions
 */
export function getUserPermissions(userRole: string): PermissionSet {
  // Superadmin has full access to everything
  if (userRole === 'superadmin' || userRole === 'superadmin') {
    return {
      // Core warehouse operations
      canViewDashboard: true,
      canManagePackages: true,
      canProcessIntake: true,
      canUpdatePackageStatus: true,
      canViewInventory: true,
      
      // Advanced operations
      canCreateShipments: true,
      canManageShipments: true,
      canViewAnalytics: true,
      canExportData: true,
      
      // Administrative functions - full access including user management
      canManageUsers: true,
      canViewUserManagement: true,
      canAccessSystemSettings: true,
      canViewReports: true,
      
      // Bulk operations
      canBulkUpdatePackages: true,
      canBulkCreateShipments: true,
    };
  }
  
  // Admin has full access except user management
  if (userRole === 'admin') {
    return {
      // Core warehouse operations
      canViewDashboard: true,
      canManagePackages: true,
      canProcessIntake: true,
      canUpdatePackageStatus: true,
      canViewInventory: true,
      
      // Advanced operations
      canCreateShipments: true,
      canManageShipments: true,
      canViewAnalytics: true,
      canExportData: true,
      
      // Administrative functions - no user management
      canManageUsers: false,
      canViewUserManagement: false,
      canAccessSystemSettings: true,
      canViewReports: true,
      
      // Bulk operations
      canBulkUpdatePackages: true,
      canBulkCreateShipments: true,
    };
  }
  
  // Warehouse admin has restricted access - only dashboard, intake, inventory, create-shipment
  if (userRole === 'warehouse_admin') {
    return {
      // Core warehouse operations - limited to basic functions
      canViewDashboard: true,
      canManagePackages: true,
      canProcessIntake: true,
      canUpdatePackageStatus: true,
      canViewInventory: true,
      
      // Advanced operations - only create shipments, no management or analytics
      canCreateShipments: true,
      canManageShipments: false,
      canViewAnalytics: false, // No analytics report access
      canExportData: false,
      
      // Administrative functions - denied
      canManageUsers: false,
      canViewUserManagement: false,
      canAccessSystemSettings: false,
      canViewReports: false,
      
      // Bulk operations - limited
      canBulkUpdatePackages: false,
      canBulkCreateShipments: false,
    };
  }
  
  // Default: no permissions
  return {
    canViewDashboard: false,
    canManagePackages: false,
    canProcessIntake: false,
    canUpdatePackageStatus: false,
    canViewInventory: false,
    canCreateShipments: false,
    canManageShipments: false,
    canViewAnalytics: false,
    canExportData: false,
    canManageUsers: false,
    canViewUserManagement: false,
    canAccessSystemSettings: false,
    canViewReports: false,
    canBulkUpdatePackages: false,
    canBulkCreateShipments: false,
  };
}

/**
 * Check if user can access a specific page/feature
 * @param userRole - User role string
 * @param feature - Feature name to check
 * @returns Boolean indicating access permission
 */
export function canAccessFeature(userRole: string, feature: string): boolean {
  const permissions = getUserPermissions(userRole);
  
  const featureMap: Record<string, keyof PermissionSet> = {
    'dashboard': 'canViewDashboard',
    'packages': 'canManagePackages',
    'inventory': 'canViewInventory',
    'intake': 'canProcessIntake',
    'shipments': 'canManageShipments',
    'create-shipment': 'canCreateShipments',
    'analytics': 'canViewAnalytics',
    'reports': 'canViewReports',
    'users': 'canManageUsers',
    'user-management': 'canViewUserManagement',
    'settings': 'canAccessSystemSettings',
    'export': 'canExportData',
  };
  
  const permissionKey = featureMap[feature];
  return permissionKey ? permissions[permissionKey] : false;
}

/**
 * Get navigation items based on user permissions
 * @param userRole - User role string
 * @returns Array of allowed navigation items
 */
export function getAllowedNavItems(userRole: string) {
  const permissions = getUserPermissions(userRole);
  
  const navItems = [];
  
  // Core warehouse operations - available to all roles
  if (permissions.canViewDashboard) {
    navItems.push({ path: '/dashboard', name: 'Dashboard', icon: 'FiHome' });
  }
  
  if (permissions.canProcessIntake) {
    navItems.push({ path: '/intake', name: 'Package Intake', icon: 'FiPackage' });
  }
  
  if (permissions.canViewInventory) {
    navItems.push({ path: '/inventory', name: 'Inventory', icon: 'FiBox' });
  }
  
  if (permissions.canCreateShipments) {
    navItems.push({ path: '/create-shipment', name: 'Create Shipment', icon: 'FiTruck' });
  }
  
  // Advanced operations - admin and superadmin only
  if (permissions.canManageShipments) {
    navItems.push({ path: '/shipments', name: 'Shipment History', icon: 'FiClock' });
  }
  
  // Analytics Report - admin and superadmin only (not warehouse_admin)
  if (permissions.canViewAnalytics && (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin')) {
    navItems.push({ path: '/analytics', name: 'Analytics Report', icon: 'FiBarChart' });
  }
  
  // Administrative features - superadmin only
  if (permissions.canViewUserManagement) {
    navItems.push({ path: '/users', name: 'User Management', icon: 'FiUsers' });
  }
  
  if (permissions.canViewReports) {
    navItems.push({ path: '/reports', name: 'Reports', icon: 'FiFileText' });
  }
  
  return navItems;
}

/**
 * Role display names for UI
 * All admin types display as "Administrator" for consistency
 */
export const ROLE_DISPLAY_NAMES = {
  'superadmin': 'Administrator',
  'admin': 'Administrator', 
  'warehouse_admin': 'Administrator',
  'super_admin': 'Administrator'
} as const;

/**
 * Get user role display name
 * @param userRole - User role string
 * @returns Formatted role name for display
 */
export function getRoleDisplayName(userRole: string): string {
  return ROLE_DISPLAY_NAMES[userRole as keyof typeof ROLE_DISPLAY_NAMES] || 'Unknown Role';
}

export default {
  getUserPermissions,
  canAccessFeature,
  getAllowedNavItems,
  getRoleDisplayName,
  ROLE_DISPLAY_NAMES
};
