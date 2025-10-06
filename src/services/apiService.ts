/**
 * API Service Layer
 * 
 * Handles API communication with automatic environment switching
 * Provides seamless transition from mock data to real API
 */

import { getApiUrl, isProduction, isDevelopment, logger } from '../config/environment';
import type { User, UserRole, RolePermissions } from '../app/auth/contexts/AuthContext';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  employeeId: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

/**
 * Base API client with automatic environment handling
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      logger.debug('API Request:', { url, options });

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      logger.debug('API Response:', data);

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      logger.error('API Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

/**
 * Authentication API service
 */
export class AuthApiService {
  private apiClient: ApiClient;

  // Mock data for development (should match AuthContext)
  private readonly MOCK_USERS: Record<string, { role: UserRole; name: string; department: string; password: string }> = {
    // warehouse_admin Role - 3 employees
    '1234567890': { role: 'warehouse_admin', name: 'John Michael Doe', department: 'Warehouse Operations', password: 'work01' },
    '2345678901': { role: 'warehouse_admin', name: 'Maria Elena Santos', department: 'Warehouse Operations', password: 'work02' },
    '3456789012': { role: 'warehouse_admin', name: 'David Chen Wang', department: 'Warehouse Operations', password: 'work03' },
    
    // admin Role - 3 employees
    '4567890123': { role: 'admin', name: 'Sarah Jane Smith', department: 'Inventory Management', password: 'inv001' },
    '5678901234': { role: 'admin', name: 'Ahmed Hassan Ali', department: 'Inventory Management', password: 'inv002' },
    '6789012345': { role: 'admin', name: 'Emily Rose Johnson', department: 'Inventory Management', password: 'inv003' },
    
    // superadmin Role - 4 employees  
    '7890123456': { role: 'superadmin', name: 'Alice Katherine Brown', department: 'Warehouse Management', password: 'mgr001' },
    '8901234567': { role: 'superadmin', name: 'Robert James Wilson', department: 'Warehouse Management', password: 'mgr002' },
    '9012345678': { role: 'superadmin', name: 'Jennifer Michelle Davis', department: 'Warehouse Management', password: 'mgr003' },
    '0123456789': { role: 'superadmin', name: 'Carlos Eduardo Rodriguez', department: 'Warehouse Management', password: 'mgr004' },
  };

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get role permissions (should match AuthContext)
   */
  private getRolePermissions(role: UserRole): RolePermissions {
    switch (role) {
      case 'warehouse_admin':
        return {
          dashboard: true,
          incomingRequests: true,
          createShipment: false,
          shipmentHistory: true,
          staffManagement: false,
          analysisReport: false,
          inventory: true,
        };
      case 'admin':
        return {
          dashboard: true,
          incomingRequests: false,
          createShipment: false,
          shipmentHistory: true,
          staffManagement: false,
          analysisReport: true,
          inventory: true,
        };
      case 'superadmin':
        return {
          dashboard: true,
          incomingRequests: true,
          createShipment: true,
          shipmentHistory: true,
          staffManagement: true,
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
  }

  /**
   * Login user with automatic environment handling
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    // In production, use real API
    if (isProduction()) {
      return this.apiClient.post<LoginResponse>('/auth/login', credentials);
    }

    // In development, you can choose to use real API or mock
    if (isDevelopment()) {
      // Check if we should use mock data
      const useMock = import.meta.env.VITE_MOCK_AUTH === 'true';
      
      if (useMock) {
        return this.mockLogin(credentials);
      } else {
        // Use real API in development
        return this.apiClient.post<LoginResponse>('/auth/login', credentials);
      }
    }

    // Fallback to mock
    return this.mockLogin(credentials);
  }

  /**
   * Mock login for development/testing
   */
  private async mockLogin(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    try {
      // Validate employee ID format
      if (!/^\d{10}$/.test(credentials.employeeId)) {
        throw new Error('Employee ID must be 10 digits');
      }
      
      // Validate password format
      if (credentials.password.length !== 6) {
        throw new Error('Password must be 6 characters');
      }
      
      // Check if user exists in mock data
      const userData = this.MOCK_USERS[credentials.employeeId];
      
      if (!userData || credentials.password !== userData.password) {
        throw new Error('Invalid employee ID or password');
      }
      
      const permissions = this.getRolePermissions(userData.role);
      
      const token = `jwt-${userData.role.toLowerCase()}-${credentials.employeeId}`;
      
      const user: User = {
        id: `emp_${credentials.employeeId}`,
        email: `${credentials.employeeId}@Vanguard-cargo.com`,
        firstName: userData.name.split(' ')[0] || '',
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        name: userData.name,
        role: userData.role,
        permissions,
        isActive: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      return {
        success: true,
        data: {
          user,
          token: token,
          refreshToken: `refresh-${token}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<ApiResponse<void>> {
    if (isProduction() || !import.meta.env.VITE_MOCK_AUTH) {
      return this.apiClient.post<void>('/auth/logout', {}, token);
    }

    // Mock logout
    return { success: true };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    if (isProduction() || !import.meta.env.VITE_MOCK_AUTH) {
      return this.apiClient.post<{ token: string }>('/auth/refresh', { refreshToken });
    }

    // Mock refresh
    return {
      success: true,
      data: { token: `refreshed-${Date.now()}` },
    };
  }
}

// Export singleton instance
export const authApi = new AuthApiService();
export const apiClient = new ApiClient();
