/**
 * PackageService.ts
 * 
 * Core package service for Vanguard Cargo
 * This service provides comprehensive CRUD operations and business logic for packages
 * Centralizes all package-related operations with proper validation and error handling
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { 
  PackageUtils,
  PackagePriority,
  PackageType,
  PaymentStatus
} from '../models/Package';

import type { 
  Package, 
  CreatePackageRequest, 
  // UpdatePackageRequest removed as it was unused
  PackageSearchCriteria, 
  PackageSearchResult, 
  PackageStatistics
} from '../models/Package';
import { StatusValidationService } from '../status/StatusValidationService';
import type { PackageStatusContext } from '../status/StatusValidationService';
// Removed unused StatusTransitionService import
import { LocationMappingService, FacilityTypeValues, type LocationPoint } from '../status/StatusLocationMapping';
import type { TrackingPoint, TrackingTimeline } from '../models/TrackingPoint';
import { TrackingSource } from '../models/TrackingPoint';
import { PackageStatus } from '../status/StatusDefinitions';

/**
 * Package service result interface
 * Standardized response format for service operations
 */
export interface PackageServiceResult<T = unknown> {
  readonly success: boolean;           // Whether operation succeeded
  readonly data?: T;                   // Result data if successful
  readonly error?: string;             // Error message if failed
  readonly errors?: string[];          // Multiple error messages
  readonly warnings?: string[];        // Warning messages
  readonly metadata?: Record<string, unknown>; // Additional metadata
}

/**
 * Package batch operation result interface
 * Result format for batch operations
 */
export interface PackageBatchResult {
  readonly totalProcessed: number;     // Total packages processed
  readonly successful: number;         // Successfully processed
  readonly failed: number;             // Failed to process
  readonly results: Array<{
    readonly packageId: string;
    readonly success: boolean;
    readonly error?: string;
  }>;
  readonly warnings: string[];         // Overall warnings
}

/**
 * Comprehensive package service
 * Central hub for all package-related business operations
 */
export class PackageService {
  static async getPackages(params: { status: PackageStatus[]; limit: number; }): Promise<Package[]> {
    // TODO: Replace with actual API call
    // For now, return mock data for development
    const mockPackages: Package[] = [
      {
        id: 'PKG-001',
        requestId: 'REQ-001',
        trackingNumber: 'TT001234567890',
        clientName: 'John Doe',
        clientEmail: 'john.doe@example.com',
        clientPhone: '+1234567890',
        packageType: PackageType.PARCEL,
        priority: PackagePriority.MEDIUM,
        status: PackageStatus.PROCESSING,
        description: 'Electronics package',
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15, volume: 9000 },
        value: 500,
        currency: 'USD',
        origin: {
          facilityName: 'Main Warehouse',
          address: '123 Origin St',
          city: 'New York',
          state: 'NY',
          region: 'Northeast',
          country: 'USA',
          postalCode: '10001',
          facilityType: FacilityTypeValues.WAREHOUSE,
          latitude: 40.7128,
          longitude: -74.0060
        },
        destination: {
          facilityName: 'Customer Location',
          address: '456 Dest Ave',
          city: 'Los Angeles',
          state: 'CA',
          region: 'West Coast',
          country: 'USA',
          postalCode: '90001',
          facilityType: FacilityTypeValues.CUSTOMER_LOCATION,
          latitude: 34.0522,
          longitude: -118.2437
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        estimatedDelivery: '2024-01-10T00:00:00Z',
        statusHistory: [],
        specialHandling: [],
        hazardous: false,
        fragile: false,
        temperatureSensitive: false,
        trackingPoints: [],
        shippingCost: 0,
        paymentStatus: 'pending',
        signatureRequired: false,
        createdBy: '',
        lastModifiedBy: '',
        version: 0
      },
      {
        id: 'PKG-002',
        requestId: 'REQ-002',
        trackingNumber: 'TT001234567891',
        clientName: 'Jane Smith',
        clientEmail: 'jane.smith@example.com',
        clientPhone: '+1234567891',
        packageType: PackageType.DOCUMENT,
        priority: PackagePriority.HIGH,
        status: PackageStatus.PROCESSING,
        description: 'Documents package',
        weight: 0.5,
        dimensions: { length: 25, width: 18, height: 2, volume: 900 },
        value: 100,
        currency: 'USD',
        origin: {
          facilityName: 'Branch Office',
          address: '789 Start Rd',
          city: 'Chicago',
          state: 'IL',
          region: 'Midwest',
          country: 'USA',
          postalCode: '60601',
          facilityType: FacilityTypeValues.WAREHOUSE,
          latitude: 41.8781,
          longitude: -87.6298
        },
        destination: {
          facilityName: 'Client Office',
          address: '321 End Blvd',
          city: 'Miami',
          state: 'FL',
          region: 'Southeast',
          country: 'USA',
          postalCode: '33101',
          facilityType: FacilityTypeValues.CUSTOMER_LOCATION,
          latitude: 25.7617,
          longitude: -80.1918
        },
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        estimatedDelivery: '2024-01-08T00:00:00Z',
        statusHistory: [],
        specialHandling: [],
        hazardous: false,
        fragile: true,
        temperatureSensitive: false,
        trackingPoints: [],
        shippingCost: 0,
        paymentStatus: 'pending',
        signatureRequired: false,
        createdBy: '',
        lastModifiedBy: '',
        version: 0
      }
    ];

    // Filter by status if provided
    let filteredPackages = mockPackages;
    if (params.status && params.status.length > 0) {
      filteredPackages = mockPackages.filter(pkg => params.status.includes(pkg.status));
    }

    // Apply limit
    if (params.limit && params.limit > 0) {
      filteredPackages = filteredPackages.slice(0, params.limit);
    }

    return filteredPackages;
  }
  private static instance: PackageService;
  
