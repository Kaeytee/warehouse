/**
 * PackageSelector.tsx
 * 
 * Package Selection Component for Group Management Dashboard
 * Allows admins to select packages for grouping operations
 * Features multi-select, filtering, search, and bulk operations
 * 
 * Key Features:
 * - Multi-select packages with checkboxes
 * - Search and filter functionality
 * - Bulk select/deselect operations
 * - Package details preview
 * - Status-based filtering
 * - Responsive table design with Tailwind CSS
 * 
 * @author Senior Software Engineer
 * @version 2.0.0 - Migrated to Tailwind CSS
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  FaSearch, 
  FaTimes, 
  FaEye,
  FaBox,
  FaCalendar,
  FaUser,
  FaArrowRight,
  FaCheck
} from 'react-icons/fa';
import type { Package } from '../../../core/models/Package';
import { PackagePriority } from '../../../core/models/Package';
import { PackageStatus, StatusUtils } from '../../../core/status/StatusDefinitions';

/**
 * Props interface for PackageSelector component
 */
interface PackageSelectorProps {
  readonly packages: Package[];                                    // Available packages for selection
  readonly selectedPackages: Set<string>;                         // Currently selected package IDs
  readonly onPackageSelection: (packageId: string) => void;       // Handle individual package selection
  readonly onBulkSelection: (packageIds: string[], selected: boolean) => void; // Handle bulk selection
  readonly onNext: () => void;                                     // Proceed to next step
  readonly onCancel: () => void;                                   // Cancel selection process
}

/**
 * Filter options for package selection
 */
interface PackageFilters {
  readonly search: string;                                         // Search query
  readonly status: PackageStatus | 'all';                        // Status filter
  readonly priority: PackagePriority | 'all';                    // Priority filter
  readonly dateRange: 'all' | 'today' | 'week' | 'month';       // Date range filter
}

/**
 * PackageSelector Component
 * Handles package selection workflow with advanced filtering and search
 */
