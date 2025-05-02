import React, { useState } from 'react';
import { useData } from '../contexts/data-context';
import { useAuth } from '../contexts/auth-context';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Components
import EvaluationCriteriaSettings from '../components/settings/evaluation-criteria-settings';
import LinkedInSettingsForm from '../components/settings/linkedin-settings-form';
import NotificationSettings from '../components/settings/notifcation-settings';
import AccountSettings from '../components/settings/account-settings';

// Icons
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { evaluationCriteria, updateEvaluationCriteria } = useData();
  const { currentUser, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('evaluationCriteria');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Tabs configuration
  const tabs = [
    { id: 'evaluationCriteria', name: 'Evaluation Criteria' },
    { id: 'linkedInSettings', name: 'LinkedIn API Settings' },
    { id: 'notifications', name: 'Notification Settings' },
    { id: 'account', name: 'Account Settings' }
  ];
  
  // Handle evaluation criteria update
  const handleCriteriaUpdate = async (updatedCriteria) => {
    setSaving(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      updateEvaluationCriteria(updatedCriteria);
      showSavedMessage();
    } catch (error) {
      console.error('Error updating criteria:', error);
      alert('Failed to update evaluation criteria');
    } finally {
      setSaving(false);
    }
  };
  
  // Show saved message
  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };
  
  // LinkedIn settings form schema
  const linkedInSettingsSchema = Yup.object({
    clientId: Yup.string().required('Client ID is required'),
    clientSecret: Yup.string().required('Client Secret is required'),
    redirectUri: Yup.string().url('Must be a valid URL').required('Redirect URI is required'),
  });
  
  // LinkedIn settings form
  const linkedInSettingsForm = useFormik({
    initialValues: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
    },
    validationSchema: linkedInSettingsSchema,
    onSubmit: async (values) => {
      setSaving(true);
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('LinkedIn settings saved:', values);
        showSavedMessage();
      } catch (error) {
        console.error('Error saving LinkedIn settings:', error);
        alert('Failed to save LinkedIn settings');
      } finally {
        setSaving(false);
      }
    },
  });
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your application preferences and configuration
        </p>
      </div>
      
      {/* Success message */}
      {saved && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id 
                  ? 'border-linkedin-blue text-linkedin-blue' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white shadow rounded-lg">
        {/* Evaluation Criteria */}
        {activeTab === 'evaluationCriteria' && (
          <EvaluationCriteriaSettings 
            criteria={evaluationCriteria}
            onUpdate={handleCriteriaUpdate}
            saving={saving}
          />
        )}
        
        {/* LinkedIn API Settings */}
        {activeTab === 'linkedInSettings' && (
          <LinkedInSettingsForm 
            formik={linkedInSettingsForm}
            saving={saving}
          />
        )}
        
        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <NotificationSettings 
            onSave={showSavedMessage}
            setSaving={setSaving}
            saving={saving}
          />
        )}
        
        {/* Account Settings */}
        {activeTab === 'account' && (
          <AccountSettings 
            currentUser={currentUser}
            onLogout={handleLogout}
            onSave={showSavedMessage}
            setSaving={setSaving}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;