  /**
   * Get singleton instance of PackageService
   * @returns PackageService instance
   */
  static getInstance(): PackageService {
    if (!PackageService.instance) {
      PackageService.instance = new PackageService();
    }
    return PackageService.instance;
  }
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize service
    this.initializeService();
  }
  
  /**
   * Initialize the package service
   */
  private initializeService(): void {
    // Initialize validation service
    StatusValidationService.initialize();
    
    // Set up event listeners or other initialization
    console.log('PackageService initialized');
  }
  
  /**
   * Create a new package
   * @param request - Package creation request
   * @param createdBy - User creating the package
   * @returns Service result with created package
   */
  async createPackage(
    request: CreatePackageRequest,
    createdBy: string
  ): Promise<PackageServiceResult<Package>> {
    try {
      // Validate request data
      const validationErrors = this.validateCreateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }
      
      // Generate package identifiers
      const packageId = PackageUtils.generatePackageId();
      const trackingNumber = PackageUtils.generateTrackingNumber();
      const now = new Date().toISOString();
      
      // Calculate estimated delivery
      const estimatedDelivery = request.estimatedDelivery || 
        LocationMappingService.calculateEstimatedDelivery(
          request.destination.city,
          PackageStatus.PENDING
        );
      
      // Create package object
      const newPackage: Package = {
        id: packageId,
        requestId: request.requestId,
        trackingNumber,
        clientName: request.clientName,
        clientId: request.clientId,
        clientEmail: request.clientEmail,
        clientPhone: request.clientPhone,
        description: request.description,
        packageType: request.packageType,
        weight: request.weight,
        dimensions: {
          ...request.dimensions,
          volume: PackageUtils.calculateVolume(request.dimensions)
        },
        value: request.value,
        currency: request.currency,
        origin: request.origin,
        destination: request.destination,
        status: PackageStatus.PENDING,
        statusHistory: [],
        trackingPoints: [],
        createdAt: now,
        updatedAt: now,
        estimatedDelivery,
        priority: request.priority,
        specialHandling: request.specialHandling || [],
        fragile: request.fragile || false,
        temperatureSensitive: request.temperatureSensitive || false,
        hazardous: request.hazardous || false,
        shippingCost: request.shippingCost || 0,
        insuranceValue: request.insuranceValue,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: request.paymentMethod,
        notes: request.notes,
        customerNotes: request.customerNotes,
        deliveryInstructions: request.deliveryInstructions,
        signatureRequired: request.signatureRequired || false,
        createdBy,
        lastModifiedBy: createdBy,
        version: 1
      };
      
      // Create initial tracking point
      const initialTrackingPoint: TrackingPoint = {
        id: `TRK-${packageId}-001`,
        packageId,
        location: request.origin,
        status: PackageStatus.PENDING,
        timestamp: now,
        isEstimated: false,
        isVisible: true,
        isActive: true,
        isMilestone: true,
        sequence: 1,
        description: 'Package request received',
        facilityType: FacilityTypeValues.WAREHOUSE,
        createdAt: now,
        updatedAt: now,
        createdBy,
        lastModifiedBy: createdBy,
        source: TrackingSource.SYSTEM_GENERATED,
        confidence: 1.0
      };
      
      // Add history and tracking to package
      const packageWithHistory: Package = {
        ...newPackage,
        statusHistory: [{
          id: `HST-${packageId}-001`,
          status: PackageStatus.PENDING,
          timestamp: now,
          location: request.origin,
          performedBy: createdBy,
          performedByRole: 'User',
          reason: 'Package created',
          notes: 'Initial package creation',
          automatic: false
        }],
        trackingPoints: [initialTrackingPoint]
      };
      
      // TODO: Save to database
      // await this.packageRepository.save(packageWithHistory);
      
      return {
        success: true,
        data: packageWithHistory,
        metadata: {
          trackingNumber,
          estimatedDelivery
        }
      };
      
    } catch (error) {
      console.error('Error creating package:', error);
      return {
        success: false,
        error: 'Failed to create package'
      };
    }
  }
  
  /**
   * Update package status with full validation
   * @param packageId - Package ID to update
   * @param newStatus - New status
   * @param updatedBy - User performing update
   * @param reason - Reason for status change
   * @param location - Location where change occurred
   * @returns Service result
   */
  async updatePackageStatus(
    packageId: string,
    newStatus: PackageStatus,
    updatedBy: string,
    reason?: string,
    location?: LocationPoint
  ): Promise<PackageServiceResult<Package>> {
    try {
      // Get current package
      const currentPackage = await this.getPackageById(packageId);
      if (!currentPackage.success || !currentPackage.data) {
        return {
          success: false,
          error: 'Package not found'
        };
      }
      
      const pkg = currentPackage.data;
      
      // Create status context for validation (convert Package StatusHistoryEntry to ValidationService format)
      const statusContext: PackageStatusContext = {
        packageId: pkg.id,
        currentStatus: pkg.status,
        statusHistory: pkg.statusHistory.map(entry => ({
          status: entry.status,
          timestamp: entry.timestamp,
          performedBy: entry.performedBy,
          reason: entry.reason,
          location: entry.location?.address || entry.location?.city || 'Unknown',
          notes: entry.notes
        })),
        groupId: pkg.groupId,
        destination: pkg.destination.city,
        priority: pkg.priority === 'urgent' ? 'high' : pkg.priority, // Map 'urgent' to 'high' for compatibility
        specialHandling: pkg.specialHandling,
        customerType: 'standard' // TODO: Get from customer data
      };
      
      // Validate status change
      const validationResult = StatusValidationService.validateStatusChange(
        statusContext,
        newStatus,
        'admin', // TODO: Get actual user role
        reason
      );
      
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        };
      }
      
      // Update package
      const now = new Date().toISOString();
      const updatedLocation = location || LocationMappingService.getLocationForStatus(
        newStatus,
        pkg.destination.city
      );
      
      // Create new tracking point
      const trackingPoint: TrackingPoint = {
        id: `TRK-${packageId}-${String(pkg.trackingPoints.length + 1).padStart(3, '0')}`,
        packageId,
        location: updatedLocation,
        status: newStatus,
        timestamp: now,
        isEstimated: false,
        isVisible: true,
        isActive: true,
        isMilestone: true,
        sequence: pkg.trackingPoints.length + 1,
        description: reason || `Package status updated to ${newStatus}`,
        facilityType: updatedLocation.facilityType,
        createdAt: now,
        updatedAt: now,
        createdBy: updatedBy,
        lastModifiedBy: updatedBy,
        source: TrackingSource.MANUAL,
        confidence: 1.0
      };
      
      // Update package
      const updatedPackage: Package = {
        ...pkg,
        status: newStatus,
        currentLocation: updatedLocation,
        updatedAt: now,
        lastModifiedBy: updatedBy,
        statusHistory: [
          ...pkg.statusHistory,
          {
            id: `HST-${packageId}-${now}`,
            status: newStatus,
            timestamp: now,
            location: updatedLocation,
            performedBy: updatedBy,
            performedByRole: 'User',
            reason: reason || 'Status updated',
            notes: `Status changed from ${pkg.status} to ${newStatus}`,
            automatic: false
          }
        ],
        trackingPoints: [
          ...pkg.trackingPoints.map(tp => ({ ...tp, isActive: false })),
          trackingPoint
        ],
        version: pkg.version + 1
      };
      
      // TODO: Save to database
      // await this.packageRepository.save(updatedPackage);
      
      return {
        success: true,
        data: updatedPackage,
        warnings: validationResult.warnings
      };
      
    } catch (error) {
      console.error('Error updating package status:', error);
      return {
        success: false,
        error: 'Failed to update package status'
      };
    }
  }
  
  /**
   * Get package by ID
   * @param packageId - Package ID
   * @returns Service result with package data
   */
  async getPackageById(packageId: string): Promise<PackageServiceResult<Package>> {
    try {
      // TODO: Implement database query
      // For now, return mock data
      const mockPackage: Package = {
        id: packageId,
        requestId: 'REQ-001',
        trackingNumber: 'TT12345678',
        clientName: 'John Doe',
        description: 'Test package',
        packageType: PackageType.PARCEL,
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15, volume: 9000 },
        value: 100,
        currency: 'GHS',
        origin: {
          latitude: 5.6037,
          longitude: -0.1870,
          address: 'Accra Main Warehouse',
          city: 'Accra',
          region: 'Greater Accra',
          country: 'Ghana',
          facilityType: FacilityTypeValues.WAREHOUSE,
          state: 'Greater Accra', // Use region as state for compatibility
          facilityName: 'warehouse - Accra' // Generate facility name
        },
        destination: {
          latitude: 6.6885,
          longitude: -1.6244,
          address: 'Kumasi Distribution Hub',
          city: 'Kumasi',
          region: 'Ashanti',
          country: 'Ghana',
          facilityType: FacilityTypeValues.DISTRIBUTION_HUB,
          state: 'Ashanti', // Use region as state for compatibility
          facilityName: 'distribution_hub - Kumasi' // Generate facility name
        },
        status: PackageStatus.PROCESSING,
        statusHistory: [],
        trackingPoints: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        priority: PackagePriority.MEDIUM,
        specialHandling: [],
        fragile: false,
        temperatureSensitive: false,
        hazardous: false,
        shippingCost: 25,
        paymentStatus: PaymentStatus.PAID,
        signatureRequired: false,
        createdBy: 'system',
        lastModifiedBy: 'system',
        version: 1
      };
      
      return {
        success: true,
        data: mockPackage
      };
      
    } catch (error) {
      console.error('Error getting package:', error);
      return {
        success: false,
        error: 'Failed to retrieve package'
      };
    }
  }
  
  /**
   * Search packages with criteria
   * @param criteria - Search criteria
   * @returns Service result with search results
   */
  async searchPackages(criteria: PackageSearchCriteria): Promise<PackageServiceResult<PackageSearchResult>> {
    try {
      // TODO: Implement database search
      // For now, return mock results
      const mockResults: PackageSearchResult = {
        packages: [],
        totalCount: 0,
        page: criteria.page || 1,
        limit: criteria.limit || 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
      
      return {
        success: true,
        data: mockResults
      };
      
    } catch (error) {
      console.error('Error searching packages:', error);
      return {
        success: false,
        error: 'Failed to search packages'
      };
    }
  }
  
  /**
   * Get package tracking timeline
   * @param packageId - Package ID
   * @returns Service result with tracking timeline
   */
  async getPackageTimeline(packageId: string): Promise<PackageServiceResult<TrackingTimeline>> {
    try {
      const packageResult = await this.getPackageById(packageId);
      if (!packageResult.success || !packageResult.data) {
        return {
          success: false,
          error: 'Package not found'
        };
      }
      
      const pkg = packageResult.data;
      const timeline = {
        packageId: pkg.id,
        points: pkg.trackingPoints,
        currentPoint: pkg.trackingPoints.find(tp => tp.status === pkg.status),  // Use status match instead of isActive
        estimatedDelivery: pkg.estimatedDelivery,
        actualDelivery: pkg.actualDelivery,
        totalDistance: 0, // TODO: Calculate from tracking points
        completionPercentage: this.calculateCompletionPercentage(pkg),
        isOnTime: !PackageUtils.isOverdue(pkg),
        delayMinutes: PackageUtils.isOverdue(pkg) ? 
          Math.round((new Date().getTime() - new Date(pkg.estimatedDelivery).getTime()) / (1000 * 60)) : 
          undefined
      };
      
      // Cast the timeline to TrackingTimeline to satisfy type requirements
      return {
        success: true,
        data: timeline as unknown as TrackingTimeline
      };
      
    } catch (error) {
      console.error('Error getting package timeline:', error);
      return {
        success: false,
        error: 'Failed to get package timeline'
      };
    }
  }
  
  /**
   * Batch update package statuses
   * @param packageIds - Array of package IDs
   * @param newStatus - New status for all packages
   * @param updatedBy - User performing update
   * @param reason - Reason for batch update
   * @returns Batch operation result
   */
  async batchUpdateStatus(
    packageIds: string[],
    newStatus: PackageStatus,
    updatedBy: string,
    reason?: string
  ): Promise<PackageServiceResult<PackageBatchResult>> {
    try {
      const results: PackageBatchResult['results'] = [];
      const warnings: string[] = [];
      let successful = 0;
      let failed = 0;
      
      // Process each package
      for (const packageId of packageIds) {
        try {
          const result = await this.updatePackageStatus(
            packageId,
            newStatus,
            updatedBy,
            reason
          );
          
          if (result.success) {
            successful++;
            results.push({
              packageId,
              success: true
            });
            
            if (result.warnings) {
              warnings.push(...result.warnings);
            }
          } else {
            failed++;
            results.push({
              packageId,
              success: false,
              error: result.error || result.errors?.join(', ')
            });
          }
        } catch (error) {
          console.error(`Error updating package ${packageId}:`, error);
          failed++;
          results.push({
            packageId,
            success: false,
            error: 'Unexpected error during update'
          });
        }
      }
      
      const batchResult: PackageBatchResult = {
        totalProcessed: packageIds.length,
        successful,
        failed,
        results,
        warnings: [...new Set(warnings)] // Remove duplicates
      };
      
      return {
        success: failed === 0,
        data: batchResult,
        warnings: batchResult.warnings
      };
      
    } catch (error) {
      console.error('Error in batch update:', error);
      return {
        success: false,
        error: 'Failed to perform batch update'
      };
    }
  }
  
  /**
   * Get package statistics
   * @param criteria - Optional filter criteria
   * @returns Service result with statistics
   */
  async getPackageStatistics(/* criteria?: Partial<PackageSearchCriteria> */): Promise<PackageServiceResult<PackageStatistics>> {
    try {
      // TODO: Implement database aggregation with criteria
      // For now, return mock statistics
      const mockStats: PackageStatistics = {
        totalPackages: 0,
        statusCounts: {} as Record<string, number>,
        priorityCounts: {} as Record<string, number>,
        typeCounts: {} as Record<string, number>,
        averageDeliveryTime: 48,
        onTimeDeliveryRate: 85,
        totalValue: 0,
        totalWeight: 0,
        groupedPackages: 0,
        ungroupedPackages: 0
      };
      
      return {
        success: true,
        data: mockStats
      };
      
    } catch (error) {
      console.error('Error getting package statistics:', error);
      return {
        success: false,
        error: 'Failed to get package statistics'
      };
    }
  }
  
  /**
   * Validate package creation request
   * @param request - Creation request to validate
   * @returns Array of validation errors
   */
  private validateCreateRequest(request: CreatePackageRequest): string[] {
    const errors: string[] = [];
    
    // Use PackageUtils validation
    const packageErrors = PackageUtils.validatePackage(request as Package);
    errors.push(...packageErrors);
    
    // Additional business validation
    if (request.weight > 50 && !request.specialHandling?.includes('heavy')) {
      errors.push('Heavy packages (>50kg) require special handling');
    }
    
    if (request.value > 10000 && !request.insuranceValue) {
      errors.push('High-value packages (>10,000) require insurance');
    }
    
    if (request.hazardous && !request.specialHandling?.includes('hazardous')) {
      errors.push('Hazardous packages require special handling designation');
    }
    
    return errors;
  }
  
  /**
   * Calculate package completion percentage
   * @param pkg - Package to calculate for
   * @returns Completion percentage (0-100)
   */
  private calculateCompletionPercentage(pkg: Package): number {
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
    
    const currentIndex = statusOrder.indexOf(pkg.status);
    if (currentIndex === -1) return 0;
    
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  }
}
