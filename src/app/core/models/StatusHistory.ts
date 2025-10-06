/**
 * StatusHistory.ts
 * 
 * Core status history data structure for Vanguard Cargo
 * This file defines the StatusHistory model for comprehensive audit trails
 * Provides complete tracking of all status changes across packages and groups
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from '../status/StatusDefinitions';
import { GroupStatus } from './ShipmentGroup';
import type { LocationPoint } from '../status/StatusLocationMapping';

/**
 * Core StatusHistory interface
 * Comprehensive audit trail for all status changes
 */
export interface StatusHistory {
  // 🔑 IDENTIFICATION
  readonly id: string;                    // Unique history entry ID (HST-XXXX)
  readonly entityId: string;              // ID of entity (package/group) that changed
  readonly entityType: EntityType;        // Type of entity
  readonly correlationId?: string;        // Correlation ID for related changes
  
  // 📊 STATUS CHANGE INFORMATION
  readonly previousStatus?: PackageStatus | GroupStatus; // Previous status
  readonly newStatus: PackageStatus | GroupStatus; // New status
  readonly statusCategory: StatusCategory; // Category of status change
  readonly changeType: ChangeType;        // Type of change operation
  
  // ⏰ TIMING INFORMATION
  readonly timestamp: string;             // When change occurred (ISO string)
  readonly effectiveDate?: string;        // When change takes effect (if different)
  readonly scheduledDate?: string;        // When change was scheduled
  readonly duration?: number;             // Time in previous status (minutes)
  
  // 🗺️ LOCATION CONTEXT
  readonly location?: LocationPoint;      // Where change occurred
  readonly previousLocation?: LocationPoint; // Previous location
  readonly locationChanged: boolean;      // Whether location also changed
  
  // 👤 ACTOR INFORMATION
  readonly performedBy: string;           // User/system that made change
  readonly performedByType: ActorType;    // Type of actor
  readonly performedByRole?: string;      // Role of user if applicable
  readonly onBehalfOf?: string;           // If acting on behalf of someone else
  
  // 📝 CHANGE CONTEXT
  readonly reason?: string;               // Reason for status change
  readonly reasonCategory?: ReasonCategory; // Category of reason
  readonly notes?: string;                // Additional notes
  readonly customerNotes?: string;        // Customer-facing notes
  readonly internalNotes?: string;        // Internal-only notes
  
  // 🔄 CHANGE METADATA
  readonly automatic: boolean;            // Whether change was automatic
  readonly batchId?: string;              // Batch ID if part of batch operation
  readonly parentChangeId?: string;       // Parent change if this is a cascade
  readonly childChangeIds?: string[];     // Child changes triggered by this
  readonly rollbackId?: string;           // ID of change that rolled this back
  
  // 🚨 VALIDATION AND APPROVAL
  readonly requiresApproval: boolean;     // Whether change needs approval
  readonly approvedBy?: string;           // Who approved the change
  readonly approvedAt?: string;           // When change was approved
  readonly approvalNotes?: string;        // Approval notes
  readonly validationErrors?: string[];   // Any validation errors
  readonly validationWarnings?: string[]; // Any validation warnings
  
  // 📊 IMPACT ANALYSIS
  readonly impactLevel: ImpactLevel;      // Level of impact
  readonly affectedEntities?: string[];   // Other entities affected
  readonly customerNotified: boolean;     // Whether customer was notified
  readonly notificationMethod?: string;   // How customer was notified
  readonly estimatedDeliveryChanged: boolean; // Whether ETA changed
  readonly previousETA?: string;          // Previous estimated delivery
  readonly newETA?: string;               // New estimated delivery
  
  // 🔒 AUDIT METADATA
  readonly createdAt: string;             // Record creation timestamp
  readonly source: ChangeSource;          // Source of the change
  readonly sourceVersion?: string;        // Version of source system
  readonly ipAddress?: string;            // IP address of change origin
  readonly userAgent?: string;            // User agent if web-based
  readonly sessionId?: string;            // Session ID if applicable
  readonly requestId?: string;            // Request ID for tracing
  
  // 📈 METRICS
  readonly processingTime?: number;       // Time taken to process change (ms)
  readonly retryCount?: number;           // Number of retries if failed
  readonly errorCount?: number;           // Number of errors encountered
  readonly warningCount?: number;         // Number of warnings generated
  
