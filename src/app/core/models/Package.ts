/**
 * Package.ts
 * 
 * Core package/shipment data structure for Vanguard Cargo
 * This file defines the central Package model used throughout the entire application
 * Provides type safety and consistency for all package-related operations
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from '../status/StatusDefinitions';
import type { LocationPoint } from '../status/StatusLocationMapping';

/**
 * Core Package interface
 * Central data structure for all package/shipment information
 */
export interface Package {
  // 🔑 IDENTIFICATION
  readonly id: string;                    // Unique package identifier (PKG-XXXX)
  readonly requestId: string;             // Original request ID (REQ-XXXX)
  readonly trackingNumber: string;        // Customer-facing tracking number
  readonly barcode?: string;              // Generated barcode data URL
  
  // 📋 BASIC INFORMATION
  readonly clientName: string;            // Client/customer name
  readonly clientId?: string;             // Client identifier in system
  readonly clientEmail?: string;          // Client email address
  readonly clientPhone?: string;          // Client phone number
  
  // 📦 PACKAGE DETAILS
  readonly description: string;           // Package contents description
  readonly packageType: PackageType;     // Type of package
  readonly weight: number;                // Weight in kilograms
  readonly dimensions: PackageDimensions; // Package dimensions
  readonly value: number;                 // Declared value in currency
  readonly currency: string;              // Currency code (GHS, USD, etc.)
  
  // 🗺️ LOCATION INFORMATION
  readonly origin: LocationPoint;         // Pickup/origin location
  readonly destination: LocationPoint;    // Delivery destination
  readonly currentLocation?: LocationPoint; // Current package location
  
  // 📊 STATUS AND TRACKING
  readonly status: PackageStatus;         // Current package status
  readonly statusHistory: StatusHistoryEntry[]; // Complete status history
  readonly trackingPoints: TrackingPoint[]; // Location tracking points
  
  // 👥 GROUP MANAGEMENT
  readonly groupId?: string;              // Shipment group ID if grouped
  readonly groupPosition?: number;        // Position within group
  
  // ⏰ TIMESTAMPS
  readonly createdAt: string;             // Package creation timestamp
  readonly updatedAt: string;             // Last update timestamp
  readonly estimatedDelivery: string;     // Estimated delivery date/time
  readonly actualDelivery?: string;       // Actual delivery timestamp
  
  // 🚨 SPECIAL HANDLING
  readonly priority: PackagePriority;     // Package priority level
  readonly specialHandling: string[];     // Special handling requirements
  readonly fragile: boolean;              // Whether package is fragile
  readonly temperatureSensitive: boolean; // Temperature control required
  readonly hazardous: boolean;            // Contains hazardous materials
  
  // 💰 FINANCIAL
  readonly shippingCost: number;          // Shipping cost
  readonly insuranceValue?: number;       // Insurance coverage amount
  readonly paymentStatus: PaymentStatus; // Payment status
  readonly paymentMethod?: string;        // Payment method used
  
  // 📝 ADDITIONAL INFORMATION
  readonly notes?: string;                // Internal notes
  readonly customerNotes?: string;        // Customer-provided notes
  readonly deliveryInstructions?: string; // Special delivery instructions
  readonly signatureRequired: boolean;    // Whether signature is required
  
  // 🔒 METADATA
  readonly createdBy: string;             // User who created the package
  readonly lastModifiedBy: string;        // User who last modified
  readonly version: number;               // Version for optimistic locking
}

/**
 * Package type enumeration
 * Categorizes different types of packages
 */
export const PackageType = {
  DOCUMENT: 'document',           // Documents and papers
  PARCEL: 'parcel',              // Standard parcels
  FRAGILE: 'fragile',            // Fragile items
  ELECTRONICS: 'electronics',    // Electronic devices
  CLOTHING: 'clothing',          // Clothing and textiles
  FOOD: 'food',                  // Food items
  MEDICAL: 'medical',            // Medical supplies
  AUTOMOTIVE: 'automotive',      // Auto parts
  INDUSTRIAL: 'industrial',      // Industrial equipment
  OTHER: 'other'                 // Other items
} as const;

// Type for package type values
export type PackageType = typeof PackageType[keyof typeof PackageType];

/**
 * Package priority enumeration
 * Defines priority levels for processing and delivery
 */
export const PackagePriority = {
  LOW: 'low',                    // Standard processing
  MEDIUM: 'medium',              // Expedited processing
  HIGH: 'high',                  // Priority processing
  URGENT: 'urgent'               // Emergency processing
} as const;

// Type for package priority values
export type PackagePriority = typeof PackagePriority[keyof typeof PackagePriority];

/**
 * Payment status enumeration
 * Tracks payment status for packages
 */
export const PaymentStatus = {
  PENDING: 'pending',            // Payment not yet received
  PAID: 'paid',                  // Payment completed
  PARTIAL: 'partial',            // Partial payment received
  REFUNDED: 'refunded',          // Payment refunded
  FAILED: 'failed'               // Payment failed
} as const;

