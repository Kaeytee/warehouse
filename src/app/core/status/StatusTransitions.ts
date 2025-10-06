/**
 * StatusTransitions.ts
 * 
 * Centralized status transition management for Vanguard Cargo
 * This file defines valid status change rules and business logic for package lifecycle management.
 * Ensures data integrity and prevents invalid status transitions.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from './StatusDefinitions';

/**
 * Status transition rule interface
 * Defines the structure for transition validation and metadata
 */
export interface StatusTransitionRule {
  readonly from: PackageStatus;              // Source status
  readonly to: PackageStatus;                // Target status
  readonly isAutomatic: boolean;             // Whether transition can happen automatically
  readonly requiresApproval: boolean;        // Whether admin approval is required
  readonly requiresReason: boolean;          // Whether a reason must be provided
  readonly allowedRoles: string[];           // User roles that can perform this transition
  readonly conditions?: string[];            // Additional conditions that must be met
  readonly description: string;              // Human-readable description of the transition
}

/**
 * Comprehensive status transition matrix
 * Defines all valid status changes and their rules
 */
export const STATUS_TRANSITIONS: StatusTransitionRule[] = [
  // 🔄 INTAKE PHASE TRANSITIONS
  {
    from: PackageStatus.PENDING,
    to: PackageStatus.PROCESSING,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'warehouse_manager', 'processor'],
    description: 'Begin processing received package request'
  },
  
  {
    from: PackageStatus.PROCESSING,
    to: PackageStatus.READY_FOR_GROUPING,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'warehouse_manager', 'processor'],
    conditions: ['package_verified', 'barcode_generated', 'weight_recorded'],
    description: 'Complete processing and make available for grouping'
  },
  
  // 📋 GROUPING PHASE TRANSITIONS
  {
    from: PackageStatus.READY_FOR_GROUPING,
    to: PackageStatus.GROUPED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'warehouse_manager', 'group_manager'],
    conditions: ['group_exists', 'group_capacity_available'],
    description: 'Add package to shipment group'
  },
  
  {
    from: PackageStatus.GROUPED,
    to: PackageStatus.GROUP_CONFIRMED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'warehouse_manager', 'group_manager'],
    conditions: ['group_complete', 'route_planned', 'vehicle_assigned'],
    description: 'Confirm group and prepare for dispatch'
  },
  
  {
    from: PackageStatus.GROUP_CONFIRMED,
    to: PackageStatus.DISPATCHED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'warehouse_manager', 'dispatcher'],
    conditions: ['driver_assigned', 'vehicle_loaded', 'route_confirmed'],
    description: 'Dispatch group from warehouse'
  },
  
  // 🚚 SHIPPING PHASE TRANSITIONS
  {
    from: PackageStatus.DISPATCHED,
    to: PackageStatus.IN_TRANSIT,
    isAutomatic: true,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'driver', 'dispatcher'],
    description: 'Package is actively moving toward destination'
  },
  
  {
    from: PackageStatus.IN_TRANSIT,
    to: PackageStatus.OUT_FOR_DELIVERY,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'driver', 'delivery_agent'],
    conditions: ['reached_destination_hub'],
    description: 'Package ready for final delivery'
  },
  
  {
    from: PackageStatus.OUT_FOR_DELIVERY,
    to: PackageStatus.DELIVERED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: false,
    allowedRoles: ['admin', 'delivery_agent'],
    conditions: ['recipient_confirmed', 'signature_obtained'],
    description: 'Package successfully delivered to recipient'
  },
  
  // ⚠️ EXCEPTION HANDLING TRANSITIONS
  // Any status can transition to DELAYED
  {
    from: PackageStatus.PROCESSING,
    to: PackageStatus.DELAYED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'warehouse_manager'],
    description: 'Mark package as delayed during processing'
  },
  
  {
    from: PackageStatus.GROUPED,
    to: PackageStatus.DELAYED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'warehouse_manager'],
    description: 'Mark grouped package as delayed'
  },
  
  {
    from: PackageStatus.DISPATCHED,
    to: PackageStatus.DELAYED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'driver', 'dispatcher'],
    description: 'Mark dispatched package as delayed'
  },
  
  {
    from: PackageStatus.IN_TRANSIT,
    to: PackageStatus.DELAYED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'driver'],
    description: 'Mark in-transit package as delayed'
  },
  
  {
    from: PackageStatus.OUT_FOR_DELIVERY,
    to: PackageStatus.DELAYED,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'delivery_agent'],
    description: 'Mark delivery attempt as delayed'
  },
  
  // Recovery from DELAYED status
  {
    from: PackageStatus.DELAYED,
    to: PackageStatus.PROCESSING,
    isAutomatic: false,
    requiresApproval: true,
    requiresReason: true,
    allowedRoles: ['admin', 'warehouse_manager'],
    description: 'Resume processing of delayed package'
  },
  
  {
    from: PackageStatus.DELAYED,
    to: PackageStatus.IN_TRANSIT,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'driver'],
    description: 'Resume transit of delayed package'
  },
  
  {
    from: PackageStatus.DELAYED,
    to: PackageStatus.OUT_FOR_DELIVERY,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'delivery_agent'],
    description: 'Resume delivery of delayed package'
  },
  
  // RETURNED status transitions
  {
    from: PackageStatus.OUT_FOR_DELIVERY,
    to: PackageStatus.RETURNED,
    isAutomatic: false,
    requiresApproval: true,
    requiresReason: true,
    allowedRoles: ['admin', 'delivery_agent'],
    conditions: ['delivery_failed', 'return_authorized'],
    description: 'Return package due to failed delivery'
  },
  
  {
    from: PackageStatus.DELAYED,
    to: PackageStatus.RETURNED,
    isAutomatic: false,
    requiresApproval: true,
    requiresReason: true,
    allowedRoles: ['admin', 'warehouse_manager'],
    conditions: ['return_authorized'],
    description: 'Return delayed package to sender'
  },
  
  // LOST status transitions (emergency only)
  {
    from: PackageStatus.IN_TRANSIT,
    to: PackageStatus.LOST,
    isAutomatic: false,
    requiresApproval: true,
    requiresReason: true,
    allowedRoles: ['admin'],
    conditions: ['investigation_complete', 'package_not_found'],
    description: 'Mark package as lost after investigation'
  },
  
  {
    from: PackageStatus.DELAYED,
    to: PackageStatus.LOST,
    isAutomatic: false,
    requiresApproval: true,
    requiresReason: true,
    allowedRoles: ['admin'],
    conditions: ['investigation_complete', 'package_not_found'],
    description: 'Mark delayed package as lost'
  },
  
  // UNGROUPING TRANSITIONS (for group management)
  {
    from: PackageStatus.GROUPED,
    to: PackageStatus.READY_FOR_GROUPING,
    isAutomatic: false,
    requiresApproval: false,
    requiresReason: true,
    allowedRoles: ['admin', 'warehouse_manager', 'group_manager'],
    description: 'Remove package from group and make available for regrouping'
  }
];

