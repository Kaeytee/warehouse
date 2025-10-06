import React, { useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useEffect } from 'react';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';
import { supabase } from '../../config/supabase';

/**
 * AppNavbar Component
 * 
 * This component renders the top navigation bar for the application.
 * It includes a notifications icon and user welcome message.
 * 
 * @returns {React.ReactElement} The AppNavbar component
 */
const AppNavbar: React.FC = () => {
  // Get user information from warehouse auth
  const { user } = useWarehouseAuth();
  // State for unread notifications count
  const [notificationCount, setNotificationCount] = useState<number>(0);
  
  // Fetch unread notifications count for the current user
  useEffect(() => {
    let isMounted = true; // safety flag to prevent state updates after unmount

    const fetchUnreadCount = async () => {
      try {
        if (!user?.id) {
          if (isMounted) setNotificationCount(0);
          return;
        }

        // Query Supabase for unread notifications count for this user
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) {
          console.error('Failed to fetch notifications count:', error);
          if (isMounted) setNotificationCount(0);
          return;
        }

        if (isMounted) setNotificationCount(count ?? 0);
      } catch (err) {
        console.error('Unexpected error fetching notifications count:', err);
        if (isMounted) setNotificationCount(0);
      }
    };

    // Initial load
    fetchUnreadCount();

    // Realtime subscription to notifications table
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        }, 
        (payload) => {
          console.log('Notification change received:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-end">
          {/* Right side items */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <div className="relative">
              <button className="flex items-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200">
                <FiBell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* User welcome */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Welcome, {user?.fullName || user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;

