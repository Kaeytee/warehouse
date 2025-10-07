import React from 'react';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';

/**
 * AppNavbar Component
 * 
 * This component renders the top navigation bar for the application.
 * It includes user welcome message and profile information.
 * 
 * @returns {React.ReactElement} The AppNavbar component
 */
const AppNavbar: React.FC = () => {
  // Get user information from warehouse auth
  const { displayName } = useWarehouseAuth();
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-end">
          {/* User welcome */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
              {displayName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Welcome, {displayName || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;

