/**
 * Enhanced Package Detail Modal
 * 
 * Comprehensive package view with barcode/QR display and verification
 * Integrates all Phase 1 features into a single modal
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { 
  FiX, FiPackage, FiMapPin, FiClock, FiDollarSign, 
  FiShield, FiPrinter, FiFileText, FiSend 
} from 'react-icons/fi';
import BarcodeQRDisplay from './BarcodeQRDisplay';
import PackageVerificationModal from './PackageVerificationModal';
import ReceiptViewer from './ReceiptViewer';
import { warehouseDocumentService } from '../../services/warehouseDocumentService';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageDetails {
  id: string;
  package_id: string;
  tracking_number: string;
  user_id: string;
  status: string;
  description: string | null;
  weight: number | null;
  declared_value: number | null;
  store_name: string | null;
  vendor_name: string | null;
  notes: string | null;
  barcode_data: string | null;
  qr_code_data: string | null;
  delivery_auth_code: string | null;
  linked_to_shipment_id: string | null;
  intake_date: string | null;
  created_at: string;
  updated_at: string;
  // User details
  user_name?: string;
  suite_number?: string;
  user_email?: string;
}

interface EnhancedPackageDetailModalProps {
  packageData: PackageDetails;
  onClose: () => void;
  onUpdate?: () => void;
}

// ============================================================================
// ENHANCED PACKAGE DETAIL MODAL COMPONENT
// ============================================================================

export const EnhancedPackageDetailModal: React.FC<EnhancedPackageDetailModalProps> = ({
  packageData,
  onClose,
  onUpdate
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const { userId } = useWarehouseAuth();

  // Modal state
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);
  
  // UI state
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Generate and display receipt
   * Creates package intake receipt
   */
  const handleGenerateReceipt = async (): Promise<void> => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setIsGeneratingReceipt(true);
    setError('');

    try {
      const generatedReceipt = await warehouseDocumentService.generatePackageIntakeReceipt(
        packageData.id,
        userId
      );

      setReceipt(generatedReceipt);
      setShowReceipt(true);

    } catch (err) {
      console.error('Failed to generate receipt:', err);
      setError('Failed to generate receipt');
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  /**
   * Handle successful verification
   * Updates parent component and closes modals
   */
  const handleVerificationSuccess = (result: any): void => {
    if (onUpdate) {
      onUpdate();
    }
    setShowVerification(false);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Format date for display
   * Converts ISO string to readable format
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status badge color
   * Returns color classes based on status
   */
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
      case 'in_transit':
        return 'bg-red-100 text-red-800';
      case 'received':
      case 'arrived':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Check if package can be verified
   * Returns true if package is in 'arrived' status
   */
  const canVerify = (): boolean => {
    return packageData.status === 'arrived';
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <FiPackage className="text-3xl" />
                  Package Details
                </h2>
                <p className="text-red-100 font-mono text-lg">
                  {packageData.package_id}
                </p>
                <p className="text-red-200 text-sm mt-1">
                  Tracking: {packageData.tracking_number}
                </p>
              </div>
              
              {/* Status Badge */}
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(packageData.status)}`}>
                  {packageData.status.toUpperCase().replace('_', ' ')}
                </span>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-red-500 p-2 rounded-lg transition"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleGenerateReceipt}
                disabled={isGeneratingReceipt}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                <FiFileText />
                <span className="text-sm font-medium">Receipt</span>
              </button>
              
              {canVerify() && (
                <button
                  onClick={() => setShowVerification(true)}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  <FiShield />
                  <span className="text-sm font-medium">Verify</span>
                </button>
              )}
              
              {packageData.linked_to_shipment_id && (
                <button
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition"
                >
                  <FiSend />
                  <span className="text-sm font-medium">Shipment</span>
                </button>
              )}
              
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                <FiPrinter />
                <span className="text-sm font-medium">Print</span>
              </button>
            </div>

            {/* Package Information */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FiPackage />
                Package Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="font-semibold text-gray-800">{packageData.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Store/Vendor</p>
                  <p className="font-semibold text-gray-800">
                    {packageData.store_name || packageData.vendor_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <FiDollarSign className="text-xs" />
                    Weight
                  </p>
                  <p className="font-semibold text-gray-800">
                    {packageData.weight ? `${packageData.weight} kg` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <FiDollarSign className="text-xs" />
                    Declared Value
                  </p>
                  <p className="font-semibold text-gray-800">
                    {packageData.declared_value ? `$${packageData.declared_value}` : 'N/A'}
                  </p>
                </div>
              </div>

              {packageData.notes && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-800">{packageData.notes}</p>
                </div>
              )}
            </div>

            {/* Customer Information */}
            {(packageData.user_name || packageData.suite_number) && (
              <div className="border border-gray-200 rounded-lg p-5 bg-white">
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                  <FiMapPin />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageData.user_name && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Customer Name</p>
                      <p className="font-semibold text-gray-800">{packageData.user_name}</p>
                    </div>
                  )}
                  {packageData.suite_number && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Suite Number</p>
                      <p className="font-mono font-semibold text-gray-800">{packageData.suite_number}</p>
                    </div>
                  )}
                  {packageData.user_email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-800">{packageData.user_email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authentication Code (if exists and not used) */}
            {packageData.delivery_auth_code && (
              <div className="border-2 border-purple-300 rounded-lg p-5 bg-purple-50">
                <h3 className="font-bold text-lg text-purple-800 mb-3 flex items-center gap-2">
                  <FiShield />
                  Delivery Authentication Code
                </h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600 tracking-widest mb-2">
                    {packageData.delivery_auth_code}
                  </p>
                  <p className="text-sm text-purple-700">
                    Customer must provide this code for package pickup
                  </p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <FiClock />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold text-gray-800">{formatDate(packageData.created_at)}</span>
                </div>
                {packageData.intake_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Intake</span>
                    <span className="font-semibold text-gray-800">{formatDate(packageData.intake_date)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-semibold text-gray-800">{formatDate(packageData.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Barcode & QR Code Display */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white">
              <h3 className="font-bold text-lg text-gray-800 mb-4">
                Barcode & QR Code
              </h3>
              <BarcodeQRDisplay
                trackingNumber={packageData.tracking_number}
                entityId={packageData.id}
                entityType="package"
                existingBarcodeData={packageData.barcode_data}
                existingQRData={packageData.qr_code_data}
                showActions={true}
                size="medium"
                autoGenerate={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && (
        <PackageVerificationModal
          packageId={packageData.id}
          packageTrackingNumber={packageData.tracking_number}
          onSuccess={handleVerificationSuccess}
          onClose={() => setShowVerification(false)}
        />
      )}

      {/* Receipt Viewer */}
      {showReceipt && receipt && (
        <ReceiptViewer
          receipt={receipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
};

export default EnhancedPackageDetailModal;
