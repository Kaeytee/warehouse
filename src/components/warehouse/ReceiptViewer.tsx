/**
 * Receipt Viewer Component
 * 
 * Professional receipt display for package intake and shipments
 * Provides printing and viewing capabilities
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useRef } from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import type { ReceiptData } from '../../services/warehouseDocumentService';
import { LOGO, COMPANY_INFO, COMPANY_ADDRESS_SINGLE_LINE, COMPANY_PHONES_SHORT, WATERMARK_TEXT, DOCUMENT_SETTINGS } from '../../config/branding';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

interface ReceiptViewerProps {
  receipt: ReceiptData;
  onClose?: () => void;
}

// ============================================================================
// RECEIPT VIEWER COMPONENT
// ============================================================================

export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({
  receipt,
  onClose
}) => {
  // Print reference
  const printRef = useRef<HTMLDivElement>(null);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Print receipt document
   * Opens browser print dialog with formatted receipt
   */
  const handlePrint = (): void => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=600,height=800');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt - ${receipt.receipt_number}</title>
              <style>
                /* Responsive page setup for all paper sizes */
                @page {
                  margin: 1cm;
                  size: auto;
                }
                
                * {
                  box-sizing: border-box;
                }
                
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                }
                
                body {
                  font-family: Arial, sans-serif;
                  padding: 1cm;
                  max-width: 100%;
                  font-size: 10pt;
                  position: relative;
                  line-height: 1.5;
                }
                
                /* Receipt container - responsive */
                .receipt-container {
                  border: 2px solid #333;
                  padding: 1em;
                  max-width: 100%;
                  width: 100%;
                  position: relative;
                  margin: 0 auto;
                }
                
                /* Watermark - scales with viewport */
                .watermark {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(-45deg);
                  font-size: 8vw;
                  font-weight: bold;
                  color: rgba(0, 0, 0, 0.05);
                  z-index: -1;
                  white-space: nowrap;
                  pointer-events: none;
                  letter-spacing: 0.1em;
                }
                
                /* Header section - responsive */
                .header {
                  text-align: center;
                  border-bottom: 2px solid #dc2626;
                  padding-bottom: 1em;
                  margin-bottom: 1em;
                  width: 100%;
                }
                
                /* Company logo - scales with container */
                .company-logo {
                  max-width: 20%;
                  min-width: 100px;
                  height: auto;
                  margin: 0 auto 0.5em;
                  display: block;
                }
                
                .company-info {
                  text-align: center;
                  margin-bottom: 1em;
                  line-height: 1.6;
                  width: 100%;
                }
                
                .company-name {
                  font-size: 1.8em;
                  font-weight: bold;
                  color: #dc2626;
                  margin: 0.5em 0 0.3em;
                  word-wrap: break-word;
                }
                
                .company-address {
                  font-size: 0.85em;
                  color: #666;
                  margin: 0.2em 0;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
                
                .header h1 {
                  margin: 0;
                  font-size: 1.5em;
                  word-wrap: break-word;
                }
                
                .receipt-number {
                  font-size: 1.1em;
                  font-weight: bold;
                  margin: 0.5em 0;
                  padding: 0.5em;
                  word-wrap: break-word;
                }
                
                /* Section styling - responsive */
                .section {
                  margin-bottom: 1em;
                  padding-bottom: 0.5em;
                  border-bottom: 1px solid #ddd;
                  width: 100%;
                }
                
                .section-title {
                  font-weight: bold;
                  font-size: 1em;
                  margin-bottom: 0.5em;
                  color: #333;
                }
                
                /* Info rows - flexible layout */
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 0.3em;
                  padding: 0.2em 0;
                  word-wrap: break-word;
                  flex-wrap: wrap;
                  gap: 0.5em;
                }
                
                .label {
                  font-weight: bold;
                  color: #666;
                  font-size: 0.85em;
                  flex-shrink: 0;
                  min-width: 30%;
                }
                
                .value {
                  color: #333;
                  text-align: right;
                  font-size: 0.85em;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                  flex: 1;
                  min-width: 0;
                }
                
                /* Barcode - responsive */
                .barcode {
                  text-align: center;
                  margin: 1em 0;
                  width: 100%;
                }
                
                .barcode img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 0 auto;
                }
                
                /* Footer - responsive */
                .footer {
                  text-align: center;
                  margin-top: 1em;
                  padding-top: 1em;
                  border-top: 2px solid #dc2626;
                  font-size: 0.75em;
                  color: #666;
                  width: 100%;
                  word-wrap: break-word;
                }
                
                .footer-logo {
                  max-width: 15%;
                  min-width: 60px;
                  height: auto;
                  margin: 0 auto 0.5em;
                  display: block;
                }
                
                /* Stamp/Auth code - responsive */
                .stamp {
                  text-align: center;
                  margin: 1em auto;
                  padding: 0.5em;
                  background-color: #f9f9f9;
                  border: 2px solid #0066cc;
                  border-radius: 0.5em;
                  max-width: 100%;
                  word-wrap: break-word;
                }
                
                /* Print-specific styles */
                @media print {
                  @page {
                    margin: 1cm;
                    size: auto;
                  }
                  
                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100%;
                    height: 100%;
                  }
                  
                  body {
                    padding: 0.5cm;
                    font-size: 10pt;
                  }
                  
                  .receipt-container {
                    page-break-inside: avoid;
                    max-width: 100%;
                    width: 100%;
                  }
                  
                  .no-print {
                    display: none;
                  }
                  
                  img {
                    max-width: 100%;
                    height: auto;
                    page-break-inside: avoid;
                  }
                  
                  .section {
                    page-break-inside: avoid;
                  }
                  
                  /* Ensure watermark appears on print */
                  .watermark {
                    font-size: 6vw;
                  }
                }
                
                /* Responsive adjustments for small paper sizes */
                @media print and (max-width: 15cm) {
                  body {
                    font-size: 9pt;
                  }
                  
                  .company-name {
                    font-size: 1.5em;
                  }
                  
                  .company-logo {
                    max-width: 25%;
                  }
                }
              </style>
            </head>
            <body>
              <div class="watermark">${WATERMARK_TEXT}</div>
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

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Format date for display
   * Converts ISO date string to readable format
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get receipt type label
   * Returns human-readable receipt type
   */
  const getReceiptTypeLabel = (): string => {
    switch (receipt.receipt_type) {
      case 'package_intake':
        return 'Package Intake Receipt';
      case 'shipment_created':
        return 'Shipment Creation Receipt';
      case 'delivery_confirmation':
        return 'Delivery Confirmation Receipt';
      default:
        return 'Receipt';
    }
  };

  // Extract receipt data
  const data = receipt.receipt_data;

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {getReceiptTypeLabel()}
            </h2>
            <p className="text-gray-100 text-sm mt-1">
              Receipt #{receipt.receipt_number}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-green-50 transition flex items-center gap-2 font-medium"
            >
              <FiPrinter />
              Print
            </button>
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
          <div ref={printRef} className="receipt-container" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="header text-center mb-6" style={{ position: 'relative', zIndex: 1 }}>
              {/* Company Logo */}
              <img src={LOGO} alt={`${COMPANY_INFO.name} Logo`} className="company-logo" />
              
              {/* Company Information */}
              <div className="company-info">
                <h1 className="company-name">
                  {COMPANY_INFO.name}
                </h1>
                <p className="company-address">
                  {COMPANY_ADDRESS_SINGLE_LINE}
                </p>
                <p className="company-address">
                  Email: {COMPANY_INFO.supportEmail}
                </p>
                <p className="company-address">
                  {COMPANY_PHONES_SHORT}
                </p>
              </div>
              
              {/* Receipt Number */}
              <div className="receipt-number" style={{ backgroundColor: '#f3f4f6', borderRadius: '0.5em' }}>
                {getReceiptTypeLabel()}<br/>
                Receipt: {receipt.receipt_number}
              </div>
              <p style={{ fontSize: '0.85em', color: '#666', marginTop: '0.5em' }}>
                Generated: {formatDate(receipt.generated_at || data.timestamps?.generated_at)}
              </p>
            </div>

            {/* Customer Information */}
            {data.customer_details && (
              <div className="section mb-6" style={{ position: 'relative', zIndex: 1 }}>
                <div className="section-title text-lg font-bold text-gray-800 mb-3">
                  Customer Information
                </div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{data.customer_details.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Suite Number:</span>
                    <span className="value font-mono">{data.customer_details.suite_number}</span>
                  </div>
                  {data.customer_details.email && (
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{data.customer_details.email}</span>
                    </div>
                  )}
                  {data.customer_details.phone && (
                    <div className="info-row">
                      <span className="label">Phone:</span>
                      <span className="value">{data.customer_details.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Package Details */}
            {data.package_details && (
              <div className="section mb-6" style={{ position: 'relative', zIndex: 1 }}>
                <div className="section-title text-lg font-bold text-gray-800 mb-3">
                  Package Details
                </div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="label">Package ID:</span>
                    <span className="value font-mono">{data.package_details.package_id}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Tracking Number:</span>
                    <span className="value font-mono">{data.package_details.tracking_number}</span>
                  </div>
                  {data.package_details.description && (
                    <div className="info-row">
                      <span className="label">Description:</span>
                      <span className="value">{data.package_details.description}</span>
                    </div>
                  )}
                  {data.package_details.weight && (
                    <div className="info-row">
                      <span className="label">Weight:</span>
                      <span className="value">{data.package_details.weight} kg</span>
                    </div>
                  )}
                  {data.package_details.declared_value && (
                    <div className="info-row">
                      <span className="label">Declared Value:</span>
                      <span className="value">${data.package_details.declared_value}</span>
                    </div>
                  )}
                  {data.package_details.store_name && (
                    <div className="info-row">
                      <span className="label">Store Name:</span>
                      <span className="value">{data.package_details.store_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipment Details */}
            {data.shipment_details && (
              <div className="section mb-6" style={{ position: 'relative', zIndex: 1 }}>
                <div className="section-title text-lg font-bold text-gray-800 mb-3">
                  Shipment Details
                </div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="label">Tracking Number:</span>
                    <span className="value font-mono">{data.shipment_details.tracking_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Service Type:</span>
                    <span className="value capitalize">{data.shipment_details.service_type}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Packages:</span>
                    <span className="value">{data.shipment_details.packages_count}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Total Weight:</span>
                    <span className="value">{data.shipment_details.total_weight} kg</span>
                  </div>
                 
                </div>
              </div>
            )}

            {/* Delivery Details */}
            {data.delivery_details && (
              <div className="section mb-6" style={{ position: 'relative', zIndex: 1 }}>
                <div className="section-title text-lg font-bold text-gray-800 mb-3">
                  Delivery Information
                </div>
                <div className="space-y-2">
                  <div className="info-row">
                    <span className="label">Recipient:</span>
                    <span className="value">{data.delivery_details.recipient_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{data.delivery_details.recipient_phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">{data.delivery_details.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">{data.delivery_details.city}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Country:</span>
                    <span className="value">{data.delivery_details.country}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication Code (if applicable) */}
            {data.auth_code && (
              <div className="stamp">
                <div className="text-sm font-bold text-gray-600 mb-2">Delivery Authentication Code</div>
                <div className="text-3xl font-bold text-green-600 tracking-wider">
                  {data.auth_code}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Keep this code secure. Required for package pickup.
                </div>
              </div>
            )}

            {/* Barcode */}
            {data.barcode_data && (
              <div className="barcode mb-6">
                <img src={data.barcode_data} alt="Receipt Barcode" className="mx-auto max-w-md" />
              </div>
            )}

            {/* Footer */}
            <div className="footer" style={{ position: 'relative', zIndex: 1 }}>
              <p className="font-bold mb-2" style={{ fontWeight: 'bold', marginBottom: '0.5em' }}>Thank you for choosing {COMPANY_INFO.name}!</p>
              <p className="text-xs" style={{ fontSize: '0.75em' }}>
                This is an official receipt. Please keep for your records.
              </p>
              <p className="text-xs mt-2" style={{ fontSize: '0.75em', marginTop: '0.5em' }}>
                <strong>{COMPANY_INFO.name}</strong><br/>
                {COMPANY_ADDRESS_SINGLE_LINE}<br/>
                Email: {COMPANY_INFO.supportEmail} | {COMPANY_PHONES_SHORT}
              </p>
              <p className="text-xs mt-4" style={{ fontSize: '0.75em', marginTop: '1em' }}>
                {DOCUMENT_SETTINGS.copyrightText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
