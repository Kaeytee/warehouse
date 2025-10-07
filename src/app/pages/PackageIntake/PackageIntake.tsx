import React, { useState, useEffect } from 'react';
import { FiPackage, FiUser, FiFileText, FiSave, FiSearch, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { supabase } from '../../../lib/supabase';

/**
 * Package Intake System Component
 * 
 * Main package intake interface for warehouse staff to log incoming packages.
 * Provides suite number lookup, customer verification, and package registration.
 * Matches the /intake route for better maintainability.
 * 
 * @returns {React.ReactElement} The Package Intake component
 */
interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  suite_number: string;
  email: string;
  status: string;
  phone_number?: string;
  whatsapp_number?: string;
  street_address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

interface PackageFormData {
  suiteNumber: string;
  description: string;
  weight: string;
  storeName: string;
  vendorName: string;
  notes: string;
}

const PackageIntake: React.FC = () => {
  const { isAuthenticated, userId } = useWarehouseAuth();
  
  // Form state
  const [formData, setFormData] = useState<PackageFormData>({
    suiteNumber: '',
    description: '',
    weight: '',
    storeName: '',
    vendorName: '',
    notes: ''
  });

  // User lookup state
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [createdPackage, setCreatedPackage] = useState<any>(null);

  /**
   * Search for user by suite number
   */
  const searchUserBySuite = async (suiteNumber: string) => {
    if (!suiteNumber.trim()) {
      setUserDetails(null);
      setUserNotFound(false);
      return;
    }

    setIsSearchingUser(true);
    setUserNotFound(false);
    setUserDetails(null);

    const searchSuite = suiteNumber.trim().toUpperCase();
    console.log('Searching for suite number:', searchSuite);
    console.log('Original input:', suiteNumber);

    try {
      console.log('Starting user search for suite:', suiteNumber);
      
      // Use ilike for case-insensitive search - this will match regardless of case
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('suite_number', suiteNumber.trim());

      console.log('Search results with ilike:', { users, error, searchTerm: suiteNumber.trim() });

      if (error) {
        console.error('Database error:', error);
        setUserNotFound(true);
        setUserDetails(null);
        return;
      }

      if (!users || users.length === 0) {
        console.log('No user found with suite number:', suiteNumber.trim());
        setUserNotFound(true);
        setUserDetails(null);
        return;
      }

      // Found user
      const foundUser = users[0];
      console.log('User found:', foundUser);
      setUserDetails(foundUser);
      setUserNotFound(false);
    } catch (err) {
      console.error('Error searching user:', err);
      setUserNotFound(true);
      setUserDetails(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  /**
   * Handle suite number input change with debounced search
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.suiteNumber) {
        searchUserBySuite(formData.suiteNumber);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.suiteNumber]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof PackageFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear user details if suite number changes
    if (field === 'suiteNumber') {
      setUserDetails(null);
      setUserNotFound(false);
    }
  };

  /**
   * Submit package intake form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userDetails) {
      setSubmitError('Please enter a valid suite number');
      return;
    }

    if (!isAuthenticated || !userId) {
      setSubmitError('User authentication required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Call the warehouse_package_intake function
      const { data, error } = await supabase.rpc('warehouse_package_intake', {
        p_user_suite_number: formData.suiteNumber.trim().toUpperCase(),
        p_description: formData.description.trim(),
        p_warehouse_staff_id: userId,
        p_weight: formData.weight ? parseFloat(formData.weight) : null,
        p_declared_value: null,
        p_store_name: formData.storeName.trim() || null,
        p_vendor_name: formData.vendorName.trim() || null,
        p_notes: formData.notes.trim() || null
      });

      if (error) {
        throw error;
      }

      console.log('Response data:', data);

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to process package intake');
      }

      // Success
      setCreatedPackage(data);
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        suiteNumber: '',
        description: '',
        weight: '',
        storeName: '',
        vendorName: '',
        notes: ''
      });
      setUserDetails(null);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        setCreatedPackage(null);
      }, 5000);

    } catch (err: any) {
      console.error('Error submitting package:', err);
      setSubmitError(err.message || 'Failed to process package intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Package Intake</h1>
        <p className="text-gray-600">Scan and log packages into warehouse inventory</p>
      </div>

      {/* Success Message */}
      {submitSuccess && createdPackage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiCheck className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Package Successfully Logged</h3>
              <p className="text-sm text-green-700 mt-1">
                Package ID: <span className="font-mono font-semibold">{createdPackage.package_id}</span> | 
                Tracking: <span className="font-mono font-semibold">{createdPackage.tracking_number}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Suite Number Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiUser className="mr-2 text-red-600" />
            Client Information
          </h2>
          
          <div className="space-y-4">
            {/* Suite Number Input */}
            <div>
              <label htmlFor="suiteNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Suite Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="suiteNumber"
                  value={formData.suiteNumber}
                  onChange={(e) => handleInputChange('suiteNumber', e.target.value.toUpperCase())}
                  placeholder="Enter suite number (e.g., VC-001, S001, A123)"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  required
                />
                {isSearchingUser && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  </div>
                )}
              </div>
              
              {/* User Search Results */}
              {userNotFound && formData.suiteNumber && (
                <div className="mt-2 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1 h-4 w-4" />
                  No user found with suite number "{formData.suiteNumber}"
                </div>
              )}
              
              {userDetails && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800 mb-2">
                    <FiCheck className="mr-2 h-4 w-4" />
                    <span className="font-semibold">User Found</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p><span className="font-medium">Name:</span> {userDetails.first_name} {userDetails.last_name}</p>
                        <p><span className="font-medium">Suite:</span> {userDetails.suite_number}</p>
                        <p><span className="font-medium">Email:</span> {userDetails.email}</p>
                        <p><span className="font-medium">Status:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                            userDetails.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userDetails.status}
                          </span>
                        </p>
                        {userDetails.phone_number && (
                          <p><span className="font-medium">Phone:</span> {userDetails.phone_number}</p>
                        )}
                        {userDetails.whatsapp_number && (
                          <p><span className="font-medium">WhatsApp:</span> {userDetails.whatsapp_number}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-green-800 mb-1">Shipping Address:</p>
                        {userDetails.street_address ? (
                          <div className="text-green-700 bg-green-100 p-2 rounded border">
                            <p>{userDetails.street_address}</p>
                            {userDetails.city && userDetails.country && (
                              <p>{userDetails.city}, {userDetails.country}</p>
                            )}
                            {userDetails.postal_code && (
                              <p>{userDetails.postal_code}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-amber-700 bg-amber-100 p-2 rounded border">
                            <p className="text-xs">⚠️ No shipping address on file</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instruction message when user is not confirmed */}
        {!userDetails && formData.suiteNumber && !isSearchingUser && !userNotFound && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiSearch className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Searching for User</h3>
                <p className="text-sm text-red-700 mt-1">Please wait while we verify the suite number...</p>
              </div>
            </div>
          </div>
        )}

        {/* Instruction message when no suite number entered */}
        {!userDetails && !formData.suiteNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Log a Package</h3>
              <p className="text-gray-600">Enter a valid suite number above to begin logging package details.</p>
            </div>
          </div>
        )}

        {/* Package Details Section - Only show when user is confirmed */}
        {userDetails && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiPackage className="mr-2 text-red-600" />
              Package Details
            </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Package Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="e.g., Electronics, Clothing, Documents"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                required
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <div className="relative">
                <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  id="weight"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>


            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                Store/Retailer Name
              </label>
              <input
                type="text"
                id="storeName"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                placeholder="e.g., Amazon, Best Buy"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            {/* Vendor Name */}
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor/Brand Name
              </label>
              <input
                type="text"
                id="vendorName"
                value={formData.vendorName}
                onChange={(e) => handleInputChange('vendorName', e.target.value)}
                placeholder="e.g., Apple, Nike"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special handling instructions or additional information..."
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Submit Button - Only show when user is confirmed */}
        {userDetails && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!userDetails || isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 h-4 w-4" />
                  Log Package
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PackageIntake;
