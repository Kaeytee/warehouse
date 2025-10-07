/**
 * Verification Logs Dashboard
 * 
 * Admin dashboard for viewing package delivery verification attempts
 * Shows all verification logs with filtering and search
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { FiShield, FiCheckCircle, FiXCircle, FiSearch, FiFilter, FiDownload } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VerificationLog {
  id: string;
  package_id: string;
  suite_number: string;
  verification_success: boolean;
  failure_reason: string | null;
  verified_by: string;
  verified_by_role: string;
  verified_at: string;
  // Joined data
  package_tracking?: string;
  verified_by_name?: string;
}

interface LogFilters {
  success?: boolean | null;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ============================================================================
// VERIFICATION LOGS DASHBOARD COMPONENT
// ============================================================================

export const VerificationLogsDashboard: React.FC = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const { userId } = useWarehouseAuth();

  // Data state
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filter state
  const [filters, setFilters] = useState<LogFilters>({
    success: null,
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const logsPerPage = 20;

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    todayCount: 0
  });

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Load verification logs on mount and filter change
   */
  useEffect(() => {
    loadVerificationLogs();
  }, [currentPage, filters]);

  /**
   * Calculate statistics when logs change
   */
  useEffect(() => {
    calculateStatistics();
  }, [logs]);

  // ========================================
  // DATA LOADING
  // ========================================

  /**
   * Load verification logs from database
   * Applies filters and pagination
   */
  const loadVerificationLogs = async (): Promise<void> => {
    setIsLoading(true);
    setError('');

    try {
      // Build query with filters
      let query = supabase
        .from('package_verification_log')
        .select(`
          *,
          packages (
            tracking_number
          ),
          users!package_verification_log_verified_by_fkey (
            first_name,
            last_name
          )
        `, { count: 'exact' })
        .order('verified_at', { ascending: false });

      // Apply success filter
      if (filters.success !== null && filters.success !== undefined) {
        query = query.eq('verification_success', filters.success);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('verified_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('verified_at', filters.dateTo);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`suite_number.ilike.%${filters.search}%,package_id.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (currentPage - 1) * logsPerPage;
      query = query.range(offset, offset + logsPerPage - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw queryError;
      }

      // Transform data
      const transformedLogs: VerificationLog[] = (data || []).map((log: any) => ({
        id: log.id,
        package_id: log.package_id,
        suite_number: log.suite_number,
        verification_success: log.verification_success,
        failure_reason: log.failure_reason,
        verified_by: log.verified_by,
        verified_by_role: log.verified_by_role,
        verified_at: log.verified_at,
        package_tracking: log.packages?.tracking_number,
        verified_by_name: log.users ? `${log.users.first_name} ${log.users.last_name}` : 'Unknown'
      }));

      setLogs(transformedLogs);
      setTotalCount(count || 0);

    } catch (err) {
      console.error('Failed to load verification logs:', err);
      setError('Failed to load verification logs');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calculate statistics from current logs
   */
  const calculateStatistics = (): void => {
    const total = logs.length;
    const successful = logs.filter(log => log.verification_success).length;
    const failed = logs.filter(log => !log.verification_success).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = logs.filter(log => new Date(log.verified_at) >= today).length;

    setStats({ total, successful, failed, todayCount });
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof LogFilters, value: any): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = (): void => {
    setFilters({
      success: null,
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setCurrentPage(1);
  };

  /**
   * Export logs to CSV
   */
  const handleExportCSV = (): void => {
    const csvContent = [
      ['Date/Time', 'Package ID', 'Suite Number', 'Success', 'Failure Reason', 'Verified By', 'Role'],
      ...logs.map(log => [
        formatDateTime(log.verified_at),
        log.package_tracking || log.package_id,
        log.suite_number,
        log.verification_success ? 'Yes' : 'No',
        log.failure_reason || 'N/A',
        log.verified_by_name || 'Unknown',
        log.verified_by_role
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Format date and time for display
   */
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(totalCount / logsPerPage);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiShield className="text-purple-600" />
            Verification Logs Dashboard
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Monitor all package delivery verification attempts
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
        >
          <FiDownload />
          Export CSV
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiShield className="text-blue-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-green-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-800">{stats.successful}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiXCircle className="text-red-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-800">{stats.failed}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FiShield className="text-yellow-600 text-2xl" />
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-800">{stats.todayCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Suite or Package ID"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Success Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.success === null ? '' : filters.success.toString()}
              onChange={(e) => handleFilterChange('success', e.target.value === '' ? null : e.target.value === 'true')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={loadVerificationLogs}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Logs Table */}
      {!isLoading && logs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date/Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Package ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Suite Number</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Result</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Failure Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Verified By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDateTime(log.verified_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-800">
                      {log.package_tracking || log.package_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-800">
                      {log.suite_number}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.verification_success ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          <FiCheckCircle />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                          <FiXCircle />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.failure_reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.verified_by_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.verified_by_role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, totalCount)} of {totalCount} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && logs.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <FiShield className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Verification Logs Found</h3>
          <p className="text-gray-600">
            {filters.search || filters.success !== null ? 'Try adjusting your filters' : 'No verification attempts have been logged yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationLogsDashboard;
