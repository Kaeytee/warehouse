/**
 * ShipmentGroup.ts
 * 
 * Core shipment group data structure for Vanguard Cargo
 * This file defines the central ShipmentGroup model for batch package management
 * Enables efficient grouping, routing, and batch status updates for multiple packages
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from '../status/StatusDefinitions';
import type { LocationPoint } from '../status/StatusLocationMapping';
import { type Package, PackagePriority } from './Package';

/**
 * Core ShipmentGroup interface
 * Central data structure for managing grouped packages
 */
export interface ShipmentGroup {
  originLocation: any;
  destinationCity(arg0: PackageStatus, destinationCity: any): unknown;
  // 🔑 IDENTIFICATION
  readonly id: string;                    // Unique group identifier (GRP-XXXX)
  readonly name: string;                  // Human-readable group name
  readonly description?: string;          // Group description/purpose
  
  // 📦 PACKAGE MANAGEMENT
  readonly packageIds: string[];          // Array of package IDs in this group
  readonly packageCount: number;          // Total number of packages
  readonly totalWeight: number;           // Combined weight of all packages
  readonly totalValue: number;            // Combined value of all packages
  readonly totalVolume: number;           // Combined volume of all packages
  
  // 📊 STATUS AND TRACKING
  readonly status: GroupStatus;           // Current group status
  readonly statusHistory: GroupStatusHistoryEntry[]; // Complete status history
  readonly packageStatuses: Record<string, PackageStatus>; // Individual package statuses
  
  // 🗺️ ROUTING AND cargo
  readonly route: GroupRoute;             // Optimized delivery route
  readonly origin: LocationPoint;         // Group origin/pickup point
  readonly destinations: LocationPoint[]; // All destination points
  readonly currentLocation?: LocationPoint; // Current group location
  
  // 🚛 VEHICLE AND DRIVER ASSIGNMENT
  readonly vehicleId?: string;            // Assigned vehicle ID
  readonly vehicleType?: VehicleType;     // Type of vehicle required
  readonly driverId?: string;             // Assigned driver ID
  readonly driverName?: string;           // Driver name
  readonly driverContact?: string;        // Driver contact information
  
  // ⏰ SCHEDULING
  readonly scheduledDeparture?: string;   // Scheduled departure time
  readonly actualDeparture?: string;      // Actual departure time
  readonly estimatedArrival?: string;     // Estimated arrival at final destination
  readonly actualArrival?: string;        // Actual arrival time
  readonly estimatedDelivery: string;     // Estimated completion of all deliveries
  
  // 🚨 PRIORITY AND HANDLING
  readonly priority: GroupPriority;       // Group priority level
  readonly highestPackagePriority: PackagePriority; // Highest priority package in group
  readonly specialHandling: string[];     // Combined special handling requirements
  readonly hasFragile: boolean;           // Contains fragile packages
  readonly hasTemperatureSensitive: boolean; // Contains temperature sensitive packages
  readonly hasHazardous: boolean;         // Contains hazardous materials
  
  // 💰 FINANCIAL
  readonly totalShippingCost: number;     // Combined shipping costs
  readonly groupDiscount?: number;        // Discount applied for grouping
  readonly fuelSurcharge?: number;        // Fuel surcharge for route
  readonly totalCost: number;             // Total cost including surcharges
  
  // 📝 OPERATIONAL DETAILS
  readonly loadingInstructions?: string;  // Special loading instructions
  readonly deliveryInstructions?: string; // Group delivery instructions
  readonly notes?: string;                // Internal notes
  readonly customerNotes?: string;        // Customer-facing notes
  
  // 🔒 METADATA
  readonly createdAt: string;             // Group creation timestamp
  readonly updatedAt: string;             // Last update timestamp
  readonly createdBy: string;             // User who created the group
  readonly lastModifiedBy: string;        // User who last modified
  readonly confirmedBy?: string;          // User who confirmed the group
  readonly confirmedAt?: string;          // Group confirmation timestamp
  readonly version: number;               // Version for optimistic locking
}

