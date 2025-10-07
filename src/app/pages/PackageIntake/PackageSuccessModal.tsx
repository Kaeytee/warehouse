import React from 'react';
import { printPackageTicket, generatePrintHTML, type PrintablePackageInfo } from '../../utils/printTemplateUtils';

export interface PackageInfo {
  requestId: string;
  weight: number;
  type: string;
  value: number;
  dimensions: string;
  client: string;
  submitted: string;
  destination: string;
  time: string;
  description: string;
  packageId: string;
  barcode: string;
  barcodeImage: string;
}

interface PackageSuccessModalProps {
  open: boolean;
  onClose: () => void;
  packageInfo: PackageInfo | null;
}

const PackageSuccessModal: React.FC<PackageSuccessModalProps> = ({ open, onClose, packageInfo }) => {
  if (!open || !packageInfo) return null;

  /**
   * Handle PDF download functionality
   * Converts package information to printable format and generates HTML for download
   */
  const handleDownload = async () => {
    try {
      // Convert package info to printable format
      const printablePackageInfo: PrintablePackageInfo = {
        packageId: packageInfo.packageId,
        requestId: packageInfo.requestId,
        weight: packageInfo.weight,
        type: packageInfo.type,
        value: packageInfo.value,
        dimensions: packageInfo.dimensions,
        client: packageInfo.client,
        submitted: packageInfo.submitted,
        destination: packageInfo.destination,
        time: packageInfo.time,
        description: packageInfo.description,
        barcode: packageInfo.barcode,
        barcodeImage: packageInfo.barcodeImage,
      };
      
      // Generate HTML content for download
      const htmlContent = generatePrintHTML(printablePackageInfo, {
        title: 'Package Receipt',
        showTrackingInfo: true
      });
      
      // Create and download HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `package-receipt-${packageInfo.packageId || 'details'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate download. Please try again.');
      console.error('Download error:', err);
    }
  };

  /**
   * Handle print functionality
   * Uses the centralized print utility to open print dialog
   */
  const handlePrint = async () => {
    try {
      // Convert package info to printable format
      const printablePackageInfo: PrintablePackageInfo = {
        packageId: packageInfo.packageId,
        requestId: packageInfo.requestId,
        weight: packageInfo.weight,
        type: packageInfo.type,
        value: packageInfo.value,
        dimensions: packageInfo.dimensions,
        client: packageInfo.client,
        submitted: packageInfo.submitted,
        destination: packageInfo.destination,
        time: packageInfo.time,
        description: packageInfo.description,
        barcode: packageInfo.barcode,
        barcodeImage: packageInfo.barcodeImage,
      };
      
      // Use centralized print utility
      printPackageTicket(printablePackageInfo, {
        title: 'Package Receipt',
        showTrackingInfo: true
      });
    } catch (err) {
      alert('Failed to print. Please try again.');
      console.error('Print error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-red-900 mb-1">Package Successfully Created</h2>
        <p className="text-gray-500 text-sm mb-8">The client has been notified. You can now assign this package to a shipment.</p>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="font-medium mb-1">Package Information</div>
            <div className="text-sm text-gray-700 mb-1">Request ID: <span className="font-bold">{packageInfo.requestId}</span></div>
            <div className="text-sm text-gray-700 mb-1">Weight: <span className="font-bold">{packageInfo.weight}kg</span></div>
            <div className="text-sm text-gray-700 mb-1">Package Type: <span className="font-bold">{packageInfo.type}</span></div>
            <div className="text-sm text-gray-700 mb-1">Value: <span className="font-bold">GHS {packageInfo.value}</span></div>
            <div className="text-sm text-gray-700 mb-1">Dimensions: <span className="font-bold">{packageInfo.dimensions}</span></div>
            <div className="text-sm text-gray-700 mb-1">Status: <span className="inline-flex items-center px-3 py-1 rounded-full border border-red-300 text-red-700 bg-red-50 text-xs font-semibold">Received</span></div>
          </div>
          <div>
            <div className="font-medium mb-1">Client & Shipping</div>
            <div className="text-sm text-gray-700 mb-1">Client: <span className="font-bold">{packageInfo.client}</span></div>
            <div className="text-sm text-gray-700 mb-1">Submitted: <span className="font-bold">{packageInfo.submitted}</span></div>
            <div className="text-sm text-gray-700 mb-1">Destination: <span className="font-bold">{packageInfo.destination}</span></div>
            <div className="text-sm text-gray-700 mb-1">Time: <span className="font-bold">{packageInfo.time}</span></div>
            <div className="text-sm text-gray-700 mb-1">Description: <span className="font-bold">{packageInfo.description}</span></div>
          </div>
        </div>
        <div className="bg-gray-50 border rounded-lg p-5 flex flex-col items-center mb-2">
          <div className="font-medium mb-1">Package ID: <span className="font-bold">{packageInfo.packageId}</span></div>
          <img src={packageInfo.barcodeImage} alt="Barcode" className="my-2 w-56 h-14 object-contain" />
          <div className="text-sm">Barcode: <span className="font-bold">{packageInfo.barcode}</span></div>
          <div className="flex gap-2 mt-4">
            <button
              className="border border-red-900 text-red-900 px-5 py-2 rounded-lg font-semibold hover:bg-red-50"
              onClick={handleDownload}
              aria-label="Download barcode"
            >
              Download
            </button>
            <button
              className="bg-red-900 hover:bg-red-800 text-white px-5 py-2 rounded-lg font-semibold shadow"
              onClick={handlePrint}
              aria-label="Print barcode"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageSuccessModal;