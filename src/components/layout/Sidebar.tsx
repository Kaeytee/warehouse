import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';
import { getAllowedNavItems, getRoleDisplayName } from '../../utils/permissions';
import { supabase } from '../../lib/supabase';
import { 
  FiGrid, 
  FiFileText, 
  FiClock, 
  FiBarChart2, 
  FiDatabase,
  FiLogOut,
  FiX,
  FiPackage,
  FiLoader,
  FiSend,
  FiUsers,
  FiHome,
  FiBox,
  FiBarChart,
  FiTruck,
  FiDownload
} from 'react-icons/fi';

/**
 * Warehouse Sidebar Component with Role-Based Access Control
 * 
 * This component renders the warehouse application sidebar with navigation links
 * filtered based on the authenticated user's role and permissions.
 * Supports superadmin, admin, and warehouse_admin roles.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Mobile sidebar open state
 * @param {function} props.onToggle - Mobile sidebar toggle function
 * @returns {React.ReactElement} The Sidebar component
 */
interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

interface NavigationItem {
  path: string;
  name: string;
  icon: string;
}

interface PendingTasks {
  incomingRequests: number;
  pendingInventory: number;
  urgentTasks: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onToggle }) => {
  const navigate = useNavigate();
  const { isAuthenticated, role, email, displayName } = useWarehouseAuth();
  
  // Create user object for compatibility
  const user = isAuthenticated ? {
    email,
    role,
    name: displayName || 'Administrator',
    fullName: displayName || 'Administrator'
  } : null;
  
  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTasks>({
    incomingRequests: 0,
    pendingInventory: 0,
    urgentTasks: 0,
  });
  const [, setTasksLoading] = useState(true);

  // Get navigation items based on user role permissions (memoized to prevent flickering)
  const navigationItems = useMemo(() => {
    return user ? getAllowedNavItems(user.role) : [];
  }, [user?.role]);
  
  // Icon mapping for navigation items (memoized to prevent re-creation)
  const getIcon = useMemo(() => {
    const iconMap = {
      'FiHome': <FiHome size={20} />,
      'FiDownload': <FiDownload size={20} />,
      'FiPackage': <FiPackage size={20} />,
      'FiBox': <FiBox size={20} />,
      'FiSend': <FiSend size={20} />,
      'FiTruck': <FiTruck size={20} />,
      'FiBarChart': <FiBarChart size={20} />,
      'FiUsers': <FiUsers size={20} />,
      'FiFileText': <FiFileText size={20} />,
      'FiGrid': <FiGrid size={20} />,
      'FiDatabase': <FiDatabase size={20} />,
      'FiClock': <FiClock size={20} />,
      'FiBarChart2': <FiBarChart2 size={20} />
    };
    
    return (iconName: string) => {
      return iconMap[iconName as keyof typeof iconMap] || <FiGrid size={20} />;
    };
  }, []);

  // Mock function to fetch pending tasks (memoized to prevent re-creation)
  const fetchPendingTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on user role
      const mockTasks: PendingTasks = {
        incomingRequests: 0, // Removed badge number
        pendingInventory: 0, // Removed badge number
        urgentTasks: 0, // Removed random badge
      };
      
      setPendingTasks(mockTasks);
    } catch (error) {
      console.error('Failed to fetch pending tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch pending tasks when user is authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchPendingTasks();
    }
  }, [user?.role, isAuthenticated, fetchPendingTasks]);

  /**
   * Handle user logout with confirmation
   */
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Simulate logout delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logout();
      navigate('/login');
      
      // Close mobile menu if open
      if (onToggle) {
        onToggle();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle navigation click on mobile
   */
  const handleNavClick = () => {
    if (onToggle && window.innerWidth < 768) {
      onToggle();
    }
  };

  /**
   * Navigation link item component
   */
  const NavItem: React.FC<{ item: NavigationItem; badge?: number }> = ({ item, badge }) => (
    <NavLink
      to={item.path}
      onClick={handleNavClick}
      className={({ isActive }) => 
        `flex items-center justify-between px-6 py-4 text-white hover:bg-red-900 transition-colors duration-200 group ${
          isActive ? 'bg-red-500 border-l-4 border-white' : ''
        }`
      }
    >
      <div className="flex items-center">
        <span className="mr-4 text-xl">{getIcon(item.icon)}</span>
        <span className="font-medium">{item.name}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );

  /**
   * Role badge component
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'warehouse_admin': return 'bg-red-600';
      case 'admin': return 'bg-red-600';
      case 'super_admin': return 'bg-red-600';
      case 'superadmin': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  // Don't render sidebar if not authenticated (let parent handle loading)
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const sidebarContent = (
    <>
      {/* Logo section */}
      <div className="px-6 py-6 bg-transparent">
        <h1 className="text-xl font-bold text-white tracking-wide">Vanguard Cargo</h1>
      </div>

      {/* User role indicator */}
      <div className="px-6 py-3 border-b border-red-800">
        <div className="flex items-center justify-between">
          <span className="text-red-200 text-sm">Logged in as:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getRoleBadgeColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
        </div>
        <div className="text-white text-sm font-medium mt-1 truncate" title={user.name}>
          {user.name}
        </div>
      </div>
      
      {/* Main navigation */}
      <nav className="flex-1 py-6">
        <div>
          {navigationItems.length > 0 ? (
            navigationItems.map((item, index) => {
              // Add badges for specific items
              let badge = undefined;
              if (item.path === '/intake') {
                badge = pendingTasks.incomingRequests;
              } else if (item.path === '/inventory') {
                badge = pendingTasks.pendingInventory;
              }
              
              return (
                <NavItem key={index} item={item} badge={badge} />
              );
            })
          ) : (
            <div className="px-6 py-4 text-red-200 text-sm">
              No accessible features for your role.
            </div>
          )}
        </div>
        
        
        
        {/* Logout button */}
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center w-full px-6 py-4 text-white hover:bg-red-900 transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-4 text-xl">
              {isLoading ? <FiLoader className="animate-spin" /> : <FiLogOut size={20} />}
            </span>
            <span className="font-medium">
              {isLoading ? 'Logging out...' : 'Log Out'}
            </span>
          </button>
        </div>
      </nav>
      
      {/* User profile section */}
      <div className="p-6 mt-auto border-t border-red-800">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-900 font-bold text-lg">
            {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate" title={user.fullName}>
              {user.fullName || 'User'}
            </p>
            <p className="text-red-200 text-xs mt-1 truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-red-700 h-full overflow-y-auto">
        {sidebarContent}
      </aside>
      
      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-64 h-full bg-red-700 transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onToggle}
            className="text-white hover:bg-red-800 p-2 rounded-lg transition-colors duration-200"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="flex flex-col h-full -mt-16">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;