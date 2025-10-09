import { useState, useEffect } from 'react';
import { BsPerson, BsLock } from 'react-icons/bs';
import { useWarehouseAuth } from '../hooks/useWarehouseAuth';
import { WarehouseAuthService } from '../services/warehouseAuthService';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import image from '../assets/logo.png';

/**
 * Meta-Level Login Component - Email Pattern Based Authentication
 */
const Login = () => {
  const { isAuthenticated, isLoading: authLoading } = useWarehouseAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated (hook will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }
    
    // Pre-validate email pattern (Meta-style)
    const role = WarehouseAuthService.determineUserRole(email);
    if (!WarehouseAuthService.isAuthorizedRole(role)) {
      setLocalError('🚫 Access Denied');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Attempt Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        // Log failed login attempt
        await supabase.rpc('log_auth_event', {
          p_event_type: 'login_failed',
          p_user_id: null,
          p_user_email: email.trim().toLowerCase(),
          p_user_role: null,
          p_session_id: null,
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_status: 'failure',
          p_details: null,
          p_error_message: error.message
        });
        
        setLocalError('🚫 Access Denied');
        setIsLoading(false);
        return;
      }
      
      if (!data.user) {
        setLocalError('🚫 Access Denied');
        setIsLoading(false);
        return;
      }
      
      // Log successful login
      await supabase.rpc('log_auth_event', {
        p_event_type: 'login_success',
        p_user_id: data.user.id,
        p_user_email: email.trim().toLowerCase(),
        p_user_role: role,
        p_session_id: data.session?.access_token?.substring(0, 20) || null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_status: 'success',
        p_details: null,
        p_error_message: null
      });
      
      // Update user's last login timestamp
      await supabase.rpc('update_user_last_login', {
        p_user_id: data.user.id,
        p_ip_address: null
      });
      
      // Success! The useWarehouseAuth hook will handle the rest
      
    } catch (err) {
      setLocalError('🚫 Access Denied');
      setIsLoading(false);
    }
  };

  return (
    // Main container with full viewport height and custom background
    <div className="min-h-screen w-full  relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorative elements matching the exact design */}
      {/* Top large ellipse - positioned at top with exact dimensions */}
      <div 
        className="absolute bg-gradient-to-br from-red-700 to-red-900 rounded-full"
        style={{
          width: '120%',
          height: '110%',
          flexShrink: 0,
          bottom: '350px',
          left: '-40px',
          transform: 'rotate(15deg)'
        }}>
      </div>
      
    
      
      {/* Bottom left curved accent to match the design flow */}
      <div 
        className="absolute bg-gradient-to-tr from-red-900 to-red-800 rounded-full"
        style={{
          width: '500px',
          height: '500px',
          bottom: '-250px',
          left: '-250px',
          opacity: 0.8,
          transform: 'rotate(-15deg)'
        }}>
      </div>
      {/* Centered card container - positioned above background elements */}
      <div className="relative z-10 w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left side - Image container */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="w-full h-full bg-white flex items-center justify-center">
            {/* Container ship illustration */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={image}
                alt="Container ship at port with cranes"
                className="w-full h-full object-cover rounded-l-3xl"
              />
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            {/* Logo and Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-700 mb-4">Vanguard Cargo</h1>
              <p className="text-gray-400 text-lg font-medium">Warehouse Management System</p>
              <div className="mt-2 text-xs text-gray-500">
                <p>✅ admin@vanguardcargo.org (superadmin)</p>
                <p>✅ admin@*, manager@*, warehouse@* (authorized)</p>
                <p>❌ client emails (unauthorized)</p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <BsPerson className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 pr-12 py-4 bg-gray-50 border-0 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white focus:shadow-lg transition-all duration-200"
                  placeholder="Enter your work email"
                  autoComplete="username"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <BsLock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 pr-12 py-4 bg-gray-50 border-0 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white focus:shadow-lg transition-all duration-200"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {/* Error message display */}
              {localError && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800 mt-2 mb-4 animate-pulse">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-bold">{localError}</span>
                  </div>
                </div>
              )}
              

              
              {/* Login Button with Loading State */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={`w-full bg-red-700 text-white py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg flex items-center justify-center ${isLoading ? 'opacity-90 cursor-not-allowed' : 'hover:bg-red-800 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;