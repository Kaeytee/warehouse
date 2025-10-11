import { useEffect, useState, useCallback } from "react";
import { supabase, clearAuthTokens } from "../lib/supabase";
import { WarehouseAuthService } from "../services/warehouseAuthService";

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

export const useWarehouseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [stateVersion, setStateVersion] = useState(0);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Force state update to trigger re-renders
    setStateVersion(prev => prev + 1);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, error: error.message }));
        setStateVersion(prev => prev + 1);
        return { success: false, error: error.message };
      }

      if (data.user) {
        try {
          const userData = await WarehouseAuthService.fetchUserRole(data.user.id);

          if (WarehouseAuthService.isAuthorizedRole(userData.role)) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: {
                id: data.user.id,
                email: data.user.email || '',
                role: userData.role,
                displayName: WarehouseAuthService.getUserDisplayName(userData.firstName, userData.lastName),
              },
              error: null
            });
            setStateVersion(prev => prev + 1);
            return { success: true };
          } else {
            await supabase.auth.signOut();
            setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, error: 'Access denied: Insufficient permissions' }));
            setStateVersion(prev => prev + 1);
            return { success: false, error: 'Access denied: Insufficient permissions' };
          }
        } catch (roleError) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: data.user.id,
              email: data.user.email || '',
              role: 'warehouse_admin',
              displayName: data.user.email || 'User',
            },
            error: null
          });
          setStateVersion(prev => prev + 1);
          return { success: true };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, error: message }));
      setStateVersion(prev => prev + 1);
      return { success: false, error: message };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          // Set authenticated state immediately
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: session.user.id,
              email: session.user.email || '',
              role: 'warehouse_admin', // Default role
              displayName: session.user.email || 'User',
            },
            error: null
          });

          // Try to fetch detailed role info in background
          setTimeout(async () => {
            if (!mounted) return;

            try {
              const userData = await WarehouseAuthService.fetchUserRole(session.user.id);
              if (mounted && userData.role !== 'warehouse_admin') {
                setAuthState(prev => ({
                  ...prev,
                  user: prev.user ? {
                    ...prev.user,
                    role: userData.role,
                    displayName: WarehouseAuthService.getUserDisplayName(userData.firstName, userData.lastName),
                  } : null
                }));
              }
            } catch (roleError) {
              // Silent fail - user is already authenticated with default role
            }
          }, 100);
        } else if (mounted) {
          setAuthState({ isLoading: false, isAuthenticated: false, user: null, error: null });
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null
          });
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const resetAuth = useCallback(() => {
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null
    });
    clearAuthTokens();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null
      });
    } catch (error) {
      setAuthState({
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
    stateVersion, // Include stateVersion to trigger re-renders
  };
};
