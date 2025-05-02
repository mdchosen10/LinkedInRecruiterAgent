import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const LinkedInSettingsForm = ({ formik, saving }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">LinkedIn API Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your LinkedIn API credentials to connect with the LinkedIn Recruiter platform.
        </p>
      </div>
      
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-6">
          {/* Client ID */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
              Client ID
            </label>
            <div className="mt-1 relative">
              <input
                id="clientId"
                name="clientId"
                type="text"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.clientId && formik.errors.clientId
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                placeholder="Your LinkedIn API Client ID"
                value={formik.values.clientId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.clientId && formik.errors.clientId && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.clientId && formik.errors.clientId && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.clientId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              The client ID provided by LinkedIn when you registered your application.
            </p>
          </div>
          
          {/* Client Secret */}
          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700">
              Client Secret
            </label>
            <div className="mt-1 relative">
              <input
                id="clientSecret"
                name="clientSecret"
                type="password"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.clientSecret && formik.errors.clientSecret
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                placeholder="Your LinkedIn API Client Secret"
                value={formik.values.clientSecret}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.clientSecret && formik.errors.clientSecret && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.clientSecret && formik.errors.clientSecret && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.clientSecret}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              The client secret provided by LinkedIn. Keep this value secure and never share it.
            </p>
          </div>
          
          {/* Redirect URI */}
          <div>
            <label htmlFor="redirectUri" className="block text-sm font-medium text-gray-700">
              Redirect URI
            </label>
            <div className="mt-1 relative">
              <input
                id="redirectUri"
                name="redirectUri"
                type="text"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.redirectUri && formik.errors.redirectUri
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                placeholder="https://your-app.com/auth/callback"
                value={formik.values.redirectUri}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.redirectUri && formik.errors.redirectUri && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.redirectUri && formik.errors.redirectUri && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.redirectUri}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              The URI where LinkedIn will redirect after authentication. Must match what you registered with LinkedIn.
            </p>
          </div>
          
          {/* API Scopes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Required API Scopes
            </label>
            <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>r_emailaddress</li>
                <li>r_liteprofile</li>
                <li>r_fullprofile</li>
                <li>w_member_social</li>
                <li>rw_organization_admin</li>
              </ul>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Make sure your LinkedIn application has been approved for these permission scopes.
            </p>
          </div>
          
          {/* API Testing */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Test API Connection</h3>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              Test Connection
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Test your API credentials to ensure they're working correctly.
            </p>
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formik.isSubmitting || saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LinkedInSettingsForm;