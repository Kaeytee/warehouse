
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useWarehouseAuth } from './hooks/useWarehouseAuth';
// import { useEmailNotificationProcessor } from './hooks/useEmailNotificationProcessor'; // Disabled until email tables created
import { ThemeProvider } from './contexts/ThemeContext';
import { setupTokenMonitor } from './lib/supabase';
import Login from './app/login';
import Dashboard from './app/pages/dashboard';
import AppLayout from './components/layout/AppLayout';
import PackageIntake from './app/pages/PackageIntake/PackageIntake';
import CreateShipment from './app/pages/CreateShipment/CreateShipment';
import Delivery from './app/pages/Delivery/Delivery';
import ShipmentHistory from './app/pages/ShipmentHistory/ShipmentHistory';
import AnalysisReport from './app/pages/AnalysisReport/AnalysisReport';
import Inventory from './app/pages/Inventory/Inventory';
import About from './app/pages/About/About';
import UserManagement from './app/pages/UserManagement/UserManagement';
import Reports from './app/pages/Reports/Reports';
import RouteGuard from './components/RouteGuard';
import UnauthorizedPage from './components/UnauthorizedPage';

const LoginRoute = () => {
  const auth = useWarehouseAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

const ProtectedRoute = () => {
  const auth = useWarehouseAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <AppLayout />;
  }

  return <Navigate to="/login" replace />;
};

/**
 * App Routes Component
 * 
{{ ... }}
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes - All wrapped in AppLayout */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard - Accessible by all warehouse roles */}
        <Route
          path="/dashboard"
          element={
            <RouteGuard requiredPermission="analytics_view">
              <Dashboard />
            </RouteGuard>
          }
        />
        
        {/* Package Intake - All warehouse roles */}
        <Route 
          path="/intake" 
          element={
            <RouteGuard requiredPermission="package_intake">
              <PackageIntake />
            </RouteGuard>
          } 
        />
        
        {/* Inventory/Package Management - All warehouse roles */}
        <Route 
          path="/inventory" 
          element={
            <RouteGuard requiredPermission="package_management">
              <Inventory />
            </RouteGuard>
          } 
        />
        
        {/* Create Shipment - All warehouse roles */}
        <Route 
          path="/create-shipment" 
          element={
            <RouteGuard requiredPermission="shipment_creation">
              <CreateShipment />
            </RouteGuard>
          } 
        />
        
        {/* Delivery - Package pickup verification - All warehouse roles */}
        <Route 
          path="/delivery" 
          element={
            <RouteGuard requiredPermission="package_management">
              <Delivery />
            </RouteGuard>
          } 
        />
        
        {/* Shipment History - Admin and Superadmin only */}
        <Route 
          path="/shipments" 
          element={
            <RouteGuard requiredPermission="shipment_management">
              <ShipmentHistory />
            </RouteGuard>
          } 
        />
        
        {/* Analytics Report - Admin and Superadmin only */}
        <Route 
          path="/analytics" 
          element={
            <RouteGuard requiredPermission="analytics_report">
              <AnalysisReport />
            </RouteGuard>
          } 
        />
        
        {/* Reports - Admin and Superadmin only */}
        <Route 
          path="/reports" 
          element={
            <RouteGuard requiredPermission="reports">
              <Reports />
            </RouteGuard>
          } 
        />
        
        {/* User Management - Superadmin only */}
        <Route 
          path="/users" 
          element={
            <RouteGuard requiredPermission="user_management">
              <UserManagement />
            </RouteGuard>
          } 
        />
        
        {/* Legacy route redirects */}
        <Route path="/incoming-request" element={<Navigate to="/intake" replace />} />
        <Route path="/package-intake" element={<Navigate to="/intake" replace />} />
        <Route path="/packages" element={<Navigate to="/inventory" replace />} />
        <Route path="/shipment-history" element={<Navigate to="/shipments" replace />} />
        <Route path="/analysis-report" element={<Navigate to="/analytics" replace />} />
        <Route path="/client-management" element={<Navigate to="/users" replace />} />
        {/* About page - Public within authenticated area */}
        <Route path="/about" element={<About />} />
      </Route>
      {/* Index route - redirect based on authentication */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Catch-all route - redirect to unauthorized for unknown paths */}
      <Route
        path="*"
        element={<Navigate to="/unauthorized" replace />}
      />
    </Routes>
  );
};

/**
 * Main App Component
 * 
 * Wraps the entire application with necessary providers and routing
 */
const App = (): React.ReactElement => {
  // TEMPORARILY DISABLED: Email notification processor (email tables don't exist yet)
  // TODO: Uncomment after running sql/70_email_notification_system.sql
  // useEmailNotificationProcessor();

  // Effect to check authentication status on app load
  useEffect(() => {
    // Initialize token monitoring for robust session management
    const { data: { subscription } } = setupTokenMonitor();

    // Cleanup token monitor on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
};

export default App;
