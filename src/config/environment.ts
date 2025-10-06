/**
 * Environment Configuration
 * 
 * Central configuration management for different environments
 * Handles seamless switching between development and production
 */

export interface EnvironmentConfig {
  APP_ENV: 'development' | 'production' | 'staging';
  API_BASE_URL: string;
  APP_NAME: string;
  DEBUG_MODE: boolean;
  MOCK_AUTH: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_DEVTOOLS: boolean;
  HOT_RELOAD: boolean;
  ENABLE_HTTPS: boolean;
  SECURE_COOKIES: boolean;
}

/**
 * Get environment configuration based on current environment
 */
export const getEnvConfig = (): EnvironmentConfig => {
  return {
    APP_ENV: (import.meta.env.VITE_APP_ENV as EnvironmentConfig['APP_ENV']) || 'development',
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Vanguard Warehouse',
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
    MOCK_AUTH: import.meta.env.VITE_MOCK_AUTH === 'true',
    LOG_LEVEL: (import.meta.env.VITE_LOG_LEVEL as EnvironmentConfig['LOG_LEVEL']) || 'info',
    ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
    HOT_RELOAD: import.meta.env.VITE_HOT_RELOAD === 'true',
    ENABLE_HTTPS: import.meta.env.VITE_ENABLE_HTTPS === 'true',
    SECURE_COOKIES: import.meta.env.VITE_SECURE_COOKIES === 'true',
  };
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvConfig().APP_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvConfig().APP_ENV === 'production';
};

/**
 * Get API endpoint URL
 */
export const getApiUrl = (endpoint: string = ''): string => {
  const config = getEnvConfig();
  const baseUrl = config.API_BASE_URL.endsWith('/') 
    ? config.API_BASE_URL.slice(0, -1) 
    : config.API_BASE_URL;
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Conditional logging based on environment
 */
export const logger = {
  debug: (...args: unknown[]) => {
    const config = getEnvConfig();
    if (config.DEBUG_MODE && ['debug'].includes(config.LOG_LEVEL)) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    const config = getEnvConfig();
    if (['debug', 'info'].includes(config.LOG_LEVEL)) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    const config = getEnvConfig();
    if (['debug', 'info', 'warn'].includes(config.LOG_LEVEL)) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    const config = getEnvConfig();
    if (['debug', 'info', 'warn', 'error'].includes(config.LOG_LEVEL)) {
      console.error('[ERROR]', ...args);
    }
  },
};

// Export the current environment configuration
export const envConfig = getEnvConfig();

// Log current environment on load (only in development)
if (isDevelopment()) {
  logger.info('Environment loaded:', envConfig);
}
