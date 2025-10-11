/**
 * Delivery Page Component
 * 
 * Displays all arrived shipments and packages awaiting customer pickup
 * Allows staff to verify 6-digit pickup codes and mark packages as delivered
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  FiPackage, FiSend, FiShield, FiCheckCircle, FiAlertCircle,
  FiClock, FiSearch, FiRefreshCw
} from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { supabase } from '../../../lib/supabase';
import logo from '../../../assets/image.png';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Shipment with arrived packages awaiting pickup
 */
interface ArrivedShipment {
  id: string;
  tracking_number: string;
  recipient_name: string;
  delivery_city: string;
  delivery_country: string;
  total_packages: number;
  packages_with_codes: number;
  arrived_at: string;
  service_type: string;
}

/**
 * Package awaiting pickup with code information
 */
interface PackageAwaitingPickup {
  id: string;
  package_id: string;
  tracking_number: string;
  user_id: string;
  description: string;
  weight: number | null;
  suite_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  linked_to_shipment_id: string | null;
  shipment_tracking: string | null;
  auth_code_generated_at: string | null;
  has_delivery_code: boolean;
}

/**
 * Verification modal data
 */
interface VerificationData {
  packageId: string;
  packageIdentifier: string;
  trackingNumber: string;
  customerName: string;
  suiteNumber: string;
}

// ============================================================================
// DELIVERY PAGE COMPONENT
// ============================================================================

