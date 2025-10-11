import { createClient } from '@supabase/supabase-js';
import { logger } from '../config/environment';

const authStorage = {
  getItem: (key: string) => {
    try {
      const value = localStorage.getItem(key);
      // Only validate Supabase auth tokens, not other keys
      if (key.startsWith('sb-') && value) {
        try {
          // Just check if it's valid JSON, don't remove if it fails
          JSON.parse(value);
        } catch {
          logger.warn(`Invalid token format for ${key}, but keeping it for Supabase to handle`);
          // Don't remove the token - let Supabase handle invalid tokens
          // return null;
        }
      }
      return value;
    } catch (e) {
      logger.error('Storage read failed, clearing corrupted data', e);
      // Only clear auth data if we can't read from localStorage at all
      if (e instanceof Error && e.name === 'SecurityError') {
        ['sb-access-token', 'sb-refresh-token'].forEach(tokenKey => {
          localStorage.removeItem(tokenKey);
        });
      }
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      logger.error('Storage write failed, clearing all auth data', e);
      // Clear all auth data if we can't write
      ['sb-access-token', 'sb-refresh-token'].forEach(tokenKey => {
        localStorage.removeItem(tokenKey);
      });
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      // Also clear related tokens when removing access token
      if (key === 'sb-access-token') {
        localStorage.removeItem('sb-refresh-token');
      }
    } catch (e) {
      logger.error('Storage remove failed', e);
    }
  }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

export function setupTokenMonitor() {
  return supabase.auth.onAuthStateChange((event, session) => {
    logger.debug(`Auth state change: ${event}`);

    if (event === 'TOKEN_REFRESHED') {
      logger.info('Auth tokens were refreshed');
    }

    if (event === 'SIGNED_OUT') {
      logger.info('User signed out, clearing tokens');
      authStorage.removeItem('sb-access-token');
      authStorage.removeItem('sb-refresh-token');
    }

    // Handle token refresh errors
    if (event === 'TOKEN_REFRESHED' && !session) {
      logger.error('Token refresh failed - no valid session');
      // Force logout if token refresh fails
      supabase.auth.signOut().catch(err => {
        logger.error('Forced logout failed', err);
      });
    }
  });
}

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
 * Utility function to clear all Supabase auth tokens
 * Useful for handling corrupted token scenarios
 */
export const clearAuthTokens = () => {
  logger.info('Clearing all Supabase auth tokens');
  authStorage.removeItem('sb-access-token');
  authStorage.removeItem('sb-refresh-token');
};
