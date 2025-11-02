import React, { useState, useEffect } from 'react';
import { FiPackage, FiSend, FiMapPin, FiCheck, FiLoader, FiAlertCircle, FiSearch, FiChevronRight, FiClock, FiUser, FiBox, FiCalendar, FiFileText, FiDownload } from 'react-icons/fi';
import { warehouseShipmentService, type ShipmentData, type ShipmentStatus } from '../../../services/warehouseShipmentService';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import WaybillViewer from '../../../components/warehouse/WaybillViewer';
import { warehouseDocumentService } from '../../../services/warehouseDocumentService';
import { LOGO, COMPANY_INFO, COMPANY_PHONES_SHORT, WATERMARK_TEXT } from '../../../config/branding';

/**
 * Shipment interface matching the backend data structure
 */
interface Shipment {
  id: string;
  tracking_number: string;  // Changed from shipment_number to match database field
  status: ShipmentStatus;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_region?: string | null;
  delivery_country: string;
  total_weight_lbs: number | null;
  total_declared_value: number | null;
  total_packages: number;
  total_cost: number | null;
  service_type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const ShipmentHistory: React.FC = () => {
  const { user } = useWarehouseAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ShipmentStatus>('all');
  const [isUpdating, setIsUpdating] = useState<string>('');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShipments, setTotalShipments] = useState(0);
  const itemsPerPage = 20;

  // Document generation state
  const [showWaybill, setShowWaybill] = useState<string | null>(null);
  const [isGeneratingReceipts, setIsGeneratingReceipts] = useState<string>('');

  /**
   * Fetch shipments from Supabase backend
   */
  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Build filters based on current state
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      // Fetch shipments from backend
      const response = await warehouseShipmentService.getShipments(
        filters,
        currentPage,
        itemsPerPage
      );

      // Transform backend data to match our interface
      const transformedShipments: Shipment[] = response.shipments.map((shipment: ShipmentData) => ({
        id: shipment.id,
        tracking_number: shipment.tracking_number, // Direct mapping from database
        status: shipment.status,
        recipient_name: shipment.recipient_name,
        recipient_phone: shipment.recipient_phone,
        recipient_email: null, // Not in database schema
        delivery_address: shipment.delivery_address,
        delivery_city: shipment.delivery_city,
        delivery_region: null, // Not in database schema
        delivery_country: shipment.delivery_country,
        total_weight_lbs: shipment.total_weight,
        total_declared_value: shipment.total_value,
        total_packages: shipment.total_packages || shipment.packages?.length || 0,
        total_cost: shipment.shipping_cost,
        service_type: shipment.service_type,
        created_at: shipment.created_at,
        updated_at: shipment.updated_at,
        user_id: shipment.user_id
      }));

