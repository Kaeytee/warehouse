/**
 * Meta-Level Warehouse Authentication Hook
 * Provides real-time session monitoring with immediate unauthorized user ejection
 * Inspired by Meta's internal auth patterns - deterministic role assignment
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

// Simple logger for Meta-style debugging
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
};

// Simple toast notification
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
  const role = WarehouseAuthService.determineUserRole(email);

  // Meta-style: Immediate ejection of unauthorized users
  if (!WarehouseAuthService.isAuthorizedRole(role)) {
    logger.warn('Unauthorized access attempt blocked:', { email, role, userId: user.id });
    
    // Force logout
    await supabase.auth.signOut();
    
    // Show access denied message
    toast({
      title: "🚫 Access Denied",
      description: "Access Denied",
      variant: "destructive",
      duration: 6000,
    });
    
    // Redirect to login
    navigate('/login', { replace: true });
    
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
    logger.info('Warehouse access granted:', { email, role, userId: user.id });
    isGlobalInitialized = true;
  }
};

// Initialize global auth state (only once)
const initializeGlobalAuth = async () => {
  if (isGlobalInitialized) return;
  
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await validateAndSetGlobalAuth(data.user, () => {});
    } else {
      updateGlobalAuthState({ isLoading: false });
    }
  } catch (error) {
    logger.error('Global auth initialization error:', error);
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

  return authState;
};
