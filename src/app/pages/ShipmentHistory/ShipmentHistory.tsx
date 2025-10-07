import React, { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiMapPin, FiCheck, FiLoader, FiAlertCircle, FiSearch, FiChevronRight, FiClock, FiUser, FiBox, FiCalendar } from 'react-icons/fi';
import { warehouseShipmentService, type ShipmentData, type ShipmentStatus } from '../../../services/warehouseShipmentService';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';

/**
 * Shipment interface matching the backend data structure
 */
interface Shipment {
  id: string;
  shipment_number: string;
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
  customer_name?: string;
  customer_email?: string;
  user_id: string;
}

const ShipmentHistory: React.FC = () => {
  const { userId } = useWarehouseAuth();
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
        shipment_number: shipment.tracking_number, // Map tracking_number to shipment_number for display
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
        total_packages: 1, // Default value, will need to calculate from package_shipments table
        total_cost: shipment.shipping_cost,
        service_type: shipment.service_type,
        created_at: shipment.created_at,
        updated_at: shipment.updated_at,
        customer_name: shipment.customer_name,
        customer_email: shipment.customer_email,
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
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      await warehouseShipmentService.updateShipmentStatus(
        shipmentId, 
        newStatus, 
        userId, 
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
        icon: FiTruck,
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
      arrived: 'delivered', 
      delivered: null
    };
    return flow[currentStatus];
  };

  // Filter and sort shipments (newest first for easy access)
  const filteredShipments = shipments
    .filter(shipment => {
      const matchesSearch = searchTerm === '' || 
        shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipment.customer_name && shipment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

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
    arrived: shipments.filter(s => s.status === 'arrived').length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <FiTruck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
              Shipment History
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 ml-0 sm:ml-14">
            Track and manage your shipments through every stage of delivery
          </p>
        </div>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { key: 'all', label: 'All', icon: FiBox, gradient: 'from-gray-500 to-gray-600' },
            { key: 'shipped', label: 'Shipped', icon: FiTruck, gradient: 'from-purple-500 to-purple-600' },
            { key: 'in_transit', label: 'In Transit', icon: FiMapPin, gradient: 'from-blue-500 to-blue-600' },
            { key: 'arrived', label: 'Arrived', icon: FiPackage, gradient: 'from-amber-500 to-amber-600' },
            { key: 'delivered', label: 'Delivered', icon: FiCheck, gradient: 'from-emerald-500 to-emerald-600' }
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
              placeholder="Search by tracking number, recipient, customer, or suite..."
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
                  <FiTruck className="w-8 h-8 text-gray-400" />
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
                  {/* Main Content */}
                  <div className="p-5 sm:p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl ${statusConfig.bg} border ${statusConfig.border}`}>
                          <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusConfig.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 font-mono truncate">
                              {shipment.shipment_number}
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

                      {/* Status Update Button */}
                      {nextStatus && nextStatusConfig && (
                        <button
                          onClick={() => updateShipmentStatus(shipment.id, nextStatus)}
                          disabled={isUpdating === shipment.id}
                          className={`flex-shrink-0 group relative overflow-hidden px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium text-sm text-white transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${nextStatusConfig.gradient} hover:shadow-xl hover:scale-105 active:scale-100`}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {isUpdating === shipment.id ? (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                <span className="hidden sm:inline">Updating...</span>
                              </>
                            ) : (
                              <>
                                <nextStatusConfig.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">Mark {nextStatusConfig.label}</span>
                                <span className="sm:hidden">Update</span>
                              </>
                            )}
                          </span>
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                      )}
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
                          <FiBox className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Customer</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{shipment.customer_name || 'Unknown Customer'}</p>
                          <p className="text-xs text-gray-600">ID: {shipment.user_id.substring(0, 8)}...</p>
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

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                      className="mt-4 w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isExpanded ? 'Show Less' : 'Show More Details'}
                      <FiChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6 animate-in slide-in-from-top duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  );
};

export default ShipmentHistory;