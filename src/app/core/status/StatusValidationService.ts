/**
 * StatusValidationService.ts
 * 
 * Centralized status validation and business logic service for Vanguard Cargo
 * This service handles all status-related validations, business rules, and operations
 * Ensures data integrity and enforces business constraints across the application
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus, StatusUtils } from './StatusDefinitions';
import { StatusTransitionService } from './StatusTransitions';

/**
 * Status validation result interface
 * Standardized response format for validation operations
 */
export interface StatusValidationResult {
  readonly isValid: boolean;           // Whether the operation is valid
  readonly errors: string[];           // Array of error messages
  readonly warnings: string[];         // Array of warning messages
  readonly suggestions?: string[];     // Optional improvement suggestions
}

/**
 * Package status context interface
 * Complete context information for status validation
 */
export interface PackageStatusContext {
  readonly packageId: string;          // Unique package identifier
  readonly currentStatus: PackageStatus; // Current package status
  readonly statusHistory: StatusHistoryEntry[]; // Complete status history
  readonly groupId?: string;           // Group ID if package is grouped
  readonly destination?: string;       // Package destination
  readonly priority?: 'low' | 'medium' | 'high'; // Package priority
  readonly specialHandling?: string[]; // Special handling requirements
  readonly customerType?: 'standard' | 'premium' | 'enterprise'; // Customer tier
}

/**
 * Status history entry interface
 * Individual status change record
 */
export interface StatusHistoryEntry {
  readonly status: PackageStatus;      // Status at this point
  readonly timestamp: string;          // When status was set
  readonly performedBy: string;        // Who performed the change
  readonly reason?: string;            // Reason for status change
  readonly location?: string;          // Location where change occurred
  readonly notes?: string;             // Additional notes
}

/**
 * Business rule interface
 * Defines custom business logic rules
 */
export interface BusinessRule {
  readonly id: string;                 // Unique rule identifier
  readonly name: string;               // Human-readable rule name
  readonly description: string;        // Rule description
  readonly applies: (context: PackageStatusContext) => boolean; // When rule applies
  readonly validate: (context: PackageStatusContext) => StatusValidationResult; // Validation logic
  readonly priority: number;           // Rule priority (higher = more important)
}

/**
 * Comprehensive status validation service
 * Central hub for all status-related business logic and validation
 */
export class StatusValidationService {
  validateStatusUpdate() {
    throw new Error('Method not implemented.');
  }
  private static businessRules: BusinessRule[] = [];
  
  /**
   * Initialize the service with business rules
   */
  static initialize(): void {
    this.registerDefaultBusinessRules();
  }
  
  /**
   * Validate a status change with full business context
   * @param context - Package status context
   * @param targetStatus - Desired new status
   * @param userRole - Role of user performing change
   * @param reason - Reason for status change
   * @returns Comprehensive validation result
   */
  static validateStatusChange(
    context: PackageStatusContext,
    targetStatus: PackageStatus,
    userRole: string,
    reason?: string
  ): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // 1. Basic transition validation
    const transitionResult = StatusTransitionService.validateTransition(
      context.currentStatus,
      targetStatus,
      userRole,
      reason
    );
    
    errors.push(...transitionResult.errors);
    warnings.push(...transitionResult.warnings);
    
    // 2. Business rule validation
    const businessRuleResult = this.validateBusinessRules(context);
    errors.push(...businessRuleResult.errors);
    warnings.push(...businessRuleResult.warnings);
    if (businessRuleResult.suggestions) {
      suggestions.push(...businessRuleResult.suggestions);
    }
    
    // 3. Group consistency validation
    if (context.groupId) {
      const groupResult = this.validateGroupConsistency(context, targetStatus);
      errors.push(...groupResult.errors);
      warnings.push(...groupResult.warnings);
    }
    
    // 4. Timeline validation
    const timelineResult = this.validateStatusTimeline(context, targetStatus);
    errors.push(...timelineResult.errors);
    warnings.push(...timelineResult.warnings);
    
    // 5. Customer impact validation
    const customerResult = this.validateCustomerImpact(context, targetStatus);
    warnings.push(...customerResult.warnings);
    if (customerResult.suggestions) {
      suggestions.push(...customerResult.suggestions);
    }
    
