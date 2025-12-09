import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  Warehouse,
  FileText,
  DollarSign,
  Shield,
  Search,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../app/auth/hooks/useAuth';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/packages', icon: Package, label: 'Packages' },
    ];

    // Role-specific navigation items
    interface NavigationItem {
      to: string;
      icon: typeof Package;
      label: string;
    }

    const roleSpecificItems: Record<string, NavigationItem[]> = {
      transportation_manager: [
        { to: '/shipments', icon: Truck, label: 'Shipments' },
        { to: '/fleet', icon: MapPin, label: 'Fleet Management' },
        { to: '/pricing', icon: DollarSign, label: 'Pricing' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
      ],
      warehouse_manager: [
        { to: '/inventory', icon: Warehouse, label: 'Inventory' },
        { to: '/staff', icon: Users, label: 'Staff Management' },
        { to: '/operations', icon: Settings, label: 'Operations' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
      ],
      customer_service_rep: [
        { to: '/customer-lookup', icon: Search, label: 'Customer Lookup' },
        { to: '/package-release', icon: Package, label: 'Package Release' },
        { to: '/customer-communication', icon: FileText, label: 'Communications' },
      ],
      security_officer: [
        { to: '/security', icon: Shield, label: 'Security' },
        { to: '/package-release', icon: Package, label: 'Package Release' },
        { to: '/logs', icon: FileText, label: 'Security Logs' },
      ],
      order_fulfillment_specialist: [
        { to: '/orders', icon: Clock, label: 'Order Processing' },
        { to: '/picking', icon: Package, label: 'Picking & Packing' },
        { to: '/dispatch', icon: Truck, label: 'Dispatch' },
      ],
      admin: [
        { to: '/shipments', icon: Truck, label: 'Shipments' },
        { to: '/inventory', icon: Warehouse, label: 'Inventory' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      ],
      superadmin: [
        { to: '/shipments', icon: Truck, label: 'Shipments' },
        { to: '/inventory', icon: Warehouse, label: 'Inventory' },
        { to: '/users', icon: Users, label: 'User Management' },
        { to: '/reports', icon: BarChart3, label: 'Reports' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      ],
    };

    const userRole = user?.role?.toLowerCase().replace(/[_-]/g, '_') || '';
    return [
      ...baseItems,
      ...(roleSpecificItems[userRole] || [])
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="h-full flex flex-col bg-red-600 text-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-6 border-b border-red-500">
        <h1 className="text-xl font-bold">Vanguard Warehouse</h1>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-red-500">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-red-200 truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive
                  ? 'bg-red-700 text-white'
                  : 'text-red-100 hover:bg-red-500 hover:text-white'
                }`
              }
            >
              <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="p-4 border-t border-red-500 space-y-1">
        <NavLink
          to="/settings"
          onClick={() => onNavigate?.()}
          className="flex items-center px-3 py-2 text-sm font-medium text-red-100 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
