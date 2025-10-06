/**
 * Warehouse Package Service
 * 
 * Handles package operations for warehouse staff including receiving,
 * inspection, processing, and status management
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../config/environment';

export interface PackageData {
  id: string;
  tracking_number: string;
  user_id: string;
  warehouse_id: string;
  sender_name: string | null;
  sender_email: string | null;
  description: string | null;
  declared_value: number | null;
  currency: string;
  weight_lbs: number | null;
  length_inches: number | null;
  width_inches: number | null;
  height_inches: number | null;
  status: PackageStatus;
  is_fragile: boolean;
  is_hazardous: boolean;
  requires_special_handling: boolean;
  special_instructions: string | null;
  storage_location: string | null;
  expected_arrival_date: string | null;
  actual_arrival_date: string | null;
  inspection_date: string | null;
  ready_for_shipment_date: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  received_by: string | null;
  inspected_by: string | null;
  packed_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  customer_email?: string;
  warehouse_name?: string;
  received_by_name?: string;
  inspected_by_name?: string;
}

export type PackageStatus = 
  | 'pending_arrival'
  | 'arrived' 
  | 'inspected'
  | 'ready_for_shipment'
  | 'consolidated'
  | 'shipped'
  | 'delivered'
  | 'exception';

export interface PackageFilters {
  status?: PackageStatus[];
  warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  customer_id?: string;
}

export interface PackageUpdateData {
  status?: PackageStatus;
  weight_lbs?: number;
  length_inches?: number;
  width_inches?: number;
  height_inches?: number;
  storage_location?: string;
  special_instructions?: string;
  is_fragile?: boolean;
  is_hazardous?: boolean;
  requires_special_handling?: boolean;
}

export interface DashboardMetrics {
  total_packages: number;
  pending_arrival: number;
  arrived_today: number;
  ready_for_shipment: number;
  in_inspection: number;
  awaiting_consolidation: number;
  average_processing_time: number;
  warehouse_capacity_used: number;
}

class WarehousePackageService {
  /**
   * Get packages with filtering and pagination
   */
  async getPackages(
    filters: PackageFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    packages: PackageData[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      let query = supabase
        .from('packages')
        .select(`
          *,
          user_profiles!packages_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          warehouses!packages_warehouse_id_fkey (
            name,
            code
          ),
          received_by_profile:user_profiles!packages_received_by_fkey (
            first_name,
            last_name
          ),
          inspected_by_profile:user_profiles!packages_inspected_by_fkey (
            first_name,
            last_name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      if (filters.customer_id) {
        query = query.eq('user_id', filters.customer_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`
          tracking_number.ilike.%${filters.search}%,
          sender_name.ilike.%${filters.search}%,
          description.ilike.%${filters.search}%
        `);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Transform data
      const packages: PackageData[] = (data || []).map(pkg => ({
        ...pkg,
        customer_name: pkg.user_profiles 
          ? `${pkg.user_profiles.first_name} ${pkg.user_profiles.last_name}`
          : null,
        customer_email: pkg.user_profiles?.email || null,
        warehouse_name: pkg.warehouses?.name || null,
        received_by_name: pkg.received_by_profile 
          ? `${pkg.received_by_profile.first_name} ${pkg.received_by_profile.last_name}`
          : null,
        inspected_by_name: pkg.inspected_by_profile 
          ? `${pkg.inspected_by_profile.first_name} ${pkg.inspected_by_profile.last_name}`
          : null,
      }));

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        packages,
        total,
        page,
        limit,
        total_pages,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get packages');
      throw error;
    }
  }

  /**
   * Get single package by ID with full details
   */
  async getPackageById(packageId: string): Promise<PackageData> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          user_profiles!packages_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          warehouses!packages_warehouse_id_fkey (
            name,
            code,
            street_address,
            city,
            state
          ),
          received_by_profile:user_profiles!packages_received_by_fkey (
            first_name,
            last_name
          ),
          inspected_by_profile:user_profiles!packages_inspected_by_fkey (
            first_name,
            last_name
          ),
          packed_by_profile:user_profiles!packages_packed_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('id', packageId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Package not found');
      }

      return {
        ...data,
        customer_name: data.user_profiles 
          ? `${data.user_profiles.first_name} ${data.user_profiles.last_name}`
          : null,
        customer_email: data.user_profiles?.email || null,
        warehouse_name: data.warehouses?.name || null,
        received_by_name: data.received_by_profile 
          ? `${data.received_by_profile.first_name} ${data.received_by_profile.last_name}`
          : null,
        inspected_by_name: data.inspected_by_profile 
          ? `${data.inspected_by_profile.first_name} ${data.inspected_by_profile.last_name}`
          : null,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get package by ID');
      throw error;
    }
  }

  /**
   * Mark package as received
   */
  async receivePackage(
    packageId: string,
    receivedByUserId: string,
    updateData: Partial<PackageUpdateData> = {}
  ): Promise<PackageData> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          status: 'arrived',
          actual_arrival_date: new Date().toISOString().split('T')[0],
          received_by: receivedByUserId,
          updated_at: new Date().toISOString(),
          ...updateData,
        })
        .eq('id', packageId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log status change
      await this.logStatusChange(
        packageId,
        'pending_arrival',
        'arrived',
        receivedByUserId,
        'Package received at warehouse'
      );

      logger.info('Package received successfully:', { 
        packageId, 
        receivedBy: receivedByUserId 
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Receive package');
      throw error;
    }
  }

  /**
   * Mark package as inspected
   */
  async inspectPackage(
    packageId: string,
    inspectedByUserId: string,
    updateData: Partial<PackageUpdateData> = {}
  ): Promise<PackageData> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          status: 'inspected',
          inspection_date: new Date().toISOString().split('T')[0],
          inspected_by: inspectedByUserId,
          updated_at: new Date().toISOString(),
          ...updateData,
        })
        .eq('id', packageId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log status change
      await this.logStatusChange(
        packageId,
        'arrived',
        'inspected',
        inspectedByUserId,
        'Package inspection completed'
      );

      logger.info('Package inspected successfully:', { 
        packageId, 
        inspectedBy: inspectedByUserId 
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Inspect package');
      throw error;
    }
  }

  /**
   * Mark package as ready for shipment
   */
  async markReadyForShipment(
    packageId: string,
    processedByUserId: string,
    notes?: string
  ): Promise<PackageData> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          status: 'ready_for_shipment',
          ready_for_shipment_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', packageId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log status change
      await this.logStatusChange(
        packageId,
        'inspected',
        'ready_for_shipment',
        processedByUserId,
        notes || 'Package ready for shipment'
      );

      logger.info('Package marked ready for shipment:', { 
        packageId, 
        processedBy: processedByUserId 
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Mark ready for shipment');
      throw error;
    }
  }

  /**
   * Update package information
   */
  async updatePackage(
    packageId: string,
    updateData: PackageUpdateData,
    updatedByUserId: string
  ): Promise<PackageData> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', packageId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Package updated successfully:', { 
        packageId, 
        updatedBy: updatedByUserId,
        changes: Object.keys(updateData)
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Update package');
      throw error;
    }
  }

  /**
   * Get dashboard metrics for warehouse operations
   */
  async getDashboardMetrics(warehouseId?: string): Promise<DashboardMetrics> {
    try {
      // Base query
      let query = supabase.from('packages').select('status, created_at, actual_arrival_date');
      
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }

      const { data: packages, error } = await query;

      if (error) {
        throw error;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Calculate metrics
      const total_packages = packages?.length || 0;
      const pending_arrival = packages?.filter(p => p.status === 'pending_arrival').length || 0;
      const arrived_today = packages?.filter(p => p.actual_arrival_date === today).length || 0;
      const ready_for_shipment = packages?.filter(p => p.status === 'ready_for_shipment').length || 0;
      const in_inspection = packages?.filter(p => p.status === 'arrived').length || 0;
      const awaiting_consolidation = packages?.filter(p => p.status === 'inspected').length || 0;

      // Calculate average processing time (simplified)
      const processedPackages = packages?.filter(p => 
        p.status === 'ready_for_shipment' || p.status === 'consolidated'
      ) || [];
      
      const average_processing_time = processedPackages.length > 0 
        ? Math.round(processedPackages.length / 2) // Simplified calculation
        : 0;

      // Get warehouse capacity (if specified warehouse)
      let warehouse_capacity_used = 0;
      if (warehouseId) {
        const { data: warehouse } = await supabase
          .from('warehouses')
          .select('capacity_limit, current_capacity')
          .eq('id', warehouseId)
          .single();
        
        if (warehouse?.capacity_limit) {
          warehouse_capacity_used = Math.round(
            ((warehouse.current_capacity || 0) / warehouse.capacity_limit) * 100
          );
        }
      }

      return {
        total_packages,
        pending_arrival,
        arrived_today,
        ready_for_shipment,
        in_inspection,
        awaiting_consolidation,
        average_processing_time,
        warehouse_capacity_used,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get dashboard metrics');
      throw error;
    }
  }

  /**
   * Log package status change
   */
  private async logStatusChange(
    packageId: string,
    fromStatus: PackageStatus | null,
    toStatus: PackageStatus,
    changedByUserId: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('package_status_history')
        .insert({
          package_id: packageId,
          from_status: fromStatus,
          to_status: toStatus,
          changed_by: changedByUserId,
          notes: notes || null,
          created_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Failed to log status change:', error);
        // Don't throw error for logging failure
      }
    } catch (error) {
      logger.error('Status change logging error:', error);
    }
  }

  /**
   * Search packages by tracking number
   */
  async searchByTrackingNumber(trackingNumber: string): Promise<PackageData[]> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          user_profiles!packages_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          warehouses!packages_warehouse_id_fkey (
            name,
            code
          )
        `)
        .ilike('tracking_number', `%${trackingNumber}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(pkg => ({
        ...pkg,
        customer_name: pkg.user_profiles 
          ? `${pkg.user_profiles.first_name} ${pkg.user_profiles.last_name}`
          : null,
        customer_email: pkg.user_profiles?.email || null,
        warehouse_name: pkg.warehouses?.name || null,
      }));

    } catch (error) {
      handleSupabaseError(error, 'Search packages');
      throw error;
    }
  }
}

// Export singleton instance
export const warehousePackageService = new WarehousePackageService();
export default warehousePackageService;