    return {
      isValid: errors.length === 0,
      errors: [...new Set(errors)], // Remove duplicates
      warnings: [...new Set(warnings)],
      suggestions: suggestions.length > 0 ? [...new Set(suggestions)] : undefined
    };
  }
  
  /**
   * Validate batch status update for multiple packages
   * @param packages - Array of package contexts
   * @param userRole - User performing the operation
   * @returns Validation results for each package
   */
  static validateBatchStatusUpdate(
    packages: PackageStatusContext[],
    userRole: string
  ): Array<{
    packageId: string;
    result: StatusValidationResult;
  }> {
    // Process each package individually
    const results: Array<{ packageId: string; result: StatusValidationResult }> = [];

    packages.forEach(context => {
      // Use the current status for validation since target status is determined by the batch operation
      const result = this.validateStatusChange(context, context.currentStatus, userRole);
      results.push({ packageId: context.packageId, result });
    });

    return results;
  }
  
  /**
   * Get recommended next status for a package
   * @param context - Package status context
   * @returns Recommended next status with reasoning
   */
  static getRecommendedNextStatus(context: PackageStatusContext): {
    status: PackageStatus;
    reason: string;
    confidence: number; // 0-1 confidence score
  } {
    const validNextStatuses = StatusTransitionService.getValidNextStatuses(context.currentStatus);
    
    // Apply business logic to determine best next status
    switch (context.currentStatus) {
      case PackageStatus.PENDING:
        return {
          status: PackageStatus.PROCESSING,
          reason: 'Package is ready for processing',
          confidence: 0.9
        };
        
      case PackageStatus.PROCESSING:
        return {
          status: PackageStatus.READY_FOR_GROUPING,
          reason: 'Processing complete, ready for grouping',
          confidence: 0.85
        };
        
      case PackageStatus.READY_FOR_GROUPING:
        return {
          status: PackageStatus.GROUPED,
          reason: 'Package should be added to a shipment group',
          confidence: 0.8
        };
        
      case PackageStatus.GROUPED:
        return {
          status: PackageStatus.GROUP_CONFIRMED,
          reason: 'Group is ready for confirmation',
          confidence: 0.75
        };
        
      case PackageStatus.GROUP_CONFIRMED:
        return {
          status: PackageStatus.DISPATCHED,
          reason: 'Group is ready for dispatch',
          confidence: 0.9
        };
        
      case PackageStatus.DISPATCHED:
        return {
          status: PackageStatus.IN_TRANSIT,
          reason: 'Package has left the facility',
          confidence: 0.95
        };
        
      case PackageStatus.IN_TRANSIT:
        return {
          status: PackageStatus.OUT_FOR_DELIVERY,
          reason: 'Package has reached destination hub',
          confidence: 0.8
        };
        
      case PackageStatus.OUT_FOR_DELIVERY:
        return {
          status: PackageStatus.DELIVERED,
          reason: 'Package is ready for delivery',
          confidence: 0.85
        };
        
      default:
        return {
          status: validNextStatuses[0] || context.currentStatus,
          reason: 'No specific recommendation available',
          confidence: 0.5
        };
    }
  }
  
  /**
   * Check if a package is overdue based on its status and timeline
   * @param context - Package status context
   * @returns Overdue analysis result
   */
  static checkOverdueStatus(context: PackageStatusContext): {
    isOverdue: boolean;
    overdueBy: number; // Hours overdue
    expectedStatus: PackageStatus;
    recommendation: string;
  } {
    const currentTime = new Date();
    const statusMetadata = StatusUtils.getMetadata(context.currentStatus);
    
    // Find when current status was set
    const currentStatusEntry = context.statusHistory
      .filter(entry => entry.status === context.currentStatus)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!currentStatusEntry) {
      return {
        isOverdue: false,
        overdueBy: 0,
        expectedStatus: context.currentStatus,
        recommendation: 'Unable to determine timeline'
      };
    }
    
    const statusSetTime = new Date(currentStatusEntry.timestamp);
    const hoursInStatus = (currentTime.getTime() - statusSetTime.getTime()) / (1000 * 60 * 60);
    const expectedDuration = statusMetadata.estimatedDuration;
    
    const isOverdue = hoursInStatus > expectedDuration;
    const overdueBy = Math.max(0, hoursInStatus - expectedDuration);
    
    // Determine expected status
    const recommendedNext = this.getRecommendedNextStatus(context);
    
    return {
      isOverdue,
      overdueBy,
      expectedStatus: recommendedNext.status,
      recommendation: isOverdue 
        ? `Package is ${Math.round(overdueBy)} hours overdue. Consider updating to ${recommendedNext.status}.`
        : 'Package is on schedule'
    };
  }
  
  /**
   * Register a custom business rule
   * @param rule - Business rule to register
   */
  static registerBusinessRule(rule: BusinessRule): void {
    // Remove existing rule with same ID
    this.businessRules = this.businessRules.filter(r => r.id !== rule.id);
    
    // Add new rule and sort by priority
    this.businessRules.push(rule);
    this.businessRules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Validate against all applicable business rules
   * @param context - Package status context
   * @param targetStatus - Target status
   * @returns Validation result
   */
  private static validateBusinessRules(
    context: PackageStatusContext
  ): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Apply all applicable business rules
    const applicableRules = this.businessRules.filter(rule => rule.applies(context));
    
    for (const rule of applicableRules) {
      const result = rule.validate(context);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      if (result.suggestions) {
        suggestions.push(...result.suggestions);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }
  
  /**
   * Validate group consistency for grouped packages
   * @param context - Package status context
   * @param targetStatus - Target status
   * @returns Validation result
   */
  private static validateGroupConsistency(
    context: PackageStatusContext,
    targetStatus: PackageStatus
  ): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Group-specific validations
    if (context.groupId) {
      // Check if status change is appropriate for grouped packages
      const groupPhaseStatuses = [
        PackageStatus.GROUPED,
        PackageStatus.GROUP_CONFIRMED,
        PackageStatus.DISPATCHED,
        PackageStatus.IN_TRANSIT
      ];
      
      if (context.currentStatus === PackageStatus.GROUPED && 
          !groupPhaseStatuses.includes(targetStatus)) {
        warnings.push('Changing status of grouped package may affect other packages in the group');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate status timeline consistency
   * @param context - Package status context
   * @param targetStatus - Target status
   * @returns Validation result
   */
  private static validateStatusTimeline(
    context: PackageStatusContext,
    targetStatus: PackageStatus
  ): StatusValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for status regression (going backwards inappropriately)
    const statusOrder = [
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
    
    const currentIndex = statusOrder.indexOf(context.currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    if (currentIndex > targetIndex && targetIndex !== -1) {
      warnings.push('This status change moves the package backwards in the normal flow');
    }
    
    // Check for duplicate status in history
    const hasStatusInHistory = context.statusHistory.some(
      entry => entry.status === targetStatus
    );
    
    if (hasStatusInHistory && !StatusUtils.isTerminal(targetStatus)) {
      warnings.push('Package has already been in this status before');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate customer impact of status change
   * @param context - Package status context
   * @param targetStatus - Target status
   * @returns Validation result
   */
  private static validateCustomerImpact(
    context: PackageStatusContext,
    targetStatus: PackageStatus
  ): StatusValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Check if status change affects customer visibility
    const isCurrentVisible = StatusUtils.isCustomerVisible(context.currentStatus);
    const isTargetVisible = StatusUtils.isCustomerVisible(targetStatus);
    
    if (isCurrentVisible && !isTargetVisible) {
      warnings.push('This status change will hide the package from customer tracking');
    }
    
    // Premium customer considerations
    if (context.customerType === 'premium' || context.customerType === 'enterprise') {
      if (targetStatus === PackageStatus.DELAYED) {
        suggestions.push('Consider expedited handling for premium customer');
      }
    }
    
    // High priority package considerations
    if (context.priority === 'high') {
      const statusMetadata = StatusUtils.getMetadata(targetStatus);
      if (statusMetadata.estimatedDuration > 12) {
        suggestions.push('High priority package may need expedited processing');
      }
    }
    
    return {
      isValid: true,
      errors: [],
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }
  
  /**
   * Register default business rules
   */
  private static registerDefaultBusinessRules(): void {
    // Rule: Premium customers get priority processing
    this.registerBusinessRule({
      id: 'premium_customer_priority',
      name: 'Premium Customer Priority',
      description: 'Premium customers should receive expedited processing',
      priority: 100,
      applies: (context) => context.customerType === 'premium' || context.customerType === 'enterprise',
      validate: (context) => {
        const suggestions: string[] = [];
        
        if (context.currentStatus === PackageStatus.PENDING) {
          suggestions.push('Premium customer package should be prioritized for processing');
        }
        
        return {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: suggestions.length > 0 ? suggestions : undefined
        };
      }
    });
    
    // Rule: High priority packages need faster processing
    this.registerBusinessRule({
      id: 'high_priority_processing',
      name: 'High Priority Processing',
      description: 'High priority packages should move through statuses quickly',
      priority: 90,
      applies: (context) => context.priority === 'high',
      validate: (context) => {
        const warnings: string[] = [];
        const suggestions: string[] = [];
        
        // Check if package has been in current status too long
        const overdueCheck = this.checkOverdueStatus(context);
        if (overdueCheck.isOverdue && overdueCheck.overdueBy > 6) {
          warnings.push('High priority package is overdue for status update');
          suggestions.push('Consider expediting to next status');
        }
        
        return {
          isValid: true,
          errors: [],
          warnings,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        };
      }
    });
    
    // Rule: Special handling packages need extra validation
    this.registerBusinessRule({
      id: 'special_handling_validation',
      name: 'Special Handling Validation',
      description: 'Packages with special handling requirements need extra care',
      priority: 80,
      applies: (context) => Boolean(context.specialHandling && context.specialHandling.length > 0),
      validate: (context) => {
        const warnings: string[] = [];
        
        if (context.specialHandling?.includes('fragile') && 
            context.currentStatus === PackageStatus.IN_TRANSIT) {
          warnings.push('Fragile package in transit - ensure careful handling');
        }
        
        if (context.specialHandling?.includes('temperature_sensitive') &&
            context.currentStatus === PackageStatus.DISPATCHED) {
          warnings.push('Temperature sensitive package dispatched - monitor conditions');
        }
        
        return {
          isValid: true,
          errors: [],
          warnings
        };
      }
    });
  }
}
