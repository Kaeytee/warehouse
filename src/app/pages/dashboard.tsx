import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';
import { DashboardService, type DashboardMetrics, type RecentPackage } from '../../services/DashboardService';
import {
  FiPackage,
  FiClock,
  FiAlertCircle,
  FiActivity,
  FiArrowRight,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
} from 'react-icons/fi';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';

/**
 * Professional Warehouse Dashboard Component
 * 
 * Provides comprehensive warehouse operations overview with real-time metrics,
 * performance indicators, and actionable insights aligned with database schema.
 * 
 * Features:
 * - Real-time warehouse metrics from Supabase
 * - Role-based access control
 * - Responsive design for all devices
 * - Professional UI/UX with clean design
 * - Performance analytics and KPIs
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, email, displayName, isLoading } = useWarehouseAuth();
  
  // Create user object for compatibility
  const user = isAuthenticated ? {
    email,
    role,
    name: displayName || 'Administrator',
    fullName: displayName || 'Administrator'
  } : null;
  
  // Helper function to check roles
  const hasRole = (requiredRole: string) => {
    return role === requiredRole || (requiredRole === 'admin' && role === 'superadmin');
  };
  
  // State management
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentPackages, setRecentPackages] = useState<RecentPackage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setError] = useState<string | null>(null);

  /**
   * Fetch comprehensive dashboard data from database
   */
  const fetchDashboardData = async () => {
    try {
      setIsLoadingMetrics(true);
      setError(null);
      
      // Fetch dashboard data in parallel
      const [metrics, packages] = await Promise.all([
        DashboardService.getDashboardMetrics(),
        DashboardService.getRecentPackages(8)
      ]);
      
      setDashboardMetrics(metrics);
      setRecentPackages(packages);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      setDashboardMetrics(null);
      setRecentPackages([]);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  /**
   * Handle manual refresh of data
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  /**
   * Format date for display
   */
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status color for packages
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'received': return 'bg-red-100 text-red-800 border-red-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Redirect to login if not authenticated (auth hook handles loading)
  if (!isAuthenticated && !isLoading) {
    navigate('/login');
    return null;
  }

  // Show loading state while fetching initial metrics
  if (isLoadingMetrics && !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading warehouse dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Main header content */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <FiActivity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Warehouse Operations</h1>
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                      <FiMapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="break-all sm:break-normal">ALX-E2: 4700 Eisenhower Avenue, Alexandria, VA 22304</span>
                    </div>
                  </div>
                </div>
                {user && (
                  <div className="hidden md:flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Administrator
                    </span>
                  </div>
                )}
              </div>
              
              {/* Controls section - stacks on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* User role badge for mobile */}
                {user && (
                  <div className="md:hidden">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Administrator
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      <FiCalendar className="h-4 w-4 mr-1" />
                      {formatDate(lastUpdated)}
                    </div>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <FiRefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {/* Packages Received */}
          <div className="group relative bg-gradient-to-br from-white via-white to-green-50/30 rounded-xl shadow-sm border border-gray-200/60 p-3 sm:p-6 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:border-green-200/60 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Packages Received</p>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {dashboardMetrics?.receivedPackages || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Today's intake</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiPackage className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => navigate('/intake')}
                  className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-semibold flex items-center space-x-1 hover:space-x-2 transition-all duration-200 group/btn"
                >
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                  <FiArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Packages Processing */}
          <div className="group relative bg-gradient-to-br from-white via-white to-red-50/30 rounded-xl shadow-sm border border-gray-200/60 p-3 sm:p-6 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:border-red-200/60 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Processing</p>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {dashboardMetrics?.processingPackages || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Ready to ship</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiClock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => navigate('/inventory')}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 hover:space-x-2 transition-all duration-200 group/btn"
                >
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                  <FiArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Shipments */}
          <div className="group relative bg-gradient-to-br from-white via-white to-purple-50/30 rounded-xl shadow-sm border border-gray-200/60 p-3 sm:p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-200/60 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Shipments</p>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {dashboardMetrics?.inTransitShipments || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">In transit</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                  <HiOutlinePaperAirplane className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                {hasRole('admin') || hasRole('superadmin') ? (
                  <button 
                    onClick={() => navigate('/shipments')}
                    className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center space-x-1 hover:space-x-2 transition-all duration-200 group/btn"
                  >
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">Details</span>
                    <FiArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">Access Restricted</span>
                )}
              </div>
            </div>
          </div>

          {/* Pending Packages */}
          <div className="group relative bg-gradient-to-br from-white via-white to-amber-50/30 rounded-xl shadow-sm border border-gray-200/60 p-3 sm:p-6 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:border-amber-200/60 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending</p>
                  </div>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {dashboardMetrics?.pendingPackages || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">Awaiting processing</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all duration-300 group-hover:scale-110">
                  <FiAlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => navigate('/inventory?status=pending')}
                  className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1 hover:space-x-2 transition-all duration-200 group/btn"
                >
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">Details</span>
                  <FiArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => navigate('/inventory')}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              View All <FiArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          {recentPackages.length > 0 ? (
            <div className="space-y-4">
              {recentPackages.map((pkg) => (
                <div key={pkg.packageId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FiPackage className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pkg.userName}</p>
                      <p className="text-sm text-gray-600">Suite: {pkg.userSuite}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pkg.status)}`}>
                      {pkg.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{pkg.packageId}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiActivity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Package activity will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;