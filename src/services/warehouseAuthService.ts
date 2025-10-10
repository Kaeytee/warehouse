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
 * Database-driven RBAC: Role-based authentication for warehouse access
 * Uses actual database role field instead of email patterns
 */
export class WarehouseAuthService {
  /**
   * Fetch user role from database
   * @param userId - User UUID from auth
   * @returns Promise with role string or 'unauthorized'
   */
  static async fetchUserRole(userId: string): Promise<string> {
    try {
      // Import supabase dynamically to avoid circular dependency
      const { supabase } = await import('../lib/supabase');
      
      // Fetch user's role from database
      const { data, error } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', userId)
        .single();
      
      // If error or user not found, unauthorized
      if (error || !data) {
        console.error('Error fetching user role:', error);
        return 'unauthorized';
      }
      
      // Check if user is active
      if (data.status !== 'active') {
        console.warn(`User ${userId} is not active (status: ${data.status})`);
        return 'unauthorized';
      }
      
      // Return the database role
      return data.role || 'unauthorized';
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return 'unauthorized';
    }
  }

  /**
   * Check if role is authorized for warehouse access
   * Accepts: superadmin, admin, warehouse_admin
   * @param role - User role from database
   * @returns Boolean authorization status
   */
  static isAuthorizedRole(role: string): boolean {
    // Normalize role to handle variations (super_admin vs superadmin)
    const normalizedRole = role.toLowerCase().trim();
    return [
      'warehouse_admin', 
      'admin', 
      'superadmin', 
      'super_admin'
    ].includes(normalizedRole);
  }

  /**
   * Get role display name for UI
   * @param role - User role from database
   * @returns Display name
   */
  static getRoleDisplayName(role: string): string {
    const normalizedRole = role.toLowerCase().trim();
    switch (normalizedRole) {
      case 'superadmin':
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'warehouse_admin':
        return 'Warehouse Administrator';
      default:
        return 'Unauthorized';
    }
  }
}

// Export singleton instance
export const warehouseAuthService = new WarehouseAuthService();
export default warehouseAuthService;
