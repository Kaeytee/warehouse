import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiCalendar, FiDownload, FiPackage, FiUsers, FiBox, FiActivity, FiArrowUp, FiArrowDown, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { AnalyticsService, type ShipmentAnalytics, type PackageAnalytics, type UserAnalytics } from '../../../services/AnalyticsService';
import { useTheme, type ThemeType } from '../../../contexts/ThemeContext';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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

  /**
   * Custom Tooltip Component for Charts
   * Provides professional, branded tooltips for all chart types
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-gray-600">
              <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span>{' '}
              <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  /**
   * Get chart colors based on current theme - using distinct colors for better visualization
   */
  const getChartColors = () => {
    switch (reportType) {
      case 'shipments':
        return ['#DC2626', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      case 'packages':
        return ['#9333EA', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EF4444'];
      case 'users':
        return ['#059669', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
      default:
        return ['#6B7280', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    }
  };

  /**
   * Distribution Analysis Chart Component
   * Renders pie chart showing distribution by status or category
   */
  const DistributionChart: React.FC = () => {
    // Prepare data based on report type
    const chartData = (() => {
      switch (reportType) {
        case 'shipments':
          if (!shipmentAnalytics) return [];
          return [
            { name: 'In Transit', value: shipmentAnalytics.inTransitShipments },
            { name: 'Completed', value: shipmentAnalytics.completedShipments },
            { name: 'Processing', value: shipmentAnalytics.processingShipments },
            { name: 'Pending', value: shipmentAnalytics.pendingShipments },
          ].filter(item => item.value > 0);
        case 'packages':
          if (!packageAnalytics) return [];
          return [
            { name: 'Received', value: packageAnalytics.receivedPackages },
            { name: 'Processing', value: packageAnalytics.processingPackages },
            { name: 'Shipped', value: packageAnalytics.shippedPackages },
            { name: 'Delivered', value: packageAnalytics.deliveredPackages },
            { name: 'Pending', value: packageAnalytics.pendingPackages },
          ].filter(item => item.value > 0);
        case 'users':
          if (!userAnalytics) return [];
          return [
            { name: 'Active', value: userAnalytics.activeUsers },
            { name: 'Inactive', value: userAnalytics.inactiveUsers },
            { name: 'Suspended', value: userAnalytics.suspendedUsers },
          ].filter(item => item.value > 0);
        default:
          return [];
      }
    })();

    const chartColors = getChartColors();

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Distribution Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} breakdown by category
          </p>
        </div>
        <div className="p-6">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-sm">No data available for this time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  /**
   * Volume Trends Chart Component
   * Renders bar/line chart showing activity trends over time
   */
  const VolumeTrendsChart: React.FC = () => {
    // Prepare data based on report type
    const chartData = (() => {
      switch (reportType) {
        case 'shipments':
          return shipmentAnalytics?.monthlyTrends || [];
        case 'packages':
          return packageAnalytics?.dailyIntakePattern || [];
        case 'users':
          return userAnalytics?.userActivityTrends || [];
        default:
          return [];
      }
    })();

    const chartColors = getChartColors();

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Volume Trends</h3>
          <p className="text-sm text-gray-500 mt-1">
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} activity over time
          </p>
        </div>
        <div className="p-6">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-sm">No data available for this time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey={reportType === 'shipments' ? 'month' : reportType === 'packages' ? 'day' : 'month'} 
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {reportType === 'shipments' && (
                  <Bar dataKey="shipments" fill={chartColors[0]} name="Shipments" radius={[8, 8, 0, 0]} />
                )}
                {reportType === 'packages' && (
                  <Bar dataKey="count" fill={chartColors[0]} name="Packages" radius={[8, 8, 0, 0]} />
                )}
                {reportType === 'users' && (
                  <>
                    <Bar dataKey="newUsers" fill={chartColors[0]} name="New Users" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="activeUsers" fill={chartColors[1]} name="Active Users" radius={[8, 8, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  /**
   * Performance Metrics Chart Component
   * Renders area chart showing growth and efficiency indicators (no pricing)
   */
  const PerformanceChart: React.FC = () => {
    // Prepare data based on report type - focused on warehouse metrics, not pricing
    const chartData = (() => {
      switch (reportType) {
        case 'shipments':
          // Show shipment volume trends over time
          return shipmentAnalytics?.monthlyTrends?.map(item => ({
            name: item.month,
            shipments: item.shipments,
            completed: Math.round(item.shipments * 0.7) // Estimate completed from total
          })) || [];
        case 'packages':
          // Show package count and weight distribution by store
          return packageAnalytics?.packagesByStore?.slice(0, 6).map(item => ({
            name: item.store.length > 15 ? item.store.substring(0, 15) + '...' : item.store,
            packages: item.count,
            weight: Math.round(item.count * (packageAnalytics?.averagePackageWeight || 5)) // Estimate weight
          })) || [];
        case 'users':
          // Show user distribution by location
          return userAnalytics?.geographicDistribution?.slice(0, 6).map(item => ({
            name: item.country,
            users: item.count,
            percentage: Math.round(item.percentage)
          })) || [];
        default:
          return [];
      }
    })();

    const chartColors = getChartColors();

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Performance Metrics</h3>
          <p className="text-sm text-gray-500 mt-1">Growth and efficiency indicators</p>
        </div>
        <div className="p-6">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-sm">No data available for this time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[1]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColors[1]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {reportType === 'shipments' && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="shipments" 
                      stroke={chartColors[0]} 
                      fillOpacity={1} 
                      fill="url(#colorPrimary)" 
                      name="Total Shipments"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke={chartColors[1]} 
                      fillOpacity={1} 
                      fill="url(#colorSecondary)" 
                      name="Completed"
                    />
                  </>
                )}
                {reportType === 'packages' && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="packages" 
                      stroke={chartColors[0]} 
                      fillOpacity={1} 
                      fill="url(#colorPrimary)" 
                      name="Package Count"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke={chartColors[1]} 
                      fillOpacity={1} 
                      fill="url(#colorSecondary)" 
                      name="Est. Weight (kg)"
                    />
                  </>
                )}
                {reportType === 'users' && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke={chartColors[0]} 
                      fillOpacity={1} 
                      fill="url(#colorPrimary)" 
                      name="Users"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke={chartColors[1]} 
                      fillOpacity={1} 
                      fill="url(#colorSecondary)" 
                      name="Percentage (%)"
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  /**
   * Top Performers Chart Component
   * Renders horizontal bar chart showing highest performing segments
   */
  const TopPerformersChart: React.FC = () => {
    // Prepare data based on report type
    const chartData = (() => {
      switch (reportType) {
        case 'shipments':
          return shipmentAnalytics?.topDestinations?.slice(0, 5).map(item => ({
            name: item.city,
            value: item.count,
            percentage: item.percentage
          })) || [];
        case 'packages':
          return packageAnalytics?.packagesByStore?.slice(0, 5).map(item => ({
            name: item.store.length > 20 ? item.store.substring(0, 20) + '...' : item.store,
            value: item.count,
            totalValue: item.value
          })) || [];
        case 'users':
          return userAnalytics?.topUsersBySuites?.slice(0, 5).map(item => ({
            name: `${item.suite} - ${item.user}`,
            value: item.packageCount
          })) || [];
        default:
          return [];
      }
    })();

    const chartColors = getChartColors();

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Top Performers</h3>
          <p className="text-sm text-gray-500 mt-1">Highest performing segments</p>
        </div>
        <div className="p-6">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-sm">No data available for this time period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#6B7280" 
                  style={{ fontSize: '11px' }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={chartColors[0]} radius={[0, 8, 8, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header Banner */}
      <div className={`bg-gradient-to-r ${colors.gradient} shadow-lg`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="mt-2 text-base sm:text-lg text-white/90">
                Track performance metrics and gain insights across your operations
              </p>
            </div>
            <div className="hidden sm:flex gap-3">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30 ${
                  isRefreshing ? 'cursor-not-allowed' : ''
                }`}
              >
                <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={isLoading || metrics.length === 0}
                className={`flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30 ${
                  isLoading || metrics.length === 0 ? 'cursor-not-allowed' : ''
                }`}
              >
                <FiDownload className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

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
              Export CSV
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

        {/* Professional Charts Grid with Real Data Visualization */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Distribution Analysis - Pie Chart */}
            <DistributionChart />
            
            {/* Volume Trends - Bar Chart */}
            <VolumeTrendsChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Performance Metrics - Area Chart */}
            <PerformanceChart />
            
            {/* Top Performers - Horizontal Bar Chart */}
            <TopPerformersChart />
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