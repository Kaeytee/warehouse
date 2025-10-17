/**
 * Waybill Viewer Component
 * 
 * Professional waybill display and management interface
 * Provides printing, downloading, and viewing capabilities
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { FiPrinter, FiDownload, FiX, FiPackage, FiSend, FiMapPin } from 'react-icons/fi';
import { warehouseDocumentService } from '../../services/warehouseDocumentService';
import type { WaybillData } from '../../services/warehouseDocumentService';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';
import logo from '../../assets/image.png';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

interface WaybillViewerProps {
  shipmentId: string;
  onClose?: () => void;
  autoGenerate?: boolean;
}

// ============================================================================
// WAYBILL VIEWER COMPONENT
// ============================================================================

export const WaybillViewer: React.FC<WaybillViewerProps> = ({
  shipmentId,
  onClose,
  autoGenerate = false
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Authentication state
  const { user } = useWarehouseAuth();

  // Waybill data state
  const [waybill, setWaybill] = useState<WaybillData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Print reference
  const printRef = useRef<HTMLDivElement>(null);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Load or generate waybill on component mount
   * Automatically generates if autoGenerate is true
   */
  useEffect(() => {
    if (autoGenerate && user?.id) {
      handleGenerateWaybill();
    }
  }, [shipmentId, user?.id, autoGenerate]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Generate new waybill for shipment
   * Calls backend service to create waybill document
   */
  const handleGenerateWaybill = async (): Promise<void> => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate waybill via service
      const generatedWaybill = await warehouseDocumentService.generateWaybill(
        shipmentId,
        user.id
      );

      setWaybill(generatedWaybill);

    } catch (err) {
      console.error('Failed to generate waybill:', err);
      setError('Failed to generate waybill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Print waybill document
   * Opens browser print dialog with formatted waybill
   */
  const handlePrint = (): void => {
    if (printRef.current) {
      // Create print window
      const printWindow = window.open('', '', 'width=800,height=600');
      
      if (printWindow) {
        // Build printable HTML
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Waybill - ${waybill?.waybill_number}</title>
              <style>
                @page {
                  margin: 1cm;
                  size: auto;
                }
                * {
                  box-sizing: border-box;
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0.5cm;
                  color: #333;
                  font-size: 10pt;
                  position: relative;
                }
                .watermark {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg);
                  font-size: 10vw;
                  color: rgba(220, 38, 38, 0.05);
                  font-weight: bold;
                  z-index: -1;
                  pointer-events: none;
                }
                .waybill-container {
                  max-width: 100%;
                  width: 100%;
                  margin: 0 auto;
                  position: relative;
                  z-index: 1;
                }
                .brand-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 3px solid #dc2626;
                  padding-bottom: 0.5em;
                  margin-bottom: 1em;
                }
                .brand-header-left img {
                  max-width: 20%;
                  height: auto;
                }
                .brand-header-right {
                  text-align: right;
                }
                .brand-header-right h1 {
                  color: #dc2626;
                  margin: 0 0 0.2em 0;
                  font-size: 1.6em;
                }
                .brand-header-right p {
                  margin: 0.1em 0;
                  font-size: 0.7em;
                  color: #666;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #dc2626;
                  padding-bottom: 0.5em;
                  margin-bottom: 1em;
                }
                .header h1 {
                  color: #dc2626;
                  margin-bottom: 0.3em;
                  font-size: 1.5em;
                }
                .section {
                  margin-bottom: 1em;
                  padding: 0.5em;
                  border: 1px solid #e0e0e0;
                  border-radius: 0.25em;
                }
                .section-title {
                  font-size: 1em;
                  font-weight: bold;
                  color: #dc2626;
                  margin-bottom: 0.5em;
                  padding-bottom: 0.3em;
                  border-bottom: 1px solid #e0e0e0;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 0.3em;
                  word-wrap: break-word;
                }
                .info-label {
                  font-weight: bold;
                  color: #666;
                  font-size: 0.85em;
                }
                .info-value {
                  color: #333;
                  font-size: 0.85em;
                  text-align: right;
                }
                .packages-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 0.5em;
                  font-size: 0.85em;
                }
                .packages-table th,
                .packages-table td {
                  border: 1px solid #ddd;
                  padding: 0.3em;
                  text-align: left;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
                .packages-table th {
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
                .barcode-section {
                  text-align: center;
                  margin-top: 1em;
                  padding: 0.5em;
                  background-color: #f9f9f9;
                }
                .barcode-section img {
                  max-width: 100%;
                  height: auto;
                  margin: 0.5em auto;
                }
                .footer {
                  text-align: center;
                  margin-top: 1em;
                  padding-top: 0.5em;
                  border-top: 2px solid #dc2626;
                  color: #666;
                  font-size: 0.75em;
                }
                @media print {
                  @page { margin: 1cm; }
                  body { margin: 0 !important; padding: 0.5cm; }
                  html, body { margin: 0 !important; padding: 0 !important; }
                  .no-print { display: none; }
                  img { max-width: 100%; height: auto; }
                }
              </style>
            </head>
            <body>
              <div class="watermark">VANGUARDCARGO</div>
              <div class="brand-header">
                <div class="brand-header-left">
                  <img src="${logo}" alt="VanguardCargo LLC" />
                </div>
                <div class="brand-header-right">
                  <h1>VANGUARD CARGO LLC</h1>
                  <p>4700 Eisenhower Avenue ALX-E2</p>
                  <p>Alexandria, VA 22304, USA</p>
                  <p>Email: info@vanguardcargo.co</p>
                  <p>Phone: 0303982320 | +233 544197819</p>
                </div>
              </div>
              ${printRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  /**
   * Download waybill as PDF
   * Converts waybill to PDF and triggers download
   */
  const handleDownload = async (): Promise<void> => {
    try {
      // This will be implemented with jsPDF or html2canvas
      // For now, trigger print dialog
      handlePrint();
    } catch (err) {
      console.error('Failed to download waybill:', err);
      setError('Failed to download waybill');
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Calculate estimated delivery date (3 days from creation)
   * Used as fallback when estimated_delivery is null
   */
  const calculateEstimatedDelivery = (createdAt: string): string => {
    const deliveryDate = new Date(createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    return deliveryDate.toISOString();
  };

  /**
   * Get estimated delivery date with fallback calculation
   * Returns estimated_delivery if available, otherwise calculates 3 days from creation
   */
  const getEstimatedDelivery = (): string => {
    if (waybill?.shipment_details.estimated_delivery) {
      return waybill.shipment_details.estimated_delivery;
    }
    // Fallback: calculate 3 days from creation date
    if (waybill?.shipment_details.created_at) {
      return calculateEstimatedDelivery(waybill.shipment_details.created_at);
    }
    return '';
  };

  /**
   * Format date for display (date and time)
   * Converts ISO date string to readable format
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Vanguard Cargo LLC" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="text-2xl font-bold">Digital Waybill</h2>
              <p className="text-xs text-red-100 mt-1">VANGUARD CARGO LLC</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {waybill && (
              <>
                <button
                  onClick={handlePrint}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2 font-medium"
                >
                  <FiPrinter />
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition flex items-center gap-2 font-medium"
                >
                  <FiDownload />
                  Download
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              >
                <FiX />
                Close
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating waybill...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!waybill && !isLoading && !error && (
            <div className="text-center py-12">
              <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No waybill generated yet</p>
              <button
                onClick={handleGenerateWaybill}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Generate Waybill
              </button>
            </div>
          )}

          {waybill && (
            <div ref={printRef} className="waybill-container">
              {/* Header Section */}
              <div className="header text-center border-b-4 border-red-600 pb-6 mb-8">
                <h1 className="text-3xl font-bold text-red-600 mb-2">SHIPPING WAYBILL</h1>
                <p className="text-gray-600 text-lg font-semibold">{waybill.warehouse_info.name}</p>
                <p className="text-gray-500">{waybill.warehouse_info.contact}</p>
                <div className="mt-4 text-xl font-bold text-gray-800">
                  Tracking: {waybill.shipment_details.tracking_number}
                </div>
              </div>

              {/* Shipment Details */}
              <div className="section bg-gray-50 p-4 rounded-lg mb-6">
                <div className="section-title text-red-600 font-bold text-lg mb-3 flex items-center gap-2">
                  <FiSend />
                  Shipment Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="info-row">
                    <span className="info-label text-gray-600">Service Type:</span>
                    <span className="info-value capitalize">{waybill.shipment_details.service_type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Status:</span>
                    <span className="info-value capitalize">{waybill.shipment_details.status}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Total Weight:</span>
                    <span className="info-value">{waybill.shipment_details.total_weight || 'N/A'} kg</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Created:</span>
                    <span className="info-value">{formatDate(waybill.shipment_details.created_at)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Est. Delivery:</span>
                    <span className="info-value">{formatDate(getEstimatedDelivery())}</span>
                  </div>
                </div>
              </div>

              {/* Sender Information - Vanguard Cargo LLC */}
              <div className="section bg-white border border-gray-200 p-4 rounded-lg mb-6">
                <div className="section-title text-red-600 font-bold text-lg mb-3">Sender Information</div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="info-label text-gray-600">Company:</span>
                    <span className="info-value font-semibold">{waybill.sender.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Address:</span>
                    <span className="info-value">{waybill.sender.address || '4700 Eisenhower Avenue ALX-E2, Alexandria, VA 22304, USA'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Email:</span>
                    <span className="info-value">{waybill.sender.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Phone:</span>
                    <span className="info-value">{waybill.sender.phone}</span>
                  </div>
                </div>
              </div>

              {/* Receiver Information */}
              <div className="section bg-white border border-gray-200 p-4 rounded-lg mb-6">
                <div className="section-title text-red-600 font-bold text-lg mb-3 flex items-center gap-2">
                  <FiMapPin />
                  Receiver Information
                </div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="info-label text-gray-600">Name:</span>
                    <span className="info-value">{waybill.receiver.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Phone:</span>
                    <span className="info-value">{waybill.receiver.phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Address:</span>
                    <span className="info-value">{waybill.receiver.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">City:</span>
                    <span className="info-value">{waybill.receiver.city}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label text-gray-600">Country:</span>
                    <span className="info-value">{waybill.receiver.country}</span>
                  </div>
                </div>
              </div>

              {/* Package List */}
              <div className="section bg-white border border-gray-200 p-4 rounded-lg mb-6">
                <div className="section-title text-red-600 font-bold text-lg mb-3 flex items-center gap-2">
                  <FiPackage />
                  Package List ({waybill.packages.length} items)
                </div>
                <table className="packages-table w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Package ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waybill.packages.map((pkg, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{pkg.package_id}</td>
                        <td className="border border-gray-300 px-4 py-2">{pkg.description || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{pkg.weight || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Barcode Section */}
              {waybill.barcode_data && (
                <div className="barcode-section text-center bg-gray-50 p-6 rounded-lg">
                  <div className="section-title text-red-600 font-bold text-lg mb-4">Tracking Barcode</div>
                  <img 
                    src={waybill.barcode_data} 
                    alt="Shipment Barcode" 
                    className="mx-auto max-w-md"
                  />
                  {waybill.qr_code_data && (
                    <div className="mt-4">
                      <p className="text-gray-600 mb-2">Scan QR Code to Track</p>
                      <img 
                        src={waybill.qr_code_data} 
                        alt="Tracking QR Code" 
                        className="mx-auto w-32 h-32"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="footer text-center mt-8 pt-6 border-t-2 border-red-600 text-gray-600 text-sm">
                <p className="mb-2">Generated on {formatDate(waybill.generated_at)}</p>
                <p>© 2025 VanguardCargo Warehouse. All rights reserved.</p>
                <p className="mt-2 text-xs">This is an official shipping document. Handle with care.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaybillViewer;
