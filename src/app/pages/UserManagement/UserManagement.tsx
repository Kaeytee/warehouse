/**
 * User Management Page
 *
 * Comprehensive user management interface for warehouse administrators.
 * Allows viewing, searching, and managing user status (activate/deactivate).
 * Follows clean code architecture, OOP principles, and best practices.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiMail,
  FiPhone,
  FiUser,
  FiShield
} from 'react-icons/fi';
import { UserManagementService, type User, type UserStats } from '../../../services/UserManagementService';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';

/**
 * User Management Component
 * 
 * Provides comprehensive user management capabilities including:
 * - View all users with details
 * - Filter users by status (active, inactive, suspended)
 * - Search users by name, email, or suite number
 * - Update user status (activate/deactivate)
 * - View user statistics
 * 
 * @returns {React.ReactElement} User Management interface
 */
const UserManagement: React.FC = () => {
  // Authentication and user context
  const { isAuthenticated } = useWarehouseAuth();

  // State management for user data
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Action states
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  /**
   * Load all users and statistics from database
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and statistics in parallel
      const [usersData, statsData] = await Promise.all([
        UserManagementService.getAllUsers(),
        UserManagementService.getUserStats()
      ]);

      setUsers(usersData);
      setFilteredUsers(usersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle manual refresh of data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  /**
   * Filter and search users based on current criteria
   */
  useEffect(() => {
    let result = [...users];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.suite_number?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(result);
  }, [statusFilter, searchQuery, users]);

  /**
   * Handle user status update (activate/deactivate)
   */
  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      setUpdatingUserId(userId);

      // Update status in database
      await UserManagementService.updateUserStatus(userId, newStatus);

      // Reload users to reflect changes
      await loadUsers();

      // Show success message (you can add a toast notification here)
      console.log(`User status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Load users on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  /**
   * Get status badge color classes
   */
  const getStatusColor = (status: string) => {
    return UserManagementService.getStatusColor(status);
  };

  /**
   * Get role badge color
   */
  const getRoleColor = (role: string) => {
    if (['admin', 'warehouse_admin', 'super_admin', 'superadmin'].includes(role)) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-blue-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                User Management
              </h1>
              <p className="mt-2 text-base sm:text-lg text-blue-100">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="flex gap-3">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30"
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
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

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6 mb-8">
            {/* Total Users Card */}
            <button
              onClick={() => setStatusFilter('all')}
              className={`group relative bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg shadow-gray-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-gray-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
                statusFilter === 'all' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
              }`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Total Users</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.total}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiUsers className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </button>

            {/* Active Users Card */}
            <button
              onClick={() => setStatusFilter('active')}
              className={`group relative bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
                statusFilter === 'active' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
              }`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Active</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.active}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiCheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </button>

            {/* Inactive Users Card */}
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`group relative bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl shadow-lg shadow-gray-400/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-gray-400/40 transition-all duration-300 overflow-hidden text-left w-full ${
                statusFilter === 'inactive' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
              }`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Inactive</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.inactive}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiXCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </button>

            {/* Suspended Users Card */}
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`group relative bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 overflow-hidden text-left w-full ${
                statusFilter === 'suspended' ? 'ring-4 ring-white ring-offset-2 scale-105' : 'hover:scale-102'
              }`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Suspended</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.suspended}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiAlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </button>

            {/* Clients Card */}
            <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Clients</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.clients}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiUser className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Admins Card */}
            <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 p-3 sm:p-6 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide mb-2">Admins</p>
                    <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{stats.admins}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl shadow-lg backdrop-blur-sm">
                    <FiShield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or suite number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiFilter className="mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Filter by Status:</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'inactive', 'suspended'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Suite</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <FiRefreshCw className="animate-spin h-8 w-8 text-blue-600 mr-3" />
                        <span className="text-gray-600">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* User Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {UserManagementService.formatUserName(user)}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Column */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.phone_number && (
                            <div className="flex items-center mb-1">
                              <FiPhone className="h-3 w-3 mr-1 text-gray-400" />
                              {user.phone_number}
                            </div>
                          )}
                          {user.whatsapp_number && (
                            <div className="flex items-center text-green-600">
                              <FiMail className="h-3 w-3 mr-1" />
                              {user.whatsapp_number}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Suite Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {user.suite_number || 'N/A'}
                        </span>
                      </td>

                      {/* Role Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleColor(user.role)}`}>
                          {UserManagementService.getRoleDisplayName(user.role)}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>

                      {/* Joined Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleStatusUpdate(user.id, 'inactive')}
                              disabled={updatingUserId === user.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Deactivate user"
                            >
                              <FiXCircle className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              disabled={updatingUserId === user.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Activate user"
                            >
                              <FiCheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {updatingUserId === user.id && (
                            <FiRefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
