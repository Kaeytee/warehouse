
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useWarehouseAuth } from './hooks/useWarehouseAuth';
import Login from './app/login';
import Dashboard from './app/pages/dashboard';
import AppLayout from './components/layout/AppLayout';
import IncomingRequest from './app/pages/IncomingRequest/IncomingRequest';
import CreateShipment from './app/pages/CreateShipment/CreateShipment';
import ShipmentHistory from './app/pages/ShipmentHistory/ShipmentHistory';
import AnalysisReport from './app/pages/AnalysisReport/AnalysisReport';
import Inventory from './app/pages/Inventory/Inventory';
import About from './app/pages/About/About';
import RouteGuard from './components/RouteGuard';
import UnauthorizedPage from './components/UnauthorizedPage';
// import GroupManagementDashboard from './app/pages/GroupManagement/GroupManagementDashboard'; // Removed from routing

/**
 * Login Route Component
 * 
 * Redirects authenticated users to dashboard, otherwise shows login page
 */
const LoginRoute = (): React.ReactElement => {
  const { isAuthenticated, isLoading } = useWarehouseAuth();

  // Show loading during authentication check
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>;
  }

  // Only redirect when loading is complete AND user is authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

/**
 * Protected Route Component
 * 
 * This component handles protected routes that require authentication.
 * It checks if the user is authenticated and redirects to login if not.
 */

const ProtectedRoute = (): React.ReactElement => {
  const { isAuthenticated, isLoading } = useWarehouseAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppLayout />;
};

/**
 * App Routes Component
 * 
 * Contains all the routing logic with role-based protection
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
              <IncomingRequest />
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
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports</h1>
                <p className="text-gray-600">Advanced reporting functionality coming soon...</p>
              </div>
            </RouteGuard>
          } 
        />
        
        {/* User Management - Superadmin only */}
        <Route 
          path="/users" 
          element={
            <RouteGuard requiredPermission="user_management">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
                <p className="text-gray-600">User management functionality coming soon...</p>
              </div>
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
  // Effect to check authentication status on app load
  useEffect(() => {
    // Initialize any global settings or analytics here
    console.log('Vanguard Cargo Warehouse App - Role-Based Access Control Enabled');
  }, []);
  
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
