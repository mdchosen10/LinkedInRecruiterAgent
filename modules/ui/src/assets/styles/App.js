import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/auth-context';

// Pages
import LoginPage from './pages/login-page';
import DashboardPage from './pages/dashboard-page';
import CandidatesPage from './pages/candidates-page'; // Import the missing CandidatesPage
import CandidateProfilePage from './pages/candidate-profile-page';
import MessagingPage from './pages/messaging-page';
import SettingsPage from './pages/settings-page';

// Layout components
import MainLayout from './components/common/main-layout';

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
        <Route path="candidates" element={<CandidatesPage />} /> {/* Add the candidates listing route */}
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