const Delivery: React.FC = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Authentication
  const { isAuthenticated, user } = useWarehouseAuth();

  // Shipments data
  const [arrivedShipments, setArrivedShipments] = useState<ArrivedShipment[]>([]);

  // Packages data
  const [packagesAwaitingPickup, setPackagesAwaitingPickup] = useState<PackageAwaitingPickup[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  // Verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all arrived shipments
   */
  const fetchArrivedShipments = async (): Promise<void> => {
    try {

      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          tracking_number,
          recipient_name,
          delivery_city,
          delivery_country,
          total_packages,
          created_at,
          service_type,
          packages!inner(
            id,
            delivery_auth_code,
            status
          )
        `)
        .eq('status', 'arrived')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to count packages with codes
      const transformed = (data || []).map((shipment: any) => ({
        id: shipment.id,
        tracking_number: shipment.tracking_number,
        recipient_name: shipment.recipient_name,
        delivery_city: shipment.delivery_city,
        delivery_country: shipment.delivery_country,
        total_packages: shipment.total_packages || 0,
        packages_with_codes: shipment.packages?.filter((p: any) => 
          p.status === 'arrived' && p.delivery_auth_code
        ).length || 0,
        arrived_at: shipment.created_at,
        service_type: shipment.service_type
      }));

      setArrivedShipments(transformed);

    } catch (err: any) {
      // Error fetching arrived shipments
    }
  };

  /**
   * Fetch all packages awaiting pickup
   */
  const fetchPackagesAwaitingPickup = async (): Promise<void> => {
    try {
      setIsLoadingPackages(true);

      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          package_id,
          tracking_number,
          user_id,
          description,
          weight,
          linked_to_shipment_id,
          delivery_auth_code,
          auth_code_generated_at,
          users!packages_user_id_fkey(
            suite_number,
            first_name,
            last_name,
            email,
            phone_number
          ),
          shipments(
            tracking_number
          )
        `)
        .eq('status', 'arrived')
        .order('auth_code_generated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform data
      const transformed = (data || []).map((pkg: any) => ({
        id: pkg.id,
        package_id: pkg.package_id,
        tracking_number: pkg.tracking_number,
        user_id: pkg.user_id,
        description: pkg.description,
        weight: pkg.weight,
        suite_number: pkg.users.suite_number,
        customer_name: `${pkg.users.first_name} ${pkg.users.last_name}`,
        customer_email: pkg.users.email,
        customer_phone: pkg.users.phone_number,
        linked_to_shipment_id: pkg.linked_to_shipment_id,
        shipment_tracking: pkg.shipments?.tracking_number || null,
        auth_code_generated_at: pkg.auth_code_generated_at,
        has_delivery_code: !!pkg.delivery_auth_code
      }));

      setPackagesAwaitingPickup(transformed);

    } catch (err: any) {
      // Error fetching packages
    } finally {
      setIsLoadingPackages(false);
    }
  };

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchArrivedShipments();
      fetchPackagesAwaitingPickup();
    }
  }, [isAuthenticated, user?.id]);

  /**
   * Refresh all data
   */
  const handleRefresh = (): void => {
    fetchArrivedShipments();
    fetchPackagesAwaitingPickup();
  };

  // ========================================
  // VERIFICATION HANDLERS
  // ========================================

  /**
   * Open verification modal for a package
   */
  const openVerificationModal = (pkg: PackageAwaitingPickup): void => {
    setVerificationData({
      packageId: pkg.id,
      packageIdentifier: pkg.package_id,
      trackingNumber: pkg.tracking_number,
      customerName: pkg.customer_name,
      suiteNumber: pkg.suite_number
    });
    setVerificationCode('');
    setVerificationError('');
    setVerificationSuccess('');
    setShowVerificationModal(true);
  };

  /**
   * Generate and auto-print delivery receipt for successfully verified package
   */
  const generateAndPrintDeliveryReceipt = async (packageData: VerificationData): Promise<void> => {
    try {

      // Fetch complete package details including arrival date
      const { data: packageDetails, error: packageError } = await supabase
        .from('packages')
        .select(`
          *,
          users!packages_user_id_fkey(
            suite_number,
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq('id', packageData.packageId)
        .single();

      if (packageError) throw packageError;

      // Get current date/time for receipt generation
      const now = new Date();
      const receiptNumber = `DLV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

      // Create receipt HTML with VanguardCargo branding
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Delivery Receipt - ${packageData.packageIdentifier}</title>
            <style>
              @page {
                margin: 1cm;
                size: auto;
              }
              * {
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0.5cm;
                max-width: 100%;
                font-size: 10pt;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 10vw;
                font-weight: bold;
                color: rgba(0, 0, 0, 0.05);
                z-index: -1;
                pointer-events: none;
                user-select: none;
              }
              .receipt-container {
                border: 3px solid #dc2626;
                padding: 1.5em;
                max-width: 100%;
                background: white;
                position: relative;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #dc2626;
                padding-bottom: 1em;
                margin-bottom: 1em;
              }
              .logo {
                max-width: 150px;
                height: auto;
                margin-bottom: 0.5em;
              }
              .company-name {
                font-size: 1.8em;
                font-weight: bold;
                color: #dc2626;
                margin: 0.5em 0 0.2em 0;
              }
              .company-info {
                font-size: 0.75em;
                color: #666;
                margin: 0.3em 0;
              }
              .receipt-title {
                font-size: 1.5em;
                font-weight: bold;
                color: #059669;
                margin: 1em 0 0.5em 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .receipt-number {
                font-size: 1em;
                font-weight: bold;
                background: #f3f4f6;
                padding: 0.5em;
                border-radius: 0.3em;
                margin: 0.5em 0;
              }
              .section {
                margin: 1.5em 0;
                padding: 1em;
                background: #f9fafb;
                border-left: 4px solid #dc2626;
                border-radius: 0.3em;
              }
              .section-title {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 0.7em;
                color: #dc2626;
                text-transform: uppercase;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5em;
                padding: 0.3em 0;
                border-bottom: 1px dotted #ddd;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: bold;
                color: #374151;
                font-size: 0.9em;
                flex-shrink: 0;
                margin-right: 1em;
              }
              .value {
                color: #1f2937;
                text-align: right;
                font-size: 0.9em;
                font-weight: 600;
              }
              .delivery-stamp {
                text-align: center;
                margin: 1.5em 0;
                padding: 1.5em;
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                border-radius: 1em;
                border: 3px solid #047857;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .stamp-title {
                font-size: 0.9em;
                font-weight: bold;
                color: white;
                margin-bottom: 0.5em;
                text-transform: uppercase;
              }
              .stamp-content {
                font-size: 2em;
                font-weight: bold;
                color: white;
                margin: 0.3em 0;
              }
              .stamp-note {
                font-size: 0.75em;
                color: rgba(255,255,255,0.9);
                margin-top: 0.5em;
              }
              .footer {
                text-align: center;
                margin-top: 2em;
                padding-top: 1em;
                border-top: 3px solid #dc2626;
                font-size: 0.75em;
                color: #666;
              }
              @media print {
                @page { margin: 1cm; }
                body { margin: 0 !important; padding: 0.5cm; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="watermark">VANGUARDCARGO</div>
            <div class="receipt-container">
              <!-- Header -->
              <div class="header">
                <img src="${logo}" alt="VanguardCargo Logo" class="logo" />
                <div class="company-name">VANGUARD CARGO LLC</div>
                <div class="company-info">4700 Eisenhower Avenue ALX-E2, Alexandria, VA 22304, USA</div>
                <div class="company-info">Email: support@vanguardcargo.co | Phone: 0303982320 | +233 544197819</div>
                
                <div class="receipt-title">Delivery Confirmation Receipt</div>
                <div class="receipt-number">Receipt #: ${receiptNumber}</div>
                <div class="company-info">Generated: ${now.toLocaleString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</div>
              </div>

              <!-- Customer Information -->
              <div class="section">
                <div class="section-title">📋 Customer Information</div>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${packageData.customerName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Suite Number:</span>
                  <span class="value">${packageData.suiteNumber}</span>
                </div>
                ${packageDetails.users?.email ? `
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${packageDetails.users.email}</span>
                </div>
                ` : ''}
                ${packageDetails.users?.phone_number ? `
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${packageDetails.users.phone_number}</span>
                </div>
                ` : ''}
              </div>

              <!-- Package Details -->
              <div class="section">
                <div class="section-title">📦 Package Details</div>
                <div class="info-row">
                  <span class="label">Package ID:</span>
                  <span class="value">${packageData.packageIdentifier}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tracking Number:</span>
                  <span class="value">${packageData.trackingNumber}</span>
                </div>
                ${packageDetails.description ? `
                <div class="info-row">
                  <span class="label">Description:</span>
                  <span class="value">${packageDetails.description}</span>
                </div>
                ` : ''}
                ${packageDetails.weight ? `
                <div class="info-row">
                  <span class="label">Weight:</span>
                  <span class="value">${packageDetails.weight} kg</span>
                </div>
                ` : ''}
              </div>

              <!-- Delivery Information -->
              <div class="section">
                <div class="section-title">🚚 Delivery Information</div>
                ${packageDetails.auth_code_generated_at ? `
                <div class="info-row">
                  <span class="label">Package Arrived:</span>
                  <span class="value">${new Date(packageDetails.auth_code_generated_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="label">Delivered On:</span>
                  <span class="value">${now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</span>
                </div>
                <div class="info-row">
                  <span class="label">Delivery Status:</span>
                  <span class="value" style="color: #059669; font-weight: bold;">DELIVERED</span>
                </div>
              </div>

              <!-- Delivery Confirmation Stamp -->
              <div class="delivery-stamp">
                <div class="stamp-title">Package Successfully Delivered</div>
                <div class="stamp-content">VERIFIED & RELEASED</div>
                <div class="stamp-note">Delivery code verified by warehouse staff</div>
                <div class="stamp-note" style="margin-top: 0.5em; font-size: 0.85em;">
                  Delivered to: ${packageData.customerName} (Suite ${packageData.suiteNumber})
                </div>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.5em;">Thank you for choosing VanguardCargo!</p>
                <p>This is an official delivery confirmation receipt. Please keep for your records.</p>
                <p style="margin-top: 1em;">For inquiries, contact: support@vanguardcargo.co</p>
                <p style="margin-top: 1em; font-weight: bold;">© 2025 VanguardCargo Warehouse. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Auto-print the receipt
      const printWindow = window.open('', '', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 500);
          }, 250);
        };
      }
    } catch (error) {
      // Error generating delivery receipt - don't throw to avoid blocking verification
    }
  };

  /**
   * Handle verification submission
   */
  const handleVerifyPickupCode = async (): Promise<void> => {
    if (!verificationData || !user?.id) return;

    setIsVerifying(true);
    setVerificationError('');
    setVerificationSuccess('');

    try {
      // Call verification function
      const { data, error } = await supabase.rpc('verify_delivery_code', {
        p_package_id: verificationData.packageId,
        p_suite_number: verificationData.suiteNumber.trim().toUpperCase(),
        p_auth_code: verificationCode.trim(),
        p_staff_id: user.id
      });

      if (error) throw error;

      if (data.verified) {
        // Success!
        setVerificationSuccess(data.message);
        
        // Generate and auto-print delivery receipt
        await generateAndPrintDeliveryReceipt(verificationData);
        
        // Close modal after 3 seconds and refresh data
        setTimeout(() => {
          setShowVerificationModal(false);
          handleRefresh();
        }, 3000);
      } else {
        // Failed verification
        setVerificationError(data.message || 'Verification failed');
      }

    } catch (err: any) {
      setVerificationError(err.message || 'Failed to verify pickup code');
    } finally {
      setIsVerifying(false);
    }
  };

  // ========================================
  // FILTERING
  // ========================================

  /**
   * Filter packages based on search and selected shipment
   */
  const filteredPackages = packagesAwaitingPickup.filter(pkg => {
    // Filter by shipment if selected
    if (selectedShipment && pkg.linked_to_shipment_id !== selectedShipment) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        pkg.package_id.toLowerCase().includes(query) ||
        pkg.tracking_number.toLowerCase().includes(query) ||
        pkg.suite_number.toLowerCase().includes(query) ||
        pkg.customer_name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Package Delivery
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-red-100">
                Verify pickup codes and hand over packages to customers
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all border border-white/30 text-sm sm:text-base whitespace-nowrap self-end sm:self-auto"
            >
              <FiRefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-red-100/50 border border-red-100 p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Arrived Shipments</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mt-1 sm:mt-2">
                  {arrivedShipments.length}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl flex-shrink-0">
                <FiSend className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-green-100/50 border border-green-100 p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Packages Ready</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mt-1 sm:mt-2">
                  {packagesAwaitingPickup.length}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl flex-shrink-0">
                <FiPackage className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-purple-100/50 border border-purple-100 p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">With Delivery Codes</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mt-1 sm:mt-2">
                  {packagesAwaitingPickup.filter(p => p.has_delivery_code).length}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl flex-shrink-0">
                <FiShield className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-gray-50 hover:bg-white text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Shipment Filter */}
            <div className="w-full">
              <select
                value={selectedShipment || ''}
                onChange={(e) => setSelectedShipment(e.target.value || null)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-gray-50 hover:bg-white font-medium text-sm sm:text-base"
              >
                <option value="">All Shipments</option>
                {arrivedShipments.map(shipment => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.tracking_number} ({shipment.packages_with_codes})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Packages List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-red-50 to-white border-b-2 border-red-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">Packages Awaiting Pickup</h2>
                <p className="text-xs sm:text-sm font-normal text-gray-600">{filteredPackages.length} packages ready</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoadingPackages ? (
              <div className="p-16 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
                <p className="mt-6 text-gray-600 font-medium">Loading packages...</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-16 text-center">
                <div className="p-6 bg-gray-100 rounded-2xl inline-block mb-4">
                  <FiPackage className="h-16 w-16 text-gray-400 mx-auto" />
                </div>
                <p className="text-gray-600 text-lg font-medium">No packages awaiting pickup</p>
                <p className="text-gray-500 text-sm mt-2">Packages will appear here once they arrive</p>
              </div>
            ) : (
              filteredPackages.map(pkg => (
                <div key={pkg.id} className="p-4 sm:p-6 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent transition-all duration-200 border-l-4 border-transparent hover:border-red-500">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Package Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-all">
                          {pkg.package_id}
                        </h3>
                        {pkg.has_delivery_code ? (
                          <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-md whitespace-nowrap">
                            <FiCheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            CODE READY
                          </span>
                        ) : (
                          <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-lg shadow-sm whitespace-nowrap">
                            NO CODE
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-wrap items-start gap-1">
                          <span className="text-gray-500 font-semibold">Tracking:</span>
                          <span className="text-gray-900 font-mono break-all">{pkg.tracking_number}</span>
                        </div>
                        <div className="flex flex-wrap items-start gap-1">
                          <span className="text-gray-500 font-semibold">Suite:</span>
                          <span className="text-gray-900 font-semibold">{pkg.suite_number}</span>
                        </div>
                        <div className="flex flex-wrap items-start gap-1">
                          <span className="text-gray-500 font-semibold">Customer:</span>
                          <span className="text-gray-900 font-medium break-words">{pkg.customer_name}</span>
                        </div>
                        <div className="flex flex-wrap items-start gap-1">
                          <span className="text-gray-500 font-semibold">Description:</span>
                          <span className="text-gray-900 break-words">{pkg.description}</span>
                        </div>
                        {pkg.shipment_tracking && (
                          <div className="flex flex-wrap items-start gap-1">
                            <span className="text-gray-500 font-semibold">Shipment:</span>
                            <span className="text-gray-900 font-mono break-all">{pkg.shipment_tracking}</span>
                          </div>
                        )}
                        {pkg.auth_code_generated_at && (
                          <div className="flex flex-wrap items-center gap-1">
                            <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500 font-semibold">Generated:</span>
                            <span className="text-gray-900">{new Date(pkg.auth_code_generated_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => openVerificationModal(pkg)}
                        disabled={!pkg.has_delivery_code}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm sm:text-base whitespace-nowrap"
                      >
                        <FiShield className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Verify & Deliver</span>
                        <span className="sm:hidden">Verify</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && verificationData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-top duration-300 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                    <FiShield className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="truncate">Verify Code</span>
                </h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/20 rounded-lg flex-shrink-0"
                >
                  <span className="text-xl sm:text-2xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">

              {/* Package Info */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-red-200">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Package ID</p>
                    <p className="font-mono font-bold text-gray-900 text-base sm:text-lg break-all">{verificationData.packageIdentifier}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Customer</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{verificationData.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Suite Number</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{verificationData.suiteNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                  6-Digit Delivery Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 sm:border-3 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-red-500/30 focus:border-red-500 text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.3em] sm:tracking-[0.5em] bg-gray-50 transition-all"
                  autoFocus
                  inputMode="numeric"
                />
              </div>

              {/* Messages */}
              {verificationError && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-200">
                  <FiAlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{verificationError}</p>
                </div>
              )}

              {verificationSuccess && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-200">
                  <FiCheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 font-medium">{verificationSuccess}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  disabled={isVerifying}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all font-bold disabled:opacity-50 hover:scale-105 text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPickupCode}
                  disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold hover:scale-105 text-sm sm:text-base order-1 sm:order-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Verify & Mark Delivered</span>
                      <span className="sm:hidden">Verify & Deliver</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Delivery;
