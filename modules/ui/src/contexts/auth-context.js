import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Check if user is authenticated (via electron-store)
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { success, credentials } = await window.api.getCredentials();
      
      if (success && credentials) {
        setCurrentUser(credentials);
        setIsAuthenticated(true);
      } else {
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
    }
  }, []);
  
  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      // For demonstration, we'll just store credentials securely
      // In production, you'd validate these credentials with LinkedIn API first
      const { success } = await window.api.saveCredentials(credentials);
      
      if (success) {
        setCurrentUser(credentials);
        setIsAuthenticated(true);
        navigate('/');
        return true;
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      await window.api.clearCredentials();
      setCurrentUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear any auth errors
  const clearError = () => setError(null);
  
  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    checkAuth,
    login,
    logout,
    clearError
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};