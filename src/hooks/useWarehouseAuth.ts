import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, clearAuthTokens } from "../lib/supabase";
import { WarehouseAuthService } from "../services/warehouseAuthService";
import { useNavigate } from "react-router-dom";
import { logger } from "../config/environment";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  } | null;
  error: string | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Simple auth cache to avoid repeated database queries
let authCache: { userId: string; role: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function recoverSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      logger.info('No valid session found');
      return false;
    }

    logger.info('Valid session found');
    return true;
  } catch (error) {
    logger.error('Session recovery error:', error);
    return false;
  }
}

async function getCachedUserRole(userId: string): Promise<string> {
  // Check cache first
  if (authCache && authCache.userId === userId && Date.now() - authCache.timestamp < CACHE_DURATION) {
    logger.info('Using cached user role');
    return authCache.role;
  }

  // Fetch from database
  const role = await WarehouseAuthService.fetchUserRole(userId);

  // Update cache
  authCache = {
    userId,
    role,
    timestamp: Date.now()
  };

  return role;
}

export const useWarehouseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const navigate = useNavigate();
  const initializationRef = useRef(false);

  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const signIn = async (email: string, password: string) => {
    updateAuthState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        updateAuthState({ isLoading: false, isAuthenticated: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        const role = await getCachedUserRole(data.user.id);

        if (WarehouseAuthService.isAuthorizedRole(role)) {
          updateAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: data.user.id,
              email: data.user.email || '',
              role,
              displayName: WarehouseAuthService.getRoleDisplayName(role),
            },
            error: null
          });
          return { success: true };
        } else {
          await supabase.auth.signOut();
          updateAuthState({ isLoading: false, isAuthenticated: false, error: 'Access denied: Insufficient permissions' });
          return { success: false, error: 'Access denied: Insufficient permissions' };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      updateAuthState({ isLoading: false, isAuthenticated: false, error: message });
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    if (initializationRef.current) {
      logger.info('Auth initialization already in progress, skipping');
      return;
    }

    initializationRef.current = true;

    let isMounted = true;

    const initializeAuth = async () => {
      logger.info('Starting auth initialization');

      try {
        const hasSession = await recoverSession();

        if (hasSession) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (session?.user && !error) {
            const role = await getCachedUserRole(session.user.id);

            if (WarehouseAuthService.isAuthorizedRole(role)) {
              updateAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role,
                  displayName: WarehouseAuthService.getRoleDisplayName(role),
                },
                error: null
              });
              logger.info('User authenticated successfully');
              return;
            }
          }
        }

        updateAuthState({ isLoading: false, isAuthenticated: false });
        logger.info('No valid authentication found');

      } catch (error) {
        logger.error('Auth initialization failed:', error);
        updateAuthState({
          isLoading: false,
          isAuthenticated: false,
          error: 'Authentication initialization failed'
        });
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          logger.info('User signed out');
          updateAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null
          });
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      initializationRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!authState.isLoading && !authState.isAuthenticated && window.location.pathname !== '/login') {
        logger.info('Redirecting unauthenticated user to login');
        navigate('/login', { replace: true });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [authState.isAuthenticated, authState.isLoading, navigate]);

  const resetAuth = useCallback(() => {
    logger.info('Manual auth reset triggered');
    updateAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null
    });
    clearAuthTokens();
  }, [updateAuthState]);

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
    resetAuth,
    hasRole: (role: string) => authState.user?.role === role,
    displayName: authState.user?.displayName || '',
  };
};
