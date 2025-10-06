/**
 * StatusDefinitions.ts
 * 
 * Centralized status management system for Vanguard Cargo
 * This file serves as the single source of truth for all package/shipment status codes
 * and their properties throughout the entire application.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

/**
 * Core package lifecycle status definition
 * Defines all possible states a package can be in during its journey
 */
export enum PackageStatus {
  // INTAKE PHASE - Initial processing of packages
  PENDING = 'pending',                    // Request received, awaiting processing
  PROCESSING = 'processing',              // Package being prepared/verified
  
  // GROUPING PHASE - Batch management operations
  READY_FOR_GROUPING = 'ready-for-grouping',  // Available for batch selection
  GROUPED = 'grouped',                    // Added to shipment group
  GROUP_CONFIRMED = 'group-confirmed',    // Group finalized, ready for dispatch
  
  // 🚚 SHIPPING PHASE - Active delivery process
  DISPATCHED = 'dispatched',              // Left warehouse/facility
  SHIPPED = 'shipped',                    // Package has been shipped
  IN_TRANSIT = 'in-transit',              // Moving toward destination
  OUT_FOR_DELIVERY = 'out-for-delivery',  // Final delivery attempt
  DELIVERED = 'delivered',                // Successfully delivered
  
  // ⚠️ EXCEPTION HANDLING - Error states and special cases
  DELAYED = 'delayed',                    // Unexpected delay occurred
  RETURNED = 'returned',                  // Delivery failed, returning to sender
  LOST = 'lost',                          // Package cannot be located
  EXCEPTION = 'exception',                // Generic exception state
  CANCELLED = 'cancelled'                 // Delivery cancelled
}

/**
 * Status metadata interface
 * Contains additional information about each status for UI and business logic
 */
export interface StatusMetadata {
  readonly label: string;                 // Human-readable display name
  readonly description: string;           // Detailed description of the status
  readonly phase: StatusPhase;            // Which phase of the lifecycle this status belongs to
  readonly color: StatusColor;            // Color scheme for UI display
  readonly icon: string;                  // Icon identifier for UI
  readonly isTerminal: boolean;           // Whether this is a final state
  readonly requiresAction: boolean;       // Whether admin action is required
  readonly customerVisible: boolean;      // Whether customers can see this status
  readonly estimatedDuration: number;     // Estimated time in this status (hours)
}

/**
 * Status phase definition
 * Groups statuses into logical phases for better organization
 */
export enum StatusPhase {
  INTAKE = 'intake',           // Initial processing and verification
  GROUPING = 'grouping',       // Batch management and preparation
  SHIPPING = 'shipping',       // Active delivery process
  EXCEPTION = 'exception'      // Error states and special cases
}

/**
 * Status color scheme definition
 * Standardized color coding for consistent UI display
 */
export enum StatusColor {
  GRAY = 'gray',       // Neutral/pending
  red = 'red',       // In progress/normal
  GREEN = 'green',     // Success/completed
  YELLOW = 'yellow',   // Warning/attention
  ORANGE = 'orange',   // Caution/delayed
  RED = 'red',         // Error/critical
  PURPLE = 'purple'    // Special handling
}

/**
 * Comprehensive status metadata mapping
 * Central configuration for all status properties and behaviors
 */
