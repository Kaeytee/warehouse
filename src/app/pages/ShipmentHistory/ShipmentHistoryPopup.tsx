import React from 'react';
import { FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import { generateTrackingBarcode } from '../../utils/barcodeUtils';
import { printPackageTicket, type PrintablePackageInfo } from '../../utils/printTemplateUtils';

/**
 * Interface defining the structure of a shipment object
 * Used for type safety and better code documentation
 */
interface Shipment {
  id: string;
  clientName: string;
  destination: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
  weight?: string;
  packageType?: string;
  value?: string;
  dimensions?: string;
  description?: string;
  submittedTime?: string;
  requestId?: string;
}

/**
 * Props interface for the ShipmentHistoryPopup component
 * Defines the required properties for proper component functionality
 */
interface ShipmentHistoryPopupProps {
  shipment: Shipment | null; // The shipment data to display, null when popup is closed
  isOpen: boolean; // Controls the visibility of the popup
  onClose: () => void; // Callback function to close the popup
}

/**
 * ShipmentHistoryPopup Component
 * 
 * A dynamic popup component that displays detailed shipment information.
 * The content varies based on the shipment status:
 * - Pending: Shows basic info without barcode
 * - Processing/Shipped/Delivered: Shows full info with barcode
 * 
 * Features:
 * - Responsive design for mobile and desktop
 * - Dynamic barcode generation for processed shipments
 * - Download and print functionality for barcodes
 * - Proper accessibility with focus management
 * - Clean, professional UI following modern design principles
 */
const ShipmentHistoryPopup: React.FC<ShipmentHistoryPopupProps> = ({
  shipment,
  isOpen,
  onClose
}) => {
  // Don't render anything if popup is closed or no shipment data
  if (!isOpen || !shipment) {
    return null;
  }

  // Generate unique barcode only for processed shipments (not pending)
  const shouldShowBarcode = shipment.status !== 'pending';
  const barcodeDataUrl = shouldShowBarcode ? generateTrackingBarcode(shipment.id) : null;
  
  // Extract barcode number from the shipment ID for display
  const barcodeNumber = shouldShowBarcode ? `BAR${shipment.id.replace(/[^0-9]/g, '').slice(-8)}` : null;

  /**
   * Handle download functionality for the barcode
   * Creates a downloadable link for the barcode image
   */
  const handleDownload = () => {
    if (!barcodeDataUrl) return;
    
    // Create a temporary anchor element for download
    const link = document.createElement('a');
    link.href = barcodeDataUrl;
    link.download = `barcode-${shipment.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Handle print functionality for the barcode
   * Opens a new window with just the barcode for printing
   */
  const handlePrint = () => {
    if (!barcodeDataUrl) return;
    
    // Convert shipment data to printable format with proper defaults for optional fields
    const printableInfo: PrintablePackageInfo = {
      requestId: shipment.requestId || shipment.id, // Use ID as fallback for request ID
      packageId: shipment.id,
      weight: shipment.weight || 'N/A', // Provide default for optional weight
      dimensions: shipment.dimensions || 'N/A', // Provide default for optional dimensions
      type: shipment.packageType || 'Standard', // Provide default for optional package type
      value: shipment.value || 0, // Provide default for optional value
      description: shipment.description || 'No description provided', // Provide default for optional description
      client: shipment.clientName,
      destination: shipment.destination,
      submitted: shipment.date,
      time: shipment.submittedTime || new Date().toLocaleTimeString(), // Provide current time as fallback
      barcode: barcodeNumber || shipment.id, // Use shipment ID as fallback if barcode generation fails
      barcodeImage: barcodeDataUrl,
      status: shipment.status,
    };

    printPackageTicket(printableInfo);
  };

  /**
   * Format the status for display with proper capitalization
   */
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /**
   * Get status color based on shipment status
   * Returns appropriate Tailwind CSS classes for styling
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Backdrop overlay for modal effect */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Main popup container */}
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside popup
        >
          {/* Header section with title and close button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Package Details - {shipment.id}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {shouldShowBarcode 
                  ? 'Complete package information and barcode' 
                  : 'Package information (Processing required for barcode)'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close popup"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content section */}
          <div className="p-6">
            {/* Information grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Package Information Column */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Package Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Package ID:</span>
                    <span className="ml-2 text-sm text-gray-900 font-mono">{shipment.id}</span>
                  </div>
                  {shipment.requestId && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Request ID:</span>
                      <span className="ml-2 text-sm text-gray-900 font-mono">{shipment.requestId}</span>
                    </div>
                  )}
                  {shipment.weight && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Weight:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.weight}</span>
                    </div>
                  )}
                  {shipment.packageType && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Package Type:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.packageType}</span>
                    </div>
                  )}
                  {shipment.value && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Value:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.value}</span>
                    </div>
                  )}
                  {shipment.dimensions && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Dimensions:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.dimensions}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(shipment.status)}`}>
                      {formatStatus(shipment.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client & Shipping Information Column */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Client & Shipping</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Client:</span>
                    <span className="ml-2 text-sm text-gray-900">{shipment.clientName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Submitted:</span>
                    <span className="ml-2 text-sm text-gray-900">{shipment.date}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Destination:</span>
                    <span className="ml-2 text-sm text-gray-900">{shipment.destination}</span>
                  </div>
                  {shipment.submittedTime && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Time:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.submittedTime}</span>
                    </div>
                  )}
                  {shipment.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <span className="ml-2 text-sm text-gray-900">{shipment.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barcode section - only show for processed shipments */}
            {shouldShowBarcode && barcodeDataUrl && (
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <img 
                      src={barcodeDataUrl} 
                      alt={`Barcode for ${shipment.id}`}
                      className="mx-auto max-w-full h-auto"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">Barcode: </span>
                    <span className="text-sm font-mono text-gray-900">{barcodeNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    >
                      <FiPrinter className="w-4 h-4 mr-2" />
                      Print
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message for pending shipments */}
            {!shouldShowBarcode && (
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Barcode not available.</span>
                    <br />
                    The barcode will be generated once the shipment has been processed by an administrator.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShipmentHistoryPopup;