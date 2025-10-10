/**
 * Warehouse Authentication Hook
 * Provides real-time session monitoring with database role-based access control
 * Fetches user role from database instead of email patterns
 * 
 * SINGLETON PATTERN: Only one instance manages auth state to prevent duplicate logs
 */

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { WarehouseAuthService } from "../services/warehouseAuthService";
import { useNavigate } from "react-router-dom";

// Global auth state to prevent multiple instances
let globalAuthState = {
  isAuthenticated: false,
  role: '',
  email: '',
  displayName: '',
  userId: '',
  isLoading: true
};

let globalListeners: Set<(state: typeof globalAuthState) => void> = new Set();
let isGlobalInitialized = false;
let currentGlobalUserId = '';

// Toast fallback function
const toast = ({ title, description }: { title: string; description: string; variant?: string; duration?: number }) => {
  alert(`${title}: ${description}`);
};

// Global auth management functions
const updateGlobalAuthState = (newState: Partial<typeof globalAuthState>) => {
  globalAuthState = { ...globalAuthState, ...newState };
  globalListeners.forEach(listener => listener(globalAuthState));
};

const validateAndSetGlobalAuth = async (user: any, navigate: any) => {
  if (!user) {
    updateGlobalAuthState({ 
      isAuthenticated: false, 
      role: '', 
      email: '', 
      displayName: '', 
      userId: '', 
      isLoading: false 
    });
    currentGlobalUserId = '';
    return;
  }

  // Prevent processing the same user multiple times
  if (currentGlobalUserId === user.id) {
    return;
  }

  const email = user.email || '';
  
  // Fetch role from database instead of email pattern
  const role = await WarehouseAuthService.fetchUserRole(user.id);

  // Database-driven: Immediate ejection of unauthorized users
  if (!WarehouseAuthService.isAuthorizedRole(role)) {
    
    // Force logout
    await supabase.auth.signOut();
    
    // Show access denied message
    toast({
      title: "🚫 Access Denied",
      description: "You do not have permission to access the warehouse system",
      variant: "destructive",
      duration: 6000,
    });
    
    // Redirect to login if navigate function provided
    if (navigate) {
      navigate('/login', { replace: true });
    }
    
    updateGlobalAuthState({ 
      isAuthenticated: false, 
      role: '', 
      email: '', 
      displayName: '', 
      userId: '', 
      isLoading: false 
    });
    return;
  }

  // Set currentUserId to prevent duplicate processing
  currentGlobalUserId = user.id;
  
  // User is authorized - set auth state
  updateGlobalAuthState({ 
    isAuthenticated: true, 
    role, 
    email,
    displayName: WarehouseAuthService.getRoleDisplayName(role),
    userId: user.id,
    isLoading: false
  });
  
  // Only log once per user session to avoid spam
  if (!isGlobalInitialized) {
    isGlobalInitialized = true;
  }
};

// Initialize global auth state (only once)
const initializeGlobalAuth = async () => {
  if (isGlobalInitialized) return;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await validateAndSetGlobalAuth(session.user, null);
    } else {
      updateGlobalAuthState({ isLoading: false });
    }
  } catch (error) {
    updateGlobalAuthState({ isLoading: false });
  }
};

// Set up global auth listener (only once)
if (!isGlobalInitialized) {
  initializeGlobalAuth();
  
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      updateGlobalAuthState({ 
        isAuthenticated: false, 
        role: '', 
        email: '', 
        displayName: '', 
        userId: '', 
        isLoading: false 
      });
      currentGlobalUserId = '';
      isGlobalInitialized = false;
    } else if (event === 'SIGNED_IN') {
      await validateAndSetGlobalAuth(session.user, () => {});
    }
  });
}

export const useWarehouseAuth = () => {
  const [authState, setAuthState] = useState(globalAuthState);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to global auth state changes
    const listener = (newState: typeof globalAuthState) => {
      setAuthState(newState);
    };
    
    globalListeners.add(listener);
    
    // Set initial state
    setAuthState(globalAuthState);
    
    // Initialize if not already done
    if (!isGlobalInitialized) {
      initializeGlobalAuth();
    }

    // Cleanup
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  // Handle navigation for this specific instance
  useEffect(() => {
    if (!authState.isAuthenticated && !authState.isLoading && window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [authState.isAuthenticated, authState.isLoading, navigate]);

  // Return auth state with methods
  return {
    ...authState,
    user: authState.isAuthenticated ? { 
      id: authState.userId, 
      email: authState.email, 
      role: authState.role as any,
      firstName: authState.displayName.split(' ')[0] || '',
      lastName: authState.displayName.split(' ')[1] || '',
      fullName: authState.displayName,
      status: 'active' as const,
      suiteNumber: undefined,
      phoneNumber: undefined,
      address: undefined,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : null,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          await validateAndSetGlobalAuth(data.user, navigate);
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
      }
    },
    signOut: async () => {
      await supabase.auth.signOut();
      updateGlobalAuthState({ 
        isAuthenticated: false, 
        role: '', 
        email: '', 
        displayName: '', 
        userId: '', 
        isLoading: false 
      });
      navigate('/login', { replace: true });
    },
    hasRole: (role: string) => authState.role === role,
    error: null
  };
};
