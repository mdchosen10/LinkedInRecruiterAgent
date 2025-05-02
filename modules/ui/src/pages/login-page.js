import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    console.log('LoginPage - checking authentication status:', isAuthenticated);
    if (isAuthenticated) {
      console.log('User is already authenticated, redirecting to dashboard');
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Attempting login with email:', email);
      
      if (!window.api) {
        console.error('API not available - cannot login');
        setError('Authentication API unavailable. Please restart the application.');
        setSubmitting(false);
        return;
      }
      
      // Call login function from auth context
      const result = await login({ email, password });
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, will redirect shortly');
        setLoginSuccess(true);
        // navigate will be triggered by useEffect when isAuthenticated changes
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle demo login (for testing)
  const handleDemoLogin = async () => {
    console.log('Demo login requested');
    setEmail('demo@example.com');
    setPassword('demo123');
    
    // Submit the form after setting demo credentials
    setTimeout(() => {
      const loginForm = document.getElementById('login-form');
      if (loginForm) loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="m-auto w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-linkedin-blue">LinkedIn Recruiter Tool</h1>
          <p className="text-gray-600 mt-2">Sign in to access your account</p>
        </div>
        
        {loginSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
            Login successful! Redirecting...
          </div>
        )}
        
        {(error || authError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error || authError}
          </div>
        )}
        
        <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your.email@example.com"
              disabled={submitting}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="********"
              disabled={submitting}
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={handleDemoLogin}
            className="text-linkedin-blue hover:underline text-sm"
            disabled={submitting}
          >
            Use demo account
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>This application connects to LinkedIn for recruitment automation.</p>
          <p className="mt-2">For support, contact your administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;