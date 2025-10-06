/**
 * Supabase Client Configuration for Warehouse Management System
 * 
 * This module provides the Supabase client instance for database operations
 * and authentication in the warehouse management system.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../config/environment';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist auth session in localStorage
    storage: window.localStorage,
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Persist session across browser tabs
    persistSession: true,
    // Detect session in other tabs
    detectSessionInUrl: false,
  },
  // Global configuration
  global: {
    headers: {
      'x-application': 'vanguard-warehouse',
      'x-client-version': '1.0.0',
    },
  },
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Database type definitions for TypeScript support
 * These should match your Supabase database schema
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: 'customer' | 'admin' | 'super_admin' | 'warehouse_admin';
          status: 'pending_verification' | 'active' | 'suspended' | 'inactive';
          first_name: string;
          last_name: string;
          phone: string | null;
          country: string | null;
          language: string;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
          us_shipping_address_id: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'customer' | 'admin' | 'super_admin' | 'warehouse_admin';
          status?: 'pending_verification' | 'active' | 'suspended' | 'inactive';
          first_name: string;
          last_name: string;
          phone?: string | null;
          country?: string | null;
          language?: string;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          us_shipping_address_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'customer' | 'admin' | 'super_admin' | 'warehouse_admin';
          status?: 'pending_verification' | 'active' | 'suspended' | 'inactive';
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          country?: string | null;
          language?: string;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          us_shipping_address_id?: string | null;
        };
      };
      packages: {
        Row: {
          id: string;
          tracking_number: string;
          user_id: string;
          warehouse_id: string;
          sender_name: string | null;
          sender_email: string | null;
          description: string | null;
          declared_value: number | null;
          currency: string;
          weight_lbs: number | null;
          length_inches: number | null;
          width_inches: number | null;
          height_inches: number | null;
          status: 'pending_arrival' | 'arrived' | 'inspected' | 'ready_for_shipment' | 'consolidated' | 'shipped' | 'delivered' | 'exception';
          is_fragile: boolean;
          is_hazardous: boolean;
          requires_special_handling: boolean;
          special_instructions: string | null;
          storage_location: string | null;
          expected_arrival_date: string | null;
          actual_arrival_date: string | null;
          inspection_date: string | null;
          ready_for_shipment_date: string | null;
          shipped_date: string | null;
          delivered_date: string | null;
          received_by: string | null;
          inspected_by: string | null;
          packed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tracking_number: string;
          user_id: string;
          warehouse_id: string;
          sender_name?: string | null;
          sender_email?: string | null;
          description?: string | null;
          declared_value?: number | null;
          currency?: string;
          weight_lbs?: number | null;
          length_inches?: number | null;
          width_inches?: number | null;
          height_inches?: number | null;
          status?: 'pending_arrival' | 'arrived' | 'inspected' | 'ready_for_shipment' | 'consolidated' | 'shipped' | 'delivered' | 'exception';
          is_fragile?: boolean;
          is_hazardous?: boolean;
          requires_special_handling?: boolean;
          special_instructions?: string | null;
          storage_location?: string | null;
          expected_arrival_date?: string | null;
          actual_arrival_date?: string | null;
          inspection_date?: string | null;
          ready_for_shipment_date?: string | null;
          shipped_date?: string | null;
          delivered_date?: string | null;
          received_by?: string | null;
          inspected_by?: string | null;
          packed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tracking_number?: string;
          user_id?: string;
          warehouse_id?: string;
          sender_name?: string | null;
          sender_email?: string | null;
          description?: string | null;
          declared_value?: number | null;
          currency?: string;
          weight_lbs?: number | null;
          length_inches?: number | null;
          width_inches?: number | null;
          height_inches?: number | null;
          status?: 'pending_arrival' | 'arrived' | 'inspected' | 'ready_for_shipment' | 'consolidated' | 'shipped' | 'delivered' | 'exception';
          is_fragile?: boolean;
          is_hazardous?: boolean;
          requires_special_handling?: boolean;
          special_instructions?: string | null;
          storage_location?: string | null;
          expected_arrival_date?: string | null;
          actual_arrival_date?: string | null;
          inspection_date?: string | null;
          ready_for_shipment_date?: string | null;
          shipped_date?: string | null;
          delivered_date?: string | null;
          received_by?: string | null;
          inspected_by?: string | null;
          packed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          shipment_number: string;
          user_id: string;
          service_type: string;
          recipient_name: string;
          recipient_phone: string;
          recipient_email: string | null;
          delivery_address: string;
          delivery_city: string;
          delivery_region: string | null;
          delivery_country: string;
          total_weight_lbs: number | null;
          total_declared_value: number | null;
          total_packages: number;
          total_cost: number | null;
          status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'awaiting_quote' | 'awaiting_payment';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_number: string;
          user_id: string;
          service_type: string;
          recipient_name: string;
          recipient_phone: string;
          recipient_email?: string | null;
          delivery_address: string;
          delivery_city: string;
          delivery_region?: string | null;
          delivery_country?: string;
          total_weight_lbs?: number | null;
          total_declared_value?: number | null;
          total_packages?: number;
          total_cost?: number | null;
          status?: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'awaiting_quote' | 'awaiting_payment';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shipment_number?: string;
          user_id?: string;
          service_type?: string;
          recipient_name?: string;
          recipient_phone?: string;
          recipient_email?: string | null;
          delivery_address?: string;
          delivery_city?: string;
          delivery_region?: string | null;
          delivery_country?: string;
          total_weight_lbs?: number | null;
          total_declared_value?: number | null;
          total_packages?: number;
          total_cost?: number | null;
          status?: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'awaiting_quote' | 'awaiting_payment';
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          code: string;
          street_address: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone: string | null;
          email: string | null;
          manager_name: string | null;
          is_active: boolean;
          capacity_limit: number | null;
          current_capacity: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      staff_assignments: {
        Row: {
          id: string;
          user_id: string;
          warehouse_id: string;
          position: string;
          is_active: boolean;
          start_date: string;
          end_date: string | null;
          can_receive_packages: boolean;
          can_ship_packages: boolean;
          can_modify_packages: boolean;
          can_manage_inventory: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type-safe Supabase client
export type SupabaseClient = typeof supabase;

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: any, context: string = 'Supabase operation') => {
  logger.error(`${context} error:`, error);
  
  // Handle specific error types
  if (error?.code === 'PGRST116') {
    throw new Error('No data found');
  }
  
  if (error?.code === '23505') {
    throw new Error('Data already exists');
  }
  
  if (error?.message?.includes('JWT')) {
    throw new Error('Authentication required');
  }
  
  // Generic error
  throw new Error(error?.message || 'An unexpected error occurred');
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user;
  } catch (error) {
    logger.error('Authentication check failed:', error);
    return false;
  }
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    logger.error('Get current user failed:', error);
    return null;
  }
};

// Export for use in components
export default supabase;
