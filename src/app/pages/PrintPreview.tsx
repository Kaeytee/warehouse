/**
 * Print Preview Page
 * 
 * Standalone page to preview all printout templates without logging in
 * Shows waybills, receipts with sample data
 * 
 * Access at: /print-preview
 */

import React, { useState } from 'react';
import { LOGO, COMPANY_INFO, COMPANY_ADDRESS_SINGLE_LINE, COMPANY_PHONES_SHORT, DOCUMENT_SETTINGS } from '../../config/branding';

const PrintPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waybill' | 'receipt'>('waybill');

  // Sample waybill data
  const sampleWaybill = {
    waybill_number: 'WB-2025-001234',
    generated_at: new Date().toISOString(),
    shipment_details: {
      tracking_number: 'VC-SHP-20250102-001',
      service_type: 'express',
      status: 'in_transit',
      total_weight: 15.5,
      created_at: new Date().toISOString(),
    },
    packages: [
      { package_id: 'PKG-001', description: 'Electronics', weight: 5.5 },
      { package_id: 'PKG-002', description: 'Clothing', weight: 10.0 },
    ],
    receiver: {
      name: 'John Doe',
      phone: '+233 24 123 4567',
      address: '123 Main Street',
      city: 'Accra',
      country: 'Ghana',
    },
  };

  // Sample receipt data
  const sampleReceipt = {
    receipt_number: 'RCP-2025-001234',
    generated_at: new Date().toISOString(),
    customer_details: {
      name: 'Jane Smith',
      suite_number: 'VC-12345',
      email: 'jane.smith@example.com',
    },
    package_details: {
      package_id: 'PKG-001',
      tracking_number: 'VC-PKG-20250102-001',
      description: 'Electronics',
      weight: 5.5,
      store_name: 'Amazon',
    },
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Print Preview</h1>
              <p className="text-gray-600 mt-2">Preview all printout templates with sample data</p>
            </div>
            <img src={LOGO} alt={COMPANY_INFO.name} className="h-16 w-16 object-contain" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b">
            <button
              onClick={() => setActiveTab('waybill')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'waybill'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Waybill
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'receipt'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Receipt
            </button>
          </div>

          {/* Print Button */}
          <div className="mt-4">
            <button
              onClick={handlePrint}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
            >
              Print Preview
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {activeTab === 'waybill' && (
            <div className="waybill-preview">
              {/* Waybill Header */}
              <div className="border-b-3 border-red-600 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <img src={LOGO} alt={COMPANY_INFO.name} className="h-16 w-auto mb-2" />
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-red-600">{COMPANY_INFO.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{COMPANY_ADDRESS_SINGLE_LINE}</p>
                  <p className="text-sm text-gray-600">Email: {COMPANY_INFO.email}</p>
                  <p className="text-sm text-gray-600">{COMPANY_PHONES_SHORT}</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">SHIPPING WAYBILL</h2>
                <p className="text-gray-600 mt-2">Waybill #: {sampleWaybill.waybill_number}</p>
                <p className="text-gray-600">Tracking: {sampleWaybill.shipment_details.tracking_number}</p>
              </div>

              {/* Shipment Details */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg text-red-600 mb-3">Shipment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 font-medium">Service Type:</span>
                    <span className="ml-2 capitalize">{sampleWaybill.shipment_details.service_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Total Weight:</span>
                    <span className="ml-2">{sampleWaybill.shipment_details.total_weight} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Shipment Date:</span>
                    <span className="ml-2">{new Date(sampleWaybill.shipment_details.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Est. Delivery:</span>
                    <span className="ml-2">{new Date(new Date(sampleWaybill.shipment_details.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Receiver Information */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg text-red-600 mb-3">Receiver Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span>{sampleWaybill.receiver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span>{sampleWaybill.receiver.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Address:</span>
                    <span>{sampleWaybill.receiver.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">City:</span>
                    <span>{sampleWaybill.receiver.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Country:</span>
                    <span>{sampleWaybill.receiver.country}</span>
                  </div>
                </div>
              </div>

              {/* Page Break Indicator - Only visible on screen, not in print */}
              <div className="my-8 text-center no-print">
                <div className="inline-block bg-gray-200 px-6 py-2 rounded-full text-sm text-gray-600 font-medium">
                  📄 Page Break - Package list prints on separate page
                </div>
              </div>
              
              {/* Actual page break for printing */}
              <div className="page-break-print"></div>

              {/* Package List */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg text-red-600 mb-3">Package Manifest ({sampleWaybill.packages.length} items)</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Package ID</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleWaybill.packages.map((pkg, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{pkg.package_id}</td>
                        <td className="border border-gray-300 px-4 py-2">{pkg.description}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{pkg.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t-2 border-red-600 text-gray-600 text-sm">
                <p className="mb-2">Generated on {new Date(sampleWaybill.generated_at).toLocaleString()}</p>
                <p>{DOCUMENT_SETTINGS.copyrightText}</p>
                <p className="mt-2 text-xs">This is an official shipping document. Handle with care.</p>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="receipt-preview">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-red-600 pb-4 mb-6">
                <img src={LOGO} alt={`${COMPANY_INFO.name} Logo`} className="h-20 w-auto mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-600">{COMPANY_INFO.name}</h1>
                <p className="text-sm text-gray-600 mt-2">{COMPANY_ADDRESS_SINGLE_LINE}</p>
                <p className="text-sm text-gray-600">Email: {COMPANY_INFO.supportEmail}</p>
                <p className="text-sm text-gray-600">{COMPANY_PHONES_SHORT}</p>
                
                <div className="bg-gray-100 rounded-lg p-4 mt-4 inline-block">
                  <h2 className="text-lg font-bold">Package Intake Receipt</h2>
                  <p className="text-gray-600">Receipt: {sampleReceipt.receipt_number}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Generated: {new Date(sampleReceipt.generated_at).toLocaleString()}
                </p>
              </div>

              {/* Customer Information */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span>{sampleReceipt.customer_details.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Suite Number:</span>
                    <span className="font-mono">{sampleReceipt.customer_details.suite_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span>{sampleReceipt.customer_details.email}</span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg text-gray-800 mb-3">Package Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Package ID:</span>
                    <span className="font-mono">{sampleReceipt.package_details.package_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Tracking Number:</span>
                    <span className="font-mono">{sampleReceipt.package_details.tracking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Description:</span>
                    <span>{sampleReceipt.package_details.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Weight:</span>
                    <span>{sampleReceipt.package_details.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Store Name:</span>
                    <span>{sampleReceipt.package_details.store_name}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t-2 border-red-600 text-gray-600 text-sm">
                <p className="font-bold mb-2">Thank you for choosing {COMPANY_INFO.name}!</p>
                <p className="text-xs">This is an official receipt. Please keep for your records.</p>
                <p className="text-xs mt-4">{DOCUMENT_SETTINGS.copyrightText}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        .page-break-print {
          display: none;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          .page-break-print {
            display: block;
            page-break-before: always;
            height: 0;
          }
          body {
            background: white;
          }
          .bg-gray-100 {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPreview;
