/**
 * Package Management System
 *
 * Comprehensive package management interface for warehouse operations.
 * Handles package tracking, status updates, and inventory management.
 * Follows clean code architecture, OOP principles, and best practices.
 * 
 * @author Senior Software Engineer
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FiPackage, 
  FiCheckCircle, 
  FiFilter, 
  FiSearch, 
  FiEye,
  FiEdit3,
  FiTruck,
  FiBox,
  FiBarChart,
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { WarehouseService } from '../../../services/WarehouseService';

/**
 * Package Management System Interface
 * 
 * Provides comprehensive package management capabilities including:
 * - Real-time package tracking and status monitoring
 * - Advanced search and filtering options
 * - Package status updates and workflow management
 * - Bulk operations and export functionality
 * - Role-based access control for warehouse operations
 * 
 * @returns {React.ReactElement} Package Management System interface
 */
const PackageManagement: React.FC = () => {
  // Authentication and user context
  const { isAuthenticated, userId } = useWarehouseAuth();
  
  // State management for package data and UI
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  // Filter and search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  
  // Modal and action states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPackageForUpdate, setSelectedPackageForUpdate] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  
  // Package summary metrics
  const [summary, setSummary] = useState({
    totalPackages: 0,
    received: 0,
    processing: 0,
    shipped: 0,
    totalWeight: '0kg',
  });

  /**
   * Load packages from warehouse service
   * Fetches real-time package data and calculates summary metrics
   */
  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch packages from warehouse service
      const packageData = await WarehouseService.getPackages();
      setPackages(packageData);
      
      // Calculate summary metrics
      const metrics = calculateSummaryMetrics(packageData);
      setSummary(metrics);
      
    } catch (err) {
      console.error('Error loading packages:', err);
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Calculate summary metrics from package data
   * @param {Array} packageData - Array of package objects
   * @returns {Object} Summary metrics object
   */
  const calculateSummaryMetrics = (packageData: any[]) => {
    const totalPackages = packageData.length;
    const received = packageData.filter(pkg => pkg.status === 'received').length;
    const processing = packageData.filter(pkg => pkg.status === 'processing').length;
    const shipped = packageData.filter(pkg => pkg.status === 'shipped').length;
    
    // Calculate total weight
    const totalWeight = packageData.reduce((sum, pkg) => {
      // Handle both string and number weight formats
      let weight = 0;
      if (typeof pkg.weight === 'string') {
        weight = parseFloat(pkg.weight.replace('kg', '') || '0');
      } else if (typeof pkg.weight === 'number') {
        weight = pkg.weight;
      }
      return sum + weight;
    }, 0);
    
    return {
      totalPackages,
      received,
      processing,
      shipped,
      totalWeight: `${totalWeight.toFixed(1)}kg`
    };
  };
  
  /**
   * Handle package status update
   * @param {string} packageId - Package ID to update
   * @param {string} newStatus - New status to set
   */
  const handleStatusUpdate = async (packageId: string, newStatus: string) => {
    try {
      // Check user authentication
      if (!isAuthenticated || !userId) {
        setError('User authentication required');
        return;
      }

      await WarehouseService.updatePackageStatus(packageId, newStatus);
      
      // Refresh package data
      await loadPackages();
      
      // Close modal
      setShowStatusModal(false);
      setSelectedPackageForUpdate(null);
      setNewStatus('');
      
    } catch (err) {
      console.error('Error updating package status:', err);
      setError('Failed to update package status. Please try again.');
    }
  };
  
  /**
   * Handle bulk status update for selected packages
   * @param {string} status - New status to apply to selected packages
   */
  const handleBulkStatusUpdate = async (status: string) => {
    try {
      // Check user authentication
      if (!isAuthenticated || !userId) {
        setError('User authentication required');
        return;
      }

      // Update all selected packages
      await Promise.all(
        selectedPackages.map(packageId => 
          WarehouseService.updatePackageStatus(packageId, status)
        )
      );
      
      // Clear selection and refresh data
      setSelectedPackages([]);
      await loadPackages();
      
    } catch (err) {
      console.error('Error updating package statuses:', err);
      setError('Failed to update package statuses. Please try again.');
    }
  };
  
  // Load packages on component mount
  useEffect(() => {
    loadPackages();
  }, []);

  /**
   * Filter packages based on search criteria and filters
   * @returns {Array} Filtered package array
   */
  const filteredPackages = packages.filter(pkg => {
    // Search filter - matches package ID, barcode, client name, or tracking number
    const matchesSearch = search === '' || [
      pkg.package_id,
      pkg.barcode,
      pkg.client_name,
      pkg.tracking_number,
      pkg.suite_number
    ].some(field => 
      field?.toLowerCase().includes(search.toLowerCase())
    );
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    
    // Date range filter
    const matchesDateRange = !dateRange.start || !dateRange.end || (
      new Date(pkg.created_at) >= dateRange.start &&
      new Date(pkg.created_at) <= dateRange.end
    );
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });
  
  /**
   * Handle package selection for bulk operations
   * @param {string} packageId - Package ID to toggle selection
   */
  const togglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };
  
  /**
   * Select or deselect all visible packages
   */
  const toggleSelectAll = () => {
    if (selectedPackages.length === filteredPackages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(filteredPackages.map(pkg => pkg.package_id));
    }
  };

  // Package status options for filtering and updates
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ];
  
  /**
   * Get status badge styling based on package status
   * @param {string} status - Package status
   * @returns {string} CSS classes for status badge
   */
  const getStatusBadgeClass = (status: string) => {
    const statusClasses = {
      pending: 'border-yellow-400 text-yellow-600 bg-yellow-50',
      received: 'border-red-400 text-red-600 bg-red-50',
      processing: 'border-purple-400 text-purple-600 bg-purple-50',
      shipped: 'border-green-400 text-green-600 bg-green-50',
      delivered: 'border-gray-400 text-gray-600 bg-gray-50'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'border-gray-400 text-gray-600 bg-gray-50';
  };
  
  /**
   * Export filtered packages to CSV
   */
  const exportToCSV = () => {
    const csvData = filteredPackages.map(pkg => ({
      'Package ID': pkg.package_id,
      'Barcode': pkg.barcode,
      'Client': pkg.client_name,
      'Suite': pkg.suite_number,
      'Type': pkg.package_type,
      'Weight': pkg.weight,
      'Status': pkg.status,
      'Created': new Date(pkg.created_at).toLocaleDateString(),
      'Tracking': pkg.tracking_number
    }));
    
    // Convert to CSV and download
    const csv = [Object.keys(csvData[0]).join(',')]
      .concat(csvData.map(row => Object.values(row).join(',')))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packages-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="py-10 px-6 w-full">
      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* Page header with actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black mb-1">Package Management</h1>
          <p className="text-gray-400 text-sm">Comprehensive package tracking and inventory management</p>
        </div>
        <div className="flex gap-3">
          {/* Refresh button */}
          <button
            onClick={loadPackages}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Export button */}
          <button
            onClick={exportToCSV}
            disabled={filteredPackages.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FiDownload className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>
          

      {/* Package summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Total Packages Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[140px]">
          <span className="absolute top-4 right-4 text-red-500 text-2xl">
            <FiPackage />
          </span>
          <span className="text-gray-500 text-base mb-2">Total Packages</span>
          <span className="text-2xl font-bold text-[#0D1637]">{summary.totalPackages}</span>
          <span className="text-gray-300 text-xs mt-2">in warehouse</span>
        </div>
        
        {/* Received Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[140px]">
          <span className="absolute top-4 right-4 text-red-500 text-2xl">
            <FiBox />
          </span>
          <span className="text-gray-500 text-base mb-2">Received</span>
          <span className="text-2xl font-bold text-[#0D1637]">{summary.received}</span>
          <span className="text-gray-300 text-xs mt-2">awaiting processing</span>
        </div>
        
        {/* Processing Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[140px]">
          <span className="absolute top-4 right-4 text-purple-500 text-2xl">
            <FiBarChart />
          </span>
          <span className="text-gray-500 text-base mb-2">Processing</span>
          <span className="text-2xl font-bold text-[#0D1637]">{summary.processing}</span>
          <span className="text-gray-300 text-xs mt-2">being prepared</span>
        </div>
        
        {/* Shipped Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[140px]">
          <span className="absolute top-4 right-4 text-green-500 text-2xl">
            <FiTruck />
          </span>
          <span className="text-gray-500 text-base mb-2">Shipped</span>
          <span className="text-2xl font-bold text-[#0D1637]">{summary.shipped}</span>
          <span className="text-gray-300 text-xs mt-2">in transit</span>
        </div>
        
        {/* Total Weight Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col relative min-h-[140px]">
          <span className="absolute top-4 right-4 text-orange-500 text-2xl">
            <FiCheckCircle />
          </span>
          <span className="text-gray-500 text-base mb-2">Total Weight</span>
          <span className="text-2xl font-bold text-[#0D1637]">{summary.totalWeight}</span>
          <span className="text-gray-300 text-xs mt-2">current inventory</span>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedPackages.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-700 font-medium">
              {selectedPackages.length} package{selectedPackages.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('processing')}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
              >
                Mark Processing
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('shipped')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Mark Shipped
              </button>
              <button
                onClick={() => setSelectedPackages([])}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        {/* Search bar */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search packages by ID, barcode, client, or tracking number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400 text-sm shadow-sm"
          />
        </div>
        
        {/* Status filter */}
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-100 text-gray-900 text-sm shadow-sm min-w-[140px]"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        {/* Date range picker */}
        <div className="flex items-center gap-2">
          <DatePicker
            selected={dateRange.start}
            onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
            placeholderText="Start date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            dateFormat="MM/dd/yyyy"
          />
          <span className="text-gray-400">to</span>
          <DatePicker
            selected={dateRange.end}
            onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
            placeholderText="End date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            dateFormat="MM/dd/yyyy"
          />
        </div>
        
        {/* Clear filters */}
        {(search || statusFilter !== 'all' || dateRange.start || dateRange.end) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateRange({ start: null, end: null });
            }}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Package management table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiRefreshCw className="animate-spin text-red-500 mr-3" size={24} />
            <span className="text-gray-600">Loading packages...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiPackage className="text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {packages.length === 0 
                ? "No packages have been added to the warehouse yet."
                : "No packages match your current search and filter criteria."
              }
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPackages.length === filteredPackages.length && filteredPackages.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Package ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Suite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg: any) => (
                <tr key={pkg.package_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.package_id)}
                      onChange={() => togglePackageSelection(pkg.package_id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {pkg.package_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-700">
                    {pkg.barcode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pkg.client_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {pkg.suite_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {pkg.package_type || 'Package'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {pkg.weight || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold capitalize ${getStatusBadgeClass(pkg.status)}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" 
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedPackageForUpdate(pkg);
                          setNewStatus(pkg.status);
                          setShowStatusModal(true);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition-colors" 
                        title="Update Status"
                      >
                        <FiEdit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedPackageForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Package Status
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Package: <span className="font-medium">{selectedPackageForUpdate.package_id}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Client: <span className="font-medium">{selectedPackageForUpdate.client_name}</span>
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {statusOptions.filter(opt => opt.value !== 'all').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedPackageForUpdate(null);
                  setNewStatus('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedPackageForUpdate.package_id, newStatus)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;