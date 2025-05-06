import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/auth-context';

// Import your page components
import LoginPage from './pages/login-page';
import DashboardPage from './pages/dashboard-page';
import CandidatesPage from './pages/candidates-page';
import CandidateProfilePage from './pages/candidate-profile-page';
import MessagingPage from './pages/messaging-page';
import SettingsPage from './pages/settings-page';
import LinkedInExtractionPage from './pages/linkedin-extraction-page';
import MainLayout from './components/common/main-layout';

// Create a ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { checkAuth, isAuthenticated, loading } = useAuth();
  
  // Debug API availability and add direct event handlers
  useEffect(() => {
    try {
      if (window.api) {
        console.log('App: Electron API is available:', Object.keys(window.api));

        // Add a global click handler to debug clicks
        const handleGlobalClick = (e) => {
          console.log('Global click detected on:', e.target.tagName, e.target.className);
          
          // If this is a button with certain text, handle logout directly
          if (e.target.tagName === 'BUTTON' && 
              (e.target.innerText.includes('Logout') || 
               e.target.innerText.includes('logout'))) {
            console.log('Logout button detected via global handler');
            
            // Try direct logout via API
            if (window.api.clearCredentials) {
              window.api.clearCredentials()
                .then(result => {
                  console.log('Direct logout result:', result);
                  window.location.href = '#/login';
                  window.location.reload();
                })
                .catch(err => console.error('Direct logout error:', err));
            }
          }
        };
        
        // Add the global handler
        document.addEventListener('click', handleGlobalClick);
        
        // Return cleanup function
        return () => {
          document.removeEventListener('click', handleGlobalClick);
        };
      } else {
        console.warn('App: Electron API is not available');
      }
      
      // Log authentication status
      console.log('App: Auth status -', { isAuthenticated, loading });
    } catch (error) {
      console.error('Error in App initialization:', error);
    }
  }, [isAuthenticated, loading]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/candidates" element={
        <ProtectedRoute>
          <MainLayout>
            <CandidatesPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/candidates/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <CandidateProfilePage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/messaging" element={
        <ProtectedRoute>
          <MainLayout>
            <MessagingPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/linkedin-extraction" element={
        <ProtectedRoute>
          <MainLayout>
            <LinkedInExtractionPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;