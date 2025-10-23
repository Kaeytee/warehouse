/**
 * User Management Service
 * 
 * Handles all user management operations including viewing users,
 * updating user status (active/inactive/suspended), and user analytics.
 * Follows clean code architecture and OOP principles.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @created 2025-10-08
 */

// @ts-nocheck
import { supabase } from '../lib/supabase';

/**
 * User interface representing database user structure
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  suite_number: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'reported';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  street_address?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

/**
 * User statistics interface
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  reported: number;
  clients: number;
  admins: number;
}

/**
 * User Management Service Class
 * Provides comprehensive user management functionality
 */
export class UserManagementService {
  /**
   * Fetch all users from the database
   * 
   * @returns Promise with array of users
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      // Fetch all users ordered by creation date (newest first)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users from database');
    }
  }

  /**
   * Fetch users by status filter
   * 
   * @param status - User status to filter by
   * @returns Promise with array of filtered users
   */
  static async getUsersByStatus(status: 'active' | 'inactive' | 'suspended' | 'reported'): Promise<User[]> {
    try {
      // Fetch users filtered by status
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error fetching ${status} users:`, error);
      throw new Error(`Failed to fetch ${status} users from database`);
    }
  }

  /**
   * Update user status (activate/deactivate/suspend)
   * 
   * @param userId - UUID of the user to update
   * @param newStatus - New status to set
   * @returns Promise with updated user data
   */
  static async updateUserStatus(
    userId: string, 
    newStatus: 'active' | 'inactive' | 'suspended'
  ): Promise<User> {
    try {
      // Update user status in database
      const { data, error } = await supabase
        .from('users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Get user statistics for dashboard
   * 
   * @returns Promise with user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      // Fetch all users for statistics calculation
      const { data: users, error } = await supabase
        .from('users')
        .select('status, role');

      if (error) throw error;

      // Calculate statistics
      const stats: UserStats = {
        total: users?.length || 0,
        active: users?.filter(u => u.status === 'active').length || 0,
        inactive: users?.filter(u => u.status === 'inactive').length || 0,
        suspended: users?.filter(u => u.status === 'suspended').length || 0,
        reported: users?.filter(u => u.status === 'reported').length || 0,
        clients: users?.filter(u => u.role === 'client').length || 0,
        admins: users?.filter(u => ['admin', 'warehouse_admin', 'super_admin', 'superadmin'].includes(u.role)).length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  /**
   * Search users by name, email, or suite number
   * 
   * @param searchTerm - Search query string
   * @returns Promise with array of matching users
   */
  static async searchUsers(searchTerm: string): Promise<User[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllUsers();
      }

      // Search across multiple fields
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,suite_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get user by ID
   * 
   * @param userId - UUID of the user
   * @returns Promise with user data
   */
  static async getUserById(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user details');
    }
  }

  /**
   * Get package count for a user
   * 
   * @param userId - UUID of the user
   * @returns Promise with package count
   */
  static async getUserPackageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error fetching user package count:', error);
      return 0;
    }
  }

  /**
   * Bulk update user statuses
   * 
   * @param userIds - Array of user IDs
   * @param newStatus - New status to set
   * @returns Promise with number of updated users
   */
  static async bulkUpdateUserStatus(
    userIds: string[], 
    newStatus: 'active' | 'inactive' | 'suspended'
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)
        .select();

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error bulk updating user status:', error);
      throw new Error('Failed to bulk update user statuses');
    }
  }

  /**
   * Format user full name
   * 
   * @param user - User object
   * @returns Formatted full name
   */
  static formatUserName(user: User): string {
    return `${user.first_name} ${user.last_name}`.trim();
  }

  /**
   * Get user role display name
   * 
   * @param role - User role
   * @returns Formatted role name
   */
  static getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'client': 'Client',
      'warehouse_admin': 'Administrator',
      'admin': 'Administrator',
      'super_admin': 'Administrator',
      'superadmin': 'Administrator'
    };

    return roleMap[role] || role;
  }

  /**
   * Get status badge color
   * 
   * @param status - User status
   * @returns Tailwind CSS color classes
   */
  static getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
      'suspended': 'bg-red-100 text-red-800 border-red-200',
      'reported': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Send deactivation request to support team
   * 
   * This method is used when warehouse_admin attempts to deactivate a user.
   * It sends an email notification to the support team with admin details
   * and the reason for deactivation request.
   * 
   * @param adminId - ID of the admin requesting deactivation
   * @param targetUserId - ID of the user to be deactivated
   * @param reason - Detailed reason for deactivation request
   * @returns Promise with success status
   */
  static async notifySupportForDeactivation(
    adminId: string,
    targetUserId: string,
    reason: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'notify-support-user-deactivation',
        {
          body: {
            adminId,
            targetUserId,
            reason
          }
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send notification to support');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send notification');
      }

      return {
        success: true,
        message: 'Support team has been notified. Your request will be reviewed shortly.'
      };
    } catch (error) {
      console.error('Error notifying support:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to notify support team'
      };
    }
  }
}
