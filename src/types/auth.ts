/**
 * Authentication and Authorization Types
 * Defines user roles, permissions, and authentication state
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  permissions: RolePermissions;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 
  | 'admin'
  | 'warehouse_manager'
  | 'processor'
  | 'group_manager'
  | 'dispatcher'
  | 'driver'
  | 'delivery_agent'
  | 'worker'
  | 'specialist';

export type WarehouseRole = 
  | 'admin'
  | 'warehouse_manager'
  | 'processor'
  | 'group_manager'
  | 'dispatcher'
  | 'driver'
  | 'delivery_agent'
  | 'worker'
  | 'specialist';

export interface RolePermissions {
  packages: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  shipments: {
    view: boolean;
    create: boolean;
    update: boolean;
  };
  customers: {
    view: boolean;
    manage: boolean;
  };
  reports: {
    view: boolean;
    generate: boolean;
  };
  system: {
    configure: boolean;
    userManagement: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: RolePermissions | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PermissionCheck {
  resource: keyof RolePermissions;
  action: string;
  required: boolean;
}