// Type for payment status values
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

/**
 * Package dimensions interface
 * Standard dimensions in centimeters
 */
export interface PackageDimensions {
  readonly length: number;        // Length in cm
  readonly width: number;         // Width in cm
  readonly height: number;        // Height in cm
  readonly volume?: number;       // Calculated volume in cm³
}

/**
 * Status history entry interface
 * Records each status change with full context
 */
export interface StatusHistoryEntry {
  readonly id: string;            // Unique entry ID
  readonly status: PackageStatus; // Status at this point
  readonly timestamp: string;     // When status was set (ISO string)
  readonly location?: LocationPoint; // Location where change occurred
  readonly performedBy: string;   // User who performed the change
  readonly performedByRole: string; // Role of the user
  readonly reason?: string;       // Reason for status change
  readonly notes?: string;        // Additional notes
  readonly automatic: boolean;    // Whether change was automatic
  readonly estimatedDuration?: number; // Expected time in this status (hours)
}

/**
 * Tracking point interface
 * Individual location points in package journey
 */
export interface TrackingPoint {
  readonly id: string;            // Unique tracking point ID
  readonly location: LocationPoint; // Geographic location
  readonly timestamp: string;     // When package was at this location
  readonly status: PackageStatus; // Status at this location
  readonly description: string;   // Human-readable description
  readonly isEstimated: boolean;  // Whether this is an estimated point
  readonly isVisible: boolean;    // Whether visible to customers
  readonly estimatedArrival?: string; // Estimated arrival time
  readonly actualArrival?: string; // Actual arrival time
  readonly notes?: string;        // Additional notes
}

/**
 * Package creation request interface
 * Data structure for creating new packages
 */
export interface CreatePackageRequest {
  // Required fields
  readonly requestId: string;
  readonly clientName: string;
  readonly description: string;
  readonly packageType: PackageType;
  readonly weight: number;
  readonly dimensions: PackageDimensions;
  readonly value: number;
  readonly currency: string;
  readonly origin: LocationPoint;
  readonly destination: LocationPoint;
  readonly priority: PackagePriority;
  
  // Optional fields
  readonly clientId?: string;
  readonly clientEmail?: string;
  readonly clientPhone?: string;
  readonly specialHandling?: string[];
  readonly fragile?: boolean;
  readonly temperatureSensitive?: boolean;
  readonly hazardous?: boolean;
  readonly shippingCost?: number;
  readonly insuranceValue?: number;
  readonly paymentMethod?: string;
  readonly notes?: string;
  readonly customerNotes?: string;
  readonly deliveryInstructions?: string;
  readonly signatureRequired?: boolean;
  readonly estimatedDelivery?: string;
}

/**
 * Package update request interface
 * Data structure for updating existing packages
 */
export interface UpdatePackageRequest {
  readonly id: string;            // Package ID to update
  readonly version: number;       // Version for optimistic locking
  
  // Updatable fields
  readonly status?: PackageStatus;
  readonly currentLocation?: LocationPoint;
  readonly groupId?: string;
  readonly estimatedDelivery?: string;
  readonly actualDelivery?: string;
  readonly paymentStatus?: PaymentStatus;
  readonly notes?: string;
  readonly customerNotes?: string;
  readonly deliveryInstructions?: string;
  
  // Update metadata
  readonly updatedBy: string;
  readonly updateReason?: string;
}

/**
 * Package search criteria interface
 * Flexible search and filtering options
 */
export interface PackageSearchCriteria {
  // Text search
  readonly query?: string;        // General text search
  readonly clientName?: string;   // Search by client name
  readonly trackingNumber?: string; // Search by tracking number
  
  // Status filtering
  readonly status?: PackageStatus[];
  readonly statusNot?: PackageStatus[];
  
  // Date filtering
  readonly createdAfter?: string;
  readonly createdBefore?: string;
  readonly deliveryAfter?: string;
  readonly deliveryBefore?: string;
  
  // Location filtering
  readonly originCity?: string;
  readonly destinationCity?: string;
  readonly currentLocation?: string;
  
  // Group filtering
  readonly groupId?: string;
  readonly grouped?: boolean;     // Whether package is in a group
  
  // Priority and type filtering
  readonly priority?: PackagePriority[];
  readonly packageType?: PackageType[];
  
  // Special handling
  readonly fragile?: boolean;
  readonly temperatureSensitive?: boolean;
  readonly hazardous?: boolean;
  
  // Financial filtering
  readonly paymentStatus?: PaymentStatus[];
  readonly minValue?: number;
  readonly maxValue?: number;
  
