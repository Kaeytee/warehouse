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

    try {
      
      // Use ilike for case-insensitive search - this will match regardless of case
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('suite_number', suiteNumber.trim());

      if (error) {
        setUserNotFound(true);
        setUserDetails(null);
        return;
      }

      if (!users || users.length === 0) {
        setUserNotFound(true);
        setUserDetails(null);
        return;
      }

      // Found user
      const foundUser = users[0];
      setUserDetails(foundUser);
      setUserNotFound(false);
    } catch (err) {
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
      // Call basic package intake function (codes generated later on shipment arrival)
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
      setSubmitError(err.message || 'Failed to process package intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Package Intake
              </h1>
              <p className="mt-2 text-base sm:text-lg text-red-100">
               Scan and log packages into warehouse inventory
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Success Message */}
      {submitSuccess && createdPackage && (
        <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 shadow-xl shadow-green-200/50 animate-in slide-in-from-top duration-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FiCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-2"> Package Successfully Logged!</h3>
              <div className="space-y-2">
                <div className="p-3 bg-white/60 rounded-xl border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Package ID</p>
                  <p className="font-mono font-bold text-base text-gray-900">{createdPackage.package_id}</p>
                </div>
                <div className="p-3 bg-white/60 rounded-xl border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-base text-gray-900">{createdPackage.tracking_number}</p>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-3 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Pickup code will be auto-generated when shipment arrives
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-lg shadow-red-100/50 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <FiAlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">❌ Error</h4>
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Suite Number Section */}
        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-b-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FiUser className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-900">Client Information</div>
                <div className="text-sm font-normal text-gray-600">Verify customer suite number</div>
              </div>
            </h2>
          </div>
          
          <div className="p-6">
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
                <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md">
                  <div className="flex items-center text-green-800 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-2">
                      <FiCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="font-bold text-lg"> User Verified</span>
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
        </div>

        {/* Instruction message when user is not confirmed */}
        {!userDetails && formData.suiteNumber && !isSearchingUser && !userNotFound && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-xl animate-pulse">
                <FiSearch className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-900">🔍 Searching for User</h3>
                <p className="text-sm text-blue-700 mt-1">Please wait while we verify the suite number...</p>
              </div>
            </div>
          </div>
        )}

        {/* Instruction message when no suite number entered */}
        {!userDetails && !formData.suiteNumber && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8 shadow-md">
            <div className="text-center">
              <div className="inline-flex p-4 bg-gray-200 rounded-2xl mb-4">
                <FiPackage className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Ready to Log a Package</h3>
              <p className="text-gray-600">Enter a valid suite number above to begin logging package details.</p>
            </div>
          </div>
        )}

        {/* Package Details Section - Only show when user is confirmed */}
        {userDetails && (
          <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <FiPackage className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="text-gray-900">Package Details</div>
                  <div className="text-sm font-normal text-gray-600">Enter package information</div>
                </div>
              </h2>
            </div>
            
            <div className="p-6">
          
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
          </div>
        )}

        {/* Submit Button - Only show when user is confirmed */}
        {userDetails && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!userDetails || isSubmitting}
              className="inline-flex items-center px-8 py-4 border-0 text-base font-bold rounded-2xl shadow-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-red-500/30 hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiSave className="mr-3 h-5 w-5" />
                  📦 Log Package
                </>
              )}
            </button>
          </div>
        )}
      </form>
      </div>
    </div>
  );
};

export default PackageIntake;
