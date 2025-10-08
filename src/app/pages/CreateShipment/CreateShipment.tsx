import React, { useState, useEffect } from 'react';
import { FiPackage, FiMapPin, FiLoader, FiAlertCircle, FiFileText, FiSend } from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { supabase } from '../../../lib/supabase';
import { warehouseDocumentService } from '../../../services/warehouseDocumentService';
import WaybillViewer from '../../../components/warehouse/WaybillViewer';
import ReceiptViewer from '../../../components/warehouse/ReceiptViewer';
import ConsolidatedShipmentView from '../../../components/warehouse/ConsolidatedShipmentView';
import logo from '../../../assets/image.png';

/**
 * Package interface for received packages ready for shipment
 */
interface ProcessingPackage {
  id: string;
  package_id: string;
  tracking_number: string;
  user_id: string;
  description: string;
  weight: number;
  store_name: string;
  vendor_name: string;
  user_name: string;
  suite_number: string;
  intake_date: string;
}

/**
 * CreateShipment Component
 * 
 * This component allows warehouse staff to create shipments from packages with 'received' status.
 * It fetches available packages, allows selection, and creates consolidated shipments.
 * 
 * @returns {React.ReactElement} The CreateShipment component
 */
const CreateShipment: React.FC = () => {
  // Authentication and state management
  const { isAuthenticated, userId } = useWarehouseAuth();
  const [receivedPackages, setReceivedPackages] = useState<ProcessingPackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Created shipment details
  const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(null);
  const [createdTrackingNumber, setCreatedTrackingNumber] = useState<string>('');
  const [createdPackageCount, setCreatedPackageCount] = useState<number>(0);

  // Modal states
  const [showReceipt, setShowReceipt] = useState(false);
  const [showWaybill, setShowWaybill] = useState(false);
  const [showShipmentView, setShowShipmentView] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Form state for shipment details
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryCountry: '',
    serviceType: 'standard' as 'standard' | 'express' | 'overnight'
  });

  /**
   * Fetch packages with 'received' status on component mount
   */
  useEffect(() => {
    fetchReceivedPackages();
  }, []);

  /**
   * Fetch all packages with 'received' status from the database
   */
  const fetchReceivedPackages = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Call the get_processing_packages function to bypass RLS (temporarily using existing function)
      const { data, error } = await supabase.rpc('get_processing_packages');

      if (error) {
        throw error;
      }

      // Data is already in the correct format from the function
      const transformedPackages: ProcessingPackage[] = data || [];

      setReceivedPackages(transformedPackages);
    } catch (err: any) {
      console.error('Error fetching received packages:', err);
      setError('Failed to load received packages: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle package selection/deselection
   */
  const handlePackageSelection = (packageId: string) => {
    const newSelection = new Set(selectedPackages);
    if (newSelection.has(packageId)) {
      newSelection.delete(packageId);
    } else {
      newSelection.add(packageId);
    }
    setSelectedPackages(newSelection);
  };

  /**
   * Handle select all packages toggle
   */
  const handleSelectAll = () => {
    if (selectedPackages.size === receivedPackages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(receivedPackages.map((pkg: ProcessingPackage) => pkg.id)));
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle shipment creation form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !userId) {
      setError('User authentication required');
      return;
    }

    if (selectedPackages.size === 0) {
      setError('Please select at least one package for shipment');
      return;
    }

    if (!formData.recipientName || !formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryCountry) {
      setError('Please fill in all required delivery information');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Convert selected package IDs to array
      const packageIds = Array.from(selectedPackages);
      
      // Call the create_shipment_from_packages function
      const { data, error } = await supabase.rpc('create_shipment_from_packages', {
        p_package_ids: packageIds,
        p_warehouse_staff_id: userId,
        p_recipient_name: formData.recipientName,
        p_recipient_phone: formData.recipientPhone || null,
        p_delivery_address: formData.deliveryAddress,
        p_delivery_city: formData.deliveryCity,
        p_delivery_country: formData.deliveryCountry,
        p_service_type: formData.serviceType
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to create shipment');
      }

      // Success - store shipment details
      setSuccess(`Shipment created successfully! Tracking number: ${data.tracking_number}`);
      setCreatedShipmentId(data.shipment_id);
      setCreatedTrackingNumber(data.tracking_number);
      setCreatedPackageCount(selectedPackages.size);
      
      // Generate individual package receipts first, then shipment receipt
      try {
        setIsGeneratingReceipt(true);
        
        // Step 1: Generate receipt for each package (using UUID, not package_id string)
        const selectedPackageIds = Array.from(selectedPackages);
        await Promise.all(
          selectedPackageIds.map(async (packageUuid) => {
            try {
              await warehouseDocumentService.generatePackageIntakeReceipt(packageUuid, userId);
            } catch (pkgError) {
              console.error(`Failed to generate receipt for package ${packageUuid}:`, pkgError);
            }
          })
        );
        
        // Step 2: Generate shipment receipt
        const generatedReceipt = await warehouseDocumentService.generateShipmentReceipt(
          data.shipment_id,
          userId
        );
        setReceipt(generatedReceipt);
        
        // Auto-show receipt after 1.5 seconds
        setTimeout(() => {
          setShowReceipt(true);
        }, 1500);
      } catch (receiptError) {
        console.error('Failed to generate receipt:', receiptError);
        // Continue anyway, receipt generation is optional
      } finally {
        setIsGeneratingReceipt(false);
      }

      // Reset form
      setSelectedPackages(new Set());
      setFormData({
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryCountry: '',
        serviceType: 'standard'
      });

      // Refresh the packages list
      fetchReceivedPackages();

    } catch (err: any) {
      console.error('Error creating shipment:', err);
      setError('Failed to create shipment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Create Shipment
              </h1>
              <p className="mt-2 text-base sm:text-lg text-red-100">
                Consolidate packages and create professional shipments
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-lg shadow-red-100/50 animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <FiAlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message with Actions */}
        {success && createdShipmentId && (
          <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 shadow-xl shadow-green-200/50 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <img src={logo} alt="Vanguard Cargo LLC" className="h-16 w-16 object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  VANGUARD CARGO LLC
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-base sm:text-lg text-green-800 font-bold">
                    ✅ Shipment Created Successfully!
                  </p>
                </div>
                <div className="mt-3 p-3 bg-white/60 rounded-xl border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-xl text-gray-900">
                    {createdTrackingNumber}
                  </p>
                </div>
                <p className="text-sm text-green-700 mt-2 font-medium">
                  📦 {createdPackageCount} packages consolidated
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setShowShipmentView(true)}
                disabled={isGeneratingReceipt}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-5 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-sm font-bold disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
              >
                <FiSend className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => setShowWaybill(true)}
                disabled={isGeneratingReceipt}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-5 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-sm font-bold disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
              >
                <FiFileText className="w-4 h-4" />
                Waybill
              </button>
              <button
                onClick={() => setShowReceipt(true)}
                disabled={!receipt || isGeneratingReceipt}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 text-sm font-bold disabled:from-gray-400 disabled:to-gray-400 disabled:shadow-none"
              >
                {isGeneratingReceipt ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FiFileText />
                    Receipt
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSuccess('');
                  setCreatedShipmentId(null);
                  setCreatedTrackingNumber('');
                  setCreatedPackageCount(0);
                  setReceipt(null);
                }}
                className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 py-3 px-5 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Package Selection Section */}
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <FiPackage className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Available Packages</div>
                    <div className="text-sm font-normal text-gray-600">{receivedPackages.length} ready to ship</div>
                  </div>
                </h2>
              </div>
              {receivedPackages.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                >
                  {selectedPackages.size === receivedPackages.length ? '✓ Deselect All' : '☐ Select All'}
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="animate-spin h-6 w-6 text-red-600 mr-2" />
                  <span className="text-gray-600">Loading packages...</span>
                </div>
              ) : receivedPackages.length === 0 ? (
                <div className="text-center py-8">
                  <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No packages with 'received' status found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Packages need to be marked as 'received' before they can be shipped
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {receivedPackages.map((pkg: ProcessingPackage) => (
                    <div
                      key={pkg.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        selectedPackages.has(pkg.id)
                          ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-lg shadow-red-200/50 scale-[1.02]'
                          : 'border-gray-200 hover:border-red-300 hover:shadow-md bg-white'
                      }`}
                      onClick={() => handlePackageSelection(pkg.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedPackages.has(pkg.id)
                                ? 'bg-red-600 border-red-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedPackages.has(pkg.id) && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-base">{pkg.package_id}</h4>
                              <p className="text-sm text-gray-600 font-medium">{pkg.user_name} • {pkg.suite_number}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Description:</span>
                              <span className="text-gray-900">{pkg.description}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Weight:</span>
                              <span className="text-gray-900 font-semibold">{pkg.weight ? `${pkg.weight} kg` : 'Not specified'}</span>
                            </div>
                            {pkg.store_name && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-medium min-w-[80px]">Store:</span>
                                <span className="text-gray-900">{pkg.store_name}</span>
                              </div>
                            )}
                            {pkg.vendor_name && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-medium min-w-[80px]">Vendor:</span>
                                <span className="text-gray-900">{pkg.vendor_name}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 font-medium min-w-[80px]">Intake Date:</span>
                              <span className="text-gray-900">{new Date(pkg.intake_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Shipment Details Form */}
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-white border-b-2 border-green-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <FiMapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-gray-900">Shipment Details</div>
                  <div className="text-sm font-normal text-gray-600">Enter delivery information</div>
                </div>
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Recipient Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Recipient Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      id="recipientName"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter recipient's full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="recipientPhone" className="block text-sm font-medium text-gray-700">
                      Recipient Phone
                    </label>
                    <input
                      type="tel"
                      id="recipientPhone"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Address</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700">
                      Street Address *
                    </label>
                    <textarea
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter complete delivery address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="deliveryCity" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        id="deliveryCity"
                        name="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deliveryCountry" className="block text-sm font-medium text-gray-700">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="deliveryCountry"
                        name="deliveryCountry"
                        value={formData.deliveryCountry}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Shipping Options</h3>
                <div>
                  <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                    Service Type
                  </label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="standard">Standard (5-7 business days)</option>
                    <option value="express">Express (3-5 business days)</option>
                    <option value="overnight">Overnight (1-2 business days)</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    📅 Estimated delivery will be calculated automatically based on service type
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t-2 border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedPackages.size === 0}
                  className={`w-full flex justify-center items-center py-4 px-6 border-0 rounded-2xl shadow-lg text-base font-bold text-white transition-all duration-300 ${
                    isSubmitting || selectedPackages.size === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/30 hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin mr-3 h-6 w-6" />
                      Creating Shipment...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-3 h-5 w-5" />
                      Create Shipment ({selectedPackages.size} {selectedPackages.size === 1 ? 'package' : 'packages'})
                    </>
                  )}
                </button>
                {selectedPackages.size === 0 && (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Please select at least one package to create a shipment
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Waybill Viewer Modal */}
      {showWaybill && createdShipmentId && (
        <WaybillViewer
          shipmentId={createdShipmentId}
          onClose={() => setShowWaybill(false)}
          autoGenerate={true}
        />
      )}

      {/* Receipt Viewer Modal */}
      {showReceipt && receipt && (
        <ReceiptViewer
          receipt={receipt}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Consolidated Shipment View Modal */}
      {showShipmentView && createdShipmentId && (
        <ConsolidatedShipmentView
          shipmentId={createdShipmentId}
          onClose={() => setShowShipmentView(false)}
        />
      )}
    </div>
  );
};

export default CreateShipment;
