/**
 * Package Intake Integration Helper
 * 
 * Utility functions to integrate Phase 1 features into package intake flow
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { supabase } from '../config/supabase';
import { barcodeQRGenerator } from './barcodeQRGenerator';
import { warehouseDocumentService } from '../services/warehouseDocumentService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Package intake request with enhanced features
 */
export interface EnhancedPackageIntakeRequest {
  userSuiteNumber: string;
  description: string;
  warehouseStaffId: string;
  weight?: number;
  declaredValue?: number;
  storeName?: string;
  vendorName?: string;
  notes?: string;
  autoGenerateCodes?: boolean;
  autoGenerateReceipt?: boolean;
}

/**
 * Package intake result with all generated data
 */
export interface PackageIntakeResult {
  success: boolean;
  packageId: string;
  packageUUID: string;
  trackingNumber: string;
  authCode: string;
  userId: string;
  barcodeData?: string;
  qrCodeData?: string;
  receiptData?: any;
  message: string;
  error?: string;
}

// ============================================================================
// PACKAGE INTAKE HELPER CLASS
// ============================================================================

class PackageIntakeHelper {
  /**
   * Perform enhanced package intake with all features
   * Generates auth code, barcodes, QR codes, and receipt
   */
  async performEnhancedIntake(
    request: EnhancedPackageIntakeRequest
  ): Promise<PackageIntakeResult> {
    try {

      // Step 1: Call enhanced intake function with auto auth code generation
      const { data: intakeResult, error: intakeError } = await supabase.rpc(
        'warehouse_package_intake_enhanced',
        {
          p_user_suite_number: request.userSuiteNumber,
          p_description: request.description,
          p_warehouse_staff_id: request.warehouseStaffId,
          p_weight: request.weight || null,
          p_declared_value: request.declaredValue || null,
          p_store_name: request.storeName || null,
          p_vendor_name: request.vendorName || null,
          p_notes: request.notes || null
        }
      );

      if (intakeError) {
        throw intakeError;
      }

      if (!intakeResult || !intakeResult.success) {
        throw new Error(intakeResult?.error || 'Package intake failed');
      }

      // Prepare result object
      const result: PackageIntakeResult = {
        success: true,
        packageId: intakeResult.package_id,
        packageUUID: intakeResult.package_uuid,
        trackingNumber: intakeResult.tracking_number,
        authCode: intakeResult.auth_code,
        userId: intakeResult.user_id,
        message: intakeResult.message
      };

      // Step 2: Generate and store barcode/QR codes (if requested)
      if (request.autoGenerateCodes !== false) {
        try {
          const codes = await barcodeQRGenerator.generatePackageCodes(
            intakeResult.tracking_number
          );

          // Store codes in database
          await warehouseDocumentService.storePackageCodes(
            intakeResult.package_uuid,
            codes.barcode.dataUrl,
            codes.qrCode.dataUrl,
            request.warehouseStaffId
          );

          result.barcodeData = codes.barcode.dataUrl;
          result.qrCodeData = codes.qrCode.dataUrl;

        } catch (codeError) {
          // Continue even if code generation fails
        }
      }

      // Step 3: Generate receipt (if requested)
      if (request.autoGenerateReceipt !== false) {
        try {
          const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
            intakeResult.package_uuid,
            request.warehouseStaffId
          );

          result.receiptData = receipt;

        } catch (receiptError) {
          // Continue even if receipt generation fails
        }
      }

      return result;

    } catch (error) {
      
      return {
        success: false,
        packageId: '',
        packageUUID: '',
        trackingNumber: '',
        authCode: '',
        userId: '',
        message: 'Package intake failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate codes for existing package
   * Useful for packages created before Phase 1 implementation
   */
  async generateCodesForPackage(
    packageId: string,
    trackingNumber: string,
    staffId: string
  ): Promise<{ success: boolean; barcodeData?: string; qrCodeData?: string; error?: string }> {
    try {
      // Generate codes
      const codes = await barcodeQRGenerator.generatePackageCodes(trackingNumber);

      // Store in database
      await warehouseDocumentService.storePackageCodes(
        packageId,
        codes.barcode.dataUrl,
        codes.qrCode.dataUrl,
        staffId
      );

      return {
        success: true,
        barcodeData: codes.barcode.dataUrl,
        qrCodeData: codes.qrCode.dataUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate codes'
      };
    }
  }

  /**
   * Generate receipt for existing package
   * Useful for regenerating lost receipts
   */
  async generateReceiptForPackage(
    packageId: string,
    staffId: string
  ): Promise<{ success: boolean; receipt?: any; error?: string }> {
    try {
      const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
        packageId,
        staffId
      );

      return {
        success: true,
        receipt
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate receipt'
      };
    }
  }

  /**
   * Batch generate codes for multiple packages
   * Useful for migrating existing packages
   */
  async batchGenerateCodes(
    packages: Array<{ id: string; trackingNumber: string }>,
    staffId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];

      try {
        await this.generateCodesForPackage(pkg.id, pkg.trackingNumber, staffId);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed for ${pkg.trackingNumber}: ${error}`);
      }

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, packages.length);
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  /**
   * Verify auth code without updating status
   * Useful for testing or preview
   */
  async verifyAuthCode(
    packageId: string,
    suiteNumber: string,
    authCode: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Get package details
      const { data: packageData, error } = await supabase
        .from('packages')
        .select(`
          delivery_auth_code,
          auth_code_used_at,
          status,
          users (suite_number)
        `)
        .eq('id', packageId)
        .single();

      if (error || !packageData) {
        return { valid: false, reason: 'Package not found' };
      }

      // Check suite number
      if (packageData.users[0]?.suite_number !== suiteNumber.trim().toUpperCase()) {
        return { valid: false, reason: 'Suite number mismatch' };
      }

      // Check if code exists
      if (!packageData.delivery_auth_code) {
        return { valid: false, reason: 'No authentication code set' };
      }

      // Check if code matches
      if (packageData.delivery_auth_code !== authCode.trim()) {
        return { valid: false, reason: 'Invalid authentication code' };
      }

      // Check if already used
      if (packageData.auth_code_used_at) {
        return { valid: false, reason: 'Code already used' };
      }

      // Check status
      if (packageData.status !== 'arrived') {
        return { valid: false, reason: 'Package not in arrived status' };
      }

      return { valid: true };

    } catch (error) {
      return { 
        valid: false, 
        reason: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  /**
   * Get package with all enhanced data
   * Retrieves complete package information including codes and auth
   */
  async getEnhancedPackageData(packageId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          users (
            first_name,
            last_name,
            suite_number,
            email
          )
        `)
        .eq('id', packageId)
        .single();

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

// Export singleton instance for use throughout the application
export const packageIntakeHelper = new PackageIntakeHelper();
export default packageIntakeHelper;
