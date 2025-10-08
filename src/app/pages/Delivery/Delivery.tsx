/**
 * Delivery Page Component
 * 
 * Displays all arrived shipments and packages awaiting customer pickup
 * Allows staff to verify 6-digit pickup codes and mark packages as delivered
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

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
  const { isAuthenticated, userId } = useWarehouseAuth();

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
      console.error('Error fetching arrived shipments:', err);
    }
  };

  /**
   * Fetch all packages awaiting pickup
   */
  const fetchPackagesAwaitingPickup = async (): Promise<void> => {
    try {
      setIsLoadingPackages(true);

      console.log('🔍 [DELIVERY DEBUG] Fetching packages with status=arrived...');

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
        console.error('❌ [DELIVERY DEBUG] Supabase error:', error);
        throw error;
      }

      console.log(`✅ [DELIVERY DEBUG] Found ${data?.length || 0} packages with status=arrived`);
      console.log('📦 [DELIVERY DEBUG] Raw package data:', data);

      // Log each package's code status
      data?.forEach((pkg: any, index: number) => {
        console.log(`📦 Package ${index + 1}:`, {
          package_id: pkg.package_id,
          tracking: pkg.tracking_number,
          delivery_code: pkg.delivery_auth_code || '❌ NO CODE',
          code_generated_at: pkg.auth_code_generated_at || 'Never',
          has_code: !!pkg.delivery_auth_code
        });
      });

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

      const packagesWithCodes = transformed.filter(p => p.has_delivery_code).length;
      console.log(`📊 [DELIVERY DEBUG] Summary: ${packagesWithCodes} packages WITH codes, ${transformed.length - packagesWithCodes} WITHOUT codes`);

      setPackagesAwaitingPickup(transformed);

    } catch (err: any) {
      console.error('❌ [DELIVERY DEBUG] Error fetching packages:', err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchArrivedShipments();
      fetchPackagesAwaitingPickup();
    }
  }, [isAuthenticated, userId]);

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
      console.log('📄 Generating delivery receipt for:', packageData.packageId);

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
                
                <div class="receipt-title">✅ Delivery Confirmation Receipt</div>
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
                  <span class="value" style="color: #059669; font-weight: bold;">✅ DELIVERED</span>
                </div>
              </div>

              <!-- Delivery Confirmation Stamp -->
              <div class="delivery-stamp">
                <div class="stamp-title">Package Successfully Delivered</div>
                <div class="stamp-content">✅ VERIFIED & RELEASED</div>
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

      console.log('✅ Delivery receipt generated and sent to printer');
    } catch (error) {
      console.error('❌ Error generating delivery receipt:', error);
      // Don't throw - we don't want to block the verification success
    }
  };

  /**
   * Handle verification submission
   */
  const handleVerifyPickupCode = async (): Promise<void> => {
    if (!verificationData || !userId) return;

    setIsVerifying(true);
    setVerificationError('');
    setVerificationSuccess('');

    try {
      // Call verification function
      const { data, error } = await supabase.rpc('verify_delivery_code', {
        p_package_id: verificationData.packageId,
        p_suite_number: verificationData.suiteNumber.trim().toUpperCase(),
        p_auth_code: verificationCode.trim(),
        p_staff_id: userId
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
      console.error('Verification error:', err);
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Package Delivery
              </h1>
              <p className="mt-2 text-base sm:text-lg text-red-100">
                Verify pickup codes and hand over packages to customers
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all border border-white/30"
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-red-100/50 border border-red-100 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Arrived Shipments</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mt-2">
                  {arrivedShipments.length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl">
                <FiSend className="h-10 w-10 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-green-100/50 border border-green-100 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Packages Ready</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mt-2">
                  {packagesAwaitingPickup.length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                <FiPackage className="h-10 w-10 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-purple-100/50 border border-purple-100 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">With Delivery Codes</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mt-2">
                  {packagesAwaitingPickup.filter(p => p.has_delivery_code).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                <FiShield className="h-10 w-10 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by package ID, tracking, suite number, or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Shipment Filter */}
            <div className="md:w-64">
              <select
                value={selectedShipment || ''}
                onChange={(e) => setSelectedShipment(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Shipments</option>
                {arrivedShipments.map(shipment => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.tracking_number} ({shipment.packages_with_codes} packages)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Packages List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Packages Awaiting Pickup ({filteredPackages.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoadingPackages ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading packages...</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="p-12 text-center">
                <FiPackage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No packages awaiting pickup</p>
              </div>
            ) : (
              filteredPackages.map(pkg => (
                <div key={pkg.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    {/* Package Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {pkg.package_id}
                        </h3>
                        {pkg.has_delivery_code ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded flex items-center gap-1">
                            <FiCheckCircle className="h-3 w-3" />
                            CODE READY
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                            NO CODE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p><strong>Tracking:</strong> {pkg.tracking_number}</p>
                        <p><strong>Suite:</strong> {pkg.suite_number}</p>
                        <p><strong>Customer:</strong> {pkg.customer_name}</p>
                        <p><strong>Description:</strong> {pkg.description}</p>
                        {pkg.shipment_tracking && (
                          <p><strong>Shipment:</strong> {pkg.shipment_tracking}</p>
                        )}
                        {pkg.auth_code_generated_at && (
                          <p className="flex items-center gap-1">
                            <FiClock className="h-4 w-4" />
                            <strong>Code Generated:</strong> {new Date(pkg.auth_code_generated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        onClick={() => openVerificationModal(pkg)}
                        disabled={!pkg.has_delivery_code}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiShield />
                        Verify & Deliver
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FiShield className="text-red-600" />
                Verify Delivery Code
              </h3>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Package Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Package</p>
              <p className="font-semibold text-gray-900">{verificationData.packageIdentifier}</p>
              <p className="text-sm text-gray-600 mt-3">Customer</p>
              <p className="font-semibold text-gray-900">{verificationData.customerName}</p>
              <p className="text-sm text-gray-600 mt-3">Suite Number</p>
              <p className="font-semibold text-gray-900">{verificationData.suiteNumber}</p>
            </div>

            {/* Input Fields */}
            <div className="space-y-4 mb-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6-Digit Delivery Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-center text-2xl font-mono tracking-widest"
                />
              </div>
            </div>

            {/* Messages */}
            {verificationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <FiAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{verificationError}</p>
              </div>
            )}

            {verificationSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <FiCheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{verificationSuccess}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowVerificationModal(false)}
                disabled={isVerifying}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPickupCode}
                disabled={isVerifying || !verificationCode || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Verify & Mark Delivered
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Delivery;
