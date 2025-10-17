/**
 * Warehouse Document Service
 * 
 * Handles waybill generation, receipt creation, and barcode/QR code operations
 * Provides comprehensive document generation for warehouse operations
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../config/environment';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Waybill data structure
 * Contains complete shipment information for printing and documentation
 */
export interface WaybillData {
  waybill_number: string;
  generated_at: string;
  generated_by: string;
  shipment_details: {
    shipment_id: string;
    tracking_number: string;
    status: string;
    service_type: string;
    total_weight: number | null;
    total_value: number | null;
    shipping_cost: number | null;
    estimated_delivery: string | null;
    created_at: string;
  };
  sender: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  packages: Array<{
    package_id: string;
    tracking_number: string;
    description: string;
    weight: number | null;
    declared_value: number | null;
    barcode_data: string | null;
    qr_code_data: string | null;
  }>;
  barcode_data: string | null;
  qr_code_data: string | null;
  warehouse_info: {
    name: string;
    contact: string;
  };
}

/**
 * Receipt data structure
 * Standardized receipt format for intake and shipments
 */
export interface ReceiptData {
  receipt_id: string;
  receipt_number: string;
  receipt_type: 'package_intake' | 'shipment_created' | 'delivery_confirmation';
  receipt_data: any;
  generated_at: string;
}

/**
 * Package verification request
 * Data required to verify package delivery
 */
export interface PackageVerificationRequest {
  package_id: string;
  suite_number: string;
  auth_code: string;
  staff_id: string;
}

/**
 * Package verification result
 * Result of verification attempt
 */
export interface PackageVerificationResult {
  success: boolean;
  verified: boolean;
  package_id?: string;
  tracking_number?: string;
  customer_name?: string;
  message: string;
  reason?: string;
}

/**
 * Consolidated shipment details
 * Complete shipment with all linked packages
 */
export interface ConsolidatedShipmentDetails {
  shipment: {
    shipment_id: string;
    tracking_number: string;
    status: string;
    service_type: string;
    total_weight: number | null;
    total_value: number | null;
    total_packages: number;
    shipping_cost: number | null;
    combined_suite_numbers: string[];
    customer_name: string;
    customer_email: string;
    suite_number: string;
    recipient_name: string;
    recipient_phone: string;
    delivery_address: string;
    delivery_city: string;
    delivery_country: string;
    estimated_delivery: string | null;
    created_at: string;
    updated_at: string;
    barcode_data: string | null;
    qr_code_data: string | null;
    waybill_generated: boolean;
  };
  packages: Array<{
    id: string;
    package_id: string;
    tracking_number: string;
    description: string;
    weight: number | null;
    declared_value: number | null;
    status: string;
    store_name: string | null;
    vendor_name: string | null;
    barcode_data: string | null;
    qr_code_data: string | null;
    auth_code: string | null;
    linked_at: string;
  }>;
}

// ============================================================================
// WAREHOUSE DOCUMENT SERVICE CLASS
// ============================================================================

