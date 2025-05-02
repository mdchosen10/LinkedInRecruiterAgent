/**
 * Electron Preload Script
 * 
 * This script exposes a secure API to the renderer process
 * for communicating with the LinkedIn Automation module.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose LinkedIn automation functionality to renderer process
contextBridge.exposeInMainWorld('linkedinAutomation', {
  // Initialize automation
  initialize: async () => {
    return await ipcRenderer.invoke('initialize-automation');
  },
  
  // Login to LinkedIn
  login: async (email, password, rememberCredentials = false) => {
    return await ipcRenderer.invoke('login', { email, password, rememberCredentials });
  },
  
  // Get applicants for a job
  getApplicants: async (jobId) => {
    return await ipcRenderer.invoke('get-applicants', { jobId });
  },
  
  // Get detailed profile data
  getProfileData: async (profileUrl) => {
    return await ipcRenderer.invoke('get-profile-data', { profileUrl });
  },
  
  // Download CV if available
  downloadCV: async (profileUrl) => {
    return await ipcRenderer.invoke('download-cv', { profileUrl });
  },
  
  // Export profiles to JSON
  exportProfiles: async (profiles) => {
    return await ipcRenderer.invoke('export-profiles', { profiles });
  },
  
  // Logout from LinkedIn
  logout: async () => {
    return await ipcRenderer.invoke('logout');
  },
  
  // Close automation
  close: async () => {
    return await ipcRenderer.invoke('close-automation');
  }
});

// Expose utilities for the renderer process
contextBridge.exposeInMainWorld('utils', {
  // Format date to readable string
  formatDate: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  },
  
  // Check if a string is a valid URL
  isValidUrl: (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },
  
  // Format a profile name for file saving
  formatProfileName: (name) => {
    if (!name) return 'unknown_profile';
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
});