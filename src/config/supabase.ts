/**
 * Supabase Configuration
 * 
 * Centralized configuration for Supabase client with warehouse-specific settings
 * Handles authentication, database connections, and storage operations
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable');
}

/**
 * Supabase Client Instance
 * 
 * Configured with warehouse-specific options for optimal performance
 * and security in warehouse operations.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto refresh tokens for long warehouse sessions
    autoRefreshToken: true,
    // Persist auth state for warehouse workstations
    persistSession: true,
    // Detect session changes for multi-user workstations
    detectSessionInUrl: true,
    // Storage key for warehouse app
    storageKey: 'vanguard-warehouse-auth'
  },
  db: {
    // Schema for warehouse operations
    schema: 'public'
  },
  global: {
    // Custom headers for warehouse operations
    headers: {
      'X-Client-Info': 'vanguard-warehouse@1.0.0'
    }
  },
  realtime: {
    // Enable real-time updates for warehouse operations
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Warehouse Configuration Constants
 * 
 * Hardcoded warehouse information as specified in requirements
 */
export const WAREHOUSE_CONFIG = {
  // Primary warehouse location
  WAREHOUSE_ID: 'ALX-E2',
  WAREHOUSE_NAME: 'Vanguard Cargo Alexandria Warehouse',
  WAREHOUSE_ADDRESS: '4700 Eisenhower Avenue, Alexandria, VA 22304, USA',
  
  // Operational settings
  TIMEZONE: 'America/New_York',
  BUSINESS_HOURS: {
    start: '08:00',
    end: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  
  // Storage settings
  STORAGE_BUCKETS: {
    PACKAGE_PHOTOS: 'package-photos',
    SHIPPING_LABELS: 'shipping-labels',
    DOCUMENTS: 'warehouse-documents'
  },
  
  // Real-time channels
  REALTIME_CHANNELS: {
    PACKAGES: 'packages-channel',
    SHIPMENTS: 'shipments-channel',
    NOTIFICATIONS: 'notifications-channel'
  }
} as const;

/**
 * Database Table Names
 * 
 * Centralized table name constants for type safety
 */
export const TABLES = {
  USERS: 'users',
  PACKAGES: 'packages',
  SHIPMENTS: 'shipments',
  ADDRESSES: 'addresses',
  NOTIFICATIONS: 'notifications',
  USER_PREFERENCES: 'user_preferences',
  PACKAGE_SHIPMENTS: 'package_shipments'
} as const;

/**
 * Database Functions
 * 
 * Available stored procedures for warehouse operations
 */
export const DB_FUNCTIONS = {
  // Package operations
  WAREHOUSE_PACKAGE_INTAKE: 'warehouse_package_intake',
  UPDATE_PACKAGE_STATUS: 'update_package_status',
  
  // Shipment operations
  CREATE_SHIPMENT_FROM_PACKAGES: 'create_shipment_from_packages',
  UPDATE_SHIPMENT_STATUS: 'update_shipment_status',
  
  // User management
  ADMIN_CREATE_USER: 'admin_create_user',
  ADMIN_REPORT_USER: 'admin_report_user',
  ADMIN_REVOKE_USER: 'admin_revoke_user',
  
  // Utility functions
  GENERATE_TRACKING_NUMBER: 'generate_tracking_number',
  GENERATE_PACKAGE_ID: 'generate_package_id',
  MARK_NOTIFICATION_READ: 'mark_notification_read'
} as const;

/**
 * Supabase Error Handler
 * 
 * Centralized error handling for Supabase operations
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Helper function to handle Supabase responses
 * @param response - Supabase response object
 * @returns Processed response with error handling
 */
export function handleSupabaseResponse<T>(response: {
  data: T | null;
  error: any;
}): { data: T; error: null } | { data: null; error: SupabaseError } {
  if (response.error) {
    return {
      data: null,
      error: new SupabaseError(
        response.error.message || 'Unknown database error',
        response.error.code,
        response.error.details
      )
    };
  }

  return {
    data: response.data as T,
    error: null
  };
}

/**
 * Check if user role has warehouse access
 * @param userRole - User role to check
 * @returns Boolean indicating warehouse access
 */
export function hasWarehouseAccess(userRole: string): boolean {
  return ['warehouse_admin', 'admin', 'super_admin', 'superadmin'].includes(userRole);
}

/**
 * Check if user has admin-level permissions (full access)
 * @param userRole - User role to check
 * @returns Boolean indicating admin-level access
 */
export function hasAdminAccess(userRole: string): boolean {
  return ['admin', 'super_admin', 'superadmin'].includes(userRole);
}

/**
 * Check if user has restricted warehouse access (limited permissions)
 * @param userRole - User role to check
 * @returns Boolean indicating restricted access
 */
export function hasRestrictedAccess(userRole: string): boolean {
  return userRole === 'warehouse_admin';
}

/**
 * Get storage URL for uploaded files
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL for the file
 */
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Real-time subscription helper
 * @param table - Table to subscribe to
 * @param callback - Callback function for changes
 * @returns Subscription object
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`${table}-changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table 
      }, 
      callback
    )
    .subscribe();
}

/**
 * Batch operation helper
 * @param operations - Array of operations to execute
 * @returns Promise resolving to array of results
 */
export async function executeBatch<T>(
  operations: (() => Promise<T>)[]
): Promise<T[]> {
  return Promise.all(operations.map(op => op()));
}