class WarehouseDocumentService {
  /**
   * Generate waybill for shipment
   * Creates comprehensive waybill document with all shipment details
   * Automatically generates barcode and QR code if not present
   */
  async generateWaybill(
    shipmentId: string,
    userId: string
  ): Promise<WaybillData> {
    try {
      logger.info('Generating waybill:', { shipmentId, userId });

      // Get shipment tracking number first
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('tracking_number, barcode_data, qr_code_data')
        .eq('id', shipmentId)
        .single();

      if (shipmentError) {
        throw shipmentError;
      }

      // Generate barcode and QR code if not already present
      if (!shipment.barcode_data || !shipment.qr_code_data) {
        // Dynamically import barcode generator singleton
        const barcodeQRGeneratorModule = await import('../utils/barcodeQRGenerator');
        const generator = barcodeQRGeneratorModule.default;
        
        // Generate codes
        const codes = await generator.generateShipmentCodes(shipment.tracking_number);
        
        // Store codes in database
        await this.storeShipmentCodes(
          shipmentId,
          codes.barcode.dataUrl,
          codes.qrCode.dataUrl,
          userId
        );
        
        logger.info('Generated and stored barcode/QR code for shipment:', { shipmentId });
      }

      // Call database function to generate waybill
      const { data, error } = await supabase.rpc('generate_waybill', {
        p_shipment_id: shipmentId,
        p_generated_by: userId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate waybill');
      }

      logger.info('Waybill generated successfully:', { 
        shipmentId,
        waybillNumber: data.waybill.waybill_number
      });

      return data.waybill as WaybillData;

    } catch (error) {
      handleSupabaseError(error, 'Generate waybill');
      throw error;
    }
  }

  /**
   * Generate package intake receipt
   * Creates receipt after package is received at warehouse
   */
  async generatePackageIntakeReceipt(
    packageId: string,
    staffId: string
  ): Promise<ReceiptData> {
    try {
      // Call database function
      const { data, error } = await supabase.rpc('generate_package_intake_receipt', {
        p_package_id: packageId,
        p_staff_id: staffId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate receipt');
      }

      return {
        receipt_id: data.receipt_id,
        receipt_number: data.receipt_number,
        receipt_type: 'package_intake',
        receipt_data: data.receipt_data,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      handleSupabaseError(error, 'Generate package intake receipt');
      throw error;
    }
  }

  /**
   * Generate shipment creation receipt
   * Creates receipt after shipment is created
   */
  async generateShipmentReceipt(
    shipmentId: string,
    staffId: string
  ): Promise<ReceiptData> {
    try {
      // Call database function
      const { data, error } = await supabase.rpc('generate_shipment_receipt', {
        p_shipment_id: shipmentId,
        p_staff_id: staffId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate receipt');
      }

      return {
        receipt_id: data.receipt_id,
        receipt_number: data.receipt_number,
        receipt_type: 'shipment_created',
        receipt_data: data.receipt_data,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      handleSupabaseError(error, 'Generate shipment receipt');
      throw error;
    }
  }

  /**
   * Verify package delivery with 6-digit authentication code
   * Validates code and marks package as delivered if successful
   */
  async verifyPackageDelivery(
    request: PackageVerificationRequest
  ): Promise<PackageVerificationResult> {
    try {
      logger.info('Verifying package delivery:', { 
        packageId: request.package_id,
        suiteNumber: request.suite_number
      });

      // Call database function
      const { data, error } = await supabase.rpc('verify_package_delivery', {
        p_package_id: request.package_id,
        p_suite_number: request.suite_number,
        p_auth_code: request.auth_code,
        p_staff_id: request.staff_id
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No response from verification function');
      }

      // Log verification result
      if (data.verified) {
        logger.info('Package verified successfully:', { 
          packageId: request.package_id,
          customerName: data.customer_name
        });
      } else {
        logger.warn('Package verification failed:', { 
          packageId: request.package_id,
          reason: data.reason
        });
      }

      return {
        success: data.success || false,
        verified: data.verified || false,
        package_id: data.package_id,
        tracking_number: data.tracking_number,
        customer_name: data.customer_name,
        message: data.message || data.error || 'Verification completed',
        reason: data.reason
      };

    } catch (error) {
      handleSupabaseError(error, 'Verify package delivery');
      throw error;
    }
  }

  /**
   * Get package verification logs
   * Retrieves audit trail of verification attempts
   */
  async getVerificationLogs(
    packageId: string,
    staffId: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_package_verification_logs', {
        p_package_id: packageId,
        p_staff_id: staffId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to get verification logs');
      }

      return data.logs || [];

    } catch (error) {
      handleSupabaseError(error, 'Get verification logs');
      throw error;
    }
  }

  /**
   * Get consolidated shipment details with all packages
   * Retrieves complete shipment information including linked packages
   */
  async getConsolidatedShipmentDetails(
    shipmentId: string,
    userId: string
  ): Promise<ConsolidatedShipmentDetails> {
    try {
      const { data, error } = await supabase.rpc('get_consolidated_shipment_details', {
        p_shipment_id: shipmentId,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to get shipment details');
      }

      return {
        shipment: data.shipment,
        packages: data.packages || []
      };

    } catch (error) {
      handleSupabaseError(error, 'Get consolidated shipment details');
      throw error;
    }
  }

  /**
   * Store barcode and QR code data for package
   * Saves generated codes to database
   */
  async storePackageCodes(
    packageId: string,
    barcodeData: string,
    qrCodeData: string,
    staffId: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('store_package_codes', {
        p_package_id: packageId,
        p_barcode_data: barcodeData,
        p_qr_code_data: qrCodeData,
        p_staff_id: staffId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to store codes');
      }

      logger.info('Package codes stored:', { packageId });

    } catch (error) {
      handleSupabaseError(error, 'Store package codes');
      throw error;
    }
  }

  /**
   * Store barcode and QR code data for shipment
   * Saves generated codes to database
   */
  async storeShipmentCodes(
    shipmentId: string,
    barcodeData: string,
    qrCodeData: string,
    staffId: string
  ): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('store_shipment_codes', {
        p_shipment_id: shipmentId,
        p_barcode_data: barcodeData,
        p_qr_code_data: qrCodeData,
        p_staff_id: staffId
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to store codes');
      }

      logger.info('Shipment codes stored:', { shipmentId });

    } catch (error) {
      handleSupabaseError(error, 'Store shipment codes');
      throw error;
    }
  }

  /**
   * Get all receipts for a user
   * Retrieves receipt history with pagination
   */
  async getUserReceipts(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    receipts: ReceiptData[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('receipts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        receipts: (data || []).map(r => ({
          receipt_id: r.id,
          receipt_number: r.receipt_number,
          receipt_type: r.receipt_type,
          receipt_data: r.receipt_data,
          generated_at: r.generated_at
        })),
        total,
        page,
        total_pages
      };

    } catch (error) {
      handleSupabaseError(error, 'Get user receipts');
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

// Export singleton instance for use throughout the application
export const warehouseDocumentService = new WarehouseDocumentService();
export default warehouseDocumentService;
