/**
 * Consolidated Shipment Detail View
 * 
 * Complete shipment view with all linked packages, waybill, and metrics
 * Displays consolidation details and package traceability
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  FiX, FiSend, FiPackage, FiMapPin, FiFileText,
  FiDollarSign, FiClock, FiDownload, FiArchive
} from 'react-icons/fi';
import BarcodeQRDisplay from './BarcodeQRDisplay';
import WaybillViewer from './WaybillViewer';
import { warehouseDocumentService } from '../../services/warehouseDocumentService';
import type { ConsolidatedShipmentDetails } from '../../services/warehouseDocumentService';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';
import logo from '../../assets/image.png';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

interface ConsolidatedShipmentViewProps {
  shipmentId: string;
  onClose: () => void;
}

// ============================================================================
// CONSOLIDATED SHIPMENT VIEW COMPONENT
// ============================================================================

export const ConsolidatedShipmentView: React.FC<ConsolidatedShipmentViewProps> = ({
  shipmentId,
  onClose
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const { userId } = useWarehouseAuth();

  // Data state
  const [shipmentData, setShipmentData] = useState<ConsolidatedShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modal state
  const [showWaybill, setShowWaybill] = useState<boolean>(false);
  const [isGeneratingReceipts, setIsGeneratingReceipts] = useState<boolean>(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Load shipment details on mount
   * Fetches complete consolidation data
   */
  useEffect(() => {
    if (shipmentId && userId) {
      loadShipmentDetails();
    }
  }, [shipmentId, userId]);

  // ========================================
  // DATA LOADING
  // ========================================

  /**
   * Load shipment details from backend
   * Gets complete shipment with all packages
   */
  const loadShipmentDetails = async (): Promise<void> => {
    if (!userId) return;

    setIsLoading(true);
    setError('');

    try {
      const details = await warehouseDocumentService.getConsolidatedShipmentDetails(
        shipmentId,
        userId
      );

      setShipmentData(details);

    } catch (err) {
      console.error('Failed to load shipment details:', err);
      setError('Failed to load shipment details');
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Generate and auto-print all package receipts
   * Creates receipts for all packages and triggers print dialog
   */
  const handleGeneratePackageReceipts = async (): Promise<void> => {
    if (!userId || !shipmentData) return;

    setIsGeneratingReceipts(true);
    setError('');

    try {
      // Generate receipt for each package
      const receipts = await Promise.all(
        shipmentData.packages.map(async (pkg: any) => {
          try {
            const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
              pkg.id || pkg.package_uuid,
              userId
            );
            return {
              package: pkg,
              receipt,
              success: true
            };
          } catch (err) {
            console.error(`Failed to generate receipt for ${pkg.package_id}:`, err);
            return {
              package: pkg,
              receipt: null,
              success: false,
              error: err
            };
          }
        })
      );

      const successfulReceipts = receipts.filter(r => r.success);
      
      if (successfulReceipts.length > 0) {
        // Print each receipt individually
        for (const item of successfulReceipts) {
          if (!item.receipt) continue;
          
          const receiptData = item.receipt.receipt_data;
          const printWindow = window.open('', '_blank');
          
          if (printWindow) {
            printWindow.document.write(`
              <html>
              <head>
                <title>Receipt - ${item.receipt.receipt_number}</title>
                <style>
                  @page { margin: 1cm; size: auto; }
                  * { box-sizing: border-box; }
                  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0.5cm; background: #f5f5f5; position: relative; font-size: 10pt; }
                  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 10vw; color: rgba(220, 38, 38, 0.05); font-weight: bold; z-index: -1; pointer-events: none; }
                  .receipt { max-width: 100%; width: 100%; margin: 0 auto; background: white; padding: 1em; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; z-index: 1; }
                  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; padding-bottom: 0.5em; margin-bottom: 1em; }
                  .header-left { flex: 1; }
                  .header-left img { max-width: 20%; height: auto; }
                  .header-right { flex: 1; text-align: right; }
                  .header-right h1 { color: #dc2626; margin: 0 0 0.3em 0; font-size: 1.4em; }
                  .header-right p { color: #666; margin: 0.1em 0; font-size: 0.75em; }
                  .receipt-number { text-align: center; background: #dc2626; color: white; padding: 0.5em; margin: 0.5em 0; font-size: 1em; font-weight: bold; }
                  .section { margin: 0.8em 0; }
                  .section-title { background: #f3f4f6; padding: 0.5em; font-weight: bold; color: #1f2937; border-left: 3px solid #dc2626; margin-bottom: 0.5em; font-size: 0.9em; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em; }
                  .info-item { padding: 0.3em 0; border-bottom: 1px solid #e5e7eb; }
                  .info-label { font-weight: 600; color: #6b7280; font-size: 0.8em; }
                  .info-value { color: #1f2937; font-size: 0.9em; margin-top: 0.2em; word-wrap: break-word; }
                  .footer { margin-top: 1em; padding-top: 0.5em; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.7em; }
                  @media print {
                    @page { margin: 1cm; }
                    body { background: white; padding: 0.5cm; margin: 0 !important; }
                    html, body { margin: 0 !important; padding: 0 !important; }
                    .receipt { box-shadow: none; max-width: 100%; }
                  }
                </style>
              </head>
              <body>
                <div class="watermark">VANGUARDCARGO</div>
                <div class="receipt">
                  <div class="header">
                    <div class="header-left">
                      <img src="${logo}" alt="VanguardCargo LLC" />
                    </div>
                    <div class="header-right">
                      <h1>VANGUARD CARGO LLC</h1>
                      <p>4700 Eisenhower Avenue ALX-E2</p>
                      <p>Alexandria, VA 22304, USA</p>
                      <p>Email: info@vanguardcargo.co</p>
                      <p>Phone: 0303982320 | +233 544197819</p>
                    </div>
                  </div>
                  
                  <div class="receipt-number">
                    Receipt #${item.receipt.receipt_number}
                  </div>
                  
                  <div class="section">
                    <div class="section-title">PACKAGE INFORMATION</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Package ID</div>
                        <div class="info-value">${receiptData.package_details.package_id}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Tracking Number</div>
                        <div class="info-value">${receiptData.package_details.tracking_number}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Description</div>
                        <div class="info-value">${receiptData.package_details.description}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Weight</div>
                        <div class="info-value">${receiptData.package_details.weight || 'N/A'} kg</div>
                      </div>
                      ${receiptData.package_details.store_name ? `
                      <div class="info-item">
                        <div class="info-label">Store</div>
                        <div class="info-value">${receiptData.package_details.store_name}</div>
                      </div>
                      ` : ''}
                      ${receiptData.package_details.vendor_name ? `
                      <div class="info-item">
                        <div class="info-label">Vendor</div>
                        <div class="info-value">${receiptData.package_details.vendor_name}</div>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  <div class="section">
                    <div class="section-title">CUSTOMER INFORMATION</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Name</div>
                        <div class="info-value">${receiptData.customer_details.name}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Suite Number</div>
                        <div class="info-value">${receiptData.customer_details.suite_number}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${receiptData.customer_details.email}</div>
                      </div>
                      ${receiptData.customer_details.phone ? `
                      <div class="info-item">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${receiptData.customer_details.phone}</div>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p><strong>Generated:</strong> ${new Date(item.receipt.generated_at).toLocaleString()}</p>
                    <p style="margin-top: 10px;">This is an official receipt from VanguardCargo Warehouse</p>
                    <p>© 2025 VanguardCargo. All rights reserved.</p>
                  </div>
                </div>
                
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                    }, 500);
                  };
                </script>
              </body>
              </html>
            `);
            printWindow.document.close();
          }
          
          // Delay between opening windows to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        alert(`Successfully generated and opened ${successfulReceipts.length} receipt(s) for printing.`);
      }

    } catch (err) {
      console.error('Failed to generate package receipts:', err);
      setError('Failed to generate package receipts');
    } finally {
      setIsGeneratingReceipts(false);
    }
  };

  /**
   * Download all shipment documents as ZIP
   * Generates PDFs for waybill and all package receipts, then zips them
   */
  const handleDownloadAllDocuments = async (): Promise<void> => {
    if (!userId || !shipmentData) return;

    setIsDownloadingAll(true);
    setError('');

    try {
      const zip = new JSZip();
      
      // Format date for filename
      const date = new Date().toISOString().split('T')[0];
      const trackingNumber = shipmentData.shipment.tracking_number || 'Unknown';
      
      // Generate Waybill PDF
      try {
        const waybill = await warehouseDocumentService.generateWaybill(shipmentId, userId);
        
        // Create waybill HTML content
        const waybillHTML = generateWaybillHTML(waybill);
        const waybillPDF = await generatePDFFromHTML(waybillHTML);
        zip.file(`Waybill_${trackingNumber}.pdf`, waybillPDF);
      } catch (err) {
        console.error('Failed to generate waybill:', err);
      }

      // Generate PDF for each package receipt
      for (const pkg of shipmentData.packages) {
        try {
          const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
            pkg.id,  // Use UUID, not package_id string
            userId
          );
          
          const receiptHTML = generateReceiptHTML(receipt);
          const receiptPDF = await generatePDFFromHTML(receiptHTML);
          zip.file(`Package_${pkg.package_id}_Receipt.pdf`, receiptPDF);
        } catch (err) {
          console.error(`Failed to generate receipt for ${pkg.package_id}:`, err);
        }
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Shipment_${trackingNumber}_${date}_Documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully downloaded all documents for shipment ${trackingNumber}`);

    } catch (err) {
      console.error('Failed to download all documents:', err);
      setError('Failed to download all documents');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  /**
   * Generate PDF from HTML content
   * Converts HTML string to PDF blob
   */
  const generatePDFFromHTML = async (htmlContent: string): Promise<Blob> => {
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    document.body.appendChild(container);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      return pdf.output('blob');
    } finally {
      document.body.removeChild(container);
    }
  };

  /**
   * Generate HTML for waybill
   * Creates formatted HTML content for waybill document with responsive design
   */
  const generateWaybillHTML = (waybill: any): string => {
    // Generate package rows
    const packagesRows = waybill.packages.map((pkg: any) => `
      <tr>
        <td>${pkg.package_id}</td>
        <td>${pkg.description || 'N/A'}</td>
        <td style="text-align: right;">${pkg.weight || 'N/A'} kg</td>
      </tr>
    `).join('');
    
    // Build responsive HTML document
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 1cm; size: auto; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; margin: 0; padding: 0; }
    .container { max-width: 100%; width: 100%; margin: 0 auto; padding: 0.5cm; position: relative; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 10vw; font-weight: bold; color: rgba(220, 38, 38, 0.05); z-index: 0; pointer-events: none; white-space: nowrap; }
    .content { position: relative; z-index: 1; }
    .header { border-bottom: 0.2em solid #dc2626; padding-bottom: 1em; margin-bottom: 1.5em; }
    .header-flex { display: table; width: 100%; margin-bottom: 0.5em; }
    .logo-cell { display: table-cell; width: 15%; vertical-align: middle; }
    .logo { max-width: 100%; height: auto; max-height: 5em; display: block; }
    .title-cell { display: table-cell; width: 85%; vertical-align: middle; padding-left: 1em; }
    h1 { color: #dc2626; margin: 0 0 0.3em 0; font-size: 1.8em; line-height: 1.2; }
    .company-info { margin: 0.2em 0; font-size: 0.85em; color: #666; }
    h2 { margin: 0.5em 0 0.3em 0; color: #333; font-size: 1.5em; text-align: center; }
    .tracking { display: inline-block; margin: 0.5em 0 0 0; font-size: 1em; font-weight: bold; background: #fef2f2; padding: 0.4em 0.8em; border-radius: 0.3em; border: 1px solid #fecaca; }
    .section { background: #f9fafb; padding: 1em; margin-bottom: 1em; border-radius: 0.5em; page-break-inside: avoid; }
    .section-title { color: #dc2626; margin: 0 0 0.5em 0; font-size: 1.1em; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 0.4em; text-align: left; word-wrap: break-word; overflow-wrap: break-word; }
    .two-col { width: 100%; margin-bottom: 1em; }
    .two-col td { width: 50%; vertical-align: top; }
    .info-box { border: 1px solid #e5e7eb; padding: 1em; border-radius: 0.5em; margin: 0 0.25em; page-break-inside: avoid; }
    .info-box h3 { color: #dc2626; margin: 0 0 0.5em 0; font-size: 1em; }
    .info-box p { margin: 0.3em 0; font-size: 0.9em; }
    .packages-table { border: 1px solid #ddd; margin-top: 0.5em; }
    .packages-table thead { background: #f3f4f6; }
    .packages-table th { border: 1px solid #ddd; padding: 0.6em; font-size: 0.95em; font-weight: bold; }
    .packages-table td { border: 1px solid #ddd; padding: 0.5em; font-size: 0.9em; }
    .footer { border-top: 0.15em solid #dc2626; margin-top: 2em; padding-top: 1em; text-align: center; font-size: 0.85em; color: #666; }
    .footer p { margin: 0.3em 0; }
  </style>
</head>
<body>
  <div class="watermark">VANGUARDCARGO</div>
  <div class="container">
    <div class="content">
      <div class="header">
        <div class="header-flex">
          <div class="logo-cell">
            <img src="${logo}" alt="VanguardCargo Logo" class="logo" />
          </div>
          <div class="title-cell">
            <h1>VANGUARD CARGO LLC</h1>
            <p class="company-info">4700 Eisenhower Avenue ALX-E2, Alexandria, VA 22304, USA</p>
            <p class="company-info">Email: info@vanguardcargo.co | Phone: 0303982320 | +233 544197819</p>
          </div>
        </div>
        <div style="text-align: center;">
          <h2>SHIPPING WAYBILL</h2>
          <span class="tracking">Tracking: ${waybill.shipment_details.tracking_number}</span>
        </div>
      </div>
      <div class="section">
        <h3 class="section-title">Shipment Information</h3>
        <table>
          <tr>
            <td style="width: 50%;"><strong>Service Type:</strong> ${waybill.shipment_details.service_type}</td>
            <td><strong>Status:</strong> ${waybill.shipment_details.status}</td>
          </tr>
          <tr>
            <td><strong>Total Weight:</strong> ${waybill.shipment_details.total_weight || 'N/A'} kg</td>
            <td><strong>Created:</strong> ${new Date(waybill.shipment_details.created_at).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>
      <table class="two-col">
        <tr>
          <td>
            <div class="info-box">
              <h3>SENDER</h3>
              <p><strong>${waybill.sender.name}</strong></p>
              <p>${waybill.sender.address}</p>
              <p>${waybill.sender.email}</p>
              <p>${waybill.sender.phone}</p>
            </div>
          </td>
          <td>
            <div class="info-box">
              <h3>RECEIVER</h3>
              <p><strong>${waybill.receiver.name}</strong></p>
              <p>${waybill.receiver.address}, ${waybill.receiver.city}</p>
              <p>${waybill.receiver.country}</p>
              <p>${waybill.receiver.phone}</p>
            </div>
          </td>
        </tr>
      </table>
      <div>
        <h3 class="section-title">Package List (${waybill.packages.length} items)</h3>
        <table class="packages-table">
          <thead>
            <tr>
              <th>Package ID</th>
              <th>Description</th>
              <th style="text-align: right;">Weight</th>
            </tr>
          </thead>
          <tbody>
            ${packagesRows}
          </tbody>
        </table>
      </div>
      <div class="footer">
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>© 2025 VanguardCargo Warehouse. All rights reserved.</p>
        <p style="font-size: 0.9em;">This is an official shipping document. Handle with care.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  /**
   * Generate HTML for package receipt
   * Creates formatted HTML content for package receipt
   */
  const generateReceiptHTML = (receipt: any): string => {
    const data = receipt.receipt_data;
    const pkgDetails = data.package_details || {};
    const custDetails = data.customer_details || {};
    
    // Build optional rows
    const storeRow = pkgDetails.store_name ? `
      <tr>
        <td class="label">Store:</td>
        <td>${pkgDetails.store_name}</td>
      </tr>` : '';
      
    const vendorRow = pkgDetails.vendor_name ? `
      <tr>
        <td class="label">Vendor:</td>
        <td>${pkgDetails.vendor_name}</td>
      </tr>` : '';
      
    const customerSection = custDetails.name ? `
      <div class="info-box">
        <h3 class="section-title">CUSTOMER INFORMATION</h3>
        <p><strong>Name:</strong> ${custDetails.name}</p>
        <p><strong>Suite Number:</strong> ${custDetails.suite_number || 'N/A'}</p>
        ${custDetails.email ? `<p><strong>Email:</strong> ${custDetails.email}</p>` : ''}
        ${custDetails.phone ? `<p><strong>Phone:</strong> ${custDetails.phone}</p>` : ''}
      </div>` : '';
    
    // Build responsive HTML document
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 1cm; size: auto; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; margin: 0; padding: 0; }
    .container { max-width: 100%; width: 100%; margin: 0 auto; padding: 0.5cm; position: relative; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 8vw; font-weight: bold; color: rgba(220, 38, 38, 0.05); z-index: 0; pointer-events: none; white-space: nowrap; }
    .content { position: relative; z-index: 1; }
    .header { text-align: center; border-bottom: 0.2em solid #dc2626; padding-bottom: 1em; margin-bottom: 1.5em; }
    .logo { max-width: 100%; height: auto; max-height: 5em; margin-bottom: 0.5em; }
    h1 { color: #dc2626; margin: 0 0 0.3em 0; font-size: 1.6em; line-height: 1.2; }
    .company-info { margin: 0.2em 0; font-size: 0.85em; color: #666; }
    h2 { margin: 0.5em 0 0.3em 0; color: #333; font-size: 1.3em; }
    .receipt-number { display: inline-block; margin: 0.5em 0; font-size: 1em; font-weight: bold; background: #fef2f2; padding: 0.5em 1em; border-radius: 0.3em; border: 1px solid #fecaca; }
    .section { background: #f9fafb; padding: 1em; margin-bottom: 1em; border-radius: 0.5em; page-break-inside: avoid; }
    .section-title { color: #dc2626; margin: 0 0 0.5em 0; font-size: 1em; font-weight: bold; }
    .info-box { background: #fff; border: 1px solid #e5e7eb; padding: 1em; margin-bottom: 1em; border-radius: 0.5em; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0.5em 0; word-wrap: break-word; overflow-wrap: break-word; font-size: 0.95em; }
    .label { width: 40%; font-weight: bold; color: #666; }
    .info-box p { margin: 0.3em 0; font-size: 0.95em; }
    .footer { border-top: 0.15em solid #dc2626; margin-top: 2em; padding-top: 1em; text-align: center; font-size: 0.85em; color: #666; }
    .footer p { margin: 0.3em 0; }
  </style>
</head>
<body>
  <div class="watermark">VANGUARDCARGO</div>
  <div class="container">
    <div class="content">
      <div class="header">
        <img src="${logo}" alt="VanguardCargo Logo" class="logo" />
        <h1>VANGUARD CARGO LLC</h1>
        <p class="company-info">4700 Eisenhower Avenue ALX-E2, Alexandria, VA 22304, USA</p>
        <p class="company-info">Email: info@vanguardcargo.co | Phone: 0303982320 | +233 544197819</p>
        <h2>Package Intake Receipt</h2>
        <span class="receipt-number">Receipt #: ${receipt.receipt_number || data.receipt_number}</span>
      </div>
      <div class="section">
        <h3 class="section-title">PACKAGE INFORMATION</h3>
        <table>
          <tr>
            <td class="label">Package ID:</td>
            <td>${pkgDetails.package_id || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Tracking Number:</td>
            <td>${pkgDetails.tracking_number || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Description:</td>
            <td>${pkgDetails.description || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Weight:</td>
            <td>${pkgDetails.weight || 'N/A'} kg</td>
          </tr>
          ${storeRow}
          ${vendorRow}
        </table>
      </div>
      ${customerSection}
      <div class="footer">
        <p><strong>Thank you for choosing VanguardCargo!</strong></p>
        <p>Generated: ${new Date(data.timestamps?.generated_at).toLocaleString()}</p>
        <p>For inquiries, contact: info@vanguardcargo.co</p>
        <p>© 2025 VanguardCargo Warehouse. All rights reserved.</p>
        <p style="font-size: 0.9em; color: #999;">This is an official receipt. Please keep for your records.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Format date for display
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
   */
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
      case 'shipped':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get delivery timeframe based on service type
   */
  const getDeliveryTimeframe = (serviceType: string): string => {
    switch (serviceType.toLowerCase()) {
      case 'express':
        return '(3-5 business days)';
      case 'overnight':
        return '(1-2 business days)';
      case 'standard':
      default:
        return '(5-7 business days)';
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @page {
          margin: 1cm;
          size: auto;
        }
        @media print {
          @page {
            margin: 1cm;
          }
          * {
            box-sizing: border-box;
          }
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            background: white;
            padding: 0.5cm;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1em;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 0.5em;
          }
          .print-logo {
            max-width: 20%;
            height: auto;
          }
          table {
            page-break-inside: auto;
            width: 100%;
            font-size: 0.85em;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          td, th {
            padding: 0.3em !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          .rounded-lg, .border {
            border-radius: 0.25em !important;
          }
          /* Responsive font sizing */
          body {
            font-size: 10pt;
          }
          h1, h2, h3 {
            font-size: 1.2em;
          }
          /* Hide browser default headers and footers */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col print-content">

          {/* Print Header (visible only in print) */}
          <div className="print-header hidden">
            <div>
              <img src={logo} alt="VanguardCargo LLC" className="print-logo" />
            </div>
            <div style={{textAlign: 'right'}}>
              <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: 0}}>VANGUARD CARGO LLC</h1>
              <p style={{margin: '5px 0', fontSize: '12px'}}>4700 Eisenhower Avenue ALX-E2</p>
              <p style={{margin: '5px 0', fontSize: '12px'}}>Alexandria, VA 22304, USA</p>
              <p style={{margin: '5px 0', fontSize: '12px'}}>Email: info@vanguardcargo.co</p>
              <p style={{margin: '5px 0', fontSize: '12px'}}>Phone: 0303982320 | +233 544197819</p>
            </div>
          </div>

          {/* Header (screen only) */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 no-print">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <FiSend className="text-3xl" />
                  Consolidated Shipment
                </h2>
                {shipmentData && (
                  <>
                    <p className="text-red-100 font-mono text-lg">
                      {shipmentData.shipment.tracking_number}
                    </p>
                    <p className="text-red-200 text-sm mt-1">
                      {shipmentData.shipment.total_packages} packages • {shipmentData.shipment.total_weight || 0} kg
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {shipmentData && (
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(shipmentData.shipment.status)}`}>
                    {shipmentData.shipment.status.toUpperCase().replace('_', ' ')}
                  </span>
                )}
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
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading shipment details...</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Shipment Data */}
            {!isLoading && shipmentData && (
              <>
                {/* Quick Actions (screen only) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
                  <button
                    onClick={() => setShowWaybill(true)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition"
                  >
                    <FiFileText />
                    <span className="text-sm font-medium">Waybill</span>
                  </button>
                  
                  <button
                    onClick={handleGeneratePackageReceipts}
                    disabled={isGeneratingReceipts || !shipmentData?.packages.length}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {isGeneratingReceipts ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm font-medium">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload />
                        <span className="text-sm font-medium">Receipts ({shipmentData?.packages.length || 0})</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleDownloadAllDocuments}
                    disabled={isDownloadingAll || !shipmentData}
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
                  >
                    {isDownloadingAll ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm font-medium">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <FiArchive />
                        <span className="text-sm font-medium">Download All ZIP</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={loadShipmentDetails}
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition"
                  >
                    <FiClock />
                    <span className="text-sm font-medium">Refresh</span>
                  </button>
                </div>

                {/* Shipment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FiPackage className="text-red-600 text-2xl" />
                      <div>
                        <p className="text-sm text-gray-600">Total Packages</p>
                        <p className="text-2xl font-bold text-gray-800">{shipmentData.shipment.total_packages}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FiDollarSign className="text-green-600 text-2xl" />
                      <div>
                        <p className="text-sm text-gray-600">Total Weight</p>
                        <p className="text-2xl font-bold text-gray-800">{shipmentData.shipment.total_weight || 0} kg</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sender Info - VanguardCargo */}
                  <div className="border border-red-200 rounded-lg p-5 bg-red-50">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                      <img src={logo} alt="VanguardCargo" className="w-8 h-8 object-contain" />
                      Sender Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-semibold text-red-700">VANGUARD CARGO LLC</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-800">4700 Eisenhower Avenue ALX-E2</p>
                        <p className="text-sm text-gray-700">Alexandria, VA 22304, USA</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="text-sm text-gray-800">Email: info@vanguardcargo.co</p>
                        <p className="text-sm text-gray-800">Phone: 0303982320 | +233 544197819</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Packages in Shipment</p>
                        <p className="font-semibold text-gray-800">{shipmentData.packages.length} package(s)</p>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Info */}
                  <div className="border border-gray-200 rounded-lg p-5 bg-white">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                      <FiMapPin />
                      Delivery Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Recipient</p>
                        <p className="font-semibold text-gray-800">{shipmentData.shipment.recipient_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-800">{shipmentData.shipment.recipient_phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-semibold text-gray-800">
                          {shipmentData.shipment.delivery_address}, {shipmentData.shipment.delivery_city}, {shipmentData.shipment.delivery_country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packages List */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white">
                  <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <FiPackage />
                    Consolidated Packages ({shipmentData.packages.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Package ID</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Weight</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {shipmentData.packages.map((pkg) => (
                          <tr key={pkg.package_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-800">{pkg.package_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{pkg.description || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{pkg.weight || 'N/A'} kg</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pkg.status)}`}>
                                {pkg.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Barcode & QR Code */}
                <div className="border border-gray-200 rounded-lg p-5 bg-white">
                  <h3 className="font-bold text-lg text-gray-800 mb-4">Shipment Tracking Codes</h3>
                  <BarcodeQRDisplay
                    trackingNumber={shipmentData.shipment.tracking_number}
                    entityId={shipmentData.shipment.shipment_id}
                    entityType="shipment"
                    existingBarcodeData={shipmentData.shipment.barcode_data}
                    existingQRData={shipmentData.shipment.qr_code_data}
                    showActions={false}
                    size="medium"
                    autoGenerate={true}
                  />
                </div>

                {/* Timestamps */}
                <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <FiClock />
                    Timeline
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-semibold text-gray-800">{formatDate(shipmentData.shipment.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-semibold text-gray-800">{formatDate(shipmentData.shipment.updated_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Delivery</p>
                      <p className="font-semibold text-gray-800">
                        {shipmentData.shipment.estimated_delivery 
                          ? formatDate(shipmentData.shipment.estimated_delivery)
                          : 'Calculating...'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getDeliveryTimeframe(shipmentData.shipment.service_type)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Waybill Viewer */}
      {showWaybill && (
        <WaybillViewer
          shipmentId={shipmentId}
          onClose={() => setShowWaybill(false)}
          autoGenerate={true}
        />
      )}

    </>
  );
};

export default ConsolidatedShipmentView;