  // 🔧 CUSTOM DATA
  readonly metadata?: Record<string, unknown>; // Additional custom metadata for the status change
}

/**
 * Entity type enumeration
 * Types of entities that can have status changes
 */
export enum EntityType {
  PACKAGE = 'package',                   // Individual package
  GROUP = 'group',                       // Shipment group
  BATCH = 'batch',                       // Batch operation
  ROUTE = 'route',                       // Delivery route
  VEHICLE = 'vehicle',                   // Vehicle status
  DRIVER = 'driver',                      // Driver status
  SHIPMENT_GROUP = "SHIPMENT_GROUP"
}

/**
 * Status category enumeration
 * Categories of status changes for analytics
 */
export enum StatusCategory {
  INTAKE = 'intake',                     // Initial intake statuses
  PROCESSING = 'processing',             // Processing-related changes
  GROUPING = 'grouping',                 // Grouping operations
  DISPATCH = 'dispatch',                 // Dispatch operations
  TRANSIT = 'transit',                   // In-transit updates
  DELIVERY = 'delivery',                 // Delivery operations
  EXCEPTION = 'exception',               // Exception handling
  COMPLETION = 'completion',             // Final completion
  ADMINISTRATIVE = 'administrative'      // Admin operations
}

/**
 * Change type enumeration
 * Types of change operations
 */
export enum ChangeType {
  STATUS_UPDATE = 'status_update',       // Regular status update
  BATCH_UPDATE = 'batch_update',         // Batch status update
  ROLLBACK = 'rollback',                 // Status rollback
  CORRECTION = 'correction',             // Status correction
  ESCALATION = 'escalation',             // Status escalation
  AUTOMATIC = 'automatic',               // Automatic status change
  SCHEDULED = 'scheduled',               // Scheduled status change
  EMERGENCY = 'emergency'                // Emergency status change
}

/**
 * Actor type enumeration
 * Types of actors that can make changes
 */
export enum ActorType {
  USER = 'user',                         // Human user
  SYSTEM = 'system',                     // System process
  API = 'api',                           // API call
  SCHEDULER = 'scheduler',               // Scheduled job
  WEBHOOK = 'webhook',                   // Webhook trigger
  IMPORT = 'import',                     // Data import
  MIGRATION = 'migration'                // Data migration
}

/**
 * Reason category enumeration
 * Categories of reasons for status changes
 */
export enum ReasonCategory {
  NORMAL_FLOW = 'normal_flow',           // Normal business flow
  CUSTOMER_REQUEST = 'customer_request', // Customer-requested change
  OPERATIONAL = 'operational',           // Operational necessity
  EXCEPTION_HANDLING = 'exception_handling', // Handling exceptions
  QUALITY_CONTROL = 'quality_control',   // Quality control measures
  COMPLIANCE = 'compliance',             // Compliance requirements
  EMERGENCY = 'emergency',               // Emergency situation
  CORRECTION = 'correction',             // Correcting errors
  OPTIMIZATION = 'optimization'          // Process optimization
}

/**
 * Impact level enumeration
 * Levels of impact for status changes
 */
export enum ImpactLevel {
  LOW = 'low',                          // Minimal impact
  MEDIUM = 'medium',                    // Moderate impact
  HIGH = 'high',                        // Significant impact
  CRITICAL = 'critical'                 // Critical impact
}

/**
 * Change source enumeration
 * Sources of status changes
 */
export enum ChangeSource {
  WEB_APP = 'web_app',                  // Web application
  MOBILE_APP = 'mobile_app',            // Mobile application
  API = 'api',                          // REST API
  SCANNER = 'scanner',                  // Barcode scanner
  GPS_TRACKER = 'gps_tracker',          // GPS tracking device
  WEBHOOK = 'webhook',                  // External webhook
  BATCH_IMPORT = 'batch_import',        // Batch import process
  SCHEDULER = 'scheduler',              // Scheduled job
  MANUAL_ENTRY = 'manual_entry',        // Manual data entry
  SYSTEM_GENERATED = 'system_generated',  // System-generated change
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',        // System update
  CASCADE_UPDATE = 'CASCADE_UPDATE'       // Cascade update
}

/**
 * Status history search criteria interface
 * Search and filter options for status history
 */
