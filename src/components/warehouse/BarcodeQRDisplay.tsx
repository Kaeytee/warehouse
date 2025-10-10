/**
 * Barcode & QR Code Display Component
 * 
 * Reusable component for displaying barcodes and QR codes
 * Includes generation, display, and action buttons (print, download)
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { FiMaximize2, FiDownload, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { barcodeQRGenerator } from '../../utils/barcodeQRGenerator';
import { warehouseDocumentService } from '../../services/warehouseDocumentService';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BarcodeQRDisplayProps {
  trackingNumber: string;
  entityId: string; // package_id or shipment_id
  entityType: 'package' | 'shipment';
  existingBarcodeData?: string | null;
  existingQRData?: string | null;
  showActions?: boolean;
  size?: 'small' | 'medium' | 'large';
  autoGenerate?: boolean;
}

// ============================================================================
// BARCODE QR DISPLAY COMPONENT
// ============================================================================

export const BarcodeQRDisplay: React.FC<BarcodeQRDisplayProps> = ({
  trackingNumber,
  entityId,
  entityType,
  existingBarcodeData,
  existingQRData,
  showActions = true,
  size = 'medium',
  autoGenerate = true
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const { user } = useWarehouseAuth();
  
  // Code data state
  const [barcodeData, setBarcodeData] = useState<string | null>(existingBarcodeData || null);
  const [qrCodeData, setQRCodeData] = useState<string | null>(existingQRData || null);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showFullView, setShowFullView] = useState<boolean>(false);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Auto-generate codes if not provided and autoGenerate is true
   * Generates and stores codes in database
   */
  useEffect(() => {
    if (autoGenerate && (!barcodeData || !qrCodeData) && trackingNumber) {
      handleGenerateCodes();
    }
  }, [trackingNumber, autoGenerate]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Generate barcode and QR code
   * Creates codes and stores them in database
   */
  const handleGenerateCodes = async (): Promise<void> => {
    setIsGenerating(true);
    setError('');

    try {
      // Generate codes based on entity type
      const codes = entityType === 'package'
        ? await barcodeQRGenerator.generatePackageCodes(trackingNumber)
        : await barcodeQRGenerator.generateShipmentCodes(trackingNumber);

      // Update local state
      setBarcodeData(codes.barcode.dataUrl);
      setQRCodeData(codes.qrCode.dataUrl);

      // Store in database if user is authenticated
      if (user?.id) {
        if (entityType === 'package') {
          await warehouseDocumentService.storePackageCodes(
            entityId,
            codes.barcode.dataUrl,
            codes.qrCode.dataUrl,
            user.id
          );
        } else {
          await warehouseDocumentService.storeShipmentCodes(
            entityId,
            codes.barcode.dataUrl,
            codes.qrCode.dataUrl,
            user.id
          );
        }
      }

    } catch (err) {
      console.error('Failed to generate codes:', err);
      setError('Failed to generate codes');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download barcode image
   * Triggers browser download
   */
  const handleDownloadBarcode = (): void => {
    if (barcodeData) {
      const link = document.createElement('a');
      link.download = `barcode-${trackingNumber}.png`;
      link.href = barcodeData;
      link.click();
    }
  };

  /**
   * Download QR code image
   * Triggers browser download
   */
  const handleDownloadQR = (): void => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.download = `qrcode-${trackingNumber}.png`;
      link.href = qrCodeData;
      link.click();
    }
  };

  /**
   * Print barcode
   * Opens print dialog with barcode
   */
  const handlePrintBarcode = (): void => {
    if (barcodeData) {
      barcodeQRGenerator.printBarcode(trackingNumber);
    }
  };

  /**
   * Print QR code
   * Opens print dialog with QR code
   */
  const handlePrintQR = (): void => {
    if (qrCodeData) {
      barcodeQRGenerator.printQRCode(qrCodeData, trackingNumber);
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Get size classes for images
   * Returns Tailwind classes based on size prop
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { barcode: 'max-w-xs', qr: 'w-16 h-16' };
      case 'large':
        return { barcode: 'max-w-2xl', qr: 'w-48 h-48' };
      default:
        return { barcode: 'max-w-md', qr: 'w-32 h-32' };
    }
  };

  const sizeClasses = getSizeClasses();

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Generating codes...</p>
          </div>
        </div>
      )}

      {/* Codes Display */}
      {!isGenerating && (barcodeData || qrCodeData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Barcode Section */}
          {barcodeData && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Barcode</h3>
                {showActions && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFullView(true)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                      title="Enlarge"
                    >
                      <FiMaximize2 />
                    </button>
                    <button
                      onClick={handleDownloadBarcode}
                      className="text-green-600 hover:bg-green-50 p-1 rounded transition"
                      title="Download"
                    >
                      <FiDownload />
                    </button>
                    <button
                      onClick={handlePrintBarcode}
                      className="text-purple-600 hover:bg-purple-50 p-1 rounded transition"
                      title="Print"
                    >
                      <FiPrinter />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-center bg-gray-50 p-3 rounded">
                <img 
                  src={barcodeData} 
                  alt="Barcode" 
                  className={`${sizeClasses.barcode}`}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2 font-mono">
                {trackingNumber}
              </p>
            </div>
          )}

          {/* QR Code Section */}
          {qrCodeData && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">QR Code</h3>
                {showActions && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFullView(true)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                      title="Enlarge"
                    >
                      <FiMaximize2 />
                    </button>
                    <button
                      onClick={handleDownloadQR}
                      className="text-green-600 hover:bg-green-50 p-1 rounded transition"
                      title="Download"
                    >
                      <FiDownload />
                    </button>
                    <button
                      onClick={handlePrintQR}
                      className="text-purple-600 hover:bg-purple-50 p-1 rounded transition"
                      title="Print"
                    >
                      <FiPrinter />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-center bg-gray-50 p-3 rounded">
                <img 
                  src={qrCodeData} 
                  alt="QR Code" 
                  className={`${sizeClasses.qr}`}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Scan to track
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regenerate Button */}
      {!isGenerating && (barcodeData || qrCodeData) && showActions && (
        <button
          onClick={handleGenerateCodes}
          className="w-full text-sm text-gray-600 hover:text-red-600 py-2 border border-gray-300 rounded-lg hover:border-red-600 transition flex items-center justify-center gap-2"
        >
          <FiRefreshCw className="text-sm" />
          Regenerate Codes
        </button>
      )}

      {/* Generate Button (if no codes exist) */}
      {!isGenerating && !barcodeData && !qrCodeData && !autoGenerate && (
        <button
          onClick={handleGenerateCodes}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium"
        >
          Generate Barcode & QR Code
        </button>
      )}

      {/* Full View Modal */}
      {showFullView && (barcodeData || qrCodeData) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullView(false)}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Full View</h3>
              <button
                onClick={() => setShowFullView(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {barcodeData && (
                <div className="text-center">
                  <p className="font-semibold mb-3">Barcode</p>
                  <img src={barcodeData} alt="Barcode" className="mx-auto max-w-full" />
                </div>
              )}
              
              {qrCodeData && (
                <div className="text-center">
                  <p className="font-semibold mb-3">QR Code</p>
                  <img src={qrCodeData} alt="QR Code" className="mx-auto w-64 h-64" />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {barcodeData && (
                <button
                  onClick={handlePrintBarcode}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <FiPrinter />
                  Print Barcode
                </button>
              )}
              {qrCodeData && (
                <button
                  onClick={handlePrintQR}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <FiPrinter />
                  Print QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeQRDisplay;