export const STATUS_METADATA: Record<string, StatusMetadata> = {
  [PackageStatus.PENDING]: {
    label: 'Pending',
    description: 'Request received and awaiting initial processing',
    phase: StatusPhase.INTAKE,
    color: StatusColor.GRAY,
    icon: 'clock',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 24
  },
  
  [PackageStatus.PROCESSING]: {
    label: 'Processing',
    description: 'Package being prepared, verified, and documented',
    phase: StatusPhase.INTAKE,
    color: StatusColor.red,
    icon: 'cog',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 12
  },
  
  [PackageStatus.READY_FOR_GROUPING]: {
    label: 'Ready for Grouping',
    description: 'Package processed and available for batch selection',
    phase: StatusPhase.GROUPING,
    color: StatusColor.YELLOW,
    icon: 'package',
    isTerminal: false,
    requiresAction: true,
    customerVisible: false,
    estimatedDuration: 6
  },
  
  [PackageStatus.GROUPED]: {
    label: 'Grouped',
    description: 'Package added to shipment group, awaiting dispatch',
    phase: StatusPhase.GROUPING,
    color: StatusColor.YELLOW,
    icon: 'layers',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 4
  },
  
  [PackageStatus.GROUP_CONFIRMED]: {
    label: 'Group Confirmed',
    description: 'Shipment group finalized and ready for dispatch',
    phase: StatusPhase.GROUPING,
    color: StatusColor.YELLOW,
    icon: 'check-circle',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 2
  },
  
  [PackageStatus.DISPATCHED]: {
    label: 'Dispatched',
    description: 'Package has left the warehouse or facility',
    phase: StatusPhase.SHIPPING,
    color: StatusColor.red,
    icon: 'truck',
    isTerminal: false,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 12
  },
  
  [PackageStatus.SHIPPED]: {
    label: 'Shipped',
    description: 'Package has been shipped and is on its way',
    phase: StatusPhase.SHIPPING,
    color: StatusColor.red,
    icon: 'shipping-fast',
    isTerminal: false,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 24
  },
  
  [PackageStatus.IN_TRANSIT]: {
    label: 'In Transit',
    description: 'Package is actively moving toward destination',
    phase: StatusPhase.SHIPPING,
    color: StatusColor.GREEN,
    icon: 'navigation',
    isTerminal: false,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 24
  },
  
  [PackageStatus.OUT_FOR_DELIVERY]: {
    label: 'Out for Delivery',
    description: 'Package is with delivery agent for final delivery',
    phase: StatusPhase.SHIPPING,
    color: StatusColor.GREEN,
    icon: 'map-pin',
    isTerminal: false,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 8
  },
  
  [PackageStatus.DELIVERED]: {
    label: 'Delivered',
    description: 'Package successfully delivered to recipient',
    phase: StatusPhase.SHIPPING,
    color: StatusColor.PURPLE,
    icon: 'check',
    isTerminal: true,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 0
  },
  
  [PackageStatus.DELAYED]: {
    label: 'Delayed',
    description: 'Unexpected delay in delivery process',
    phase: StatusPhase.EXCEPTION,
    color: StatusColor.ORANGE,
    icon: 'alert-triangle',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 12
  },
  
  [PackageStatus.RETURNED]: {
    label: 'Returned',
    description: 'Delivery failed, package returning to sender',
    phase: StatusPhase.EXCEPTION,
    color: StatusColor.RED,
    icon: 'rotate-ccw',
    isTerminal: true,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 0
  },
  
  [PackageStatus.LOST]: {
    label: 'Lost',
    description: 'Package cannot be located in the system',
    phase: StatusPhase.EXCEPTION,
    color: StatusColor.RED,
    icon: 'x-circle',
    isTerminal: true,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 0
  },
  
  [PackageStatus.EXCEPTION]: {
    label: 'Exception',
    description: 'Package has encountered an exception',
    phase: StatusPhase.EXCEPTION,
    color: StatusColor.RED,
    icon: 'alert-octagon',
    isTerminal: false,
    requiresAction: true,
    customerVisible: true,
    estimatedDuration: 24
  },
  
  [PackageStatus.CANCELLED]: {
    label: 'Cancelled',
    description: 'Package delivery has been cancelled',
    phase: StatusPhase.EXCEPTION,
    color: StatusColor.RED,
    icon: 'x',
    isTerminal: true,
    requiresAction: false,
    customerVisible: true,
    estimatedDuration: 0
  }
};

/**
 * Utility functions for status management
 */
export class StatusUtils {
  /**
   * Get status metadata for a given status
   * @param status - The package status
   * @returns Status metadata object
   */
  static getMetadata(status: PackageStatus): StatusMetadata {
    return STATUS_METADATA[status];
  }
  
  /**
   * Get all statuses for a specific phase
   * @param phase - The status phase to filter by
   * @returns Array of statuses in the specified phase
   */
  static getStatusesByPhase(phase: StatusPhase): PackageStatus[] {
    const statusesByPhase = Object.values(PackageStatus).filter(
      status => STATUS_METADATA[status].phase === phase
    ) as PackageStatus[];
    return statusesByPhase;
  }
  
  /**
   * Check if a status is terminal (final state)
   * @param status - The package status to check
   * @returns True if the status is terminal
   */
  static isTerminal(status: PackageStatus): boolean {
    return STATUS_METADATA[status].isTerminal;
  }
  
  /**
   * Check if a status requires admin action
   * @param status - The package status to check
   * @returns True if the status requires action
   */
  static requiresAction(status: PackageStatus): boolean {
    return STATUS_METADATA[status].requiresAction;
  }
  
  /**
   * Check if a status is visible to customers
   * @param status - The package status to check
   * @returns True if the status is customer-visible
   */
  static isCustomerVisible(status: PackageStatus): boolean {
    return STATUS_METADATA[status].customerVisible;
  }
  
