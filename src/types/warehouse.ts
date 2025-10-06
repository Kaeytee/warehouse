/**
 * Warehouse Management System Types
 * 
 * Comprehensive type definitions for warehouse operations
 * Supports warehouse_admin and admin roles with clean architecture
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

// Core warehouse user roles
export type WarehouseRole = 'warehouse_admin' | 'admin' | 'superadmin';

// Package status workflow
export type PackageStatus = 'pending' | 'received' | 'processing' | 'shipped' | 'delivered';

// Shipment status workflow  
export type ShipmentStatus = 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered';

// Service types for shipping
export type ServiceType = 'standard' | 'express' | 'overnight';

// User status types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'reported';

// Notification types
export type NotificationType = 'package_update' | 'shipment_update' | 'system' | 'promotion';

/**
 * Warehouse User Interface
 * Extended user information for warehouse operations
 */
export interface WarehouseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string; // Computed full name for display
  name?: string; // Alias for compatibility
  role: WarehouseRole;
  suiteNumber?: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  status: UserStatus;
  emailVerified: boolean;
  createdBy?: string | null;
  reportedBy?: string | null;
  reportReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Package Interface
 * Complete package information for warehouse operations
 */
export interface Package {
  id: string;
  packageId: string;
  trackingNumber: string;
  userId: string;
  status: PackageStatus;
  description?: string;
  weight?: number;
  declaredValue?: number;
  storeName?: string;
  vendorName?: string;
  notes?: string;
  scannedBy?: string;
  intakeDate?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields for UI
  user?: WarehouseUser;
  scannedByUser?: WarehouseUser;
}

/**
 * Shipment Interface
 * Consolidated shipment information
 */
export interface Shipment {
  id: string;
  userId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  recipientName: string;
  recipientPhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryCountry: string;
  totalWeight?: number;
  totalValue?: number;
  shippingCost?: number;
  serviceType: ServiceType;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields for UI
  user?: WarehouseUser;
  packages?: Package[];
  packageCount?: number;
}

/**
 * Address Interface
 * Shipping address information
 */
export interface Address {
  id: string;
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  line1: string;
  line2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification Interface
 * System notification information
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

/**
 * Package Intake Data
 * Information required for package intake operations
 */
export interface PackageIntakeData {
  userSuiteNumber: string;
  description: string;
  warehouseStaffId: string;
  weight?: number;
  declaredValue?: number;
  storeName?: string;
  vendorName?: string;
  notes?: string;
  photos?: File[];
}

/**
 * Package Intake Result
 * Response from package intake operation
 */
export interface PackageIntakeResult {
  success: boolean;
  packageUuid?: string;
  packageId?: string;
  trackingNumber?: string;
  userId?: string;
  message?: string;
  error?: string;
}

/**
 * Shipment Creation Data
 * Information required for creating consolidated shipments
 */
export interface ShipmentCreationData {
  packageIds: string[];
  warehouseStaffId: string;
  recipientName: string;
  recipientPhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryCountry: string;
  serviceType: ServiceType;
}

/**
 * Shipment Creation Result
 * Response from shipment creation operation
 */
export interface ShipmentCreationResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  packagesCount?: number;
  message?: string;
  error?: string;
}

/**
 * Warehouse Metrics
 * Real-time warehouse operational metrics
 */
export interface WarehouseMetrics {
  packagesReceived: number;
  packagesProcessed: number;
  packagesShipped: number;
  averageProcessingTime: number;
  inventoryValue: number;
  storageUtilization: number;
  activeShipments: number;
  pendingPackages: number;
}

/**
 * Performance Analytics
 * Warehouse performance data for reporting
 */
export interface PerformanceAnalytics {
  throughputMetrics: {
    packagesPerHour: number;
    packagesPerDay: number;
    packagesPerWeek: number;
  };
  efficiencyMetrics: {
    averageProcessingTime: number;
    errorRate: number;
    onTimeDeliveryRate: number;
  };
  qualityMetrics: {
    damageRate: number;
    customerSatisfactionScore: number;
    returnRate: number;
  };
  costAnalysis: {
    revenuePerPackage: number;
    operationalCosts: number;
    profitMargin: number;
  };
}

/**
 * Search Filters
 * Filter options for package and shipment searches
 */
export interface PackageSearchFilters {
  status?: PackageStatus[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  userId?: string;
  location?: string;
  weightRange?: {
    min: number;
    max: number;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  searchTerm?: string;
}

export interface ShipmentSearchFilters {
  status?: ShipmentStatus[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  userId?: string;
  serviceType?: ServiceType;
  searchTerm?: string;
}

/**
 * Bulk Operation Result
 * Response from bulk operations
 */
export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
  message: string;
}

/**
 * User Creation Data
 * Information required for creating new users (admin only)
 */
export interface UserCreationData {
  email: string;
  firstName: string;
  lastName: string;
  role: WarehouseRole;
  phoneNumber?: string;
  whatsappNumber?: string;
}

/**
 * User Creation Result
 * Response from user creation operation
 */
export interface UserCreationResult {
  success: boolean;
  userId?: string;
  suiteNumber?: string;
  message?: string;
  error?: string;
}

/**
 * Warehouse Location
 * Hardcoded warehouse location information
 */
export interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

/**
 * Report Period
 * Time period options for reporting
 */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Financial Report
 * Financial data for warehouse operations
 */
export interface FinancialReport {
  period: ReportPeriod;
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  packagesProcessed: number;
  averageRevenuePerPackage: number;
  operationalEfficiency: number;
}

/**
 * API Response
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Warehouse Permission
 * Permission levels for warehouse operations
 */
export type WarehousePermission = 
  | 'package_intake'
  | 'package_management' 
  | 'shipment_creation'
  | 'shipment_management'
  | 'user_management'
  | 'analytics_view'
  | 'analytics_report'
  | 'reports'
  | 'system_settings'
  | 'audit_logs';

/**
 * Role Permissions Mapping
 * Defines what each role can access
 */
export const ROLE_PERMISSIONS: Record<WarehouseRole, WarehousePermission[]> = {
  warehouse_admin: [
    'package_intake',
    'package_management',
    'shipment_creation',
    'analytics_view' // Dashboard access only, no analytics_report
  ],
  admin: [
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'analytics_view',
    'analytics_report', // Full analytics report access
    'reports', // Reports access
    'system_settings',
    'audit_logs'
  ],
  superadmin: [
    'package_intake',
    'package_management',
    'shipment_creation',
    'shipment_management',
    'user_management',
    'analytics_view',
    'analytics_report', // Full analytics report access
    'reports', // Reports access
    'system_settings',
    'audit_logs'
  ]
};

/**
 * Warehouse Constants
 * Application-wide constants
 */
export const WAREHOUSE_CONSTANTS = {
  WAREHOUSE_ID: 'ALX-E2',
  WAREHOUSE_ADDRESS: '4700 Eisenhower Avenue, Alexandria, VA 22304, USA',
  WAREHOUSE_NAME: 'Vanguard Cargo Alexandria Warehouse',
  DEFAULT_PAGINATION_SIZE: 50,
  MAX_BULK_OPERATION_SIZE: 100,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_PACKAGE: 10
} as const;
