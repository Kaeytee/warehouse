/**
 * Warehouse Authentication Context
 * 
 * Provides authentication state and actions for warehouse operations
 * Supports warehouse_admin and admin roles only
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import type { WarehouseUser } from '../../../types/warehouse';

// Warehouse-specific user roles only
export type UserRole = 'warehouse_admin' | 'admin' | 'superadmin';

// User interface compatible with existing components
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Computed from firstName + lastName
  role: UserRole;
  suiteNumber?: string;
  permissions: RolePermissions;
  isActive: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'reported';
  createdAt: string;
  lastLogin?: string;
}

// Warehouse-specific permissions
export interface RolePermissions {
  dashboard: boolean;
  incomingRequests: boolean;
  createShipment: boolean;
  shipmentHistory: boolean;
  staffManagement: boolean;
  analysisReport: boolean;
  inventory: boolean;
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  hasRole: (role: UserRole) => boolean;
}

// Create the context
export const AuthContext = createContext<AuthContextType | null>(null);

// Role-based permissions configuration
export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'warehouse_admin':
      // Limited access: dashboard, intake, inventory, create-shipment only
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: false, // No access to shipment history
        staffManagement: false,
        analysisReport: false, // No access to analytics
        inventory: true,
      };
    case 'admin':
      // Full access except user management
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: true,
        staffManagement: false, // No user management for admin
        analysisReport: true,
        inventory: true,
      };
    case 'superadmin':
      // Full access to everything including user management
      return {
        dashboard: true,
        incomingRequests: true,
        createShipment: true,
        shipmentHistory: true,
        staffManagement: true, // Full user management access
        analysisReport: true,
        inventory: true,
      };
    default:
      return {
        dashboard: false,
        incomingRequests: false,
        createShipment: false,
        shipmentHistory: false,
        staffManagement: false,
        analysisReport: false,
        inventory: false,
      };
  }
};

// Transform WarehouseUser to User interface
const transformWarehouseUser = (warehouseUser: WarehouseUser): User => {
  const name = `${warehouseUser.firstName} ${warehouseUser.lastName}`;
  const permissions = getRolePermissions(warehouseUser.role);
  
  return {
    id: warehouseUser.id,
    email: warehouseUser.email,
    firstName: warehouseUser.firstName,
    lastName: warehouseUser.lastName,
    name,
    role: warehouseUser.role,
    suiteNumber: warehouseUser.suiteNumber,
    permissions,
    isActive: warehouseUser.status === 'active',
    status: warehouseUser.status,
    createdAt: warehouseUser.createdAt,
    lastLogin: undefined, // Not available in WarehouseUser
  };
};

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const warehouseAuth = useWarehouseAuth();

  // Transform warehouse user to compatible user format
  const user = warehouseAuth.user ? transformWarehouseUser(warehouseAuth.user) : null;

  // Clear error function (placeholder - warehouse auth doesn't have this)
  const clearError = () => {
    // Warehouse auth doesn't have clearError, so this is a no-op
    console.log('Clear error called');
  };

  // Has permission check
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!user || !warehouseAuth.isAuthenticated) {
      return false;
    }
    return user.permissions[permission];
  };

  // Has role check
  const hasRole = (role: UserRole): boolean => {
    return warehouseAuth.hasRole(role);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: warehouseAuth.isAuthenticated,
    isLoading: warehouseAuth.isLoading,
    error: warehouseAuth.error,
    login: warehouseAuth.signIn,
    logout: warehouseAuth.signOut,
    clearError,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
