import React, { useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import type { User, WarehouseRole, UserRole } from '../../../types/auth';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (username: string, _password: string, role: WarehouseRole) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Convert role to UserRole format (they should match now)
      const userRole = role as UserRole;
      
      // Mock user data based on role
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email: `${username}@Vanguard-cargo.com`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        role: userRole,
        department: getDepartmentByRole(role),
        permissions: getPermissionsByRole(role),
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem('warehouse_user', JSON.stringify(mockUser));
      localStorage.setItem('warehouse_token', `token_${Date.now()}`);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
    } catch {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed. Please check your credentials.' });
    }
  };

  const logout = () => {
    localStorage.removeItem('warehouse_user');
    localStorage.removeItem('warehouse_token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('warehouse_user');
    const storedToken = localStorage.getItem('warehouse_token');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch {
        localStorage.removeItem('warehouse_user');
        localStorage.removeItem('warehouse_token');
      }
    }
  }, []);

  const value = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Helper functions
const getDepartmentByRole = (role: WarehouseRole): string => {
  const roleMap: Record<WarehouseRole, string> = {
    admin: 'Administration',
    warehouse_manager: 'Warehouse Management',
    processor: 'Processing',
    group_manager: 'Group Management',
    dispatcher: 'Dispatch',
    driver: 'Transportation',
    delivery_agent: 'Delivery',
    worker: 'Operations',
    specialist: 'Specialized Operations'
  };
  return roleMap[role] || 'General';
};

const getPermissionsByRole = (role: WarehouseRole) => {
  const basePermissions = {
    packages: {
      view: false,
      create: false,
      update: false,
      delete: false,
    },
    shipments: {
      view: false,
      create: false,
      update: false,
    },
    customers: {
      view: false,
      manage: false,
    },
    reports: {
      view: false,
      generate: false,
    },
    system: {
      configure: false,
      userManagement: false,
    },
  };

  // Apply role-specific permissions
  switch (role) {
    case 'admin':
      return {
        packages: { view: true, create: true, update: true, delete: true },
        shipments: { view: true, create: true, update: true },
        customers: { view: true, manage: true },
        reports: { view: true, generate: true },
        system: { configure: true, userManagement: true },
      };
    case 'warehouse_manager':
      return {
        ...basePermissions,
        packages: { view: true, create: true, update: true, delete: false },
        shipments: { view: true, create: true, update: true },
        customers: { view: true, manage: false },
        reports: { view: true, generate: true },
      };
    case 'processor':
    case 'group_manager':
    case 'dispatcher':
      return {
        ...basePermissions,
        packages: { view: true, create: false, update: true, delete: false },
        shipments: { view: true, create: true, update: true },
        reports: { view: true, generate: false },
      };
    default:
      return basePermissions;
  }
};
