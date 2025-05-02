import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import MessagingPage from './pages/MessagingPage';
import SettingsPage from './pages/SettingsPage';

// Layout components
import MainLayout from './components/common/MainLayout';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    // Show loading indicator while checking auth status
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function App() {
  const { checkAuth } = useAuth();
  
  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="candidates/:id" element={<CandidateProfilePage />} />
        <Route path="messaging" element={<MessagingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;