export interface StatusHistorySearchCriteria {
  // Entity filtering
  readonly entityId?: string;
  readonly entityIds?: string[];
  readonly entityType?: EntityType[];
  
  // Status filtering
  readonly previousStatus?: (PackageStatus | GroupStatus)[];
  readonly newStatus?: (PackageStatus | GroupStatus)[];
  readonly statusCategory?: StatusCategory[];
  readonly changeType?: ChangeType[];
  
  // Time filtering
  readonly timestampAfter?: string;
  readonly timestampBefore?: string;
  readonly effectiveDateAfter?: string;
  readonly effectiveDateBefore?: string;
  
  // Actor filtering
  readonly performedBy?: string;
  readonly performedByType?: ActorType[];
  readonly performedByRole?: string;
  
  // Location filtering
  readonly locationCity?: string;
  readonly locationRegion?: string;
  readonly locationChanged?: boolean;
  
  // Change context filtering
  readonly reasonCategory?: ReasonCategory[];
  readonly automatic?: boolean;
  readonly batchId?: string;
  readonly requiresApproval?: boolean;
  readonly approved?: boolean;
  
  // Impact filtering
  readonly impactLevel?: ImpactLevel[];
  readonly customerNotified?: boolean;
  readonly estimatedDeliveryChanged?: boolean;
  
  // Source filtering
  readonly source?: ChangeSource[];
  readonly hasErrors?: boolean;
  readonly hasWarnings?: boolean;
  
  // Text search
  readonly query?: string;              // Search in reason, notes
  readonly reasonContains?: string;
  readonly notesContain?: string;
  
