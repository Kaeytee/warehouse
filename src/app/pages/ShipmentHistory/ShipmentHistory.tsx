import React, { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiMapPin, FiCheck, FiLoader, FiAlertCircle, FiSearch, FiChevronRight, FiClock, FiUser, FiBox, FiCalendar } from 'react-icons/fi';

interface Shipment {
  id: string;
  tracking_number: string;
  status: 'shipped' | 'in_transit' | 'arrived' | 'delivered';
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  total_weight: number;
  total_value: number;
  service_type: 'standard' | 'express' | 'overnight';
  created_at: string;
  updated_at: string;
  user_name: string;
  suite_number: string;
  packages_count: number;
}

const ShipmentHistory: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Shipment['status']>('all');
  const [isUpdating, setIsUpdating] = useState<string>('');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  // Mock data for demo
  useEffect(() => {
    setTimeout(() => {
      setShipments([
        {
          id: '1',
          tracking_number: 'VCG2024001234',
          status: 'shipped',
          recipient_name: 'John Doe',
          recipient_phone: '+1 234 567 8900',
          delivery_address: '123 Main Street, Apt 4B',
          delivery_city: 'New York',
          delivery_country: 'USA',
          total_weight: 2.5,
          total_value: 150,
          service_type: 'express',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'Sarah Johnson',
          suite_number: 'STE-001',
          packages_count: 2
        },
        {
          id: '2',
          tracking_number: 'VCG2024001235',
          status: 'in_transit',
          recipient_name: 'Jane Smith',
          recipient_phone: '+1 234 567 8901',
          delivery_address: '456 Oak Avenue',
          delivery_city: 'Los Angeles',
          delivery_country: 'USA',
          total_weight: 3.8,
          total_value: 250,
          service_type: 'standard',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'Michael Chen',
          suite_number: 'STE-002',
          packages_count: 1
        },
        {
          id: '3',
          tracking_number: 'VCG2024001236',
          status: 'arrived',
          recipient_name: 'Robert Williams',
          recipient_phone: '+1 234 567 8902',
          delivery_address: '789 Pine Street',
          delivery_city: 'Chicago',
          delivery_country: 'USA',
          total_weight: 1.2,
          total_value: 75,
          service_type: 'overnight',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'Emily Davis',
          suite_number: 'STE-003',
          packages_count: 3
        },
        {
          id: '4',
          tracking_number: 'VCG2024001237',
          status: 'delivered',
          recipient_name: 'Lisa Anderson',
          recipient_phone: '+1 234 567 8903',
          delivery_address: '321 Elm Drive',
          delivery_city: 'Miami',
          delivery_country: 'USA',
          total_weight: 4.5,
          total_value: 300,
          service_type: 'express',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'David Wilson',
          suite_number: 'STE-004',
          packages_count: 2
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  const updateShipmentStatus = async (shipmentId: string, newStatus: Shipment['status']) => {
    setIsUpdating(shipmentId);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1200));

    setShipments(prev => prev.map(shipment => 
      shipment.id === shipmentId 
        ? { ...shipment, status: newStatus, updated_at: new Date().toISOString() }
        : shipment
    ));

    setSuccess(`Shipment status updated to ${newStatus.replace('_', ' ')}`);
    setTimeout(() => setSuccess(''), 4000);
    setIsUpdating('');
  };

  const getStatusConfig = (status: Shipment['status']) => {
    const configs = {
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
    return configs[status];
  };

  const getNextStatus = (currentStatus: Shipment['status']): Shipment['status'] | null => {
    const flow = { shipped: 'in_transit', in_transit: 'arrived', arrived: 'delivered', delivered: null };
    return flow[currentStatus] as Shipment['status'] | null;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchTerm === '' || 
      shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.suite_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: shipments.length,
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
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
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
                  <div className="w-12 h-12 rounded-full border-4 border-gray-100"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading shipments...</p>
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
                              {shipment.tracking_number}
                            </h3>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {shipment.packages_count} {shipment.packages_count === 1 ? 'package' : 'packages'} · {shipment.total_weight} kg · {shipment.service_type}
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
                          <p className="text-sm font-semibold text-gray-900 truncate">{shipment.user_name}</p>
                          <p className="text-xs text-gray-600">Suite {shipment.suite_number}</p>
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
                          <p className="text-xs font-medium text-gray-500 mb-1">Total Value</p>
                          <p className="text-sm font-semibold text-gray-900">${shipment.total_value.toFixed(2)}</p>
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
      </div>
    </div>
  );
};

export default ShipmentHistory;