/**
 * Group status type
 * Defines lifecycle stages for shipment groups
 */
export type GroupStatus = 
  | 'draft'                // Group being created/edited
  | 'pending_confirmation' // Awaiting confirmation
  | 'confirmed'            // Group confirmed and ready
  | 'assigned'             // Vehicle/driver assigned
  | 'loading'              // Packages being loaded
  | 'dispatched'           // Group dispatched
  | 'in_transit'           // Group in transit
  | 'delivering'           // Making deliveries
  | 'completed'            // All deliveries completed
  | 'cancelled'            // Group cancelled
  | 'delayed'              // Group delayed
  | 'exception'            // Exception occurred
  | 'returned'             // Group returned to origin

/**
 * Group status constants
 * Provides named constants for group statuses
 */
export const GroupStatus = {
  DRAFT: 'draft' as GroupStatus,                       // Group being created/edited
  PENDING_CONFIRMATION: 'pending_confirmation' as GroupStatus, // Awaiting confirmation
  CONFIRMED: 'confirmed' as GroupStatus,               // Group confirmed and ready
  ASSIGNED: 'assigned' as GroupStatus,                 // Vehicle/driver assigned
  LOADING: 'loading' as GroupStatus,                   // Packages being loaded
  DISPATCHED: 'dispatched' as GroupStatus,             // Group dispatched
  IN_TRANSIT: 'in_transit' as GroupStatus,             // Group in transit
  DELIVERING: 'delivering' as GroupStatus,             // Making deliveries
  COMPLETED: 'completed' as GroupStatus,               // All deliveries completed
  CANCELLED: 'cancelled' as GroupStatus,               // Group cancelled
  DELAYED: 'delayed' as GroupStatus,                   // Group delayed
  EXCEPTION: 'exception' as GroupStatus,               // Exception occurred
  RETURNED: 'returned' as GroupStatus                  // Group returned to origin
} as const;

/**
 * Group priority type
 * Defines priority levels for group processing
 */
export type GroupPriority =
  | 'low'                          // Standard processing
  | 'medium'                        // Expedited processing
  | 'high'                          // Priority processing
  | 'urgent'                        // Emergency processing

/**
 * Group priority constants
 * Provides named constants for group priorities
 */
export const GroupPriority = {
  LOW: 'low' as GroupPriority,                          // Standard processing
  MEDIUM: 'medium' as GroupPriority,                    // Expedited processing
  HIGH: 'high' as GroupPriority,                        // Priority processing
  URGENT: 'urgent' as GroupPriority                     // Emergency processing
} as const;

/**
 * Vehicle type
 * Categorizes different types of delivery vehicles
 */
export type VehicleType =
  | 'motorcycle'            // Motorcycle for small packages
  | 'van'                   // Small delivery van
  | 'truck'                 // Medium truck
  | 'large_truck'           // Large truck for heavy loads
  | 'refrigerated'          // Temperature controlled vehicle
  | 'specialized'           // Specialized vehicle for special cargo

/**
 * Vehicle type constants
 * Provides named constants for vehicle types
 */
export const VehicleType = {
  MOTORCYCLE: 'motorcycle' as VehicleType,            // Motorcycle for small packages
  VAN: 'van' as VehicleType,                         // Small delivery van
  TRUCK: 'truck' as VehicleType,                     // Medium truck
  LARGE_TRUCK: 'large_truck' as VehicleType,         // Large truck for heavy loads
  REFRIGERATED: 'refrigerated' as VehicleType,       // Temperature controlled vehicle
  SPECIALIZED: 'specialized' as VehicleType          // Specialized vehicle for special cargo
} as const;

/**
 * Group route interface
 * Optimized delivery route for the group
 */
