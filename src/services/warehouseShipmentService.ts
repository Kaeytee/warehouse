/**
 * Warehouse Shipment Service
 * 
 * Handles shipment operations for warehouse staff including creation,
 * management, and tracking of consolidated shipments
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../config/environment';

export interface ShipmentData {
  id: string;
  tracking_number: string; // This matches the database column
  user_id: string;
  service_type: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  total_weight: number | null; // This matches the database column
  total_value: number | null; // This matches the database column
  total_packages: number | null; // This matches the database column
  shipping_cost: number | null;
  status: ShipmentStatus;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_name?: string;
  customer_email?: string;
  packages?: ShipmentPackage[];
}

export interface ShipmentPackage {
  id: string;
  tracking_number: string;
  description: string | null;
  weight_lbs: number | null;
  declared_value: number | null;
  status: string;
}

export type ShipmentStatus = 
  | 'pending'
  | 'processing' 
  | 'shipped'
  | 'in_transit'
  | 'arrived'
  | 'delivered';

export interface ShipmentFilters {
  status?: ShipmentStatus[];
  service_type?: string[];
  destination_country?: string;
  date_from?: string;
  date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
  updated_date_from?: string;
  updated_date_to?: string;
  estimated_delivery_from?: string;
  estimated_delivery_to?: string;
  search?: string;
  customer_id?: string;
}

export interface CreateShipmentData {
  user_id: string;
  package_ids: string[];
  service_type: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  delivery_address: string;
  delivery_city: string;
  delivery_region?: string;
  delivery_country: string;
  is_express?: boolean;
  is_insured?: boolean;
  notes?: string;
}

export interface ShipmentMetrics {
  total_shipments: number;
  pending_quote: number;
  processing: number;
  in_transit: number;
  delivered_this_month: number;
  total_revenue: number;
  average_shipment_value: number;
}

class WarehouseShipmentService {
  /**
   * Get shipments with filtering and pagination
   */
  async getShipments(
    filters: ShipmentFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    shipments: ShipmentData[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    try {
      let query = supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          user_id,
          status,
          recipient_name,
          recipient_phone,
          delivery_address,
          delivery_city,
          delivery_country,
          total_weight,
          total_value,
          total_packages,
          shipping_cost,
          service_type,
          estimated_delivery,
          created_at,
          updated_at,
          users!shipments_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.service_type && filters.service_type.length > 0) {
        query = query.in('service_type', filters.service_type);
      }

      if (filters.destination_country) {
        query = query.eq('delivery_country', filters.destination_country);
      }

      if (filters.customer_id) {
        query = query.eq('user_id', filters.customer_id);
      }

      // Legacy date filters (for backward compatibility)
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Enhanced date filtering options
      if (filters.created_date_from) {
        query = query.gte('created_at', filters.created_date_from);
      }

      if (filters.created_date_to) {
        query = query.lte('created_at', filters.created_date_to);
      }

      if (filters.updated_date_from) {
        query = query.gte('updated_at', filters.updated_date_from);
      }

      if (filters.updated_date_to) {
        query = query.lte('updated_at', filters.updated_date_to);
      }

      if (filters.estimated_delivery_from) {
        query = query.gte('estimated_delivery', filters.estimated_delivery_from);
      }

      if (filters.estimated_delivery_to) {
        query = query.lte('estimated_delivery', filters.estimated_delivery_to);
      }

      if (filters.search) {
        query = query.or(`tracking_number.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`);
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

      // Transform data with real customer info and proper date/time fields
      const shipments: ShipmentData[] = (data || []).map((shipment: any) => ({
        ...shipment,
        customer_name: shipment.users 
          ? `${shipment.users.first_name} ${shipment.users.last_name}`.trim()
          : 'Unknown Customer',
        customer_email: shipment.users?.email || null,
        // Ensure date/time fields are properly formatted
        created_at: shipment.created_at,
        updated_at: shipment.updated_at,
        estimated_delivery: shipment.estimated_delivery,
      }));

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        shipments,
        total,
        page,
        limit,
        total_pages,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get shipments');
      throw error;
    }
  }

  /**
   * Get single shipment by ID with packages
   */
  async getShipmentById(shipmentId: string): Promise<ShipmentData> {
    try {
      // Get shipment details
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select(`
          *,
          user_profiles!shipments_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', shipmentId)
        .single();

      if (shipmentError) {
        throw shipmentError;
      }

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Get associated packages
      const { data: packages, error: packagesError } = await supabase
        .from('package_shipments')
        .select(`
          packages (
            id,
            tracking_number,
            description,
            weight_lbs,
            declared_value,
            status
          )
        `)
        .eq('shipment_id', shipmentId);

      if (packagesError) {
        logger.error('Failed to get shipment packages:', packagesError);
      }

      const shipmentPackages = packages?.map(ps => ps.packages).filter(Boolean) || [];

      return {
        ...shipment,
        customer_name: shipment.user_profiles 
          ? `${shipment.user_profiles.first_name} ${shipment.user_profiles.last_name}`
          : null,
        customer_email: shipment.user_profiles?.email || null,
        packages: shipmentPackages,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get shipment by ID');
      throw error;
    }
  }

  /**
   * Create new shipment from packages
   */
  async createShipment(
    shipmentData: CreateShipmentData,
    createdByUserId: string
  ): Promise<ShipmentData> {
    try {
      // Validate packages exist and are ready
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('id, status, weight_lbs, declared_value, user_id')
        .in('id', shipmentData.package_ids)
        .eq('status', 'ready_for_shipment');

      if (packagesError) {
        throw packagesError;
      }

      if (!packages || packages.length !== shipmentData.package_ids.length) {
        throw new Error('Not all packages are available for shipment');
      }

      // Verify all packages belong to the same customer
      const customerIds = [...new Set(packages.map(p => p.user_id))];
      if (customerIds.length > 1) {
        throw new Error('All packages must belong to the same customer');
      }

      if (customerIds[0] !== shipmentData.user_id) {
        throw new Error('Package customer mismatch');
      }

      // Calculate totals
      const total_weight_lbs = packages.reduce((sum, p) => sum + (p.weight_lbs || 0), 0);
      const total_declared_value = packages.reduce((sum, p) => sum + (p.declared_value || 0), 0);
      const total_packages = packages.length;

      // Generate shipment number
      const shipment_number = await this.generateShipmentNumber();

      // Create shipment
      const { data: newShipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          shipment_number,
          user_id: shipmentData.user_id,
          service_type: shipmentData.service_type,
          recipient_name: shipmentData.recipient_name,
          recipient_phone: shipmentData.recipient_phone,
          recipient_email: shipmentData.recipient_email,
          delivery_address: shipmentData.delivery_address,
          delivery_city: shipmentData.delivery_city,
          delivery_region: shipmentData.delivery_region,
          delivery_country: shipmentData.delivery_country || 'Ghana',
          total_weight_lbs,
          total_declared_value,
          total_packages,
          status: 'pending',
          is_express: shipmentData.is_express || false,
          is_insured: shipmentData.is_insured || false,
        })
        .select()
        .single();

      if (shipmentError) {
        throw shipmentError;
      }

      // Link packages to shipment
      const packageShipments = packages.map((pkg, index) => ({
        package_id: pkg.id,
        shipment_id: newShipment.id,
        weight_lbs: pkg.weight_lbs,
        declared_value: pkg.declared_value,
        position_in_shipment: index + 1,
      }));

      const { error: linkError } = await supabase
        .from('package_shipments')
        .insert(packageShipments);

      if (linkError) {
        // Cleanup: delete the shipment if linking fails
        await supabase.from('shipments').delete().eq('id', newShipment.id);
        throw linkError;
      }

      // Update package statuses
      const { error: statusError } = await supabase
        .from('packages')
        .update({ 
          status: 'consolidated',
          updated_at: new Date().toISOString(),
        })
        .in('id', shipmentData.package_ids);

      if (statusError) {
        logger.error('Failed to update package statuses:', statusError);
        // Continue anyway - shipment is created
      }

      // Shipment created successfully (history logging disabled)

      logger.info('Shipment created successfully:', { 
        shipmentId: newShipment.id,
        shipmentNumber: shipment_number,
        packageCount: total_packages,
        createdBy: createdByUserId
      });

      return newShipment;

    } catch (error) {
      handleSupabaseError(error, 'Create shipment');
      throw error;
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    updatedByUserId?: string,
    notes?: string
  ): Promise<ShipmentData> {
    try {
      // Get current status for logging
      const { data: currentShipment, error: fetchError } = await supabase
        .from('shipments')
        .select('status')
        .eq('id', shipmentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const oldStatus = currentShipment?.status as ShipmentStatus;

      // Update shipment
      const { data, error } = await supabase
        .from('shipments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)
        .select()
        .single();
      if (error) {
        throw error;
      }

      // Update package statuses based on shipment status
      await this.updatePackageStatusesForShipment(shipmentId, newStatus);

      logger.info('Shipment status updated:', { 
        shipmentId,
        oldStatus: currentShipment.status,
        newStatus,
        updatedBy: updatedByUserId 
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Update shipment status');
      throw error;
    }
  }

  /**
   * Set shipment cost
   */
  async setShipmentCost(
    shipmentId: string,
    totalCost: number,
    costBreakdown?: Record<string, number>,
    updatedByUserId?: string,
    notes?: string
  ): Promise<ShipmentData> {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .update({
          total_cost: totalCost,
          status: 'awaiting_payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', shipmentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Cost set successfully (history logging disabled)

      logger.info('Shipment cost set:', { 
        shipmentId,
        totalCost,
        costBreakdown 
      });

      return data;

    } catch (error) {
      handleSupabaseError(error, 'Set shipment cost');
      throw error;
    }
  }

  /**
   * Get shipment metrics for dashboard
   */
  async getShipmentMetrics(): Promise<ShipmentMetrics> {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('status, total_cost, created_at');

      if (error) {
        throw error;
      }

      const total_shipments = shipments?.length || 0;
      const pending_quote = shipments?.filter(s => s.status === 'pending').length || 0;
      const processing = shipments?.filter(s => s.status === 'processing').length || 0;
      const in_transit = shipments?.filter(s => s.status === 'in_transit').length || 0;

      // Delivered this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const delivered_this_month = shipments?.filter(s => 
        s.status === 'delivered' && 
        new Date(s.created_at) >= thisMonth
      ).length || 0;

      // Revenue calculations
      const paidShipments = shipments?.filter(s => 
        ['processing', 'shipped', 'in_transit', 'delivered'].includes(s.status) && 
        s.total_cost
      ) || [];
      
      const total_revenue = paidShipments.reduce((sum, s) => sum + (s.total_cost || 0), 0);
      const average_shipment_value = paidShipments.length > 0 
        ? total_revenue / paidShipments.length 
        : 0;

      return {
        total_shipments,
        pending_quote,
        processing,
        in_transit,
        delivered_this_month,
        total_revenue,
        average_shipment_value,
      };

    } catch (error) {
      handleSupabaseError(error, 'Get shipment metrics');
      throw error;
    }
  }

  /**
   * Generate unique shipment number
   */
  private async generateShipmentNumber(): Promise<string> {
    const prefix = 'SH';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Update package statuses based on shipment status
   */
  private async updatePackageStatusesForShipment(
    shipmentId: string,
    shipmentStatus: ShipmentStatus
  ): Promise<void> {
    try {
      let packageStatus: string | null = null;

      switch (shipmentStatus) {
        case 'processing':
        case 'shipped':
        case 'in_transit':
          packageStatus = 'shipped';
          break;
        case 'arrived':
          packageStatus = 'arrived';
          break;
        case 'delivered':
          packageStatus = 'delivered';
          break;
      }

      if (packageStatus) {
        // Get package IDs for this shipment
        const { data: packageShipments } = await supabase
          .from('package_shipments')
          .select('package_id')
          .eq('shipment_id', shipmentId);

        if (packageShipments?.length) {
          const packageIds = packageShipments.map(ps => ps.package_id);
          
          await supabase
            .from('packages')
            .update({ 
              status: packageStatus,
              updated_at: new Date().toISOString(),
            })
            .in('id', packageIds);
        }
      }
    } catch (error) {
      logger.error('Failed to update package statuses:', error);
      // Don't throw - this is a background operation
    }
  }

}

// Export singleton instance
export const warehouseShipmentService = new WarehouseShipmentService();
export default warehouseShipmentService;
