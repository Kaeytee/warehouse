/**
 * Theme Context - Dynamic Color Theme Management
 * Provides global theme state that changes based on current report type or page context
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @created 2025-10-06
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Theme color interface
export interface ThemeColors {
  primary: string;           // bg-red-500
  primaryDark: string;       // bg-red-600  
  gradient: string;          // from-red-500 to-red-600
  light: string;             // bg-red-50
  text: string;              // text-red-600
  border: string;            // border-red-200
  hover: string;             // hover:bg-red-700
  ring: string;              // ring-red-500
}

// Available theme types
export type ThemeType = 'shipments' | 'packages' | 'users' | 'default';

// Theme context interface
interface ThemeContextType {
  currentTheme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  getThemeColors: (theme: ThemeType) => ThemeColors;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Get theme colors based on theme type
 */
export const getThemeColors = (theme: ThemeType): ThemeColors => {
  switch (theme) {
    case 'shipments':
      return {
        primary: 'bg-red-500',
        primaryDark: 'bg-red-600',
        gradient: 'from-red-500 to-red-600',
        light: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        hover: 'hover:bg-red-700',
        ring: 'ring-red-500'
      };
    case 'packages':
      return {
        primary: 'bg-purple-500',
        primaryDark: 'bg-purple-600',
        gradient: 'from-purple-500 to-purple-600',
        light: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-700',
        ring: 'ring-purple-500'
      };
    case 'users':
      return {
        primary: 'bg-emerald-500',
        primaryDark: 'bg-emerald-600',
        gradient: 'from-emerald-500 to-emerald-600',
        light: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-700',
        ring: 'ring-emerald-500'
      };
    default:
      return {
        primary: 'bg-red-500',
        primaryDark: 'bg-red-600',
        gradient: 'from-red-500 to-red-600',
        light: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        hover: 'hover:bg-red-700',
        ring: 'ring-red-500'
      };
  }
};

/**
 * Theme Provider Component
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('shipments'); // Default to red theme
  
  const setTheme = (theme: ThemeType) => {
    setCurrentTheme(theme);
  };

  const colors = getThemeColors(currentTheme);

  const value: ThemeContextType = {
    currentTheme,
    colors,
    setTheme,
    getThemeColors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get theme colors for a specific theme type
 */
export const useThemeColors = (theme?: ThemeType): ThemeColors => {
  const { colors, getThemeColors } = useTheme();
  return theme ? getThemeColors(theme) : colors;
};