  // Pagination
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Package search result interface
 * Paginated search results with metadata
 */
export interface PackageSearchResult {
  readonly packages: Package[];   // Array of matching packages
  readonly totalCount: number;    // Total number of matches
  readonly page: number;          // Current page number
  readonly limit: number;         // Items per page
  readonly totalPages: number;    // Total number of pages
  readonly hasNext: boolean;      // Whether there are more pages
  readonly hasPrevious: boolean;  // Whether there are previous pages
}

/**
 * Package statistics interface
 * Summary statistics for packages
 */
export interface PackageStatistics {
  readonly totalPackages: number;
  readonly statusCounts: Record<PackageStatus, number>;
  readonly priorityCounts: Record<PackagePriority, number>;
  readonly typeCounts: Record<PackageType, number>;
  readonly averageDeliveryTime: number; // In hours
  readonly onTimeDeliveryRate: number; // Percentage
  readonly totalValue: number;
  readonly totalWeight: number;
  readonly groupedPackages: number;
  readonly ungroupedPackages: number;
}

/**
 * Package utility functions
 * Helper functions for package operations
 */
export class PackageUtils {
  /**
   * Generate a unique package ID
   * @returns New package ID in format PKG-XXXXXX
   */
  static generatePackageId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PKG-${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Generate a tracking number for customers
   * @returns Customer-facing tracking number
   */
  static generateTrackingNumber(): string {
    const prefix = 'TT'; // Vanguard prefix
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString().slice(-4);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Calculate package volume from dimensions
   * @param dimensions - Package dimensions
   * @returns Volume in cubic centimeters
   */
  static calculateVolume(dimensions: PackageDimensions): number {
    return dimensions.length * dimensions.width * dimensions.height;
  }
  
  /**
   * Calculate volumetric weight (for pricing)
   * @param dimensions - Package dimensions
   * @param divisor - Volumetric divisor (default 5000)
   * @returns Volumetric weight in kg
   */
  static calculateVolumetricWeight(
    dimensions: PackageDimensions,
    divisor: number = 5000
  ): number {
    const volume = this.calculateVolume(dimensions);
    return volume / divisor;
  }
  
  /**
   * Get billable weight (higher of actual or volumetric)
   * @param actualWeight - Actual weight in kg
   * @param dimensions - Package dimensions
   * @returns Billable weight in kg
   */
  static getBillableWeight(
    actualWeight: number,
    dimensions: PackageDimensions
  ): number {
    const volumetricWeight = this.calculateVolumetricWeight(dimensions);
    return Math.max(actualWeight, volumetricWeight);
  }
  
  /**
   * Check if package is overdue based on estimated delivery
   * @param pkg - Package to check
   * @returns Whether package is overdue
   */
  static isOverdue(pkg: Package): boolean {
    if (pkg.status === PackageStatus.DELIVERED) {
      return false;
    }
    
    const now = new Date();
    const estimated = new Date(pkg.estimatedDelivery);
    return now > estimated;
  }
  
  /**
   * Get package age in hours
   * @param pkg - Package to check
   * @returns Age in hours
   */
  static getPackageAge(pkg: Package): number {
    const now = new Date();
    const created = new Date(pkg.createdAt);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  }
  
  /**
   * Format package dimensions as string
   * @param dimensions - Package dimensions
   * @returns Formatted dimensions string
   */
  static formatDimensions(dimensions: PackageDimensions): string {
    return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`;
  }
  
  /**
   * Format package weight with appropriate units
   * @param weight - Weight in kg
   * @returns Formatted weight string
   */
  static formatWeight(weight: number): string {
    if (weight < 1) {
      return `${(weight * 1000).toFixed(0)}g`;
    }
    return `${weight.toFixed(1)}kg`;
  }
  
  /**
   * Validate package data
   * @param pkg - Package to validate
   * @returns Validation errors array
   */
  static validatePackage(pkg: Partial<Package>): string[] {
    const errors: string[] = [];
    
    if (!pkg.clientName?.trim()) {
      errors.push('Client name is required');
    }
    
    if (!pkg.description?.trim()) {
      errors.push('Package description is required');
    }
    
    if (!pkg.weight || pkg.weight <= 0) {
      errors.push('Package weight must be greater than 0');
    }
    
    if (!pkg.dimensions) {
      errors.push('Package dimensions are required');
    } else {
      if (pkg.dimensions.length <= 0 || pkg.dimensions.width <= 0 || pkg.dimensions.height <= 0) {
        errors.push('All dimensions must be greater than 0');
      }
    }
    
    if (!pkg.value || pkg.value < 0) {
      errors.push('Package value must be 0 or greater');
    }
    
    if (!pkg.origin) {
      errors.push('Origin location is required');
    }
    
    if (!pkg.destination) {
      errors.push('Destination location is required');
    }
    
    return errors;
  }
}
// Re-export PackageStatus from StatusDefinitions for convenience
export { PackageStatus };

// No need for explicit type exports as interfaces are already exported when defined with 'export interface'

