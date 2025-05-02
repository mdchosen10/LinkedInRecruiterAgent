import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const AccountSettings = ({ currentUser, onLogout, onSave, setSaving, saving }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    company: Yup.string().required('Company name is required'),
    jobTitle: Yup.string().required('Job title is required'),
  });
  
  // Initialize form with current user data
  const formik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      company: currentUser?.company || 'Your Company',
      jobTitle: currentUser?.jobTitle || 'Recruiter',
      profilePhoto: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Show success message
        onSave();
      } catch (error) {
        console.error('Error saving account settings:', error);
        alert('Failed to save account settings. Please try again.');
      } finally {
        setSaving(false);
      }
    },
  });
  
  // Handle file selection for profile photo
  const handleFileChange = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      formik.setFieldValue('profilePhoto', file);
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account information and preferences
        </p>
      </div>
      
      <form onSubmit={formik.handleSubmit}>
        <div className="space-y-6">
          {/* Profile photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
            <div className="mt-2 flex items-center">
              <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                {formik.values.profilePhoto ? (
                  <img
                    src={URL.createObjectURL(formik.values.profilePhoto)}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : currentUser?.photo ? (
                  <img
                    src={currentUser.photo}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </span>
              <button
                type="button"
                className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
                onClick={() => document.getElementById('file-upload').click()}
              >
                Change
              </button>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1 relative">
              <input
                id="name"
                name="name"
                type="text"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.name && formik.errors.name
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.name}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
            )}
          </div>
          
          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <div className="mt-1 relative">
              <input
                id="company"
                name="company"
                type="text"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.company && formik.errors.company
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                value={formik.values.company}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.company && formik.errors.company && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.company && formik.errors.company && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.company}</p>
            )}
          </div>
          
          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <div className="mt-1 relative">
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                className={`shadow-sm block w-full sm:text-sm rounded-md ${
                  formik.touched.jobTitle && formik.errors.jobTitle
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-linkedin-blue focus:border-linkedin-blue'
                }`}
                value={formik.values.jobTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.jobTitle && formik.errors.jobTitle && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {formik.touched.jobTitle && formik.errors.jobTitle && (
              <p className="mt-2 text-sm text-red-600">{formik.errors.jobTitle}</p>
            )}
          </div>
          
          {/* Password section */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Password</h3>
            <p className="mt-1 text-sm text-gray-500">
              Change your password to keep your account secure
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
              >
                Change Password
              </button>
            </div>
          </div>
          
          {/* Submit and logout buttons */}
          <div className="flex justify-between">
            <div>
              <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
            <div>
              <button
                type="submit"
                disabled={formik.isSubmitting || saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Logout confirmation dialog */}
      {showConfirmation && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Logout Confirmation
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to log out? You will need to log in again to access your account.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-linkedin-blue text-base font-medium text-white hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue sm:col-start-2 sm:text-sm"
                  onClick={onLogout}
                >
                  Logout
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white                   text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;