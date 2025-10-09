import React from 'react';
import ReactDOMServer from 'react-dom/server';

/**
 * Company details for professional printout templates.
 * Centralized configuration for consistent branding across all printouts.
 * Update this object if company information changes.
 */
const COMPANY_DETAILS = {
  name: 'Vanguard Cargo',
  address: '123 Warehouse Ave, Accra, Ghana',
  phone: '+233 24 123 4567',
  email: 'info@Vanguard.com',
  website: 'www.Vanguard.com',
  logo: '/assets/logo.png', // Add logo path when available
  primaryColor: '#b91c1c', // Red color for branding
  secondaryColor: '#1e293b', // Dark red for headers
};

/**
 * Interface for package information used in print templates
 * Comprehensive structure to support various package data formats
 */
export interface PrintablePackageInfo {
  // Core package identifiers
  requestId: string;
  packageId: string;
  
  // Package physical properties
  weight: number | string;
  dimensions: string;
  type: string;
  value: number | string;
  description: string;
  
  // Client and shipping information
  client: string;
  destination: string;
  submitted: string;
  time?: string;
  
  // Barcode information
  barcode: string;
  barcodeImage: string;
  
  // Optional status information
  status?: 'pending' | 'processing' | 'shipped' | 'delivered';
  
  // Optional additional fields
  origin?: string;
  deliveryDate?: string;
  submittedTime?: string;
}

/**
 * Props interface for the centralized print template component
 */
interface PackagePrintTemplateProps {
  packageInfo: PrintablePackageInfo;
  title?: string; // Optional custom title
  showTrackingInfo?: boolean; // Whether to show tracking URL info
  customStyles?: React.CSSProperties; // Optional custom styles
}

/**
 * Centralized Package Print Template Component
 * 
 * A professional, reusable print template for package tickets and receipts.
 * This component provides consistent branding and formatting across the application.
 * 
 * Features:
 * - Professional company branding with logo and contact information
 * - Responsive grid layout for package details
 * - Barcode integration with tracking information
 * - Status-based styling and information
 * - Customizable title and styling options
 * - Print-optimized CSS with proper margins and fonts
 * - Accessibility features with proper semantic HTML
 * 
 * Usage:
 * - Package receipts after successful submission
 * - Shipping labels and tickets
 * - Package detail printouts from history
 * - Administrative documentation
 */
