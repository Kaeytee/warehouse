/**
 * Dashboard Service - Real Database Integration
 * Fetches live data from Supabase for warehouse dashboard metrics
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @created 2025-10-06
 */

import { supabase } from '../lib/supabase';

// Dashboard interfaces
export interface DashboardMetrics {
  // Package metrics
  totalPackages: number;
  pendingPackages: number;
  receivedPackages: number;
  processingPackages: number;
  shippedPackages: number;
  deliveredPackages: number;
  arrivedPackages: number;
  
  // Shipment metrics
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  
  // User metrics
  totalUsers: number;
  activeUsers: number;
  
  // Financial metrics
  totalValue: number;
  totalWeight: number;
  averagePackageValue: number;
  
  // Performance metrics
  processingRate: number;
  deliveryRate: number;
  
  // Time-based metrics
  todayPackages: number;
  weekPackages: number;
  monthPackages: number;
  
  lastUpdated: string;
}

export interface RecentPackage {
  id: string;
  packageId: string;
  trackingNumber: string;
  status: string;
  description: string;
  weight: number;
  declaredValue: number;
  storeName: string;
  userName: string;
  userSuite: string;
  intakeDate: string;
  createdAt: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface PerformanceData {
  dailyPackages: Array<{ date: string; count: number; }>;
  statusDistribution: Array<{ status: string; count: number; percentage: number; }>;
  monthlyTrends: Array<{ month: string; packages: number; shipments: number; }>;
  topStores: Array<{ storeName: string; packageCount: number; totalValue: number; }>;
}

export class DashboardService {
  /**
   * Get comprehensive dashboard metrics from database
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Fetch package metrics
      const { data: packageStats, error: packageError } = await supabase
        .from('packages')
        .select('status, weight, declared_value, created_at, received_at');
      
      if (packageError) throw packageError;

      // Fetch shipment metrics
      const { data: shipmentStats, error: shipmentError } = await supabase
        .from('shipments')
        .select('status, total_weight, total_value, created_at');
      
      if (shipmentError) throw shipmentError;

      // Fetch user metrics
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('status, created_at');
      
      if (userError) throw userError;

      // Calculate time boundaries for today's packages
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate package metrics
      const totalPackages = packageStats?.length || 0;
      const pendingPackages = packageStats?.filter(p => p.status === 'pending').length || 0;
      // Today's received packages only (status='received' AND marked as received today)
      // Use received_at if available, fallback to created_at for backward compatibility
      const receivedPackages = packageStats?.filter(p => {
        if (p.status !== 'received') return false;
        const receivedDate = p.received_at ? new Date(p.received_at) : new Date(p.created_at);
        return receivedDate >= today;
      }).length || 0;
      const processingPackages = packageStats?.filter(p => p.status === 'processing').length || 0;
      const shippedPackages = packageStats?.filter(p => p.status === 'shipped').length || 0;
      const deliveredPackages = packageStats?.filter(p => p.status === 'delivered').length || 0;
      const arrivedPackages = packageStats?.filter(p => p.status === 'arrived').length || 0;

      // Calculate shipment metrics
      const totalShipments = shipmentStats?.length || 0;
      const pendingShipments = shipmentStats?.filter(s => s.status === 'pending').length || 0;
      const inTransitShipments = shipmentStats?.filter(s => ['processing', 'shipped', 'in_transit'].includes(s.status)).length || 0;
      const deliveredShipments = shipmentStats?.filter(s => s.status === 'delivered').length || 0;

      // Calculate user metrics
      const totalUsers = userStats?.length || 0;
      const activeUsers = userStats?.filter(u => u.status === 'active').length || 0;

      // Calculate financial metrics
      const totalValue = packageStats?.reduce((sum, p) => sum + (parseFloat(p.declared_value) || 0), 0) || 0;
      const totalWeight = packageStats?.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0) || 0;
      const averagePackageValue = totalPackages > 0 ? totalValue / totalPackages : 0;

      // Calculate performance metrics
      const processingRate = totalPackages > 0 ? ((processingPackages + shippedPackages + deliveredPackages) / totalPackages) * 100 : 0;
      const deliveryRate = totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

      // Calculate time-based metrics (already defined 'today' above)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayPackages = packageStats?.filter(p => new Date(p.created_at) >= today).length || 0;
      const weekPackages = packageStats?.filter(p => new Date(p.created_at) >= weekAgo).length || 0;
      const monthPackages = packageStats?.filter(p => new Date(p.created_at) >= monthAgo).length || 0;

      return {
        totalPackages,
        pendingPackages,
        receivedPackages,
        processingPackages,
        shippedPackages,
        deliveredPackages,
        arrivedPackages,
        totalShipments,
        pendingShipments,
        inTransitShipments,
        deliveredShipments,
        totalUsers,
        activeUsers,
        totalValue,
        totalWeight,
        averagePackageValue,
        processingRate,
        deliveryRate,
        todayPackages,
        weekPackages,
        monthPackages,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get recent packages with user information
   */
  static async getRecentPackages(limit: number = 10): Promise<RecentPackage[]> {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          package_id,
          tracking_number,
          status,
          description,
          weight,
          declared_value,
          store_name,
          intake_date,
          created_at,
          users!packages_user_id_fkey (
            first_name,
            last_name,
            suite_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(pkg => ({
        id: pkg.id,
        packageId: pkg.package_id,
        trackingNumber: pkg.tracking_number,
        status: pkg.status,
        description: pkg.description || 'No description',
        weight: parseFloat(pkg.weight) || 0,
        declaredValue: parseFloat(pkg.declared_value) || 0,
        storeName: pkg.store_name || 'Unknown Store',
        userName: `${(pkg.users as any)?.first_name || ''} ${(pkg.users as any)?.last_name || ''}`.trim() || 'Unknown User',
        userSuite: (pkg.users as any)?.suite_number || 'N/A',
        intakeDate: pkg.intake_date || pkg.created_at,
        createdAt: pkg.created_at
      })) || [];

    } catch (error) {
      throw new Error('Failed to fetch recent packages');
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadNotificationsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Get recent notifications
   */
  static async getRecentNotifications(limit: number = 5): Promise<DashboardNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        actionUrl: notification.action_url,
        createdAt: notification.created_at
      })) || [];

    } catch (error) {
      return [];
    }
  }

  /**
   * Get performance analytics data
   */
  static async getPerformanceData(): Promise<PerformanceData> {
    try {
      // Get daily package counts for the last 7 days
      const { data: dailyData, error: dailyError } = await supabase
        .from('packages')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (dailyError) throw dailyError;

      // Get status distribution
      const { data: statusData, error: statusError } = await supabase
        .from('packages')
        .select('status');

      if (statusError) throw statusError;

      // Get top stores by package count
      const { data: storeData, error: storeError } = await supabase
        .from('packages')
        .select('store_name, declared_value')
        .not('store_name', 'is', null);

      if (storeError) throw storeError;

      // Process daily data
      const dailyPackages = this.processDailyData(dailyData || []);
      
      // Process status distribution
      const statusDistribution = this.processStatusDistribution(statusData || []);
      
      // Process monthly trends (simplified - using last 30 days)
      const monthlyTrends = [
        { month: 'This Month', packages: dailyData?.length || 0, shipments: 0 }
      ];
      
      // Process top stores
      const topStores = this.processTopStores(storeData || []);

      return {
        dailyPackages,
        statusDistribution,
        monthlyTrends,
        topStores
      };

    } catch (error) {
      return {
        dailyPackages: [],
        statusDistribution: [],
        monthlyTrends: [],
        topStores: []
      };
    }
  }

  /**
   * Process daily package data for charts
   */
  private static processDailyData(data: any[]): Array<{ date: string; count: number; }> {
    const dailyCounts: { [key: string]: number } = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }
    
    // Count packages by date
    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (dailyCounts.hasOwnProperty(date)) {
        dailyCounts[date]++;
      }
    });
    
    return Object.entries(dailyCounts).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count
    }));
  }

  /**
   * Process status distribution data
   */
  private static processStatusDistribution(data: any[]): Array<{ status: string; count: number; percentage: number; }> {
    const statusCounts: { [key: string]: number } = {};
    const total = data.length;
    
    data.forEach(item => {
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  /**
   * Process top stores data
   */
  private static processTopStores(data: any[]): Array<{ storeName: string; packageCount: number; totalValue: number; }> {
    const storeStats: { [key: string]: { count: number; value: number; } } = {};
    
    data.forEach(item => {
      const store = item.store_name || 'Unknown Store';
      if (!storeStats[store]) {
        storeStats[store] = { count: 0, value: 0 };
      }
      storeStats[store].count++;
      storeStats[store].value += parseFloat(item.declared_value) || 0;
    });
    
    return Object.entries(storeStats)
      .map(([storeName, stats]) => ({
        storeName,
        packageCount: stats.count,
        totalValue: stats.value
      }))
      .sort((a, b) => b.packageCount - a.packageCount)
      .slice(0, 5); // Top 5 stores
  }

  /**
   * Update package status (for admin actions)
   */
  static async updatePackageStatus(packageId: string, newStatus: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          scanned_by: userId
        })
        .eq('id', packageId);

      if (error) throw error;
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Create system notification
   */
  static async createNotification(userId: string, title: string, message: string, type: string = 'system'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;

    } catch (error) {
      return false;
    }
  }
}
