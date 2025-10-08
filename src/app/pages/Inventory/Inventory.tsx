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
  FiSend,
  FiBox,
  FiBarChart,
  FiRefreshCw,
  FiDownload,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiPrinter
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { WarehouseService } from '../../../services/WarehouseService';
import { ReceiptViewer } from '../../../components/warehouse/ReceiptViewer';
import { supabase } from '../../../lib/supabase';
import type { ReceiptData } from '../../../services/warehouseDocumentService';

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
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [selectedPackageForView, setSelectedPackageForView] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  
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
   * Close package details modal
   */
  const closeDetailsModal = () => {
    setShowPackageDetailsModal(false);
    setSelectedPackageForView(null);
  };
  
  /**
   * Fetch and display receipt for a package
   * @param {any} pkg - Package object
   */
  const handlePrintReceipt = async (pkg: any) => {
    try {
      setLoadingReceipt(true);
      setError(null);
      
      // Check if package has been processed through shipment
      if (pkg.status === 'received' || pkg.status === 'pending') {
        setError('Receipt not available. Package has not been processed through shipment yet.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      // Fetch receipt from database
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .select('*')
        .eq('package_id', pkg.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (receiptError || !receipt) {
        console.error('Error fetching receipt:', receiptError);
        setError('Receipt not found for this package.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      // Convert receipt to ReceiptData format
      const receiptData: ReceiptData = {
        receipt_id: receipt.id,
        receipt_number: receipt.receipt_number,
        receipt_type: receipt.receipt_type,
        package_id: receipt.package_id,
        shipment_id: receipt.shipment_id,
        user_id: receipt.user_id,
        suite_number: receipt.suite_number,
        warehouse_name: receipt.warehouse_name,
        receipt_data: receipt.receipt_data,
        barcode_data: receipt.barcode_data,
        generated_by: receipt.generated_by,
        generated_at: receipt.generated_at,
        printed_at: receipt.printed_at,
        created_at: receipt.created_at,
        updated_at: receipt.updated_at
      };
      
      setSelectedReceipt(receiptData);
      setShowReceiptModal(true);
      
    } catch (err) {
      console.error('Error loading receipt:', err);
      setError('Failed to load receipt. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingReceipt(false);
    }
  };
  
  /**
   * Close receipt modal
   */
  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedReceipt(null);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Inventory Management
              </h1>
              <p className="mt-2 text-base sm:text-lg text-red-100">
                Comprehensive package tracking and inventory management
              </p>
            </div>
            <div className="flex gap-3">
              {/* Refresh button */}
              <button
                onClick={loadPackages}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {/* Export button */}
              <button
                onClick={exportToCSV}
                disabled={filteredPackages.length === 0}
                className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30"
              >
                <FiDownload className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
          

      {/* Package summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
        {/* Total Packages Card */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`group relative bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg shadow-gray-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-gray-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
            statusFilter === 'all' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
          }`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Total Packages</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {summary.totalPackages}
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">In warehouse</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                <FiPackage className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </button>
        
        {/* Received Card */}
        <button
          onClick={() => setStatusFilter('received')}
          className={`group relative bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
            statusFilter === 'received' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
          }`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Received</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {summary.received}
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">Awaiting processing</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                <FiBox className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </button>
        
        {/* Processing Card */}
        <button
          onClick={() => setStatusFilter('processing')}
          className={`group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
            statusFilter === 'processing' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
          }`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Processing</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {summary.processing}
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">Being prepared</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                <FiBarChart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </button>
        
        {/* Shipped Card */}
        <button
          onClick={() => setStatusFilter('shipped')}
          className={`group relative bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
            statusFilter === 'shipped' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
          }`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Shipped</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {summary.shipped}
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">In transit</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                <FiSend className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </button>
        
        {/* Total Weight Card - Info Only (Not Clickable) */}
        <div className="group relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-300 overflow-hidden cursor-default">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Total Weight</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold text-white mb-1">
                  {summary.totalWeight}
                </p>
                <p className="text-xs sm:text-sm text-white/80 font-medium">Current inventory</p>
              </div>
              <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110">
                <FiCheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
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
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 bg-white"
            dateFormat="MM/dd/yyyy"
          />
          <span className="text-gray-400">to</span>
          <DatePicker
            selected={dateRange.end}
            onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
            placeholderText="End date"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 bg-white"
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
                        onClick={() => {
                          setSelectedPackageForView(pkg);
                          setShowPackageDetailsModal(true);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" 
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      
                      {/* Print Receipt - Only show if package has been processed */}
                      {pkg.status !== 'received' && pkg.status !== 'pending' && (
                        <button 
                          onClick={() => handlePrintReceipt(pkg)}
                          disabled={loadingReceipt}
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50" 
                          title="Print Receipt"
                        >
                          <FiPrinter size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Package Details Modal */}
      {showPackageDetailsModal && selectedPackageForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetailsModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Package Details</h3>
                  <p className="text-red-100 text-sm mt-1">Complete package information</p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Package ID Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Package ID</h4>
                <p className="text-2xl font-bold text-gray-900 font-mono">{selectedPackageForView.package_id}</p>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Client Name
                  </h4>
                  <p className="text-base font-semibold text-gray-900">{selectedPackageForView.client_name}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="text-xs font-semibold text-purple-700 uppercase mb-2 flex items-center gap-2">
                    <FiPackage className="w-4 h-4" />
                    Suite Number
                  </h4>
                  <p className="text-base font-semibold text-gray-900">{selectedPackageForView.suite_number}</p>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Package Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Barcode</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{selectedPackageForView.barcode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Package Type</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPackageForView.package_type || 'Package'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Weight</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPackageForView.weight || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold capitalize ${getStatusBadgeClass(selectedPackageForView.status)}`}>
                      {selectedPackageForView.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {selectedPackageForView.tracking_number && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h4 className="text-xs font-semibold text-green-700 uppercase mb-2">Tracking Number</h4>
                  <p className="text-base font-mono font-bold text-gray-900">{selectedPackageForView.tracking_number}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Timeline</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Created At</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date(selectedPackageForView.created_at).toLocaleString()}</span>
                  </div>
                  {selectedPackageForView.updated_at && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Last Updated</span>
                      <span className="text-sm font-semibold text-gray-900">{new Date(selectedPackageForView.updated_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {selectedPackageForView.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-2">
                    <FiFileText className="w-4 h-4" />
                    Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedPackageForView.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {showReceiptModal && selectedReceipt && (
        <ReceiptViewer 
          receipt={selectedReceipt}
          onClose={closeReceiptModal}
        />
      )}
    </div>
  );
};

export default PackageManagement;