export interface GroupRoute {
  readonly id: string;                  // Route identifier
  readonly waypoints: RouteWaypoint[];  // Ordered list of stops
  readonly totalDistance: number;       // Total route distance in km
  readonly estimatedDuration: number;   // Estimated travel time in hours
  readonly optimizationMethod: string;  // Algorithm used for optimization
  readonly fuelEstimate: number;        // Estimated fuel consumption
  readonly tollCosts?: number;          // Estimated toll costs
  readonly alternativeRoutes?: GroupRoute[]; // Alternative route options
}

/**
 * Route waypoint interface
 * Individual stop in the delivery route
 */
export interface RouteWaypoint {
  readonly id: string;                  // Waypoint identifier
  readonly location: LocationPoint;     // Geographic location
  readonly packageIds: string[];        // Packages to deliver at this stop
  readonly estimatedArrival: string;    // Estimated arrival time
  readonly estimatedDeparture: string;  // Estimated departure time
  readonly actualArrival?: string;      // Actual arrival time
  readonly actualDeparture?: string;    // Actual departure time
  readonly deliveryDuration: number;    // Expected time for deliveries (minutes)
  readonly notes?: string;              // Special instructions for this stop
  readonly completed: boolean;          // Whether deliveries at this stop are complete
}

/**
 * Group status history entry interface
 * Records each group status change with full context
 */
export interface GroupStatusHistoryEntry {
  readonly id: string;                  // Unique entry ID
  readonly status: GroupStatus;         // Status at this point
  readonly timestamp: string;           // When status was set (ISO string)
  readonly location?: LocationPoint;    // Location where change occurred
  readonly performedBy: string;         // User who performed the change
  readonly performedByRole: string;     // Role of the user
  readonly reason?: string;             // Reason for status change
  readonly notes?: string;              // Additional notes
  readonly automatic: boolean;          // Whether change was automatic
  readonly affectedPackages?: string[]; // Package IDs affected by this change
}

/**
 * Group creation request interface
 * Data structure for creating new shipment groups
 */
export interface CreateGroupRequest {
  // Required fields
  readonly name: string;
  readonly packageIds: string[];
  readonly priority: GroupPriority;
  readonly origin: LocationPoint;
  
  // Optional fields
  readonly description?: string;
  readonly vehicleType?: VehicleType;
  readonly scheduledDeparture?: string;
  readonly loadingInstructions?: string;
  readonly deliveryInstructions?: string;
  readonly notes?: string;
  readonly customerNotes?: string;
  
  // Route optimization preferences
  readonly optimizeFor?: 'distance' | 'time' | 'fuel' | 'cost';
  readonly avoidTolls?: boolean;
  readonly avoidHighways?: boolean;
}

/**
 * Group update request interface
 * Data structure for updating existing groups
 */
export interface UpdateGroupRequest {
  readonly id: string;                  // Group ID to update
  readonly version: number;             // Version for optimistic locking
  
  // Updatable fields
  readonly status?: GroupStatus;
  readonly currentLocation?: LocationPoint;
  readonly vehicleId?: string;
  readonly driverId?: string;
  readonly driverName?: string;
  readonly driverContact?: string;
  readonly scheduledDeparture?: string;
  readonly actualDeparture?: string;
  readonly estimatedArrival?: string;
  readonly actualArrival?: string;
  readonly notes?: string;
  readonly customerNotes?: string;
  
  // Update metadata
  readonly updatedBy: string;
  readonly updateReason?: string;
}

/**
 * Group search criteria interface
 * Flexible search and filtering options for groups
 */
export interface GroupSearchCriteria {
  // Text search
  readonly query?: string;              // General text search
  readonly name?: string;               // Search by group name
  readonly driverName?: string;         // Search by driver name
  
  // Status filtering
  readonly status?: GroupStatus[];
  readonly statusNot?: GroupStatus[];
  
  // Date filtering
  readonly createdAfter?: string;
  readonly createdBefore?: string;
  readonly departureAfter?: string;
  readonly departureBefore?: string;
  
  // Location filtering
  readonly originCity?: string;
  readonly destinationCity?: string;
  readonly currentLocation?: string;
  
  // Vehicle and driver filtering
  readonly vehicleId?: string;
  readonly vehicleType?: VehicleType[];
  readonly driverId?: string;
  readonly hasDriver?: boolean;
  
