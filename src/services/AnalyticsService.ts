/**
 * Analytics Service - Real Database Analytics with Manual Calculations
 * Fetches and processes live data from Supabase for comprehensive analytics reporting
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @created 2025-10-06
 */

import { supabase } from '../lib/supabase';

// Analytics interfaces
export interface ShipmentAnalytics {
  totalShipments: number;
  completedShipments: number;
  inTransitShipments: number;
  processingShipments: number;
  pendingShipments: number;
  averageDeliveryTime: string;
  onTimeDeliveryRate: string;
  totalShipmentValue: number;
  averageShipmentValue: number;
  topDestinations: Array<{ city: string; count: number; percentage: number; }>;
  monthlyTrends: Array<{ month: string; shipments: number; value: number; }>;
  serviceTypeDistribution: Array<{ type: string; count: number; percentage: number; }>;
}

export interface PackageAnalytics {
  totalPackages: number;
  pendingPackages: number;
  receivedPackages: number;
  processingPackages: number;
  shippedPackages: number;
  deliveredPackages: number;
  averagePackageWeight: number;
  totalPackageWeight: number;
  averagePackageValue: number;
  totalPackageValue: number;
  averageProcessingTime: string;
  packagesByStore: Array<{ store: string; count: number; value: number; }>;
  dailyIntakePattern: Array<{ day: string; count: number; }>;
  weightDistribution: Array<{ range: string; count: number; percentage: number; }>;
  statusProgression: Array<{ status: string; count: number; avgDays: number; }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  newUsersThisMonth: number;
  topUsersBySuites: Array<{ user: string; suite: string; packageCount: number; }>;
  userActivityTrends: Array<{ month: string; newUsers: number; activeUsers: number; }>;
  geographicDistribution: Array<{ country: string; count: number; percentage: number; }>;
}


export interface OperationalAnalytics {
  warehouseUtilization: number;
  averageProcessingTime: number;
  throughputRate: number;
  errorRate: number;
  customerSatisfactionScore: number;
  operationalEfficiency: {
    intakeEfficiency: number;
    processingEfficiency: number;
    shippingEfficiency: number;
  };
  bottleneckAnalysis: Array<{ process: string; avgTime: number; impact: string; }>;
}