      setShipments(transformedShipments);
      setTotalShipments(response.total);
      setTotalPages(response.total_pages);
      
    } catch (err) {
      console.error('Error fetching shipments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shipments from database');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchShipments();
    }, searchTerm ? 500 : 0); // 500ms delay for search, immediate for other changes

    return () => clearTimeout(timeoutId);
  }, [currentPage, statusFilter, searchTerm]);

  const updateShipmentStatus = async (shipmentId: string, newStatus: Shipment['status']) => {
    setIsUpdating(shipmentId);
    setError('');

    try {
      // Update status in database using the warehouse shipment service
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      await warehouseShipmentService.updateShipmentStatus(
        shipmentId, 
        newStatus, 
        user.id, 
        `Status updated to ${newStatus}`
      );
      
      // Update local state to reflect the change
      setShipments(prev => prev.map(shipment => 
        shipment.id === shipmentId 
          ? { ...shipment, status: newStatus, updated_at: new Date().toISOString() }
          : shipment
      ));

      setSuccess(`Shipment status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setSuccess(''), 4000);
      
    } catch (err) {
      console.error('Error updating shipment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shipment status');
    } finally {
      setIsUpdating('');
    }
  };

  const getStatusConfig = (status: ShipmentStatus) => {
    const configs: Record<ShipmentStatus, any> = {
      pending: {
        icon: FiClock,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        ring: 'ring-gray-500',
        gradient: 'from-gray-500 to-gray-600',
        label: 'Pending'
      },
      processing: {
        icon: FiLoader,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        ring: 'ring-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600',
        label: 'Processing'
      },
      shipped: {
        icon: FiSend,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        ring: 'ring-purple-500',
        gradient: 'from-purple-500 to-purple-600',
        label: 'Shipped'
      },
      in_transit: {
        icon: FiMapPin,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        ring: 'ring-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        label: 'In Transit'
      },
      arrived: {
        icon: FiPackage,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        ring: 'ring-amber-500',
        gradient: 'from-amber-500 to-amber-600',
        label: 'Arrived'
      },
      delivered: {
        icon: FiCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'ring-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600',
        label: 'Delivered'
      }
    };
    return configs[status] || configs.pending;
  };

  const getNextStatus = (currentStatus: ShipmentStatus): ShipmentStatus | null => {
    const flow: Record<ShipmentStatus, ShipmentStatus | null> = { 
      pending: 'processing', 
      processing: 'shipped', 
      shipped: 'in_transit',
      in_transit: 'arrived',
      arrived: null,  // Don't show "Mark as Delivered" button - must use Delivery page with 6-digit verification
      delivered: null
    };
    return flow[currentStatus];
  };

  /**
   * Handle printing package receipts for a shipment
   * Generates and opens all package receipts in print windows
   */
  const handlePrintPackageReceipts = async (shipmentId: string) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsGeneratingReceipts(shipmentId);
    setError('');

    try {
      // Fetch full shipment details with packages
      const shipmentDetails = await warehouseDocumentService.getConsolidatedShipmentDetails(shipmentId, user.id);
      
      if (!shipmentDetails.packages || shipmentDetails.packages.length === 0) {
        throw new Error('No packages found for this shipment');
      }

      // Generate receipt for each package and open print window
      const receipts = await Promise.all(
        shipmentDetails.packages.map(async (pkg: any) => {
          try {
            const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
              pkg.id || pkg.package_uuid,
              user.id
            );
            return {
              package: pkg,
              receipt,
              success: true
            };
          } catch (err) {
            console.error(`Failed to generate receipt for ${pkg.package_id}:`, err);
            return {
              package: pkg,
              receipt: null,
              success: false,
              error: err
            };
          }
        })
      );

      const successfulReceipts = receipts.filter(r => r.success);
      
      if (successfulReceipts.length > 0) {
        // Print each receipt individually
        for (const item of successfulReceipts) {
          if (!item.receipt) continue;
          
          const receiptData = item.receipt.receipt_data;
          const printWindow = window.open('', '_blank');
          
          if (printWindow) {
            printWindow.document.write(`
              <html>
              <head>
                <title>Receipt - ${item.receipt.receipt_number}</title>
                <style>
                  @page { margin: 1cm; size: auto; }
                  * { box-sizing: border-box; }
                  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0.5cm; background: #f5f5f5; position: relative; font-size: 10pt; }
                  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 10vw; color: rgba(220, 38, 38, 0.05); font-weight: bold; z-index: -1; pointer-events: none; }
                  .receipt { max-width: 100%; width: 100%; margin: 0 auto; background: white; padding: 1em; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; z-index: 1; }
                  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; padding-bottom: 0.5em; margin-bottom: 1em; }
                  .header-left { flex: 1; }
                  .header-left img { max-width: 20%; height: auto; }
                  .header-right { flex: 1; text-align: right; }
                  .header-right h1 { color: #dc2626; margin: 0 0 0.3em 0; font-size: 1.4em; }
                  .header-right p { color: #666; margin: 0.1em 0; font-size: 0.75em; }
                  .receipt-number { text-align: center; background: #dc2626; color: white; padding: 0.5em; margin: 0.5em 0; font-size: 1em; font-weight: bold; }
                  .section { margin: 0.8em 0; }
                  .section-title { background: #f3f4f6; padding: 0.5em; font-weight: bold; color: #1f2937; border-left: 3px solid #dc2626; margin-bottom: 0.5em; font-size: 0.9em; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em; }
                  .info-item { padding: 0.3em 0; border-bottom: 1px solid #e5e7eb; }
                  .info-label { font-weight: 600; color: #6b7280; font-size: 0.8em; }
                  .info-value { color: #1f2937; font-size: 0.9em; margin-top: 0.2em; word-wrap: break-word; }
                  .footer { margin-top: 1em; padding-top: 0.5em; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 0.7em; }
                  @media print {
                    @page { margin: 1cm; }
                    body { background: white; padding: 0.5cm; margin: 0 !important; }
                    html, body { margin: 0 !important; padding: 0 !important; }
                    .receipt { box-shadow: none; max-width: 100%; }
                  }
                </style>
              </head>
              <body>
                <div class="watermark">${WATERMARK_TEXT}</div>
                <div class="receipt">
                  <div class="header">
                    <div class="header-left">
                      <img src="${LOGO}" alt="${COMPANY_INFO.name}" />
                    </div>
                    <div class="header-right">
                      <h1>${COMPANY_INFO.name}</h1>
                      <p>${COMPANY_INFO.address}</p>
                      <p>${COMPANY_INFO.city}, ${COMPANY_INFO.state} ${COMPANY_INFO.zipCode}, ${COMPANY_INFO.country}</p>
                      <p>Email: ${COMPANY_INFO.email}</p>
                      <p>${COMPANY_PHONES_SHORT}</p>
                    </div>
                  </div>
                  
                  <div class="receipt-number">
                    Receipt #${item.receipt.receipt_number}
                  </div>
                  
                  <div class="section">
                    <div class="section-title">PACKAGE INFORMATION</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Package ID</div>
                        <div class="info-value">${receiptData.package_details.package_id}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Tracking Number</div>
                        <div class="info-value">${receiptData.package_details.tracking_number}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Description</div>
                        <div class="info-value">${receiptData.package_details.description}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Weight</div>
                        <div class="info-value">${receiptData.package_details.weight || 'N/A'} kg</div>
                      </div>
                      ${receiptData.package_details.store_name ? `
                      <div class="info-item">
                        <div class="info-label">Store</div>
                        <div class="info-value">${receiptData.package_details.store_name}</div>
                      </div>
                      ` : ''}
                      ${receiptData.package_details.vendor_name ? `
                      <div class="info-item">
                        <div class="info-label">Vendor</div>
                        <div class="info-value">${receiptData.package_details.vendor_name}</div>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  <div class="section">
                    <div class="section-title">CUSTOMER INFORMATION</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">Name</div>
                        <div class="info-value">${receiptData.customer_details.name}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Suite Number</div>
                        <div class="info-value">${receiptData.customer_details.suite_number}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${receiptData.customer_details.email}</div>
                      </div>
                      ${receiptData.customer_details.phone ? `
                      <div class="info-item">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${receiptData.customer_details.phone}</div>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                  
                  <div class="footer">
                    <p><strong>Generated:</strong> ${new Date(item.receipt.generated_at).toLocaleString()}</p>
                    <p style="margin-top: 10px;">This is an official receipt from VanguardCargo Warehouse</p>
                    <p>© 2025 VanguardCargo. All rights reserved.</p>
                  </div>
                </div>
                
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                    }, 500);
                  };
                </script>
              </body>
              </html>
            `);
            printWindow.document.close();
          }
          
          // Delay between opening windows to prevent browser blocking
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setSuccess(`Successfully opened ${successfulReceipts.length} receipt(s) for printing`);
        setTimeout(() => setSuccess(''), 4000);
      }

    } catch (err) {
      console.error('Error generating package receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate package receipts');
    } finally {
      setIsGeneratingReceipts('');
    }
  };

  // Filter and sort shipments (newest first for easy access)
  const filteredShipments = shipments
    .filter(shipment => {
      const matchesSearch = searchTerm === '' || 
        shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.delivery_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.delivery_country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by created_at in descending order (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusCounts = {
    all: totalShipments,
    shipped: shipments.filter(s => s.status === 'shipped').length,
    in_transit: shipments.filter(s => s.status === 'in_transit').length,
    arrived: shipments.filter(s => s.status === 'arrived').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Shipment History
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-red-100">
                Track and manage your shipments through every stage of delivery
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                <FiAlertCircle className="w-3 h-3 text-red-600" />
              </div>
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                <FiCheck className="w-3 h-3 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-800 flex-1">{success}</p>
            </div>
          </div>
        )}

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { key: 'all', label: 'All', icon: FiBox, gradient: 'from-gray-500 to-gray-600' },
            { key: 'shipped', label: 'Shipped', icon: FiSend, gradient: 'from-purple-500 to-purple-600' },
            { key: 'in_transit', label: 'In Transit', icon: FiMapPin, gradient: 'from-blue-500 to-blue-600' },
            { key: 'arrived', label: 'Arrived', icon: FiPackage, gradient: 'from-amber-500 to-amber-600' }
          ].map(({ key, label, icon: Icon, gradient }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as any)}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
                statusFilter === key
                  ? 'bg-white shadow-lg shadow-gray-200/50 scale-105 ring-2 ring-gray-900/5'
                  : 'bg-white/60 hover:bg-white shadow hover:shadow-md hover:scale-102'
              }`}
            >
              <div className="flex flex-col items-start gap-2">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left w-full">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-0.5">
                    {statusCounts[key as keyof typeof statusCounts]}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking number, recipient, city, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Shipments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <FiLoader className="w-12 h-12 text-red-500 animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">Loading shipments from database...</p>
              </div>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 sm:p-16">
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-gray-50 mb-4">
                  <FiSend className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create shipments from the Create Shipment page'
                  }
                </p>
              </div>
            </div>
          ) : (
            filteredShipments.map((shipment) => {
              const statusConfig = getStatusConfig(shipment.status);
              const nextStatus = getNextStatus(shipment.status);
              const nextStatusConfig = nextStatus ? getStatusConfig(nextStatus) : null;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedShipment === shipment.id;

              return (
                <div
                  key={shipment.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 overflow-hidden"
                >
                  {/* Main Content - Clickable to expand */}
                  <div 
                    className="p-5 sm:p-6 cursor-pointer"
                    onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
                          <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusConfig.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 font-mono truncate">
                              {shipment.tracking_number}
                            </h3>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {shipment.total_packages} {shipment.total_packages === 1 ? 'package' : 'packages'} · {shipment.total_weight_lbs || 0} lbs · {shipment.service_type}
                          </p>
                        </div>
                      </div>

                      {/* Expand Indicator */}
                      <div className="flex-shrink-0">
                        <FiChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                          <FiUser className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Recipient</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{shipment.recipient_name}</p>
                          <p className="text-xs text-gray-600 truncate">{shipment.recipient_phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                          <FiMapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Destination</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{shipment.delivery_city}, {shipment.delivery_country}</p>
                          <p className="text-xs text-gray-600 truncate">{shipment.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Update Button - Visible on Main Card */}
                    {nextStatus && nextStatusConfig && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShipmentStatus(shipment.id, nextStatus);
                          }}
                          disabled={isUpdating === shipment.id}
                          className={`w-full group relative overflow-hidden px-4 py-3 rounded-xl font-semibold text-sm sm:text-base text-white transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${nextStatusConfig.gradient} hover:shadow-xl hover:scale-[1.02] active:scale-100`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {isUpdating === shipment.id ? (
                              <>
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                <span>Updating to {nextStatusConfig.label}...</span>
                              </>
                            ) : (
                              <>
                                <nextStatusConfig.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Mark as {nextStatusConfig.label}</span>
                              </>
                            )}
                          </span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6 animate-in slide-in-from-top duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                            {new Date(shipment.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            <span className="text-gray-400">·</span>
                            {new Date(shipment.created_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            {new Date(shipment.updated_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                            <span className="text-gray-400">·</span>
                            {new Date(shipment.updated_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Service Type</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{shipment.service_type}</p>
                        </div>
                      </div>

                      {/* Document Action Buttons */}
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs font-medium text-gray-500 mb-3">Shipment Documents</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowWaybill(shipment.id);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <FiFileText className="w-4 h-4" />
                            <span className="text-sm font-medium">View Waybill</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPackageReceipts(shipment.id);
                            }}
                            disabled={isGeneratingReceipts === shipment.id}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isGeneratingReceipts === shipment.id ? (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                <span className="text-sm font-medium">Generating...</span>
                              </>
                            ) : (
                              <>
                                <FiDownload className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  Print Receipts {shipment.total_packages > 0 ? `(${shipment.total_packages})` : ''}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalShipments)} of {totalShipments} shipments</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? 'bg-red-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === totalPages
                          ? 'bg-red-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Waybill Viewer Modal */}
      {showWaybill && (
        <WaybillViewer
          shipmentId={showWaybill}
          onClose={() => setShowWaybill(null)}
          autoGenerate={true}
        />
      )}
    </div>
  );
};

export default ShipmentHistory;