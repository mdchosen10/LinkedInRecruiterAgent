import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/auth-context';

// Icons
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  // Set error from context
  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);
  
  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required')
  });
  
  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoginError(null);
      
      try {
        // Attempt login
        const success = await login({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
          name: 'Demo User' // For demo purposes
        });
        
        if (!success) {
          setLoginError('Login failed. Please check your credentials and try again.');
        }
      } catch (err) {
        setLoginError('An unexpected error occurred. Please try again.');
        console.error('Login error:', err);
      }
    }
  });
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LinkedIn Recruiter
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your recruiting dashboard
          </p>
        </div>
        
        {/* Login form */}
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue focus:z-10 sm:text-sm ${
                  formik.touched.email && formik.errors.email ? 'border-red-500' : ''
                }`}
                placeholder="Email address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-xs mt-1 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formik.errors.email}
                </div>
              )}
            </div>
            
            {/* Password field */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue focus:z-10 sm:text-sm ${
                  formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                }`}
                placeholder="Password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-xs mt-1 flex items-center">
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                {formik.errors.password}
              </div>
            )}
          </div>
          
          {/* Remember me checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-linkedin-blue focus:ring-linkedin-blue border-gray-300 rounded"
                checked={formik.values.rememberMe}
                onChange={formik.handleChange}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#forgot-password" className="font-medium text-linkedin-blue hover:text-linkedin-dark-blue">
                Forgot your password?
              </a>
            </div>
          </div>
          
          {/* Login error message */}
          {loginError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{loginError}</h3>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-linkedin-lighter-blue group-hover:text-white" aria-hidden="true" />
              </span>
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          {/* Help text */}
          <div className="text-center text-sm text-gray-600">
            <p>For demo purposes, any email and password will work</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;