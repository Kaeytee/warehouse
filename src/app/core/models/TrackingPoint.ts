/**
 * TrackingPoint.ts
 * 
 * Core tracking point data structure for Vanguard Cargo
 * This file defines the TrackingPoint model for location-based package tracking
 * Enables status-based location illusions for customer tracking experience
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from '../status/StatusDefinitions';
import type { LocationPoint, FacilityType } from '../status/StatusLocationMapping';

/**
 * Core TrackingPoint interface
 * Individual location point in a package's journey
 */
export interface TrackingPoint {
  // 🔑 IDENTIFICATION
  readonly id: string;                    // Unique tracking point ID (TRK-XXXX)
  readonly packageId: string;             // Associated package ID
  readonly groupId?: string;              // Associated group ID if applicable
  
  // 🗺️ LOCATION INFORMATION
  readonly location: LocationPoint;       // Geographic location
  readonly previousLocation?: LocationPoint; // Previous location in journey
  readonly nextLocation?: LocationPoint;  // Next expected location
  
  // 📊 STATUS AND TIMING
  readonly status: PackageStatus;         // Package status at this point
  readonly timestamp: string;             // When package was/will be at this location
  readonly estimatedArrival?: string;     // Estimated arrival time
  readonly actualArrival?: string;        // Actual arrival time
  readonly estimatedDeparture?: string;   // Estimated departure time
  readonly actualDeparture?: string;      // Actual departure time
  readonly duration?: number;             // Time spent at location (minutes)
  
  // 🎯 TRACKING METADATA
  readonly isEstimated: boolean;          // Whether this is an estimated point
  readonly isVisible: boolean;            // Whether visible to customers
  readonly isActive: boolean;             // Whether this is the current location
  readonly isMilestone: boolean;          // Whether this is a major milestone
  readonly sequence: number;              // Order in the tracking sequence
  
  // 📝 DESCRIPTIVE INFORMATION
  readonly description: string;           // Human-readable description
  readonly customerDescription?: string;  // Customer-facing description
  readonly internalNotes?: string;        // Internal notes not visible to customers
  readonly publicNotes?: string;          // Notes visible to customers
  readonly notes?: string;               // General notes
  readonly exceptionDetails?: string;     // Details about exceptions
  
  // 🚛 OPERATIONAL DETAILS
  readonly facilityType: FacilityType;    // Type of facility at this location
  readonly vehicleId?: string;            // Vehicle ID if in transit
  readonly driverId?: string;             // Driver ID if applicable
  readonly scanType?: ScanType;           // Type of scan/check-in
  readonly scanData?: string;             // Additional scan data
  readonly scannedBy?: string;            // User who performed the scan
  readonly deviceId?: string;             // Device used for scanning
  
  // 🔄 STATUS CONTEXT
  readonly statusReason?: string;         // Reason for status at this location
  readonly delayReason?: string;          // Reason for any delays
  readonly exceptionType?: ExceptionType; // Type of exception if any
  readonly resolutionNotes?: string;      // Notes about exception resolution
  
  // 🌡️ ENVIRONMENTAL CONDITIONS
  readonly temperature?: number;          // Temperature at location (Celsius)
  readonly humidity?: number;             // Humidity percentage
  readonly weatherConditions?: string;    // Weather description
  readonly specialConditions?: string[];  // Special environmental conditions
  
  // 🔐 METADATA
  readonly createdAt: string;             // Point creation timestamp
  readonly updatedAt: string;             // Last update timestamp
  readonly createdBy: string;             // User/system that created point
  readonly lastModifiedBy: string;        // User/system that last modified
  readonly source: TrackingSource;        // Source of tracking information
  readonly confidence: number;            // Confidence level (0-1)
  readonly metadata?: Record<string, any>; // Additional metadata
}

/**
 * Scan type enumeration
 * Different types of package scans/check-ins
 */
