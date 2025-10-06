/**
 * Warehouse Authentication Service
 * 
 * Handles authentication for warehouse staff using Supabase Auth
 * Replaces the mock authentication system with real database integration
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../config/environment';
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
 * Define role permissions based on warehouse operations
 */
const getRolePermissions = (
  role: UserRole
): RolePermissions => {
  switch (role) {
    case 'warehouse_admin':
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: true,
        staffManagement: false,
        analysisReport: true,
        inventory: true,
      };
    case 'admin':
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: true,
        staffManagement: true,
        analysisReport: true,
        inventory: true,
      };
    case 'super_admin':
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: true,
        staffManagement: true,
        analysisReport: true,
        inventory: true,
      };
    case 'customer':
    default:
      return {
        dashboard: false,
        incomingRequests: false,
        createShipment: false,
        shipmentHistory: false,
        staffManagement: false,
        analysisReport: false,
        inventory: false,
      };
  }
};

/**
 * Map Supabase role to warehouse UserRole
 */
const mapSupabaseRole = (role: string): UserRole => {
  if (role === 'admin' || role === 'super_admin' || role === 'warehouse_admin' || role === 'customer') {
    return role as UserRole;
  }
  return 'customer';
};

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

class WarehouseAuthServiceLegacy {
  /**
   * Authenticate warehouse staff with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      logger.debug('Attempting warehouse staff login:', { email: credentials.email });

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        logger.error('Authentication failed:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No user data returned from authentication');
      }

      // Get user profile
      const profile = await this.getUserProfile(authData.user.id);
      
      // Only allow warehouse app roles: super_admin, admin, warehouse_admin, superadmin
      if (!['super_admin', 'admin', 'warehouse_admin', 'superadmin'].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error('Access Denied: This is the Warehouse Management System. Only warehouse administrators can access this application. Please use the appropriate app for your role.');
      }

      // Get staff assignments (can be multiple warehouses)
      const assignments = await this.getAllStaffAssignments(profile.id);
      const assignedWarehouses = assignments.filter(a => a.is_active).map(a => a.warehouse_id);
      let assignment: StaffAssignment | undefined = assignments.find(a => a.is_active);

      // Build warehouse user object
      const warehouseUser: User = {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        role: mapSupabaseRole(profile.role),
        department: assignment?.position || 'Administration',
        permissions: getRolePermissions(profile.role as UserRole),
        isActive: profile.status === 'active',
        status: profile.status,
        assignedWarehouses,
        createdAt: profile.created_at,
        lastLogin: new Date().toISOString(),
        token: authData.session?.access_token || '',
      };

      logger.info('Warehouse staff login successful:', { 
        userId: profile.id, 
        role: profile.role,
        department: warehouseUser.department 
      });

      return {
        user: warehouseUser,
        session: authData.session,
      };

    } catch (error) {
      handleSupabaseError(error, 'Warehouse login');
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      logger.debug('Signing out warehouse user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Logout error:', error);
        throw new Error(error.message);
      }

      logger.info('Warehouse user signed out successfully');
    } catch (error) {
      handleSupabaseError(error, 'Warehouse logout');
      throw error;
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<WarehouseStaffProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User profile not found');
      }

      return data as WarehouseStaffProfile;
    } catch (error) {
      handleSupabaseError(error, 'Get user profile');
      throw error;
    }
  }

  /**
   * Get all staff assignments for a user
   */
  async getAllStaffAssignments(userId: string): Promise<StaffAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('staff_assignments')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data as StaffAssignment[]) || [];
    } catch (error) {
      logger.warn('No staff assignments found:', error);
      return [];
    }
  }

  /**
   * Check if current session is valid
   */
  async checkSession(): Promise<User | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Get fresh profile data
      const profile = await this.getUserProfile(session.user.id);
      
      // Verify still has warehouse access
      if (!['super_admin', 'admin', 'warehouse_admin', 'superadmin'].includes(profile.role)) {
        await this.logout();
        return null;
      }

      if (profile.status !== 'active') {
        await this.logout();
        return null;
      }

      // Get all staff assignments
      const assignments = await this.getAllStaffAssignments(profile.id);
      const assignedWarehouses = assignments.filter(a => a.is_active).map(a => a.warehouse_id);
      const assignment: StaffAssignment | undefined = assignments.find(a => a.is_active);

      // Return warehouse user
      return {
        id: profile.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`,
        role: mapSupabaseRole(profile.role),
        department: assignment?.position || 'Administration',
        permissions: getRolePermissions(profile.role as UserRole),
        isActive: profile.status === 'active',
        status: profile.status,
        assignedWarehouses,
        createdAt: profile.created_at,
        lastLogin: session.user.last_sign_in_at || undefined,
        token: session.access_token,
      };

    } catch (error) {
      logger.error('Session check failed:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<WarehouseStaffProfile>): Promise<WarehouseStaffProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as WarehouseStaffProfile;
    } catch (error) {
      handleSupabaseError(error, 'Update profile');
      throw error;
    }
  }

  /**
   * Get current user's warehouse assignments
   */
  async getCurrentUserWarehouses(): Promise<unknown[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('staff_assignments')
        .select(`
          *,
          warehouses (
            id,
            name,
            code,
            city,
            state,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Get user warehouses');
      throw error;
    }
  }
}

// Export singleton instance
export const warehouseAuthService = new WarehouseAuthService();
export default warehouseAuthService;