const PackagePrintTemplate: React.FC<PackagePrintTemplateProps> = ({ 
  packageInfo, 
  title = 'Package Details',
  showTrackingInfo = true,
  customStyles = {}
}) => {
  // Format weight to ensure consistent display
  const formatWeight = (weight: number | string): string => {
    if (typeof weight === 'number') {
      return `${weight} kg`;
    }
    return weight.toString().includes('kg') ? weight.toString() : `${weight} kg`;
  };

  // Format value to ensure consistent currency display
  const formatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return `GHS ${value.toFixed(2)}`;
    }
    return value.toString().includes('GHS') ? value.toString() : `GHS ${value}`;
  };

  // Get status color for visual indication
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // Yellow
      case 'processing':
        return '#3b82f6'; // red
      case 'shipped':
        return '#8b5cf6'; // Purple
      case 'delivered':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  // Base styles for the print template
  const baseStyles: React.CSSProperties = {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    padding: 32,
    color: '#222',
    maxWidth: 700,
    margin: '0 auto',
    backgroundColor: '#fff',
    lineHeight: 1.5,
    ...customStyles
  };

  return (
    <div style={baseStyles}>
      {/* Company Header Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 32,
        borderBottom: `3px solid ${COMPANY_DETAILS.primaryColor}`,
        paddingBottom: 16
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            color: COMPANY_DETAILS.primaryColor, 
            fontWeight: 700, 
            fontSize: 32,
            letterSpacing: '-0.5px'
          }}>
            {COMPANY_DETAILS.name}
          </h1>
          <div style={{ fontSize: 16, color: '#555', marginTop: 8 }}>
            {COMPANY_DETAILS.address}
          </div>
          <div style={{ fontSize: 16, color: '#555', marginTop: 4 }}>
            Tel: {COMPANY_DETAILS.phone} | Email: {COMPANY_DETAILS.email}
          </div>
          <div style={{ fontSize: 16, color: '#555', marginTop: 4 }}>
            {COMPANY_DETAILS.website}
          </div>
        </div>
        
        {/* Barcode in header for easy scanning */}
        <div style={{ textAlign: 'center', marginLeft: 24 }}>
          <img 
            src={packageInfo.barcodeImage} 
            alt={`Barcode for package ${packageInfo.packageId}`}
            style={{ 
              width: 160, 
              height: 45, 
              objectFit: 'contain',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              padding: 4,
              backgroundColor: '#fff'
            }} 
          />
          <div style={{ 
            fontSize: 12, 
            color: '#6b7280', 
            marginTop: 4,
            fontFamily: 'monospace'
          }}>
            {packageInfo.barcode}
          </div>
        </div>
      </div>

      {/* Title and Date Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h2 style={{ 
          color: COMPANY_DETAILS.secondaryColor, 
          fontWeight: 600, 
          fontSize: 24, 
          margin: 0
        }}>
          {title}
        </h2>
        <div style={{ 
          fontSize: 14, 
          color: '#6b7280',
          textAlign: 'right'
        }}>
          <div>Printed: {new Date().toLocaleDateString()}</div>
          <div>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Package Information Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 32, 
        marginBottom: 32,
        backgroundColor: '#f8fafc',
        padding: 24,
        borderRadius: 8,
        border: '1px solid #e2e8f0'
      }}>
        {/* Left Column - Package Details */}
        <div>
          <h3 style={{ 
            color: COMPANY_DETAILS.secondaryColor, 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 16,
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: 8
          }}>
            Package Information
          </h3>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Request ID:</div>
            <div style={{ fontFamily: 'monospace', fontSize: 16 }}>{packageInfo.requestId}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Package ID:</div>
            <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}>{packageInfo.packageId}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Weight:</div>
            <div>{formatWeight(packageInfo.weight)}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Dimensions:</div>
            <div>{packageInfo.dimensions}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Type:</div>
            <div>{packageInfo.type}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Value:</div>
            <div style={{ fontWeight: 600, color: '#059669' }}>{formatValue(packageInfo.value)}</div>
          </div>
        </div>

        {/* Right Column - Client & Shipping Details */}
        <div>
          <h3 style={{ 
            color: COMPANY_DETAILS.secondaryColor, 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 16,
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: 8
          }}>
            Client & Shipping
          </h3>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Client:</div>
            <div style={{ fontWeight: 600 }}>{packageInfo.client}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Destination:</div>
            <div>{packageInfo.destination}</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Submitted:</div>
            <div>{packageInfo.submitted}</div>
          </div>
          
          {packageInfo.submittedTime && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Time:</div>
              <div>{packageInfo.submittedTime}</div>
            </div>
          )}
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Description:</div>
            <div>{packageInfo.description}</div>
          </div>
          
          {packageInfo.status && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>Status:</div>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: getStatusColor(packageInfo.status),
                textTransform: 'capitalize'
              }}>
                {packageInfo.status}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Information Section */}
      {showTrackingInfo && (
        <div style={{ 
          marginTop: 32,
          backgroundColor: '#f0f6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <h4 style={{ 
            color: '#1e40af', 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 12,
            margin: 0
          }}>
            📦 Package Tracking Information
          </h4>
          <p style={{ 
            fontSize: 14, 
            color: '#1e40af', 
            margin: '12px 0',
            lineHeight: 1.6
          }}>
            <strong>Barcode:</strong> {packageInfo.barcode}
          </p>
          <p style={{ 
            fontSize: 14, 
            color: '#1e40af', 
            margin: '12px 0',
            lineHeight: 1.6
          }}>
            <strong>Tracking URL:</strong>{' '}
            <a 
              href={`https://www.vanguardcargo.org/app/tracl/${packageInfo.packageId}`}
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#1d4ed8', 
                textDecoration: 'underline',
                wordBreak: 'break-all'
              }}
            >
              https://www.vanguardcargo.org/app/tracl/{packageInfo.packageId}
            </a>
          </p>
          <p style={{ 
            fontSize: 12, 
            color: '#374151', 
            margin: '16px 0 0 0',
            fontStyle: 'italic'
          }}>
            💡 <strong>Tip:</strong> Scan the barcode above or visit the tracking URL to view real-time package status and location updates.
          </p>
        </div>
      )}

      {/* Footer Section */}
      <div style={{ 
        marginTop: 48, 
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ 
          color: '#6b7280', 
          fontSize: 14,
          marginBottom: 8
        }}>
          Thank you for choosing <strong>{COMPANY_DETAILS.name}</strong> for your cargo needs.
        </div>
        <div style={{ 
          color: '#9ca3af', 
          fontSize: 12
        }}>
          For support, contact us at {COMPANY_DETAILS.phone} or {COMPANY_DETAILS.email}
        </div>
      </div>
    </div>
  );
};

/**
 * Utility function to generate print-ready HTML from package information
 * 
 * @param packageInfo - Package information to print
 * @param options - Optional configuration for the print template
 * @returns HTML string ready for printing
 */
export const generatePrintHTML = (
  packageInfo: PrintablePackageInfo,
  options: {
    title?: string;
    showTrackingInfo?: boolean;
    customStyles?: React.CSSProperties;
  } = {}
): string => {
  // Generate the React component as HTML string
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <PackagePrintTemplate 
      packageInfo={packageInfo}
      title={options.title}
      showTrackingInfo={options.showTrackingInfo}
      customStyles={options.customStyles}
    />
  );

  // Return complete HTML document with print styles
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Package Details - ${packageInfo.packageId}</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #fff;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;
};

/**
 * Utility function to open a print dialog with the package template
 * 
 * @param packageInfo - Package information to print
 * @param options - Optional configuration for the print template
 */
export const printPackageTicket = (
  packageInfo: PrintablePackageInfo,
  options: {
    title?: string;
    showTrackingInfo?: boolean;
    customStyles?: React.CSSProperties;
  } = {}
): void => {
  // Generate the complete HTML for printing
  const printHTML = generatePrintHTML(packageInfo, options);
  
  // Open a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    // Write the HTML content to the new window
    printWindow.document.write(printHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Optionally close the window after printing
      // printWindow.close();
    };
  } else {
    // Fallback if popup is blocked
    console.error('Unable to open print window. Please check popup blocker settings.');
    alert('Unable to open print window. Please check your popup blocker settings and try again.');
  }
};

/**
 * Utility function to download the package template as PDF (requires additional setup)
 * This is a placeholder for future PDF generation functionality
 * 
 * @param packageInfo - Package information to convert to PDF
 * @param filename - Optional filename for the download (currently unused, reserved for future implementation)
 */
export const downloadPackageTicketPDF = (
  packageInfo: PrintablePackageInfo,
  filename?: string
): void => {
  // This would require a PDF generation library like jsPDF or Puppeteer
  // For now, we'll use the print functionality as a fallback
  // The filename parameter is reserved for future PDF implementation
  printPackageTicket(packageInfo, { title: 'Package Ticket' });
};

export default PackagePrintTemplate;