export type ScanType =
  | 'pickup'          // Package picked up
  | 'arrival'         // Arrived at facility
  | 'departure'       // Departed from facility
  | 'sort'            // Sorted at facility
  | 'load'            // Loaded onto vehicle
  | 'unload'          // Unloaded from vehicle
  | 'delivery_attempt' // Attempted delivery
  | 'delivery_success' // Successful delivery
  | 'return'          // Returned to sender
  | 'exception';      // Exception scan

// Constants for ScanType to maintain compatibility
export const ScanType = {
  PICKUP: 'pickup' as ScanType,
  ARRIVAL: 'arrival' as ScanType,
  DEPARTURE: 'departure' as ScanType,
  SORT: 'sort' as ScanType,
  LOAD: 'load' as ScanType,
  UNLOAD: 'unload' as ScanType,
  DELIVERY_ATTEMPT: 'delivery_attempt' as ScanType,
  DELIVERY_SUCCESS: 'delivery_success' as ScanType,
  RETURN: 'return' as ScanType,
  EXCEPTION: 'exception' as ScanType
} as const;

/**
 * Exception type enumeration
 * Types of exceptions that can occur during tracking
 */
export type ExceptionType =
  | 'delay'                // General delay
  | 'weather_delay'        // Weather-related delay
  | 'vehicle_breakdown'    // Vehicle issues
  | 'traffic_delay'        // Traffic-related delay
  | 'address_issue'        // Address problems
  | 'recipient_unavailable' // Recipient not available
  | 'damaged_package'      // Package damage
  | 'lost_package'         // Package lost
  | 'security_hold'        // Security-related hold
  | 'customs_delay'        // Customs processing delay
  | 'facility_closure'     // Facility closed
  | 'other';               // Other exception

// Constants for ExceptionType to maintain compatibility
export const ExceptionType = {
  DELAY: 'delay' as ExceptionType,
  WEATHER_DELAY: 'weather_delay' as ExceptionType,
  VEHICLE_BREAKDOWN: 'vehicle_breakdown' as ExceptionType,
  TRAFFIC_DELAY: 'traffic_delay' as ExceptionType,
  ADDRESS_ISSUE: 'address_issue' as ExceptionType,
  RECIPIENT_UNAVAILABLE: 'recipient_unavailable' as ExceptionType,
  DAMAGED_PACKAGE: 'damaged_package' as ExceptionType,
  LOST_PACKAGE: 'lost_package' as ExceptionType,
  SECURITY_HOLD: 'security_hold' as ExceptionType,
  CUSTOMS_DELAY: 'customs_delay' as ExceptionType,
  FACILITY_CLOSURE: 'facility_closure' as ExceptionType,
  OTHER: 'other' as ExceptionType
} as const;

/**
 * Tracking source enum
 */
export type TrackingSource = 
  | 'MANUAL'
  | 'SYSTEM'
  | 'API'
  | 'SCAN'
  | 'DEVICE'
  | 'MANUAL_ENTRY'
  | 'SYSTEM_GENERATED'
  | 'CUSTOMER'
  | 'DRIVER'
  | 'ESTIMATED';

// Constants for TrackingSource to maintain compatibility
export const TrackingSource = {
  MANUAL: 'MANUAL' as TrackingSource,
  SYSTEM: 'SYSTEM' as TrackingSource,
  API: 'API' as TrackingSource,
  SCAN: 'SCAN' as TrackingSource,
  DEVICE: 'DEVICE' as TrackingSource,
  MANUAL_ENTRY: 'MANUAL_ENTRY' as TrackingSource,
  SYSTEM_GENERATED: 'SYSTEM_GENERATED' as TrackingSource,
  CUSTOMER: 'CUSTOMER' as TrackingSource,        // Customer reported
  DRIVER: 'DRIVER' as TrackingSource,            // Driver app
  ESTIMATED: 'ESTIMATED' as TrackingSource       // Estimated/calculated
} as const;

/**
 * Tracking timeline interface
 * Complete timeline view of package journey
 */