/**
 * Status transition validation and management service
 */
export class StatusTransitionService {
  /**
   * Check if a status transition is valid
   * @param from - Current status
   * @param to - Target status
   * @returns True if transition is allowed
   */
  static isValidTransition(from: PackageStatus, to: PackageStatus): boolean {
    return STATUS_TRANSITIONS.some(
      transition => transition.from === from && transition.to === to
    );
  }
  
  /**
   * Get transition rule for a specific status change
   * @param from - Current status
   * @param to - Target status
   * @returns Transition rule or null if invalid
   */
  static getTransitionRule(
    from: PackageStatus, 
    to: PackageStatus
  ): StatusTransitionRule | null {
    return STATUS_TRANSITIONS.find(
      transition => transition.from === from && transition.to === to
    ) || null;
  }
  
  /**
   * Get all valid next statuses for a given current status
   * @param currentStatus - Current package status
   * @returns Array of valid next statuses
   */
  static getValidNextStatuses(currentStatus: PackageStatus): PackageStatus[] {
    return STATUS_TRANSITIONS
      .filter(transition => transition.from === currentStatus)
      .map(transition => transition.to);
  }
  
  /**
   * Check if a user role can perform a specific transition
   * @param from - Current status
   * @param to - Target status
   * @param userRole - User's role
   * @returns True if user can perform transition
   */
  static canUserPerformTransition(
    from: PackageStatus,
    to: PackageStatus,
    userRole: string
  ): boolean {
    const rule = this.getTransitionRule(from, to);
    return rule ? rule.allowedRoles.includes(userRole) : false;
  }
  
