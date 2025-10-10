/**
 * Permission Utilities
 *
 * Centralized permission checking system for warehouse operations.
 * Uses the new ROLE_PERMISSIONS system for consistency with RouteGuard.
 * 
 * Permission Levels:
 * - superadmin: Full access to all features
 * - admin: Full access except user management
 * - warehouse_admin: Restricted access - package operations only
 * 
 * @author Senior Software Engineer
 * @version 3.0.0
 */

import type { WarehouseRole, WarehousePermission } from '../types/warehouse';
import { ROLE_PERMISSIONS } from '../types/warehouse';

/**
 * Permission interface for feature access control (legacy compatibility)
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
 * Get user permissions based on role using new ROLE_PERMISSIONS system
 * @param userRole - User role string
 * @returns PermissionSet object with all permissions
 */
export function getUserPermissions(userRole: string): PermissionSet {
  // Map new permission system to old boolean system for compatibility
  const rolePermissions = ROLE_PERMISSIONS[userRole as WarehouseRole] || [];

  return {
    // Core warehouse operations
    canViewDashboard: rolePermissions.includes('analytics_view'),
    canManagePackages: rolePermissions.includes('package_management'),
    canProcessIntake: rolePermissions.includes('package_intake'),
    canUpdatePackageStatus: rolePermissions.includes('package_management'),
    canViewInventory: rolePermissions.includes('package_management'),

    // Advanced operations
    canCreateShipments: rolePermissions.includes('shipment_creation'),
    canManageShipments: rolePermissions.includes('shipment_management'),
    canViewAnalytics: rolePermissions.includes('analytics_view'),
    canExportData: rolePermissions.includes('reports'),

    // Administrative functions
    canManageUsers: rolePermissions.includes('user_management'),
    canViewUserManagement: rolePermissions.includes('user_management'),
    canAccessSystemSettings: rolePermissions.includes('system_settings'),
    canViewReports: rolePermissions.includes('reports'),

    // Bulk operations
    canBulkUpdatePackages: rolePermissions.includes('package_management'),
    canBulkCreateShipments: rolePermissions.includes('shipment_creation'),
  };
}

/**
 * Check if user can access a specific page/feature using new permission system
 * @param userRole - User role string
 * @param feature - Feature name to check
 * @returns Boolean indicating access permission
 */
export function canAccessFeature(userRole: string, feature: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as WarehouseRole] || [];

  // Map feature names to permission requirements
  const featurePermissionMap: Record<string, WarehousePermission> = {
    'dashboard': 'analytics_view',
    'packages': 'package_management',
    'inventory': 'package_management',
    'intake': 'package_intake',
    'delivery': 'package_management',
    'shipments': 'shipment_management',
    'create-shipment': 'shipment_creation',
    'analytics': 'analytics_report',
    'reports': 'reports',
    'users': 'user_management',
    'user-management': 'user_management',
    'settings': 'system_settings',
    'export': 'reports',
  };

  const requiredPermission = featurePermissionMap[feature];
  return requiredPermission ? rolePermissions.includes(requiredPermission) : false;
}

/**
 * Get navigation items based on user permissions using new system
 * @param userRole - User role string
 * @returns Array of allowed navigation items
 */
export function getAllowedNavItems(userRole: string) {
  const rolePermissions = ROLE_PERMISSIONS[userRole as WarehouseRole] || [];

  const navItems = [];

  // Dashboard - all roles with analytics_view permission
  if (rolePermissions.includes('analytics_view')) {
    navItems.push({ path: '/dashboard', name: 'Dashboard', icon: 'FiHome' });
  }

  // Package Intake - all roles with package_intake permission
  if (rolePermissions.includes('package_intake')) {
    navItems.push({ path: '/intake', name: 'Package Intake', icon: 'FiDownload' });
  }

  // Inventory - all roles with package_management permission
  if (rolePermissions.includes('package_management')) {
    navItems.push({ path: '/inventory', name: 'Inventory', icon: 'FiBox' });
  }

  // Create Shipment - all roles with shipment_creation permission
  if (rolePermissions.includes('shipment_creation')) {
    navItems.push({ path: '/create-shipment', name: 'Create Shipment', icon: 'FiSend' });
  }

  // Delivery - all roles with package_management permission
  if (rolePermissions.includes('package_management')) {
    navItems.push({ path: '/delivery', name: 'Delivery', icon: 'FiTruck' });
  }

  // Shipment History - admin and superadmin only (shipment_management permission)
  if (rolePermissions.includes('shipment_management')) {
    navItems.push({ path: '/shipments', name: 'Shipment History', icon: 'FiClock' });
  }

  // Analytics Report - admin and superadmin only (analytics_report permission)
  if (rolePermissions.includes('analytics_report')) {
    navItems.push({ path: '/analytics', name: 'Analytics Report', icon: 'FiBarChart' });
  }

  // Reports - admin and superadmin only (reports permission)
  if (rolePermissions.includes('reports')) {
    navItems.push({ path: '/reports', name: 'Reports', icon: 'FiFileText' });
  }

  // User Management - superadmin only (user_management permission)
  if (rolePermissions.includes('user_management')) {
    navItems.push({ path: '/users', name: 'User Management', icon: 'FiUsers' });
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