export interface TrackingTimeline {
  readonly packageId: string;            // Package being tracked
  readonly points: TrackingPoint[];      // Ordered tracking points
  readonly currentPoint?: TrackingPoint; // Current location
  readonly nextPoint?: TrackingPoint;    // Next expected point
  readonly estimatedDelivery: string | null;    // Estimated delivery time
  readonly actualDelivery?: string | null;      // Actual delivery time
  readonly totalDistance: number;        // Total journey distance (km)
  readonly completionPercentage: number; // Journey completion (0-100)
  readonly isOnTime: boolean;           // Whether delivery is on schedule
  readonly delayMinutes?: number;       // Minutes delayed if applicable
}

/**
 * Tracking update request interface
 * Data structure for updating tracking points
 */
export interface TrackingUpdateRequest {
  readonly packageId: string;            // Package to update
  readonly groupId?: string;            // Associated group ID if applicable
  readonly location: LocationPoint;      // New location
  readonly status: PackageStatus;        // New status
  readonly timestamp?: string;           // Timestamp (defaults to now)
  readonly description?: string;         // Description of update
  readonly scanType?: ScanType;          // Type of scan
  readonly vehicleId?: string;           // Vehicle ID if applicable
  readonly driverId?: string;            // Driver ID if applicable
  readonly notes?: string;               // Additional notes
  readonly internalNotes?: string;       // Internal notes (not visible to customers)
  readonly source?: TrackingSource;      // Source of update (defaults to MANUAL)
  readonly performedBy: string;          // User performing update
  readonly scannedBy?: string;          // Person who scanned the package
  readonly deviceId?: string;           // Device used for scanning
  readonly temperature?: number;        // Temperature at tracking point
  readonly humidity?: number;           // Humidity at tracking point
  readonly isEstimated?: boolean;       // Whether this is an estimated point
  readonly isVisible?: boolean;         // Whether this point is visible to customers
  readonly isMilestone?: boolean;       // Whether this is a milestone point
  readonly exceptionType?: ExceptionType; // Type of exception if applicable
  readonly exceptionDetails?: string;   // Details about the exception
  readonly confidence?: number;         // Confidence level of tracking data
  readonly metadata?: Record<string, any>; // Additional metadata
}

/**
 * Tracking search criteria interface
 * Search and filter options for tracking points
 */
export interface TrackingSearchCriteria {
  // Package/Group filtering
  readonly packageId?: string;
  readonly packageIds?: string[];
  readonly groupId?: string;
  
  // Location filtering
  readonly locationCity?: string;
  readonly locationRegion?: string;
  readonly facilityType?: FacilityType[];
  readonly nearLocation?: {
    readonly latitude: number;
    readonly longitude: number;
    readonly radiusKm: number;
  };
  
  // Status filtering
  readonly status?: PackageStatus[];
  readonly statusNot?: PackageStatus[];
  readonly isActive?: boolean;
  readonly isVisible?: boolean;
  readonly isMilestone?: boolean;
  
  // Time filtering
  readonly timestampAfter?: string;
  readonly timestampBefore?: string;
  readonly createdAfter?: string;
  readonly createdBefore?: string;
  
  // Operational filtering
  readonly vehicleId?: string;
  readonly driverId?: string;
  readonly scanType?: ScanType[];
  readonly source?: TrackingSource[];
  readonly hasException?: boolean;
  readonly exceptionType?: ExceptionType[];
  
