/**
 * GroupUtils.ts
 * 
 * Utility functions for shipment group operations
 * This file provides helper functions for group management
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { GroupPriority, GroupStatus, VehicleType } from '../models/ShipmentGroup';
import type { Package } from '../models/Package';

/**
 * Shipment group utility functions
 * Helper functions for group operations
 */
export class GroupUtils {
  /**
   * Generate a unique group ID
   * @returns New group ID in format GRP-XXXXXX
   */
  static generateGroupId(): string {
    // Generate a random 6-digit number and format as GRP-XXXXXX
    const randomId = Math.floor(100000 + Math.random() * 900000);
    return `GRP-${randomId}`;
  }

  /**
   * Generate a route ID
   * @returns New route ID in format RTE-XXXXXX
   */
  static generateRouteId(): string {
    // Generate a random 6-digit number and format as RTE-XXXXXX
    const randomId = Math.floor(100000 + Math.random() * 900000);
    return `RTE-${randomId}`;
  }

  /**
   * Calculate group priority based on package priorities
   * @param packages - Array of packages in the group
   * @returns Calculated group priority
   */
  static calculateGroupPriority(packages: Package[]): GroupPriority {
    // If any package is high priority, the group is high priority
    if (packages.some(p => p.priority === 'high' || p.priority === 'urgent')) {
      return GroupPriority.HIGH;
    }
    
    // If majority of packages are medium priority, the group is medium priority
    const mediumCount = packages.filter(p => p.priority === 'medium').length;
    if (mediumCount >= packages.length / 2) {
      return GroupPriority.MEDIUM;
    }
    
    // Default to low priority
    return GroupPriority.LOW;
  }

  /**
   * Determine required vehicle type based on packages
   * @param totalWeight - Total weight of packages
   * @param totalVolume - Total volume of packages
   * @param packageCount - Number of packages
   * @returns Recommended vehicle type
   */
  static determineVehicleType(
    totalWeight: number,
    totalVolume: number,
    packageCount: number
  ): VehicleType {
    // Large vehicle for heavy or voluminous loads
    if (totalWeight > 2000 || totalVolume > 20 || packageCount > 50) {
      return VehicleType.LARGE_TRUCK;
    }
    
    // Medium vehicle for moderate loads
    if (totalWeight > 500 || totalVolume > 5 || packageCount > 20) {
      return VehicleType.TRUCK;
    }
    
    // Small vehicle for light loads
    if (totalWeight > 100 || totalVolume > 1 || packageCount > 5) {
      return VehicleType.VAN;
    }
    
    // Default to motorcycle for very small deliveries
    return VehicleType.MOTORCYCLE;
  }

  /**
   * Calculate estimated delivery time for a route
   * @param route - Delivery route
   * @returns Estimated delivery completion time
   */
  static calculateEstimatedDelivery(/* route: any */): string {
    // For now, just return a date 24 hours from now
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date.toISOString();
  }

  /**
   * Check if a group is overdue
   * @param estimatedDelivery - Estimated delivery date string
   * @returns Whether group is overdue
   */
  static isOverdue(estimatedDelivery: string): boolean {
    const now = new Date();
    const deliveryDate = new Date(estimatedDelivery);
    return deliveryDate < now;
  }

  /**
   * Get group completion percentage
   * @param status - Current group status
   * @returns Completion percentage (0-100)
   */
  static getCompletionPercentage(status: GroupStatus): number {
    // Map statuses to completion percentages
    const percentages: Record<GroupStatus, number> = {
      'draft': 0,
      'pending_confirmation': 10,
      'confirmed': 20,
      'assigned': 30,
      'loading': 40,
      'dispatched': 50,
      'in_transit': 60,
      'delivering': 80,
      'completed': 100,
      'cancelled': 0,
      'delayed': 0,
      'exception': 0,
      'returned': 0
    };
    
    return percentages[status] || 0;
  }
}
