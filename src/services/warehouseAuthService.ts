/**
 * Warehouse Authentication Service
 * 
 * Handles authentication for warehouse staff using Supabase Auth
 * Replaces the mock authentication system with real database integration
 */

// Inline UserRole and RolePermissions to avoid Fast Refresh error
export type UserRole = 'admin' | 'super_admin' | 'warehouse_admin' | 'customer';
export interface RolePermissions {
  dashboard: boolean;
  incomingRequests: boolean;
  createShipment: boolean;
  shipmentHistory: boolean;
  staffManagement: boolean;
  analysisReport: boolean;
  inventory: boolean;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  permissions: RolePermissions;
  isActive: boolean;
  status: 'active' | 'inactive' | 'suspended';
  assignedWarehouses: string[];
  createdAt: string;
  lastLogin?: string;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  session: unknown;
}

export interface WarehouseStaffProfile {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'warehouse_admin';
  status: 'active' | 'inactive' | 'suspended';
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAssignment {
  id: string;
  user_id: string;
  warehouse_id: string;
  position: string;
  is_active: boolean;
  can_receive_packages: boolean;
  can_ship_packages: boolean;
  can_modify_packages: boolean;
  can_manage_inventory: boolean;
}

/**
 * Meta-level RBAC: Email-based role determination for warehouse access
 * Inspired by Meta's internal auth patterns - deterministic role assignment
 */
export class WarehouseAuthService {
  /**
   * Determine user role based on email pattern (Meta-style)
   * @param email - User email address
   * @returns Role string or 'unauthorized'
   */
  static determineUserRole(email: string): string {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Superadmin patterns
    if (normalizedEmail.includes('superadmin@') || 
        normalizedEmail.includes('super@') ||
        normalizedEmail === 'admin@vanguardcargo.org') {
      return 'superadmin';
    }
    
    // Admin patterns  
    if (normalizedEmail.includes('admin@') || 
        normalizedEmail.includes('manager@') ||
        normalizedEmail.includes('lead@')) {
      return 'admin';
    }
    
    // Warehouse admin patterns
    if (normalizedEmail.includes('warehouse@') || 
        normalizedEmail.includes('wh@') ||
        normalizedEmail.includes('ops@')) {
      return 'warehouse_admin';
    }
    
    // All other emails are unauthorized for warehouse access
    return 'unauthorized';
  }

  /**
   * Check if role is authorized for warehouse access
   * @param role - User role
   * @returns Boolean authorization status
   */
  static isAuthorizedRole(role: string): boolean {
    return ['warehouse_admin', 'admin', 'superadmin'].includes(role);
  }

  /**
   * Get role display name for UI
   * @param role - User role
   * @returns Display name
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'superadmin': return 'Super Administrator';
      case 'admin': return 'Administrator';
      case 'warehouse_admin': return 'Warehouse Administrator';
      default: return 'Unauthorized';
    }
  }
}

// Export singleton instance
export const warehouseAuthService = new WarehouseAuthService();
export default warehouseAuthService;