export class AnalyticsService {
  /**
   * Get comprehensive shipment analytics with manual calculations
   */
  static async getShipmentAnalytics(timeRange: string = 'month'): Promise<ShipmentAnalytics> {
    try {
      // Calculate date range
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Fetch shipment data
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Manual calculations
      const totalShipments = shipments?.length || 0;
      const completedShipments = shipments?.filter(s => s.status === 'delivered').length || 0;
      const inTransitShipments = shipments?.filter(s => ['shipped', 'in_transit'].includes(s.status)).length || 0;
      const processingShipments = shipments?.filter(s => s.status === 'processing').length || 0;
      const pendingShipments = shipments?.filter(s => s.status === 'pending').length || 0;

      // Calculate average delivery time (manual calculation)
      const deliveredShipments = shipments?.filter(s => s.status === 'delivered' && s.estimated_delivery) || [];
      const avgDeliveryDays = deliveredShipments.length > 0 
        ? deliveredShipments.reduce((sum, s) => {
            const created = new Date(s.created_at);
            const delivered = new Date(s.estimated_delivery);
            const days = Math.abs(delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / deliveredShipments.length
        : 0;

      // Calculate on-time delivery rate
      const onTimeDeliveries = deliveredShipments.filter(s => {
        const estimated = new Date(s.estimated_delivery);
        const actual = new Date(); // In real scenario, you'd have actual delivery date
        return actual <= estimated;
      }).length;
      const onTimeRate = deliveredShipments.length > 0 
        ? (onTimeDeliveries / deliveredShipments.length) * 100 
        : 0;

      // Calculate financial metrics
      const totalShipmentValue = shipments?.reduce((sum, s) => sum + (parseFloat(s.total_value) || 0), 0) || 0;
      const averageShipmentValue = totalShipments > 0 ? totalShipmentValue / totalShipments : 0;

      // Calculate top destinations
      const destinationCounts: { [key: string]: number } = {};
      shipments?.forEach(s => {
        const city = s.delivery_city || 'Unknown';
        destinationCounts[city] = (destinationCounts[city] || 0) + 1;
      });
      const topDestinations = Object.entries(destinationCounts)
        .map(([city, count]) => ({
          city,
          count,
          percentage: totalShipments > 0 ? (count / totalShipments) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate monthly trends
      const monthlyData: { [key: string]: { shipments: number; value: number } } = {};
      shipments?.forEach(s => {
        const month = new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { shipments: 0, value: 0 };
        }
        monthlyData[month].shipments++;
        monthlyData[month].value += parseFloat(s.total_value) || 0;
      });
      const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        shipments: data.shipments,
        value: data.value
      }));

      // Calculate service type distribution
      const serviceTypeCounts: { [key: string]: number } = {};
      shipments?.forEach(s => {
        const type = s.service_type || 'standard';
        serviceTypeCounts[type] = (serviceTypeCounts[type] || 0) + 1;
      });
      const serviceTypeDistribution = Object.entries(serviceTypeCounts)
        .map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          percentage: totalShipments > 0 ? (count / totalShipments) * 100 : 0
        }));

      return {
        totalShipments,
        completedShipments,
        inTransitShipments,
        processingShipments,
        pendingShipments,
        averageDeliveryTime: `${avgDeliveryDays.toFixed(1)} days`,
        onTimeDeliveryRate: `${onTimeRate.toFixed(1)}%`,
        totalShipmentValue,
        averageShipmentValue,
        topDestinations,
        monthlyTrends,
        serviceTypeDistribution
      };

    } catch (error) {
      console.error('Error fetching shipment analytics:', error);
      throw new Error('Failed to fetch shipment analytics');
    }
  }

  /**
   * Get comprehensive package analytics with manual calculations
   */
  static async getPackageAnalytics(timeRange: string = 'month'): Promise<PackageAnalytics> {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Fetch package data with user information
      const { data: packages, error } = await supabase
        .from('packages')
        .select(`
          *,
          users!packages_user_id_fkey (
            first_name,
            last_name,
            suite_number
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Manual calculations for package counts
      const totalPackages = packages?.length || 0;
      const pendingPackages = packages?.filter(p => p.status === 'pending').length || 0;
      const receivedPackages = packages?.filter(p => p.status === 'received').length || 0;
      const processingPackages = packages?.filter(p => p.status === 'processing').length || 0;
      const shippedPackages = packages?.filter(p => p.status === 'shipped').length || 0;
      const deliveredPackages = packages?.filter(p => p.status === 'delivered').length || 0;

      // Calculate weight and value metrics
      const totalPackageWeight = packages?.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0) || 0;
      const averagePackageWeight = totalPackages > 0 ? totalPackageWeight / totalPackages : 0;
      const totalPackageValue = packages?.reduce((sum, p) => sum + (parseFloat(p.declared_value) || 0), 0) || 0;
      const averagePackageValue = totalPackages > 0 ? totalPackageValue / totalPackages : 0;

      // Calculate average processing time
      const processedPackages = packages?.filter(p => p.intake_date && p.status !== 'pending') || [];
      const avgProcessingDays = processedPackages.length > 0
        ? processedPackages.reduce((sum, p) => {
            const created = new Date(p.created_at);
            const processed = new Date(p.intake_date);
            const days = Math.abs(processed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / processedPackages.length
        : 0;

      // Calculate packages by store
      const storeCounts: { [key: string]: { count: number; value: number } } = {};
      packages?.forEach(p => {
        const store = p.store_name || 'Unknown Store';
        if (!storeCounts[store]) {
          storeCounts[store] = { count: 0, value: 0 };
        }
        storeCounts[store].count++;
        storeCounts[store].value += parseFloat(p.declared_value) || 0;
      });
      const packagesByStore = Object.entries(storeCounts)
        .map(([store, data]) => ({ store, count: data.count, value: data.value }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate daily intake pattern
      const dailyData: { [key: string]: number } = {};
      packages?.forEach(p => {
        const day = new Date(p.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        dailyData[day] = (dailyData[day] || 0) + 1;
      });
      const dailyIntakePattern = Object.entries(dailyData).map(([day, count]) => ({ day, count }));

      // Calculate weight distribution
      const weightRanges = [
        { range: '0-1 kg', min: 0, max: 1 },
        { range: '1-5 kg', min: 1, max: 5 },
        { range: '5-10 kg', min: 5, max: 10 },
        { range: '10-20 kg', min: 10, max: 20 },
        { range: '20+ kg', min: 20, max: Infinity }
      ];
      const weightDistribution = weightRanges.map(range => {
        const count = packages?.filter(p => {
          const weight = parseFloat(p.weight) || 0;
          return weight >= range.min && weight < range.max;
        }).length || 0;
        return {
          range: range.range,
          count,
          percentage: totalPackages > 0 ? (count / totalPackages) * 100 : 0
        };
      });

      // Calculate status progression with average days
      const statusProgression = [
        'pending', 'received', 'processing', 'shipped', 'delivered'
      ].map(status => {
        const statusPackages = packages?.filter(p => p.status === status) || [];
        const avgDays = statusPackages.length > 0
          ? statusPackages.reduce((sum, p) => {
              const days = Math.abs(new Date().getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / statusPackages.length
          : 0;
        return {
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: statusPackages.length,
          avgDays: Math.round(avgDays)
        };
      });

      return {
        totalPackages,
        pendingPackages,
        receivedPackages,
        processingPackages,
        shippedPackages,
        deliveredPackages,
        averagePackageWeight,
        totalPackageWeight,
        averagePackageValue,
        totalPackageValue,
        averageProcessingTime: `${avgProcessingDays.toFixed(1)} days`,
        packagesByStore,
        dailyIntakePattern,
        weightDistribution,
        statusProgression
      };

    } catch (error) {
      console.error('Error fetching package analytics:', error);
      throw new Error('Failed to fetch package analytics');
    }
  }

  /**
   * Get user analytics with manual calculations
   */
  static async getUserAnalytics(timeRange: string = 'month'): Promise<UserAnalytics> {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);

      // Fetch user data
      const { data: users, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      // Fetch packages for user activity analysis
      const { data: packages } = await supabase
        .from('packages')
        .select(`
          user_id,
          created_at,
          users!packages_user_id_fkey (
            first_name,
            last_name,
            suite_number
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Manual calculations
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.status === 'active').length || 0;
      const inactiveUsers = users?.filter(u => u.status === 'inactive').length || 0;
      const suspendedUsers = users?.filter(u => u.status === 'suspended').length || 0;

      // Calculate new users this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= monthStart).length || 0;

      // Calculate top users by package count
      const userPackageCounts: { [key: string]: { user: string; suite: string; count: number } } = {};
      packages?.forEach(p => {
        const userId = p.user_id;
        const userName = `${(p.users as any)?.first_name || ''} ${(p.users as any)?.last_name || ''}`.trim() || 'Unknown User';
        const suite = (p.users as any)?.suite_number || 'N/A';
        
        if (!userPackageCounts[userId]) {
          userPackageCounts[userId] = { user: userName, suite, count: 0 };
        }
        userPackageCounts[userId].count++;
      });
      const topUsersBySuites = Object.values(userPackageCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(u => ({ user: u.user, suite: u.suite, packageCount: u.count }));

      // Calculate monthly user activity trends
      const monthlyUserData: { [key: string]: { newUsers: number; activeUsers: number } } = {};
      users?.forEach(u => {
        const month = new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (!monthlyUserData[month]) {
          monthlyUserData[month] = { newUsers: 0, activeUsers: 0 };
        }
        monthlyUserData[month].newUsers++;
        if (u.status === 'active') {
          monthlyUserData[month].activeUsers++;
        }
      });
      const userActivityTrends = Object.entries(monthlyUserData).map(([month, data]) => ({
        month,
        newUsers: data.newUsers,
        activeUsers: data.activeUsers
      }));

      // Calculate geographic distribution
      const countryCounts: { [key: string]: number } = {};
      users?.forEach(u => {
        const country = u.country || 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      const geographicDistribution = Object.entries(countryCounts)
        .map(([country, count]) => ({
          country,
          count,
          percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        newUsersThisMonth,
        topUsersBySuites,
        userActivityTrends,
        geographicDistribution
      };

    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Failed to fetch user analytics');
    }
  }


  /**
   * Helper method to calculate date ranges
   */
  private static getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  /**
   * Export analytics data to CSV format
   */
  static exportToCSV(data: any, filename: string): void {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any): string {
    if (!data || typeof data !== 'object') return '';
    
    const headers = Object.keys(data);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    const maxLength = Math.max(...headers.map(h => Array.isArray(data[h]) ? data[h].length : 1));
    
    for (let i = 0; i < maxLength; i++) {
      const row = headers.map(header => {
        const value = Array.isArray(data[header]) ? data[header][i] : data[header];
        return typeof value === 'object' ? JSON.stringify(value) : value;
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }
}