  /**
   * Check if a transition requires approval
   * @param from - Current status
   * @param to - Target status
   * @returns True if approval is required
   */
  static requiresApproval(from: PackageStatus, to: PackageStatus): boolean {
    const rule = this.getTransitionRule(from, to);
    return rule ? rule.requiresApproval : false;
  }
  
  /**
   * Check if a transition requires a reason
   * @param from - Current status
   * @param to - Target status
   * @returns True if reason is required
   */
  static requiresReason(from: PackageStatus, to: PackageStatus): boolean {
    const rule = this.getTransitionRule(from, to);
    return rule ? rule.requiresReason : false;
  }
  
  /**
   * Get conditions that must be met for a transition
   * @param from - Current status
   * @param to - Target status
   * @returns Array of condition strings
   */
  static getTransitionConditions(
    from: PackageStatus, 
    to: PackageStatus
  ): string[] {
    const rule = this.getTransitionRule(from, to);
    return rule ? rule.conditions || [] : [];
  }
  
  /**
   * Validate a status transition with full context
   * @param from - Current status
   * @param to - Target status
   * @param userRole - User's role
   * @param reason - Reason for transition (if required)
   * @param conditions - Met conditions
   * @returns Validation result with details
   */
  static validateTransition(
    from: PackageStatus,
    to: PackageStatus,
    userRole: string,
    reason?: string,
    conditions: string[] = []
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if transition exists
    const rule = this.getTransitionRule(from, to);
    if (!rule) {
      errors.push(`Invalid transition from ${from} to ${to}`);
      return { isValid: false, errors, warnings };
    }
    
    // Check user permissions
    if (!rule.allowedRoles.includes(userRole)) {
      errors.push(`User role '${userRole}' cannot perform this transition`);
    }
    
    // Check if reason is required
    if (rule.requiresReason && !reason) {
      errors.push('Reason is required for this transition');
    }
    
    // Check conditions
    const requiredConditions = rule.conditions || [];
    const missingConditions = requiredConditions.filter(
      condition => !conditions.includes(condition)
    );
    
    if (missingConditions.length > 0) {
      errors.push(`Missing required conditions: ${missingConditions.join(', ')}`);
    }
    
    // Add warnings for approval requirements
    if (rule.requiresApproval) {
      warnings.push('This transition requires management approval');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get status transition history template
   * @param from - Previous status
   * @param to - New status
   * @param userRole - User who performed transition
   * @param reason - Reason for transition
   * @returns Status history entry template
   */
  static createTransitionHistoryEntry(
    from: PackageStatus,
    to: PackageStatus,
    userRole: string,
    reason?: string
  ): {
    fromStatus: PackageStatus;
    toStatus: PackageStatus;
    timestamp: string;
    performedBy: string;
    reason?: string;
    description: string;
  } {
    const rule = this.getTransitionRule(from, to);
    
    return {
      fromStatus: from,
      toStatus: to,
      timestamp: new Date().toISOString(),
      performedBy: userRole,
      reason,
      description: rule?.description || `Status changed from ${from} to ${to}`
    };
  }
}

/**
 * Batch transition utilities for group management
 */
export class BatchTransitionService {
  /**
   * Validate batch status transition for multiple packages
   * @param packages - Array of package IDs and current statuses
   * @param targetStatus - Target status for all packages
   * @param userRole - User performing the transition
   * @returns Validation results for each package
   */
  static validateBatchTransition(
    packages: Array<{ id: string; currentStatus: PackageStatus }>,
    targetStatus: PackageStatus,
    userRole: string
  ): Array<{
    packageId: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return packages.map(pkg => ({
      packageId: pkg.id,
      ...StatusTransitionService.validateTransition(
        pkg.currentStatus,
        targetStatus,
        userRole
      )
    }));
  }
  
  /**
   * Get packages that can be transitioned together
   * @param packages - Array of packages with current statuses
   * @param targetStatus - Desired target status
   * @returns Array of package IDs that can be transitioned
   */
  static getTransitionablePackages(
    packages: Array<{ id: string; currentStatus: PackageStatus }>,
    targetStatus: PackageStatus
  ): string[] {
    return packages
      .filter(pkg => 
        StatusTransitionService.isValidTransition(pkg.currentStatus, targetStatus)
      )
      .map(pkg => pkg.id);
  }
}