  // Pagination
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Status history analytics interface
 * Analytics data for status change patterns
 */
export interface StatusHistoryAnalytics {
  readonly totalChanges: number;
  readonly entityTypeCounts: Record<EntityType, number>;
  readonly statusCategoryCounts: Record<StatusCategory, number>;
  readonly changeTypeCounts: Record<ChangeType, number>;
  readonly actorTypeCounts: Record<ActorType, number>;
  readonly reasonCategoryCounts: Record<ReasonCategory, number>;
  readonly impactLevelCounts: Record<ImpactLevel, number>;
  readonly sourceCounts: Record<ChangeSource, number>;
  readonly automaticVsManual: {
    readonly automatic: number;
    readonly manual: number;
    readonly percentage: number;
  };
  readonly approvalMetrics: {
    readonly requiresApproval: number;
    readonly approved: number;
    readonly pending: number;
    readonly approvalRate: number;
  };
  readonly errorMetrics: {
    readonly withErrors: number;
    readonly withWarnings: number;
    readonly errorRate: number;
    readonly warningRate: number;
  };
  readonly timeMetrics: {
    readonly averageProcessingTime: number;
    readonly averageStatusDuration: number;
    readonly fastestChange: number;
    readonly slowestChange: number;
  };
  readonly topReasons: Array<{
    readonly reason: string;
    readonly count: number;
    readonly percentage: number;
  }>;
  readonly topPerformers: Array<{
    readonly performedBy: string;
    readonly count: number;
    readonly errorRate: number;
  }>;
}

/**
 * Status history utility functions
 * Helper functions for status history operations
 */
export class StatusHistoryUtils {
  static async saveStatusHistory(historyEntry: StatusHistory): Promise<void> {
    // TODO: Implement actual save logic to database/storage
    // For now, just log the entry to console
    console.log('Saving status history entry:', historyEntry.id);
    
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 10);
    });
  }
  
  /**
   * Generate a unique status history ID
   * @returns New status history ID in format HST-XXXXXX
   */
  static generateHistoryId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `HST-${timestamp}${random}`.toUpperCase();
  }
  
  /**
   * Create a status history entry
   * @param params - Parameters for creating history entry
   * @returns New status history entry
   */
  static createHistoryEntry(params: {
    entityId: string;
    entityType: EntityType;
    previousStatus?: PackageStatus | GroupStatus;
    newStatus: PackageStatus | GroupStatus;
    performedBy: string;
    performedByType: ActorType;
    reason?: string;
    location?: LocationPoint;
    automatic?: boolean;
    source: ChangeSource;
  }): Omit<StatusHistory, 'id' | 'createdAt'> {
    const now = new Date().toISOString();
    
    return {
      entityId: params.entityId,
      entityType: params.entityType,
      previousStatus: params.previousStatus,
      newStatus: params.newStatus,
      statusCategory: this.determineStatusCategory(params.newStatus),
      changeType: params.automatic ? ChangeType.AUTOMATIC : ChangeType.STATUS_UPDATE,
      timestamp: now,
      locationChanged: false, // Will be calculated by service
      performedBy: params.performedBy,
      performedByType: params.performedByType,
      reason: params.reason,
      automatic: params.automatic || false,
      requiresApproval: false, // Will be determined by business rules
      impactLevel: this.determineImpactLevel(params.newStatus),
      customerNotified: false, // Will be set by notification service
      estimatedDeliveryChanged: false, // Will be calculated by service
      source: params.source,
      location: params.location
    };
  }
  
  /**
   * Determine status category from status
   * @param status - Package or group status
   * @returns Status category
   */
  static determineStatusCategory(status: PackageStatus | GroupStatus): StatusCategory {
    // Package status categories
    if (typeof status === 'string') {
      switch (status as PackageStatus) {
        case PackageStatus.PENDING:
          return StatusCategory.INTAKE;
        case PackageStatus.PROCESSING:
          return StatusCategory.PROCESSING;
        case PackageStatus.READY_FOR_GROUPING:
        case PackageStatus.GROUPED:
        case PackageStatus.GROUP_CONFIRMED:
          return StatusCategory.GROUPING;
        case PackageStatus.DISPATCHED:
          return StatusCategory.DISPATCH;
        case PackageStatus.IN_TRANSIT:
          return StatusCategory.TRANSIT;
        case PackageStatus.OUT_FOR_DELIVERY:
        case PackageStatus.DELIVERED:
          return StatusCategory.DELIVERY;
        case PackageStatus.DELAYED:
        case PackageStatus.RETURNED:
        case PackageStatus.LOST:
          return StatusCategory.EXCEPTION;
        default:
          return StatusCategory.ADMINISTRATIVE;
      }
    }
    
    // Group status categories
    switch (status as GroupStatus) {
      case GroupStatus.DRAFT:
      case GroupStatus.PENDING_CONFIRMATION:
      case GroupStatus.CONFIRMED:
        return StatusCategory.GROUPING;
      case GroupStatus.ASSIGNED:
      case GroupStatus.LOADING:
      case GroupStatus.DISPATCHED:
        return StatusCategory.DISPATCH;
      case GroupStatus.IN_TRANSIT:
        return StatusCategory.TRANSIT;
      case GroupStatus.DELIVERING:
      case GroupStatus.COMPLETED:
        return StatusCategory.DELIVERY;
      case GroupStatus.CANCELLED:
      case GroupStatus.DELAYED:
      case GroupStatus.RETURNED:
        return StatusCategory.EXCEPTION;
      default:
        return StatusCategory.ADMINISTRATIVE;
    }
  }
  
  /**
   * Determine impact level from status
   * @param status - Package or group status
   * @returns Impact level
   */
  static determineImpactLevel(status: PackageStatus | GroupStatus): ImpactLevel {
    const highImpactStatuses: (PackageStatus | GroupStatus)[] = [
      PackageStatus.DELAYED,
      PackageStatus.RETURNED,
      PackageStatus.LOST,
      GroupStatus.CANCELLED,
      GroupStatus.DELAYED,
      GroupStatus.RETURNED
    ];
    
    const mediumImpactStatuses: (PackageStatus | GroupStatus)[] = [
      PackageStatus.DISPATCHED,
      PackageStatus.IN_TRANSIT,
      PackageStatus.OUT_FOR_DELIVERY,
      PackageStatus.DELIVERED,
      GroupStatus.DISPATCHED,
      GroupStatus.IN_TRANSIT,
      GroupStatus.DELIVERING,
      GroupStatus.COMPLETED
    ];
    
    if (highImpactStatuses.includes(status)) {
      return ImpactLevel.HIGH;
    } else if (mediumImpactStatuses.includes(status)) {
      return ImpactLevel.MEDIUM;
    } else {
      return ImpactLevel.LOW;
    }
  }
  
  /**
   * Calculate status duration from history entries
   * @param entries - Array of history entries for an entity
   * @returns Array of durations for each status
   */
  static calculateStatusDurations(entries: StatusHistory[]): Array<{
    status: PackageStatus | GroupStatus;
    duration: number; // minutes
    startTime: string;
    endTime?: string;
  }> {
    const sortedEntries = entries.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const durations: Array<{
      status: PackageStatus | GroupStatus;
      duration: number;
      startTime: string;
      endTime?: string;
    }> = [];
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const current = sortedEntries[i];
      const next = sortedEntries[i + 1];
      
      const startTime = current.timestamp;
      const endTime = next?.timestamp;
      
      let duration = 0;
      if (endTime) {
        duration = Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
        );
      } else {
        // Current status - calculate duration from start to now
        duration = Math.round(
          (new Date().getTime() - new Date(startTime).getTime()) / (1000 * 60)
        );
      }
      
      durations.push({
        status: current.newStatus,
        duration,
        startTime,
        endTime
      });
    }
    
    return durations;
  }
  
  /**
   * Get human-readable change description
   * @param entry - Status history entry
   * @returns Human-readable description
   */
  static getChangeDescription(entry: StatusHistory): string {
    const entityType = entry.entityType === EntityType.PACKAGE ? 'Package' : 'Group';
    const from = entry.previousStatus ? ` from ${entry.previousStatus}` : '';
    const to = entry.newStatus;
    const location = entry.location ? ` at ${entry.location.city}` : '';
    const by = entry.performedByType === ActorType.SYSTEM ? 'automatically' : `by ${entry.performedBy}`;
    
    return `${entityType} status changed${from} to ${to}${location} ${by}`;
  }
  
  /**
   * Check if status change represents an improvement
   * @param previousStatus - Previous status
   * @param newStatus - New status
   * @returns Whether change is an improvement
   */
  static isImprovement(
    previousStatus: PackageStatus | GroupStatus,
    newStatus: PackageStatus | GroupStatus
  ): boolean {
    // Define status progression orders
    const packageOrder = [
      PackageStatus.PENDING,
      PackageStatus.PROCESSING,
      PackageStatus.READY_FOR_GROUPING,
      PackageStatus.GROUPED,
      PackageStatus.GROUP_CONFIRMED,
      PackageStatus.DISPATCHED,
      PackageStatus.IN_TRANSIT,
      PackageStatus.OUT_FOR_DELIVERY,
      PackageStatus.DELIVERED
    ];
    
    const groupOrder = [
      GroupStatus.DRAFT,
      GroupStatus.PENDING_CONFIRMATION,
      GroupStatus.CONFIRMED,
      GroupStatus.ASSIGNED,
      GroupStatus.LOADING,
      GroupStatus.DISPATCHED,
      GroupStatus.IN_TRANSIT,
      GroupStatus.DELIVERING,
      GroupStatus.COMPLETED
    ];
    
    // Check if it's a forward progression
    const prevIndex = packageOrder.indexOf(previousStatus as PackageStatus);
    const newIndex = packageOrder.indexOf(newStatus as PackageStatus);
    
    if (prevIndex !== -1 && newIndex !== -1) {
      return newIndex > prevIndex;
    }
    
    const prevGroupIndex = groupOrder.indexOf(previousStatus as GroupStatus);
    const newGroupIndex = groupOrder.indexOf(newStatus as GroupStatus);
    
    if (prevGroupIndex !== -1 && newGroupIndex !== -1) {
      return newGroupIndex > prevGroupIndex;
    }
    
    return false;
  }
  
  /**
   * Validate status history entry
   * @param entry - Status history entry to validate
   * @returns Validation errors array
   */
  static validateHistoryEntry(entry: Partial<StatusHistory>): string[] {
    const errors: string[] = [];
    
    if (!entry.entityId?.trim()) {
      errors.push('Entity ID is required');
    }
    
    if (!entry.entityType) {
      errors.push('Entity type is required');
    }
    
    if (!entry.newStatus) {
      errors.push('New status is required');
    }
    
    if (!entry.timestamp) {
      errors.push('Timestamp is required');
    } else {
      const timestamp = new Date(entry.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }
    
    if (!entry.performedBy?.trim()) {
      errors.push('Performed by is required');
    }
    
    if (!entry.performedByType) {
      errors.push('Performed by type is required');
    }
    
    if (!entry.source) {
      errors.push('Source is required');
    }
    
    return errors;
  }
}
