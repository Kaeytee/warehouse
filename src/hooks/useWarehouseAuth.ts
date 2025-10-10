/**
 * Warehouse Authentication Hook - Fixed Version
 * 
 * Simplified authentication with proper session restoration
 * Eliminates race conditions and stuck loading states
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { WarehouseAuthService } from "../services/warehouseAuthService";
import { useNavigate } from "react-router-dom";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

export const useWarehouseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const navigate = useNavigate();

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAuthError = useCallback((error: string) => {
    updateAuthState({ 
      isLoading: false, 
      isAuthenticated: false, 
      user: null, 
      error 
    });
  }, [updateAuthState]);

  const validateAndSetUser = useCallback(async (user: any) => {
    if (!user) {
      updateAuthState({ 
        isLoading: false, 
        isAuthenticated: false, 
        user: null 
      });
      return;
    }

    try {
      // Fetch user role from database
      const role = await WarehouseAuthService.fetchUserRole(user.id);
      
      // Check if role is authorized
      if (!WarehouseAuthService.isAuthorizedRole(role)) {
        await supabase.auth.signOut();
        handleAuthError('Access denied: Insufficient permissions');
        return;
      }

      // Set authenticated state
      updateAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          id: user.id,
          email: user.email,
          role,
          displayName: WarehouseAuthService.getRoleDisplayName(role),
        },
        error: null
      });
    } catch (error) {
      console.error('Auth validation error:', error);
      handleAuthError('Authentication validation failed');
    }
  }, [updateAuthState, handleAuthError]);

  // Initialize authentication state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (isMounted) handleAuthError('Session validation failed');
          return;
        }

        if (session?.user && isMounted) {
          await validateAndSetUser(session.user);
        } else if (isMounted) {
          updateAuthState({ isLoading: false, isAuthenticated: false, user: null });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) handleAuthError('Authentication initialization failed');
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state change:', event, !!session);

        if (event === 'SIGNED_OUT' || !session) {
          updateAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null
          });
        } else if (event === 'SIGNED_IN' && session?.user) {
          await validateAndSetUser(session.user);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [validateAndSetUser, updateAuthState, handleAuthError]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated && window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [authState.isAuthenticated, authState.isLoading, navigate]);

  const signIn = async (email: string, password: string) => {
    updateAuthState({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        handleAuthError(error.message);
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        await validateAndSetUser(data.user);
        return { success: true };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      handleAuthError(message);
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Force local state reset even if API call fails
      updateAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    }
  };

  return {
    ...authState,
    signIn,
    signOut,
    hasRole: (role: string) => authState.user?.role === role,
  };
};
