/**
 * Warehouse Service
 *
 * Comprehensive service layer for warehouse operations and package management.
 * Handles all database interactions, business logic, and data transformations
 * for warehouse-specific functionality.
 * 
 * Follows clean code architecture, OOP principles, and best practices.
 * 
 * @author Senior Software Engineer
 * @version 2.1.0
 */

import { supabase } from '../config/supabase';
import type { WarehouseMetrics } from '../types/warehouse';

/**
 * Package interface for type safety
 */
export interface Package {
  package_id: string;
  barcode?: string;
  client_name: string;
  client_id: string;
  suite_number: string;
  package_type?: string;
  weight?: string;
  status: 'pending' | 'received' | 'processing' | 'shipped' | 'delivered';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
  warehouse_location?: string;
  notes?: string;
}


/**
 * Warehouse Service Class
 * 
 * Provides comprehensive warehouse management functionality including:
 * - Package CRUD operations
 * - Status management and workflow
 * - Inventory tracking and metrics
 * - Search and filtering capabilities
 * - Bulk operations support
 */
export class WarehouseService {
  
  /**
   * Fetch all packages from the warehouse
   * @returns {Promise<Package[]>} Array of package objects
   */
  static async getPackages(): Promise<Package[]> {
    try {
      console.log('Fetching packages from database...');
      
      // Fetch packages first, then get user data separately to avoid relationship ambiguity
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (packagesError) {
        console.error('Database query failed:', packagesError.message);
        throw new Error(`Failed to fetch packages: ${packagesError.message}`);
      }

      if (!packagesData) {
        throw new Error('No data returned from database');
      }

      // Get unique user IDs from packages
      const userIds = [...new Set(packagesData.map(pkg => pkg.user_id).filter(Boolean))];
      
      // Fetch user data for all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, suite_number, email')
        .in('id', userIds);

      if (usersError) {
        console.warn('Failed to fetch user data:', usersError.message);
      }

      // Create a map of users by ID for quick lookup
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);

      console.log(`Found ${packagesData.length} packages in database`);

      // Transform database data to match expected format with user data lookup
      return packagesData.map((pkg: any) => {
        const user = usersMap[pkg.user_id];
        return {
          package_id: pkg.package_id,
          barcode: pkg.tracking_number,
          client_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown Client',
          client_id: pkg.user_id,
          suite_number: user?.suite_number || 'N/A',
          package_type: pkg.description || 'Package',
          description: pkg.description || '',
          weight: pkg.weight || 0,
          status: pkg.status,
          created_at: pkg.created_at,
          updated_at: pkg.updated_at,
          notes: pkg.notes || ''
        };
      });

    } catch (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }
  }


  /**
   * Get packages by status
   * @param {string} status - Package status to filter by
   * @returns {Promise<Package[]>} Filtered packages
   */
  static async getPackagesByStatus(status: string): Promise<Package[]> {
    try {
      const allPackages = await this.getPackages();
      return allPackages.filter(pkg => pkg.status === status);
    } catch (error) {
      console.error('WarehouseService.getPackagesByStatus error:', error);
      throw error;
    }
  }

  /**
   * Get warehouse metrics and analytics
   * @returns {Promise<WarehouseMetrics>} Warehouse metrics object
   */
  static async getWarehouseMetrics(): Promise<WarehouseMetrics> {
    try {
      console.log('Fetching warehouse metrics from database...');
      
      // Get package counts by status directly from database
      const { data: packageCounts, error } = await supabase
        .from('packages')
        .select('status, weight, declared_value, created_at');

      if (error) {
        console.error('Failed to fetch warehouse metrics:', error.message);
        throw new Error(`Failed to fetch warehouse metrics: ${error.message}`);
      }

      if (!packageCounts) {
        throw new Error('No metrics data returned from database');
      }

      // Calculate metrics from real data
      const statusCounts = packageCounts.reduce((acc: any, pkg: any) => {
        acc[pkg.status] = (acc[pkg.status] || 0) + 1;
        return acc;
      }, {});

      // Removed unused _totalWeight calculation
      
      // Calculate average processing time (days between created and current for processing packages)
      const processingPackages = packageCounts.filter(pkg => pkg.status === 'processing');
      const avgProcessingTime = processingPackages.length > 0 
        ? processingPackages.reduce((sum, pkg) => {
            const daysDiff = Math.floor((Date.now() - new Date(pkg.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / processingPackages.length
        : 0;

      // Removed unused _dailyIntakeRate calculation

      return {
        packagesReceived: statusCounts.received || 0,
        packagesProcessed: statusCounts.processing || 0,
        packagesShipped: statusCounts.shipped || 0,
        pendingPackages: statusCounts.pending || 0,
        storageUtilization: Math.min((packageCounts.length / 1000) * 100, 100),
        averageProcessingTime: Math.round(avgProcessingTime * 10) / 10,
        inventoryValue: 0, // TODO: Calculate from package values
        activeShipments: 0 // TODO: Get from shipments table
      };
    } catch (error) {
      console.error('WarehouseService.getWarehouseMetrics error:', error);
      throw error;
    }
  }

  /**
   * Search packages by multiple criteria
   * @param {string} query - Search query
   * @returns {Promise<Package[]>} Matching packages
   */
  static async searchPackages(query: string): Promise<Package[]> {
    try {
      const allPackages = await this.getPackages();
      const lowerQuery = query.toLowerCase();
      
      return allPackages.filter((pkg: any) => 
        pkg.client_name.toLowerCase().includes(lowerQuery) ||
        pkg.package_id.toLowerCase().includes(lowerQuery) ||
        pkg.suite_number.toLowerCase().includes(lowerQuery) ||
        (pkg.description && pkg.description.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('WarehouseService.searchPackages error:', error);
      throw error;
    }
  }

  /**
   * Update package status
   * @param {string} packageId - Package ID to update
   * @param {string} newStatus - New status value
   * @returns {Promise<{success: boolean, message: string}>} Operation result
   */
  static async updatePackageStatus(packageId: string, newStatus: string): Promise<{success: boolean, message: string}> {
    try {
      console.log(`Updating package ${packageId} to status ${newStatus}`);
      
      const { data, error } = await supabase
        .from('packages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('package_id', packageId)
        .select();

      if (error) {
        console.error('Database update failed:', error.message);
        throw new Error(`Failed to update package status: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Package ${packageId} not found in database`);
      }

      console.log(`Successfully updated package ${packageId} in database`);
      return {
        success: true,
        message: `Package ${packageId} status updated to ${newStatus}`
      };
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  }

  /**
   * Insert sample data into the packages table (for testing)
   * @returns {Promise<{success: boolean, message: string}>} Operation result
   */
  static async insertSampleData(): Promise<{success: boolean, message: string}> {
    try {
      console.log('Inserting sample package data...');
      
      // First, get a user ID from your users table
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (!users || users.length === 0) {
        return {
          success: false,
          message: 'No users found in database. Please create a user first.'
        };
      }

      const userId = users[0].id;

      const samplePackages = [
        {
          package_id: 'PKG-' + Date.now() + '-001',
          tracking_number: 'TRK-' + Date.now() + '-001',
          user_id: userId,
          status: 'received',
          description: 'iPhone 15 Pro',
          weight: 0.5,
          declared_value: 999.99,
          store_name: 'Apple Store',
          vendor_name: 'Apple Inc',
          notes: 'Handle with care',
          intake_date: new Date().toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          package_id: 'PKG-' + Date.now() + '-002',
          tracking_number: 'TRK-' + Date.now() + '-002',
          user_id: userId,
          status: 'processing',
          description: 'Nike Air Max Shoes',
          weight: 1.2,
          declared_value: 150.00,
          store_name: 'Nike Store',
          vendor_name: 'Nike Inc',
          notes: '',
          intake_date: new Date().toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const { data, error } = await supabase
        .from('packages')
        .insert(samplePackages)
        .select();

      if (error) {
        console.error('Failed to insert sample data:', error.message);
        return {
          success: false,
          message: `Failed to insert sample data: ${error.message}`
        };
      }

      console.log('Successfully inserted sample data:', data);
      return {
        success: true,
        message: `Successfully inserted ${data?.length || 0} sample packages`
      };
    } catch (error) {
      console.error('Error inserting sample data:', error);
      return {
        success: false,
        message: 'Error inserting sample data'
      };
    }
  }

  /**
   * Process package intake
   * @param {Object} packageData - Package information
   * @returns {Promise<{success: boolean, packageId: string, message: string}>} Operation result
   */
  static async processPackageIntake(packageData: {
    clientId: string;
    description: string;
    weight?: number;
    notes?: string;
    storeName?: string;
    vendorName?: string;
  }): Promise<{success: boolean, packageId: string, message: string}> {
    try {
      console.log('Processing package intake in database...', packageData);
      
      // Generate unique package ID and tracking number
      const packageId = `PKG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      const { data, error } = await supabase
        .from('packages')
        .insert({
          package_id: packageId,
          tracking_number: trackingNumber,
          user_id: packageData.clientId,
          status: 'received',
          description: packageData.description,
          weight: packageData.weight || 0,
          store_name: packageData.storeName || '',
          vendor_name: packageData.vendorName || '',
          notes: packageData.notes || '',
          intake_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Failed to process package intake:', error.message);
        throw new Error(`Failed to process package intake: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after package intake');
      }

      console.log(`Successfully processed package intake: ${packageId}`);
      return {
        success: true,
        packageId: packageId,
        message: `Package ${packageId} successfully processed for intake`
      };
    } catch (error) {
      console.error('WarehouseService.processPackageIntake error:', error);
      throw error;
    }
  }

}

export default WarehouseService;