const PackageSelector: React.FC<PackageSelectorProps> = ({
  packages,
  selectedPackages,
  onPackageSelection,
  onBulkSelection,
  onNext,
  onCancel
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Current filter settings */
  const [filters, setFilters] = useState<PackageFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    dateRange: 'all'
  });

  /** Show/hide filter panel */
  const [showFilters, setShowFilters] = useState<boolean>(false);

  /** Selected package for detail view */
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<Package | null>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Filter packages based on current filter settings
   * Applies search, status, priority, and date range filters
   */
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      // Search filter - check multiple fields
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pkg.id.toLowerCase().includes(searchLower) ||
          pkg.trackingNumber.toLowerCase().includes(searchLower) ||
          pkg.clientName.toLowerCase().includes(searchLower) ||
          pkg.description.toLowerCase().includes(searchLower) ||
          pkg.origin.address.toLowerCase().includes(searchLower) ||
          pkg.destination.address.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && pkg.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && pkg.priority !== filters.priority) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const packageDate = new Date(pkg.createdAt);
        const now = new Date();
        const diffTime = now.getTime() - packageDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [packages, filters]);

  /**
   * Check if all visible packages are selected
   */
  const allVisibleSelected = useMemo(() => {
    return filteredPackages.length > 0 && 
           filteredPackages.every(pkg => selectedPackages.has(pkg.id));
  }, [filteredPackages, selectedPackages]);

  /**
   * Check if some (but not all) visible packages are selected
   */
  const someVisibleSelected = useMemo(() => {
    return filteredPackages.some(pkg => selectedPackages.has(pkg.id)) && !allVisibleSelected;
  }, [filteredPackages, selectedPackages, allVisibleSelected]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle search input change
   * Updates search filter with debouncing consideration
   */
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value
    }));
  }, []);

  /**
   * Handle filter changes
   * Updates specific filter values
   */
  const handleFilterChange = useCallback((filterKey: keyof PackageFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  /**
   * Handle bulk select/deselect all visible packages
   * Toggles selection state for all filtered packages
   */
  const handleBulkSelectAll = useCallback(() => {
    const packageIds = filteredPackages.map(pkg => pkg.id);
    onBulkSelection(packageIds, !allVisibleSelected);
  }, [filteredPackages, allVisibleSelected, onBulkSelection]);

  /**
   * Clear all filters and reset to default state
   */
  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      dateRange: 'all'
    });
  }, []);

  /**
   * Format package weight for display
   */
  const formatWeight = useCallback((weight: number): string => {
    return `${weight.toFixed(1)} kg`;
  }, []);

  /**
   * Format package dimensions for display
   */
  const formatDimensions = useCallback((dimensions: Package['dimensions']): string => {
    return `${dimensions.length}×${dimensions.width}×${dimensions.height} cm`;
  }, []);

  /**
   * Get priority badge styling based on priority level
   */
  const getPriorityBadgeClass = useCallback((priority: PackagePriority): string => {
    switch (priority) {
      case PackagePriority.URGENT:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200';
      case PackagePriority.HIGH:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200';
      case PackagePriority.MEDIUM:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200';
      case PackagePriority.LOW:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200';
      default:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200';
    }
  }, []);

  /**
   * Get status badge styling based on status
   */
  const getStatusBadgeClass = useCallback((status: PackageStatus): string => {
    switch (status) {
      case PackageStatus.PENDING:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800';
      case PackageStatus.PROCESSING:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800';
      case PackageStatus.SHIPPED:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800';
      case PackageStatus.DELIVERED:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800';
      default:
        return 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800';
    }
  }, []);

  /**
   * Handle package detail preview
   */
  const handlePreview = useCallback((pkg: Package) => {
    setSelectedPackageDetail(pkg);
  }, []);

  /**
   * Close package detail preview
   */
  const handleClosePreview = useCallback(() => {
    setSelectedPackageDetail(null);
  }, []);

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className="p-6 bg-white rounded-xl min-h-[600px]">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-gray-200">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select Packages for Grouping
          </h2>
          <p className="text-base text-gray-600">
            Choose packages to group together for batch processing and delivery optimization.
            Selected: <span className="font-semibold text-red-600">{selectedPackages.size}</span> packages
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-200 hover:text-gray-800 transition-all duration-200 min-w-[120px] justify-center"
          >
            <FaTimes className="w-4 h-4" />
            Cancel
          </button>
          
          <button
            onClick={onNext}
            disabled={selectedPackages.size === 0}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/30 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-200 min-w-[120px] justify-center"
          >
            Next Step
            <FaArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search packages by ID, tracking number, client, description, or location..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg font-medium transition-all duration-200 ${
              showFilters 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaSearch className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={handleBulkSelectAll}
            className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors duration-200"
          >
            <FaCheck className="w-4 h-4" />
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Statuses</option>
                  {Object.values(PackageStatus).map(status => (
                    <option key={status} value={status}>
                      {StatusUtils.formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Priorities</option>
                  {Object.values(PackagePriority).map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredPackages.length}</span> of{' '}
          <span className="font-semibold">{packages.length}</span> packages
        </p>
        
        {selectedPackages.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Selected:</span>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              {selectedPackages.size} packages
            </span>
          </div>
        )}
      </div>

      {/* Package Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someVisibleSelected;
                    }}
                    onChange={handleBulkSelectAll}
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                    title="Select/Deselect All"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg) => (
                <tr 
                  key={pkg.id}
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    selectedPackages.has(pkg.id) ? 'bg-red-50 border-l-4 border-red-500' : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPackages.has(pkg.id)}
                      onChange={() => onPackageSelection(pkg.id)}
                      className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                      title={`Select package ${pkg.trackingNumber}`}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-gray-900">
                      {pkg.trackingNumber}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{pkg.clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{pkg.destination.address}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={getStatusBadgeClass(pkg.status)}>
                      {StatusUtils.formatStatus(pkg.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={getPriorityBadgeClass(pkg.priority)}>
                      {pkg.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatWeight(pkg.weight)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDimensions(pkg.dimensions)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaCalendar className="w-4 h-4 text-gray-400 mr-2" />
                      {new Date(pkg.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handlePreview(pkg)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-150"
                      title="Preview Package Details"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPackages.length === 0 && (
            <div className="text-center py-12">
              <FaBox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Package Preview Modal */}
      {selectedPackageDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePreview}>
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPackageDetail.trackingNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackageDetail.clientName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-block ${getStatusBadgeClass(selectedPackageDetail.status)}`}>
                    {StatusUtils.formatStatus(selectedPackageDetail.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`mt-1 inline-block ${getPriorityBadgeClass(selectedPackageDetail.priority)}`}>
                    {selectedPackageDetail.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight</label>
                  <p className="mt-1 text-sm text-gray-900">{formatWeight(selectedPackageDetail.weight)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDimensions(selectedPackageDetail.dimensions)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPackageDetail.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origin</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackageDetail.origin.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPackageDetail.destination.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageSelector;
