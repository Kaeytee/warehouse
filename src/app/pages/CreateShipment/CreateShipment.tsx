import React, { useState, useEffect } from 'react';
import { FiPackage, FiMapPin, FiCalendar, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { supabase } from '../../../lib/supabase';

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

  // Form state for shipment details
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryCountry: '',
    serviceType: 'standard' as 'standard' | 'express' | 'overnight',
    estimatedDelivery: ''
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

      // Success - show confirmation and reset form
      setSuccess(`Shipment created successfully! Tracking number: ${data.tracking_number}`);
      setSelectedPackages(new Set());
      setFormData({
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryCountry: '',
        serviceType: 'standard',
        estimatedDelivery: ''
      });

      // Refresh the packages list
      fetchReceivedPackages();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      console.error('Error creating shipment:', err);
      setError('Failed to create shipment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FiPackage className="mr-3 text-blue-600" />
            Create Shipment
          </h1>
          <p className="mt-2 text-gray-600">
            Select packages with 'processing' status to create consolidated shipments
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <FiCheck className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
              <div className="text-green-700">{success}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Package Selection Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FiPackage className="mr-2 text-blue-600" />
                Available Packages ({receivedPackages.length})
              </h2>
              {receivedPackages.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedPackages.size === receivedPackages.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="animate-spin h-6 w-6 text-blue-600 mr-2" />
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {receivedPackages.map((pkg: ProcessingPackage) => (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPackages.has(pkg.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePackageSelection(pkg.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPackages.has(pkg.id)}
                              onChange={() => handlePackageSelection(pkg.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{pkg.package_id}</h4>
                              <p className="text-sm text-gray-600">{pkg.user_name} - {pkg.suite_number}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Description:</strong> {pkg.description}</p>
                            <p><strong>Weight:</strong> {pkg.weight ? `${pkg.weight} kg` : 'Not specified'}</p>
                            {pkg.store_name && <p><strong>Store:</strong> {pkg.store_name}</p>}
                            {pkg.vendor_name && <p><strong>Vendor:</strong> {pkg.vendor_name}</p>}
                            <p><strong>Intake Date:</strong> {new Date(pkg.intake_date).toLocaleDateString()}</p>
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FiMapPin className="mr-2 text-green-600" />
                Shipment Details
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Shipping Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                      Service Type
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="express">Express</option>
                      <option value="overnight">Overnight</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-700">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      id="estimatedDelivery"
                      name="estimatedDelivery"
                      value={formData.estimatedDelivery}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedPackages.size === 0}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting || selectedPackages.size === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Creating Shipment...
                    </>
                  ) : (
                    <>
                      <FiCalendar className="-ml-1 mr-3 h-5 w-5" />
                      Create Shipment ({selectedPackages.size} packages)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;
