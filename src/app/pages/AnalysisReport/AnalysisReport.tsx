import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiCalendar, FiDownload, FiPackage, FiUsers, FiBox, FiActivity, FiArrowUp, FiArrowDown, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { AnalyticsService, type ShipmentAnalytics, type PackageAnalytics, type UserAnalytics } from '../../../services/AnalyticsService';
import { useTheme, type ThemeType } from '../../../contexts/ThemeContext';

interface MetricData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

const AnalysisReport: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('month');
  const [reportType, setReportType] = useState<string>('shipments');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Theme context for dynamic colors
  const { setTheme, colors: themeColors } = useTheme();

  // Update theme when report type changes
  useEffect(() => {
    setTheme(reportType as ThemeType);
  }, [reportType, setTheme]);

  // Real analytics data state
  const [shipmentAnalytics, setShipmentAnalytics] = useState<ShipmentAnalytics | null>(null);
  const [packageAnalytics, setPackageAnalytics] = useState<PackageAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);

  /**
   * Fetch real analytics data from Supabase database
   */
  const fetchAnalyticsData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all analytics data in parallel from database
      const [shipments, packages, users] = await Promise.all([
        AnalyticsService.getShipmentAnalytics(timeRange),
        AnalyticsService.getPackageAnalytics(timeRange),
        AnalyticsService.getUserAnalytics(timeRange)
      ]);

      setShipmentAnalytics(shipments);
      setPackageAnalytics(packages);
      setUserAnalytics(users);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data from database');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, reportType]);

  /**
   * Get real metrics data from database based on report type
   */
  const getMetricsForType = (): MetricData[] => {
    switch (reportType) {
      case 'shipments':
        if (!shipmentAnalytics) return [];
        return [
          { 
            label: 'Total Shipments', 
            value: shipmentAnalytics.totalShipments.toLocaleString(),
            changeLabel: 'total shipments'
          },
          { 
            label: 'In Transit', 
            value: shipmentAnalytics.inTransitShipments.toLocaleString(),
            changeLabel: 'currently in transit'
          },
          { 
            label: 'Completed', 
            value: shipmentAnalytics.completedShipments.toLocaleString(),
            changeLabel: 'successfully delivered'
          },
          { 
            label: 'On-Time Rate', 
            value: shipmentAnalytics.onTimeDeliveryRate,
            changeLabel: 'delivery performance'
          },
          { 
            label: 'Avg Delivery Time', 
            value: shipmentAnalytics.averageDeliveryTime,
            changeLabel: 'processing efficiency'
          },
          { 
            label: 'Total Value', 
            value: `$${shipmentAnalytics.totalShipmentValue.toLocaleString()}`,
            changeLabel: 'shipment value'
          }
        ];
      case 'packages':
        if (!packageAnalytics) return [];
        return [
          { 
            label: 'Total Packages', 
            value: packageAnalytics.totalPackages.toLocaleString(),
            changeLabel: 'all packages'
          },
          { 
            label: 'Pending', 
            value: packageAnalytics.pendingPackages.toLocaleString(),
            changeLabel: 'awaiting processing'
          },
          { 
            label: 'Processing', 
            value: packageAnalytics.processingPackages.toLocaleString(),
            changeLabel: 'currently processing'
          },
          { 
            label: 'Delivered', 
            value: packageAnalytics.deliveredPackages.toLocaleString(),
            changeLabel: 'successfully delivered'
          },
          { 
            label: 'Avg Weight', 
            value: `${packageAnalytics.averagePackageWeight.toFixed(2)} kg`,
            changeLabel: 'package weight'
          },
          { 
            label: 'Total Value', 
            value: `$${packageAnalytics.totalPackageValue.toLocaleString()}`,
            changeLabel: 'declared value'
          }
        ];
      case 'users':
        if (!userAnalytics) return [];
        return [
          { 
            label: 'Total Users', 
            value: userAnalytics.totalUsers.toLocaleString(),
            changeLabel: 'registered users'
          },
          { 
            label: 'Active Users', 
            value: userAnalytics.activeUsers.toLocaleString(),
            changeLabel: 'currently active'
          },
          { 
            label: 'New This Month', 
            value: userAnalytics.newUsersThisMonth.toLocaleString(),
            changeLabel: 'new registrations'
          },
          { 
            label: 'Inactive Users', 
            value: userAnalytics.inactiveUsers.toLocaleString(),
            changeLabel: 'inactive accounts'
          },
          { 
            label: 'Suspended', 
            value: userAnalytics.suspendedUsers.toLocaleString(),
            changeLabel: 'suspended accounts'
          },
          { 
            label: 'Top Users', 
            value: userAnalytics.topUsersBySuites.length.toString(),
            changeLabel: 'most active users'
          }
        ];
      default:
        return [];
    }
  };



  /**
   * Handle data export using real analytics data
   */
  const handleExport = () => {
    const currentData = getMetricsForType();
    if (currentData.length > 0) {
      // Convert metrics to exportable format
      const exportData = currentData.reduce((acc, metric) => {
        acc[metric.label.replace(/\s+/g, '_').toLowerCase()] = metric.value;
        return acc;
      }, {} as Record<string, any>);
      
      AnalyticsService.exportToCSV(exportData, `${reportType}_analytics_${timeRange}`);
    } else {
      console.warn('No data available for export');
    }
  };

  /**
   * Handle manual refresh of analytics data
   */
  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  const metrics = getMetricsForType();
  // Use theme colors instead of local colors
  const colors = {
    bg: themeColors.primary,
    gradient: themeColors.gradient,
    light: themeColors.light,
    text: themeColors.text,
    border: themeColors.border
  };

  const MetricCard: React.FC<MetricData & { index: number }> = ({ label, value, change, changeLabel, index }) => (
    <div 
      className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
            change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {change >= 0 ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-semibold text-gray-900 mb-2">{value}</p>
      {changeLabel && (
        <p className="text-xs text-gray-500">{changeLabel}</p>
      )}
      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  );

  const ChartPlaceholder: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border-2 border-dashed border-gray-200">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg mb-4`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Chart Visualization</p>
          <p className="text-xs text-gray-500">Interactive chart will render here</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
              <FiActivity className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">
                Analytics Dashboard
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 active:scale-95 transition-all duration-200 ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading || metrics.length === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${colors.gradient} shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 ${
                  isLoading || metrics.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          <p className="text-base sm:text-lg text-gray-600 ml-0 sm:ml-14">
            Track performance metrics and gain insights across your operations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
            {/* Report Type */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiBarChart2 className="w-4 h-4" />
                Report Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'shipments', label: 'Shipments', icon: FiPackage },
                  { value: 'packages', label: 'Packages', icon: FiBox },
                  { value: 'users', label: 'Users', icon: FiUsers }
                ].map(({ value, label, icon: Icon }) => {
                  const isActive = reportType === value;
                  // Use theme colors for active state, or get preview colors for inactive
                  const typeColors = isActive ? colors : (() => {
                    switch (value) {
                      case 'shipments': return { light: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
                      case 'packages': return { light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
                      case 'users': return { light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' };
                      default: return { light: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                    }
                  })();
                  return (
                    <button
                      key={value}
                      onClick={() => setReportType(value)}
                      className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? `${typeColors.light} ${typeColors.text} shadow-md ring-2 ${typeColors.border} scale-105`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Range */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FiCalendar className="w-4 h-4" />
                Time Period
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['week', 'month', 'quarter', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      timeRange === range
                        ? `${colors.light} ${colors.text} shadow-md ring-2 ${colors.border} scale-105`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="sm:hidden flex gap-3 mt-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 active:scale-95 transition-all duration-200 ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExport}
              disabled={isLoading || metrics.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${colors.gradient} shadow-lg active:scale-95 transition-all duration-200 ${
                isLoading || metrics.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Error Loading Analytics</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${colors.gradient}`} />
            Key Performance Metrics
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-center h-32">
                    <div className="flex flex-col items-center gap-3">
                      <FiLoader className="w-8 h-8 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-500">Loading analytics...</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-in fade-in duration-500">
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <ChartPlaceholder
              icon={FiPieChart}
              title="Distribution Analysis"
              subtitle={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} breakdown by category`}
            />
            <ChartPlaceholder
              icon={FiBarChart2}
              title="Volume Trends"
              subtitle={`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} activity over time`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <ChartPlaceholder
              icon={FiTrendingUp}
              title="Performance Metrics"
              subtitle="Growth and efficiency indicators"
            />
            <ChartPlaceholder
              icon={FiActivity}
              title="Top Performers"
              subtitle="Highest performing segments"
            />
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className={`w-1 h-5 rounded-full bg-gradient-to-b ${colors.gradient}`} />
              Detailed Metrics Breakdown
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="group">
                  <div className="flex items-start justify-between mb-2">
                    <dt className="text-sm font-medium text-gray-600">{metric.label}</dt>
                    {metric.change !== undefined && (
                      <div className={`flex items-center gap-1 ${
                        metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {metric.change >= 0 ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
                        <span className="text-xs font-semibold">{Math.abs(metric.change)}%</span>
                      </div>
                    )}
                  </div>
                  <dd className="text-2xl font-semibold text-gray-900 mb-1">{metric.value}</dd>
                  {metric.changeLabel && (
                    <p className="text-xs text-gray-500">{metric.changeLabel}</p>
                  )}
                  <div className={`h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 mt-3 rounded-full`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;