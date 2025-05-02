import React, { useState } from 'react';

const NotificationSettings = ({ onSave, setSaving, saving }) => {
  // Notification settings state
  const [settings, setSettings] = useState({
    emailNotifications: {
      candidateResponses: true,
      newMatches: true,
      weeklyDigest: true,
      statusChanges: false,
      systemUpdates: true
    },
    desktopNotifications: {
      candidateResponses: true,
      newMatches: false,
      statusChanges: true,
      systemUpdates: false
    },
    notificationFrequency: 'immediate'
  });
  
  // Handle checkbox change
  const handleCheckboxChange = (category, setting) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [category]: {
        ...prevSettings[category],
        [setting]: !prevSettings[category][setting]
      }
    }));
  };
  
  // Handle radio button change
  const handleRadioChange = (e) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      notificationFrequency: e.target.value
    }));
  };
  
  // Handle save
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show success message
      onSave();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure how and when you want to receive notifications about recruiting activities.
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Email notifications */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
          <p className="text-xs text-gray-500 mb-4">
            Select which notifications you want to receive via email
          </p>
          
          <div className="mt-2 space-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-candidate-responses"
                  name="email-candidate-responses"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.emailNotifications.candidateResponses}
                  onChange={() => handleCheckboxChange('emailNotifications', 'candidateResponses')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-candidate-responses" className="font-medium text-gray-700">
                  Candidate responses
                </label>
                <p className="text-gray-500">Get notified when candidates reply to your messages</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-new-matches"
                  name="email-new-matches"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.emailNotifications.newMatches}
                  onChange={() => handleCheckboxChange('emailNotifications', 'newMatches')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-new-matches" className="font-medium text-gray-700">
                  New candidate matches
                </label>
                <p className="text-gray-500">Get notified when new candidates match your search criteria</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-weekly-digest"
                  name="email-weekly-digest"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.emailNotifications.weeklyDigest}
                  onChange={() => handleCheckboxChange('emailNotifications', 'weeklyDigest')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-weekly-digest" className="font-medium text-gray-700">
                  Weekly digest
                </label>
                <p className="text-gray-500">Receive a weekly summary of your recruiting activities</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-status-changes"
                  name="email-status-changes"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.emailNotifications.statusChanges}
                  onChange={() => handleCheckboxChange('emailNotifications', 'statusChanges')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-status-changes" className="font-medium text-gray-700">
                  Candidate status changes
                </label>
                <p className="text-gray-500">Get notified when a candidate's status changes</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-system-updates"
                  name="email-system-updates"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.emailNotifications.systemUpdates}
                  onChange={() => handleCheckboxChange('emailNotifications', 'systemUpdates')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-system-updates" className="font-medium text-gray-700">
                  System updates
                </label>
                <p className="text-gray-500">Receive notifications about system updates and new features</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop notifications */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Desktop Notifications</h3>
          <p className="text-xs text-gray-500 mb-4">
            Select which notifications you want to receive as desktop alerts
          </p>
          
          <div className="mt-2 space-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="desktop-candidate-responses"
                  name="desktop-candidate-responses"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.desktopNotifications.candidateResponses}
                  onChange={() => handleCheckboxChange('desktopNotifications', 'candidateResponses')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="desktop-candidate-responses" className="font-medium text-gray-700">
                  Candidate responses
                </label>
                <p className="text-gray-500">Show desktop notifications when candidates reply to your messages</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="desktop-new-matches"
                  name="desktop-new-matches"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.desktopNotifications.newMatches}
                  onChange={() => handleCheckboxChange('desktopNotifications', 'newMatches')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="desktop-new-matches" className="font-medium text-gray-700">
                  New candidate matches
                </label>
                <p className="text-gray-500">Show desktop notifications when new candidates match your search criteria</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="desktop-status-changes"
                  name="desktop-status-changes"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.desktopNotifications.statusChanges}
                  onChange={() => handleCheckboxChange('desktopNotifications', 'statusChanges')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="desktop-status-changes" className="font-medium text-gray-700">
                  Candidate status changes
                </label>
                <p className="text-gray-500">Show desktop notifications when a candidate's status changes</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="desktop-system-updates"
                  name="desktop-system-updates"
                  type="checkbox"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300 rounded"
                  checked={settings.desktopNotifications.systemUpdates}
                  onChange={() => handleCheckboxChange('desktopNotifications', 'systemUpdates')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="desktop-system-updates" className="font-medium text-gray-700">
                  System updates
                </label>
                <p className="text-gray-500">Show desktop notifications about system updates and new features</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification frequency */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">Notification Frequency</h3>
          <p className="text-xs text-gray-500 mb-4">
            Choose how often you want to receive notifications
          </p>
          
          <div className="mt-2 space-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="frequency-immediate"
                  name="notification-frequency"
                  type="radio"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300"
                  value="immediate"
                  checked={settings.notificationFrequency === 'immediate'}
                  onChange={handleRadioChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="frequency-immediate" className="font-medium text-gray-700">
                  Immediate
                </label>
                <p className="text-gray-500">Receive notifications in real-time</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="frequency-daily"
                  name="notification-frequency"
                  type="radio"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300"
                  value="daily"
                  checked={settings.notificationFrequency === 'daily'}
                  onChange={handleRadioChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="frequency-daily" className="font-medium text-gray-700">
                  Daily digest
                </label>
                <p className="text-gray-500">Receive a daily summary of all notifications</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="frequency-weekly"
                  name="notification-frequency"
                  type="radio"
                  className="focus:ring-linkedin-blue h-4 w-4 text-linkedin-blue border-gray-300"
                  value="weekly"
                  checked={settings.notificationFrequency === 'weekly'}
                  onChange={handleRadioChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="frequency-weekly" className="font-medium text-gray-700">
                  Weekly digest
                </label>
                <p className="text-gray-500">Receive a weekly summary of all notifications</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;