  // Pagination
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Tracking analytics interface
 * Analytics data for tracking performance
 */
export interface TrackingAnalytics {
  readonly totalPoints: number;
  readonly statusCounts: Record<PackageStatus, number>;
  readonly facilityTypeCounts: Record<FacilityType, number>;
  readonly scanTypeCounts: Record<ScanType, number>;
  readonly sourceCounts: Record<TrackingSource, number>;
  readonly exceptionCounts: Record<ExceptionType, number>;
  readonly averagePointsPerPackage: number;
  readonly averageJourneyTime: number;   // Hours
  readonly onTimeDeliveryRate: number;   // Percentage
  readonly exceptionRate: number;        // Percentage
  readonly mostCommonDelayReasons: Array<{
    readonly reason: string;
    readonly count: number;
    readonly percentage: number;
  }>;
}

/**
 * Tracking point utility functions
 * Helper functions for tracking operations
 */
export class TrackingPointUtils {
  /**
   * Generate a unique tracking point ID
   * @returns New tracking point ID in format TRK-XXXXXX
   */
  static generateTrackingPointId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TRK-${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Create a tracking timeline from points
   * @param points - Array of tracking points
   * @param packageId - Package ID
   * @returns Complete tracking timeline
   */
  static createTimeline(points: TrackingPoint[], packageId: string): TrackingTimeline {
    // Sort points by sequence and timestamp
    const sortedPoints = points
      .filter(p => p.packageId === packageId)
      .sort((a, b) => {
        if (a.sequence !== b.sequence) {
          return a.sequence - b.sequence;
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    
    const currentPoint = sortedPoints.find(p => p.isActive);
    const nextPoint = currentPoint 
      ? sortedPoints.find(p => p.sequence > currentPoint.sequence)
      : sortedPoints[0];
    
    // Calculate completion percentage
    const totalPoints = sortedPoints.length;
    const completedPoints = sortedPoints.filter(p => 
      new Date(p.timestamp) <= new Date()
    ).length;
    const completionPercentage = totalPoints > 0 
      ? Math.round((completedPoints / totalPoints) * 100)
      : 0;
    
    // Find delivery information
    const deliveryPoint = sortedPoints.find(p => 
      p.status === PackageStatus.DELIVERED
    );
    
    const estimatedDelivery = deliveryPoint?.estimatedArrival || 
      sortedPoints[sortedPoints.length - 1]?.estimatedArrival ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const actualDelivery = deliveryPoint?.actualArrival;
    
    // Calculate if on time
    const isOnTime = !actualDelivery || 
      new Date(actualDelivery) <= new Date(estimatedDelivery);
    
    // Calculate delay
    let delayMinutes: number | undefined;
    if (actualDelivery && !isOnTime) {
      delayMinutes = Math.round(
        (new Date(actualDelivery).getTime() - new Date(estimatedDelivery).getTime()) 
        / (1000 * 60)
      );
    }
    
    // Calculate total distance (simplified)
    const totalDistance = this.calculateTotalDistance(sortedPoints);
    
    return {
      packageId,
      points: sortedPoints,
      currentPoint,
      nextPoint,
      estimatedDelivery,
      actualDelivery,
      totalDistance,
      completionPercentage,
      isOnTime,
      delayMinutes
    };
  }
  
  /**
   * Calculate distance between tracking points
   * @param points - Array of tracking points
   * @returns Total distance in kilometers
   */
  static calculateTotalDistance(points: TrackingPoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      totalDistance += this.calculateDistance(
        prev.location.latitude,
        prev.location.longitude,
        curr.location.latitude,
        curr.location.longitude
      );
    }
    
    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 - First latitude
   * @param lon1 - First longitude
   * @param lat2 - Second latitude
   * @param lon2 - Second longitude
   * @returns Distance in kilometers
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   * @param degrees - Degrees to convert
   * @returns Radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Get customer-friendly status description
   * @param point - Tracking point
   * @returns Customer-friendly description
   */
  static getCustomerDescription(point: TrackingPoint): string {
    if (point.customerDescription) {
      return point.customerDescription;
    }
    
    // Generate customer-friendly descriptions
    const locationName = point.location.landmark || point.location.city;
    
    switch (point.status) {
      case PackageStatus.PENDING:
        return `Package request received at ${locationName}`;
      case PackageStatus.PROCESSING:
        return `Package being processed at ${locationName}`;
      case PackageStatus.GROUPED:
        return `Package grouped for delivery at ${locationName}`;
      case PackageStatus.DISPATCHED:
        return `Package dispatched from ${locationName}`;
      case PackageStatus.IN_TRANSIT:
        return `Package in transit near ${locationName}`;
      case PackageStatus.OUT_FOR_DELIVERY:
        return `Package out for delivery from ${locationName}`;
      case PackageStatus.DELIVERED:
        return `Package delivered at ${locationName}`;
      case PackageStatus.DELAYED:
        return `Package delayed at ${locationName}`;
      case PackageStatus.RETURNED:
        return `Package returned to ${locationName}`;
      default:
        return point.description;
    }
  }
  
  /**
   * Check if a tracking point represents an exception
   * @param point - Tracking point to check
   * @returns Whether point represents an exception
   */
  static isException(point: TrackingPoint): boolean {
    return point.exceptionType !== undefined ||
           point.status === PackageStatus.DELAYED ||
           point.status === PackageStatus.RETURNED ||
           point.status === PackageStatus.LOST;
  }
  
  /**
   * Get tracking point icon for UI display
   * @param point - Tracking point
   * @returns Icon identifier
   */
  static getIcon(point: TrackingPoint): string {
    if (point.exceptionType) {
      return 'alert-triangle';
    }
    
    switch (point.status) {
      case PackageStatus.PENDING:
        return 'clock';
      case PackageStatus.PROCESSING:
        return 'cog';
      case PackageStatus.GROUPED:
        return 'layers';
      case PackageStatus.DISPATCHED:
        return 'truck';
      case PackageStatus.IN_TRANSIT:
        return 'navigation';
      case PackageStatus.OUT_FOR_DELIVERY:
        return 'map-pin';
      case PackageStatus.DELIVERED:
        return 'check-circle';
      case PackageStatus.DELAYED:
        return 'clock';
      case PackageStatus.RETURNED:
        return 'rotate-ccw';
      case PackageStatus.LOST:
        return 'x-circle';
      default:
        return 'package';
    }
  }
  
  /**
   * Get tracking point color for UI display
   * @param point - Tracking point
   * @returns Color hex code
   */
  static getColor(point: TrackingPoint): string {
    if (point.exceptionType) {
      return '#F97316'; // Orange for exceptions
    }
    
    switch (point.status) {
      case PackageStatus.PENDING:
        return '#6B7280'; // Gray
      case PackageStatus.PROCESSING:
        return '#3B82F6'; // red
      case PackageStatus.GROUPED:
      case PackageStatus.GROUP_CONFIRMED:
        return '#F59E0B'; // Amber
      case PackageStatus.DISPATCHED:
      case PackageStatus.IN_TRANSIT:
      case PackageStatus.OUT_FOR_DELIVERY:
        return '#10B981'; // Green
      case PackageStatus.DELIVERED:
        return '#8B5CF6'; // Purple
      case PackageStatus.DELAYED:
        return '#F97316'; // Orange
      case PackageStatus.RETURNED:
      case PackageStatus.LOST:
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  }
  
  /**
   * Validate tracking point data
   * @param point - Tracking point to validate
   * @returns Validation errors array
   */
  static validateTrackingPoint(point: Partial<TrackingPoint>): string[] {
    const errors: string[] = [];
    
    if (!point.packageId?.trim()) {
      errors.push('Package ID is required');
    }
    
    if (!point.location) {
      errors.push('Location is required');
    }
    
    if (!point.status) {
      errors.push('Status is required');
    }
    
    if (!point.timestamp) {
      errors.push('Timestamp is required');
    } else {
      const timestamp = new Date(point.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }
    
    if (!point.description?.trim()) {
      errors.push('Description is required');
    }
    
    if (point.sequence !== undefined && point.sequence < 0) {
      errors.push('Sequence must be non-negative');
    }
    
    if (point.confidence !== undefined && (point.confidence < 0 || point.confidence > 1)) {
      errors.push('Confidence must be between 0 and 1');
    }
    
    return errors;
  }
}
