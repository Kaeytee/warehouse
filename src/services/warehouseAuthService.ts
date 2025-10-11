export interface WarehousePermission {
  analytics_view: boolean;
  analytics_report: boolean;
  package_intake: boolean;
  package_management: boolean;
  shipment_creation: boolean;
  shipment_management: boolean;
  delivery_management: boolean;
  reports: boolean;
  user_management: boolean;
  settings_management: boolean;
  can_receive_packages: boolean;
  can_ship_packages: boolean;
  can_modify_packages: boolean;
  can_manage_inventory: boolean;
}

/**
 * Role-based permissions mapping for warehouse access control
 */
export const ROLE_PERMISSIONS: Record<string, (keyof WarehousePermission)[]> = {
  superadmin: [
    'analytics_view',
    'analytics_report',
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'delivery_management',
    'reports',
    'user_management',
    'settings_management',
    'can_receive_packages',
    'can_ship_packages',
    'can_modify_packages',
    'can_manage_inventory'
  ],
  admin: [
    'analytics_view',
    'analytics_report',
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'delivery_management',
    'reports',
    'can_receive_packages',
    'can_ship_packages',
    'can_modify_packages',
    'can_manage_inventory'
  ],
  warehouse_admin: [
    'analytics_view',
    'package_intake',
    'package_management',
    'shipment_creation',
    'delivery_management',
    'can_receive_packages',
    'can_ship_packages',
    'can_modify_packages',
    'can_manage_inventory'
  ]
};

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
  static async fetchUserRole(userId: string): Promise<{ role: string; firstName?: string; lastName?: string }> {
    try {
      // Import supabase dynamically to avoid circular dependency
      const { supabase } = await import('../lib/supabase');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 3000);
      });

      // Fetch user's role and name from database with timeout
      const queryPromise = supabase
        .from('users')
        .select('role, status, first_name, last_name')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      // If error or user not found, unauthorized
      if (error || !data) {
        console.error('Error fetching user role:', error);
        return { role: 'unauthorized' };
      }

      // Check if user is active
      if (data.status !== 'active') {
        console.warn(`User ${userId} is not active (status: ${data.status})`);
        return { role: 'unauthorized' };
      }

      // Return the database role and name data
      return {
        role: data.role || 'unauthorized',
        firstName: data.first_name,
        lastName: data.last_name
      };
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return { role: 'unauthorized' };
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
   * Get user's display name from their first and last name
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns Formatted display name
   */
  static getUserDisplayName(firstName?: string, lastName?: string): string {
    // Use first and last name if available
    if (firstName && lastName) {
      return `${firstName.trim()} ${lastName.trim()}`;
    }

    if (firstName) {
      return firstName.trim();
    }

    // Fallback to role display name
    return 'User';
  }
}

// Export singleton instance
export const warehouseAuthService = new WarehouseAuthService();
export default warehouseAuthService;