  // Priority and handling
  readonly priority?: GroupPriority[];
  readonly hasFragile?: boolean;
  readonly hasTemperatureSensitive?: boolean;
  readonly hasHazardous?: boolean;
  
  // Package filtering
  readonly minPackageCount?: number;
  readonly maxPackageCount?: number;
  readonly containsPackage?: string;    // Contains specific package ID
  
  // Financial filtering
  readonly minTotalValue?: number;
  readonly maxTotalValue?: number;
  readonly minTotalCost?: number;
  readonly maxTotalCost?: number;
  
  // Pagination
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Group search result interface
 * Paginated search results with metadata
 */
export interface GroupSearchResult {
  readonly groups: ShipmentGroup[];     // Array of matching groups
  readonly totalCount: number;          // Total number of matches
  readonly page: number;                // Current page number
  readonly limit: number;               // Items per page
  readonly totalPages: number;          // Total number of pages
  readonly hasNext: boolean;            // Whether there are more pages
  readonly hasPrevious: boolean;        // Whether there are previous pages
}

/**
 * Group statistics interface
 * Summary statistics for shipment groups
 */
export interface GroupStatistics {
  readonly totalGroups: number;
  readonly statusCounts: Record<GroupStatus, number>;
  readonly priorityCounts: Record<GroupPriority, number>;
  readonly vehicleTypeCounts: Record<VehicleType, number>;
  readonly averagePackagesPerGroup: number;
  readonly averageDeliveryTime: number; // In hours
  readonly onTimeDeliveryRate: number;  // Percentage
  readonly totalPackagesGrouped: number;
  readonly totalValueGrouped: number;
  readonly totalWeightGrouped: number;
  readonly fuelEfficiency: number;      // Packages per liter
  readonly costPerPackage: number;      // Average cost per package
}

/**
 * Group optimization result interface
 * Result of route optimization algorithms
 */
export interface GroupOptimizationResult {
  readonly originalRoute: GroupRoute;
  readonly optimizedRoute: GroupRoute;
  readonly improvementMetrics: {
    readonly distanceSaved: number;     // Kilometers saved
    readonly timeSaved: number;         // Hours saved
    readonly fuelSaved: number;         // Liters saved
    readonly costSaved: number;         // Money saved
    readonly efficiencyGain: number;    // Percentage improvement
  };
  readonly alternativeRoutes: GroupRoute[];
  readonly optimizationTime: number;    // Time taken to optimize (ms)
}

/**
 * Shipment group utility functions
 * Helper functions for group operations
 */
export class ShipmentGroupUtils {
  /**
   * Generate a unique group ID
   * @returns New group ID in format GRP-XXXXXX
   */
  static generateGroupId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `GRP-${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Generate a route ID
   * @returns New route ID in format RTE-XXXXXX
   */
  static generateRouteId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RTE-${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Calculate group priority based on package priorities
   * @param packages - Array of packages in the group
   * @returns Calculated group priority
   */
  static calculateGroupPriority(packages: Package[]): GroupPriority {
    const priorities = packages.map(pkg => pkg.priority);
    
    if (priorities.includes(PackagePriority.URGENT)) {
      return GroupPriority.URGENT;
    } else if (priorities.includes(PackagePriority.HIGH)) {
      return GroupPriority.HIGH;
    } else if (priorities.includes(PackagePriority.MEDIUM)) {
      return GroupPriority.MEDIUM;
    } else {
      return GroupPriority.LOW;
    }
  }
  
  /**
   * Determine required vehicle type based on packages
   * @param packages - Array of packages in the group
   * @returns Recommended vehicle type
   */
  static determineVehicleType(packages: Package[]): VehicleType {
    const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalVolume = packages.reduce((sum, pkg) => 
      sum + (pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height), 0);
    
    const hasTemperatureSensitive = packages.some(pkg => pkg.temperatureSensitive);
    const hasHazardous = packages.some(pkg => pkg.hazardous);
    
    // Special vehicle requirements
    if (hasTemperatureSensitive) {
      return VehicleType.REFRIGERATED;
    }
    
    if (hasHazardous) {
      return VehicleType.SPECIALIZED;
    }
    
    // Weight-based vehicle selection
    if (totalWeight > 1000 || totalVolume > 10000000) { // 10 cubic meters
      return VehicleType.LARGE_TRUCK;
    } else if (totalWeight > 500 || totalVolume > 5000000) { // 5 cubic meters
      return VehicleType.TRUCK;
    } else if (totalWeight > 50 || totalVolume > 1000000) { // 1 cubic meter
      return VehicleType.VAN;
    } else {
      return VehicleType.MOTORCYCLE;
    }
  }
  
  /**
   * Calculate estimated delivery time for a group
   * @param group - Shipment group
   * @returns Estimated delivery completion time
   */
  static calculateEstimatedDelivery(group: ShipmentGroup): string {
    const baseTime = new Date();
    
    // Add route travel time
    let totalHours = group.route.estimatedDuration;
    
    // Add delivery time for each waypoint
    totalHours += group.route.waypoints.reduce(
      (sum, waypoint) => sum + (waypoint.deliveryDuration / 60), 0
    );
    
    // Add buffer based on priority
    const bufferHours = {
      [GroupPriority.URGENT]: 2,
      [GroupPriority.HIGH]: 4,
      [GroupPriority.MEDIUM]: 8,
      [GroupPriority.LOW]: 12
    };
    
    totalHours += bufferHours[group.priority];
    
    const estimatedDelivery = new Date(baseTime.getTime() + (totalHours * 60 * 60 * 1000));
    return estimatedDelivery.toISOString();
  }
  
  /**
   * Check if a group is overdue
   * @param group - Shipment group to check
   * @returns Whether group is overdue
   */
  static isOverdue(group: ShipmentGroup): boolean {
    if (group.status === GroupStatus.COMPLETED) {
      return false;
    }
    
    const now = new Date();
    const estimated = new Date(group.estimatedDelivery);
    return now > estimated;
  }
  
  /**
   * Get group completion percentage
   * @param group - Shipment group
   * @returns Completion percentage (0-100)
   */
  static getCompletionPercentage(group: ShipmentGroup): number {
    const completedWaypoints = group.route.waypoints.filter(wp => wp.completed).length;
    const totalWaypoints = group.route.waypoints.length;
    
    if (totalWaypoints === 0) return 0;
    return Math.round((completedWaypoints / totalWaypoints) * 100);
  }
  
  /**
   * Validate group data
   * @param group - Group to validate
   * @returns Validation errors array
   */
  static validateGroup(group: Partial<ShipmentGroup>): string[] {
    const errors: string[] = [];
    
    if (!group.name?.trim()) {
      errors.push('Group name is required');
    }
    
    if (!group.packageIds || group.packageIds.length === 0) {
      errors.push('Group must contain at least one package');
    }
    
    if (!group.origin) {
      errors.push('Group origin is required');
    }
    
    if (!group.destinations || group.destinations.length === 0) {
      errors.push('Group must have at least one destination');
    }
    
    if (group.totalWeight && group.totalWeight <= 0) {
      errors.push('Total weight must be greater than 0');
    }
    
    if (group.totalValue && group.totalValue < 0) {
      errors.push('Total value cannot be negative');
    }
    
    return errors;
  }
  
  /**
   * Format group summary for display
   * @param group - Shipment group
   * @returns Formatted summary string
   */
  static formatGroupSummary(group: ShipmentGroup): string {
    const packageText = group.packageCount === 1 ? 'package' : 'packages';
    const weightText = group.totalWeight < 1 
      ? `${(group.totalWeight * 1000).toFixed(0)}g`
      : `${group.totalWeight.toFixed(1)}kg`;
    
    return `${group.packageCount} ${packageText}, ${weightText}, ${group.destinations.length} stops`;
  }
}