  /**
   * Get CSS classes for status display
   * @param status - The package status
   * @returns Object containing CSS class names
   */
  static getStatusClasses(status: PackageStatus): {
    background: string;
    text: string;
    border: string;
  } {
    const color = STATUS_METADATA[status].color;
    
    const colorMap = {
      [StatusColor.GRAY]: {
        background: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-300'
      },
      [StatusColor.red]: {
        background: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-300'
      },
      [StatusColor.YELLOW]: {
        background: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-300'
      },
      [StatusColor.GREEN]: {
        background: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-300'
      },
      [StatusColor.PURPLE]: {
        background: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-300'
      },
      [StatusColor.ORANGE]: {
        background: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-300'
      }
    };
    
    return colorMap[color];
  }
  
  /**
   * Format status for display
   * @param status - The package status
   * @returns Formatted status string
   */
  static formatStatus(status: PackageStatus | string): string {
    // Handle case when status is not in metadata
    if (!status || !STATUS_METADATA[status]) {
      console.warn(`Missing metadata for status: ${status}`); 
      return status ? String(status).replace(/_/g, ' ').toLowerCase()
                         .split(' ')
                         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                         .join(' ') 
                   : 'Unknown';
    }
    return STATUS_METADATA[status].label;
  }
}

/**
 * Legacy status mapping for backward compatibility
 * Maps old status values to new centralized status system
 */
export const LEGACY_STATUS_MAPPING: Record<string, PackageStatus> = {
  'pending': PackageStatus.PENDING,
  'processing': PackageStatus.PROCESSING,
  'shipped': PackageStatus.DISPATCHED,
  'delivered': PackageStatus.DELIVERED,
  'received': PackageStatus.PROCESSING,
  'in transit': PackageStatus.IN_TRANSIT,
  'in-transit': PackageStatus.IN_TRANSIT
};

/**
 * Convert legacy status to new status system
 * @param legacyStatus - Old status string
 * @returns Corresponding PackageStatus enum value
 */
export function convertLegacyStatus(legacyStatus: string): PackageStatus {
  const normalizedStatus = legacyStatus.toLowerCase().trim();
  return LEGACY_STATUS_MAPPING[normalizedStatus] || PackageStatus.PENDING;
}

/**
 * Get valid status transitions for a given status
 * @param status - Current package status
 * @returns Array of valid next statuses
 */
export function getValidStatusTransitions(status: PackageStatus): PackageStatus[] {
  // Implementation based on valid status transitions
  switch(status) {
    case PackageStatus.PENDING:
      return [PackageStatus.PROCESSING, PackageStatus.CANCELLED];
    case PackageStatus.PROCESSING:
      return [PackageStatus.READY_FOR_GROUPING, PackageStatus.DELAYED, PackageStatus.CANCELLED];
    case PackageStatus.READY_FOR_GROUPING:
      return [PackageStatus.GROUPED, PackageStatus.DELAYED, PackageStatus.CANCELLED];
    case PackageStatus.GROUPED:
      return [PackageStatus.GROUP_CONFIRMED, PackageStatus.READY_FOR_GROUPING, PackageStatus.DELAYED];
    case PackageStatus.GROUP_CONFIRMED:
      return [PackageStatus.DISPATCHED, PackageStatus.DELAYED];
    case PackageStatus.DISPATCHED:
      return [PackageStatus.IN_TRANSIT, PackageStatus.DELAYED];
    case PackageStatus.IN_TRANSIT:
      return [PackageStatus.OUT_FOR_DELIVERY, PackageStatus.DELAYED, PackageStatus.LOST];
    case PackageStatus.OUT_FOR_DELIVERY:
      return [PackageStatus.DELIVERED, PackageStatus.DELAYED, PackageStatus.RETURNED];
    case PackageStatus.DELIVERED:
      return []; // Terminal state
    case PackageStatus.DELAYED:
      return [PackageStatus.PROCESSING, PackageStatus.IN_TRANSIT, PackageStatus.OUT_FOR_DELIVERY, 
              PackageStatus.RETURNED, PackageStatus.LOST];
    case PackageStatus.RETURNED:
      return []; // Terminal state
    case PackageStatus.LOST:
      return []; // Terminal state
    case PackageStatus.EXCEPTION:
      return [PackageStatus.PROCESSING, PackageStatus.DELAYED, PackageStatus.CANCELLED];
    case PackageStatus.CANCELLED:
      return []; // Terminal state
    default:
      return [];
  }
}
