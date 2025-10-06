import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppNavbar from './AppNavbar';
import { FiMenu } from 'react-icons/fi';

/**
 * AppLayout Component
 * 
 * This component serves as the main layout container for protected routes.
 * It includes the sidebar, top navigation bar, and content area.
 * The content area renders child routes via the Outlet component from React Router.
 * Fully responsive with mobile sidebar functionality.
 * 
 * @returns {React.ReactElement} The AppLayout component
 */
const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Toggle sidebar visibility on mobile
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Close sidebar when screen size changes to desktop
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Close sidebar when clicking outside on mobile
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isSidebarOpen && !target.closest('aside') && !target.closest('[data-mobile-menu-button]')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100 font-roboto">
      {/* Sidebar component - responsive */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content area - takes remaining width */}
      <div className="flex flex-col flex-1 overflow-hidden w-full md:w-auto">
        {/* Mobile menu button */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center">
          <button
            onClick={toggleSidebar}
            data-mobile-menu-button
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">Vanguard Cargo.</h1>
        </div>
        
        {/* Top navigation bar - hidden on mobile or integrated above */}
        <div className="hidden md:block">
          <AppNavbar />
        </div>
        
        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 ">
          <div className="max-w-7xl mx-auto">
            {/* Render child routes - authentication is handled at ProtectedRoute level */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;