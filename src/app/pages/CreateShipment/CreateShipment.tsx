import React, { useState, useEffect } from 'react';
import { FiPackage, FiMapPin, FiLoader, FiAlertCircle, FiFileText, FiSend, FiBookmark, FiSave, FiTrash2 } from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { supabase } from '../../../lib/supabase';
import { warehouseDocumentService } from '../../../services/warehouseDocumentService';
import WaybillViewer from '../../../components/warehouse/WaybillViewer';
import ReceiptViewer from '../../../components/warehouse/ReceiptViewer';
import ConsolidatedShipmentView from '../../../components/warehouse/ConsolidatedShipmentView';
import logo from '../../../assets/image.png';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
  const { isAuthenticated, user } = useWarehouseAuth();
  const [receivedPackages, setReceivedPackages] = useState<ProcessingPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<ProcessingPackage[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Phone number state for international input
  const [phoneValue, setPhoneValue] = useState<string>('');

  // Saved recipients state
  const [savedRecipients, setSavedRecipients] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [saveRecipientOnSubmit, setSaveRecipientOnSubmit] = useState(false);
  const [recipientNickname, setRecipientNickname] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  /**
   * Fetch packages with 'received' status on component mount
   */
  useEffect(() => {
    fetchReceivedPackages();
    if (user?.id) {
      fetchSavedRecipients();
    }
  }, [user?.id]);

  /**
   * Fetch all saved recipients for the current user
   */
  const fetchSavedRecipients = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_saved_recipients', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching saved recipients:', error);
        return;
      }

      setSavedRecipients(data || []);
    } catch (err) {
      console.error('Error loading saved recipients:', err);
    }
  };

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
      setFilteredPackages(transformedPackages);
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
    if (selectedPackages.size === filteredPackages.length) {
      setSelectedPackages(new Set());
    } else {
      const allIds = new Set(filteredPackages.map(pkg => pkg.id));
      setSelectedPackages(allIds);
    }
  };

  /**
   * Handle search query change and filter packages
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Filter packages based on search query
    if (query.trim() === '') {
      setFilteredPackages(receivedPackages);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = receivedPackages.filter(pkg => 
        pkg.user_name.toLowerCase().includes(lowerQuery) ||
        pkg.suite_number.toLowerCase().includes(lowerQuery) ||
        pkg.package_id.toLowerCase().includes(lowerQuery) ||
        pkg.tracking_number.toLowerCase().includes(lowerQuery) ||
        pkg.description?.toLowerCase().includes(lowerQuery) ||
        pkg.store_name?.toLowerCase().includes(lowerQuery) ||
        pkg.vendor_name?.toLowerCase().includes(lowerQuery)
      );
      setFilteredPackages(filtered);
    }
  };

  /**
   * Handle input changes for form fields
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle saved recipient selection
   */
  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    
    if (!recipientId) {
      // Clear form if "None" selected
      setFormData({
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryCountry: '',
        serviceType: 'standard'
      });
      setPhoneValue('');
      return;
    }

    const recipient = savedRecipients.find(r => r.id === recipientId);
    if (recipient) {
      setFormData({
        recipientName: recipient.recipient_name,
        recipientPhone: recipient.recipient_phone || '',
        deliveryAddress: recipient.delivery_address,
        deliveryCity: recipient.delivery_city,
        deliveryCountry: recipient.delivery_country,
        serviceType: recipient.service_type || 'standard'
      });
      setPhoneValue(recipient.recipient_phone || '');
    }
  };

  /**
   * Save recipient details after successful shipment creation
   */
  const saveRecipientAfterShipment = async () => {
    if (!user?.id || !saveRecipientOnSubmit) return;

    // Validate required fields
    if (!formData.recipientName || !formData.deliveryAddress || !formData.deliveryCity || !formData.deliveryCountry) {
      console.log('Skipping recipient save - missing required fields');
      return;
    }

    // Generate automatic nickname if not provided
    const autoNickname = recipientNickname.trim() || 
      `${formData.recipientName} - ${formData.deliveryCity}`;

    try {
      const { data, error } = await supabase.rpc('save_recipient', {
        p_user_id: user.id,
        p_nickname: autoNickname,
        p_recipient_name: formData.recipientName,
        p_recipient_phone: formData.recipientPhone || null,
        p_delivery_address: formData.deliveryAddress,
        p_delivery_city: formData.deliveryCity,
        p_delivery_country: formData.deliveryCountry,
        p_service_type: formData.serviceType,
        p_is_default: saveAsDefault
      });

      if (error) {
        console.error('Error saving recipient:', error);
        return;
      }

      if (data && !data.success) {
        console.error('Failed to save recipient:', data.error);
        return;
      }

      // Refresh saved recipients list
      await fetchSavedRecipients();
      
      console.log('✅ Recipient saved successfully:', autoNickname);
    } catch (err: any) {
      console.error('Error saving recipient:', err);
    }
  };

  /**
   * Delete a saved recipient
   */
  const handleDeleteRecipient = async (recipientId: string) => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to delete this saved recipient?')) return;

    try {
      const { data, error } = await supabase.rpc('delete_saved_recipient', {
        p_recipient_id: recipientId,
        p_user_id: user.id
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete recipient');
      }

      setSuccess('Recipient deleted successfully!');
      
      // Clear selection if deleted recipient was selected
      if (selectedRecipientId === recipientId) {
        setSelectedRecipientId('');
        setFormData({
          recipientName: '',
          recipientPhone: '',
          deliveryAddress: '',
          deliveryCity: '',
          deliveryCountry: '',
          serviceType: 'standard'
        });
        setPhoneValue('');
      }
      
      // Refresh saved recipients list
      await fetchSavedRecipients();
    } catch (err: any) {
      console.error('Error deleting recipient:', err);
      setError('Failed to delete recipient: ' + err.message);
    }
  };

  /**
   * Handle phone number change and auto-populate country
   */
  const handlePhoneChange = (value: string | undefined) => {
    setPhoneValue(value || '');
    setFormData(prev => ({
      ...prev,
      recipientPhone: value || ''
    }));

    // Auto-populate country based on phone number country code
    if (value) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber && phoneNumber.country) {
          const countryName = getCountryName(phoneNumber.country);
          setFormData(prev => ({
            ...prev,
            deliveryCountry: countryName
          }));
        }
      } catch (error) {
        // Phone number not valid yet, ignore
      }
    }
  };

  /**
   * Get full country name from country code
   */
  const getCountryName = (countryCode: string): string => {
    const countryNames: { [key: string]: string } = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'GH': 'Ghana',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'ZA': 'South Africa',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'BE': 'Belgium',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'PL': 'Poland',
      'CZ': 'Czech Republic',
      'HU': 'Hungary',
      'RO': 'Romania',
      'BG': 'Bulgaria',
      'GR': 'Greece',
      'PT': 'Portugal',
      'IE': 'Ireland',
      'CN': 'China',
      'JP': 'Japan',
      'KR': 'South Korea',
      'IN': 'India',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CL': 'Chile',
      'CO': 'Colombia',
      'PE': 'Peru',
      'VE': 'Venezuela',
      'EC': 'Ecuador',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'BO': 'Bolivia',
      'CR': 'Costa Rica',
      'PA': 'Panama',
      'SG': 'Singapore',
      'MY': 'Malaysia',
      'TH': 'Thailand',
      'VN': 'Vietnam',
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'NZ': 'New Zealand',
      'AE': 'United Arab Emirates',
      'SA': 'Saudi Arabia',
      'IL': 'Israel',
      'TR': 'Turkey',
      'EG': 'Egypt',
      'MA': 'Morocco',
      'TN': 'Tunisia',
      'ET': 'Ethiopia',
      'TZ': 'Tanzania',
      'UG': 'Uganda',
      'RW': 'Rwanda'
    };
    return countryNames[countryCode] || countryCode;
  };

  /**
   * Handle shipment creation form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user?.id) {
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
        p_warehouse_staff_id: user.id,
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

      // Track recipient usage if a saved recipient was used
      if (selectedRecipientId && user?.id) {
        try {
          await supabase.rpc('mark_recipient_used', {
            p_recipient_id: selectedRecipientId,
            p_user_id: user.id
          });
          // Refresh saved recipients to update usage count
          await fetchSavedRecipients();
        } catch (err) {
          console.error('Error tracking recipient usage:', err);
          // Non-critical error, continue
        }
      }

      // Save recipient if toggle is enabled
      if (saveRecipientOnSubmit) {
        await saveRecipientAfterShipment();
      }
      
      // Generate individual package receipts first, then shipment receipt
      try {
        setIsGeneratingReceipt(true);
        
        // Step 1: Generate receipt for each package (using UUID, not package_id string)
        const selectedPackageIds = Array.from(selectedPackages);
        await Promise.all(
          selectedPackageIds.map(async (packageUuid) => {
            try {
              await warehouseDocumentService.generatePackageIntakeReceipt(packageUuid, user.id);
            } catch (pkgError) {
              console.error(`Failed to generate receipt for package ${packageUuid}:`, pkgError);
            }
          })
        );
        
        // Step 2: Generate shipment receipt
        const generatedReceipt = await warehouseDocumentService.generateShipmentReceipt(
          data.shipment_id,
          user.id
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
      setSelectedRecipientId('');
      setSaveRecipientOnSubmit(false);
      setRecipientNickname('');
      setSaveAsDefault(false);
      setFormData({
        recipientName: '',
        recipientPhone: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryCountry: '',
        serviceType: 'standard'
      });
      setPhoneValue('');

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
                  <p className="text-base sm:text-lg text-green-800 font-bold">
                    Shipment Created Successfully!
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <FiPackage className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Available Packages</div>
                    <div className="text-sm font-normal text-gray-600">
                      {filteredPackages.length} of {receivedPackages.length} packages
                    </div>
                  </div>
                </h2>
              </div>
              
              {/* Search Input */}
              {receivedPackages.length > 0 && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPackage className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search by user, suite, package ID, or tracking number..."
                      className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilteredPackages(receivedPackages);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                  >
                    {selectedPackages.size === filteredPackages.length ? '✓ Deselect All' : '☐ Select All'}
                  </button>
                </div>
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
              ) : filteredPackages.length === 0 ? (
                <div className="text-center py-8">
                  <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No packages match your search</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try searching with different keywords
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilteredPackages(receivedPackages);
                    }}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold text-sm"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {filteredPackages.map((pkg: ProcessingPackage) => (
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
              {/* Saved Recipients Section */}
              {savedRecipients.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <h3 className="text-md font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <FiBookmark className="w-5 h-5 text-blue-600" />
                    Saved Recipients
                  </h3>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => handleRecipientSelect(e.target.value)}
                      className="flex-1 px-4 py-2.5 border-2 border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white hover:border-blue-300"
                    >
                      <option value="">✏️ Enter manually...</option>
                      {savedRecipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.is_default ? '⭐ ' : ''}{recipient.nickname} - {recipient.recipient_name} ({recipient.delivery_city}, {recipient.delivery_country})
                          {recipient.usage_count > 0 ? ` • Used ${recipient.usage_count}x` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {selectedRecipientId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipient(selectedRecipientId)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                        title="Delete this saved recipient"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient Information */}
              <div>
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  Recipient Information
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label htmlFor="recipientName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="recipientName"
                        name="recipientName"
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
                        placeholder="Enter recipient's full name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="recipientPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Recipient Phone *
                    </label>
                    <PhoneInput
                      international
                      defaultCountry="US"
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      className="phone-input-professional"
                      placeholder="Enter phone number with country code"
                      style={{
                        width: '100%'
                      }}
                    />
                    <style>{`
                      .phone-input-professional .PhoneInputInput {
                        padding: 0.75rem 1rem;
                        border: 2px solid #E5E7EB;
                        border-radius: 0.75rem;
                        width: 100%;
                        font-size: 1rem;
                        line-height: 1.5;
                        transition: all 0.2s ease-in-out;
                        color: #111827;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                      }
                      .phone-input-professional .PhoneInputInput:hover {
                        border-color: #D1D5DB;
                      }
                      .phone-input-professional .PhoneInputInput:focus {
                        outline: none;
                        border-color: #EF4444;
                        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                      }
                      .phone-input-professional .PhoneInputInput::placeholder {
                        color: #9CA3AF;
                      }
                      .phone-input-professional .PhoneInputCountrySelect {
                        padding: 0.75rem;
                        border: 2px solid #E5E7EB;
                        border-radius: 0.75rem 0 0 0.75rem;
                        background-color: #F9FAFB;
                        font-size: 1rem;
                        transition: all 0.2s ease-in-out;
                      }
                      .phone-input-professional .PhoneInputCountrySelect:hover {
                        background-color: #F3F4F6;
                        border-color: #D1D5DB;
                      }
                      .phone-input-professional .PhoneInputCountrySelect:focus {
                        outline: none;
                        border-color: #EF4444;
                        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                      }
                      .phone-input-professional .PhoneInputCountryIcon {
                        width: 1.5rem;
                        height: 1.5rem;
                        margin-right: 0.5rem;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                      }
                      .phone-input-professional {
                        display: flex;
                        gap: 0;
                      }
                    `}</style>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  Delivery Address
                </h3>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <textarea
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300 resize-none"
                      placeholder="Enter complete delivery address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="deliveryCity" className="block text-sm font-semibold text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        id="deliveryCity"
                        name="deliveryCity"
                        value={formData.deliveryCity}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
                        placeholder="Enter city"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="deliveryCountry" className="block text-sm font-semibold text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="deliveryCountry"
                        name="deliveryCountry"
                        value={formData.deliveryCountry}
                        readOnly
                        required
                        className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                        placeholder="Select phone country code first"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  Shipping Options
                </h3>
                <div>
                  <label htmlFor="serviceType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 bg-white hover:border-gray-300 cursor-pointer"
                  >
                    <option value="standard">Standard</option>
                    {/* <option value="express">Express</option>
                    <option value="overnight">Overnight</option> */}
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    📅 Estimated delivery will be calculated automatically based on service type
                  </p>
                </div>
              </div>

              {/* Save Recipient Toggle */}
              {!selectedRecipientId && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSaveRecipientOnSubmit(!saveRecipientOnSubmit)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                          saveRecipientOnSubmit ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            saveRecipientOnSubmit ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-900 cursor-pointer" onClick={() => setSaveRecipientOnSubmit(!saveRecipientOnSubmit)}>
                        <FiSave className="inline w-4 h-4 mr-1" />
                        Save this recipient for future use
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        When enabled, recipient details will be saved after creating the shipment
                      </p>
                      
                      {saveRecipientOnSubmit && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label htmlFor="saveNickname" className="block text-xs font-semibold text-gray-700 mb-1">
                              Nickname (optional)
                            </label>
                            <input
                              type="text"
                              id="saveNickname"
                              value={recipientNickname}
                              onChange={(e) => setRecipientNickname(e.target.value)}
                              placeholder={`Auto: ${formData.recipientName || 'Recipient'} - ${formData.deliveryCity || 'City'}`}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 placeholder-gray-400"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="saveAsDefaultInline"
                              checked={saveAsDefault}
                              onChange={(e) => setSaveAsDefault(e.target.checked)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <label htmlFor="saveAsDefaultInline" className="text-xs text-gray-700">
                              ⭐ Set as default recipient
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
