import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Create the context
const AuthContext = createContext(null);

// Create provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    console.log('Starting auth check...');
    setLoading(true);
    try {
      if (!window.api || !window.api.getCredentials) {
        console.warn('API not available or missing getCredentials - treating as unauthenticated');
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }

      console.log('Calling getCredentials...');
      const { success, credentials } = await window.api.getCredentials();
      console.log('getCredentials result:', { success, credentials });
      
      if (success && credentials) {
        console.log('Authentication successful, setting user:', credentials);
        setCurrentUser(credentials);
        setIsAuthenticated(true);
      } else {
        console.log('No valid credentials found');
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to verify authentication status.');
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      console.log('Auth check complete, authenticated:', isAuthenticated);
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    console.log('Attempting login with credentials:', { ...credentials, password: '[REDACTED]' });
    setError(null);
    
    try {
      if (!window.api || !window.api.saveCredentials) {
        console.error('API not available or missing saveCredentials');
        setError('Authentication API unavailable. Please restart the application.');
        return { success: false, error: 'API unavailable' };
      }
      
      // Save credentials to secure storage
      const result = await window.api.saveCredentials(credentials);
      console.log('saveCredentials result:', result);
      
      if (result.success) {
        // Refresh authentication state
        await checkAuth();
        return { success: true };
      } else {
        setError(result.error || 'Authentication failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred during login.');
      return { success: false, error: err.message };
    }
  };

  // Logout function
  const logout = async () => {
    console.log('Logging out...');
    try {
      if (!window.api || !window.api.clearCredentials) {
        console.error('API not available or missing clearCredentials');
        setError('Logout API unavailable. Please restart the application.');
        return { success: false, error: 'API unavailable' };
      }
      
      // Clear credentials from secure storage
      const result = await window.api.clearCredentials();
      console.log('clearCredentials result:', result);
      
      // Reset auth state regardless of API result
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      
      // Still reset auth state even if API fails
      setCurrentUser(null);
      setIsAuthenticated(false);
      
      return { success: false, error: err.message };
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    console.log('AuthProvider mounted, checking authentication...');
    checkAuth();
  }, [checkAuth]);

  // Create context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};