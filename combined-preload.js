const { contextBridge, ipcRenderer } = require('electron');

console.log('Combined preload script starting...');

// Define the API object
const apiObject = {
  // Authentication methods
  getCredentials: () => {
    console.log('getCredentials called');
    return ipcRenderer.invoke('get-credentials');
  },
  saveCredentials: (credentials) => {
    console.log('saveCredentials called with:', credentials);
    return ipcRenderer.invoke('save-credentials', credentials);
  },
  clearCredentials: () => {
    console.log('clearCredentials called');
    return ipcRenderer.invoke('clear-credentials');
  },
  
  // Other methods
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  connectToLinkedIn: (data) => ipcRenderer.invoke('connectToLinkedIn', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  loginToLinkedIn: (credentials) => ipcRenderer.invoke('linkedin:login', credentials),
  
  // Add any other functions your app needs
  getCandidates: (options) => ipcRenderer.invoke('candidates:getAll', options),
  getCandidateDetails: (id) => ipcRenderer.invoke('candidates:getDetails', id),
  evaluateCandidate: (id, jobId) => ipcRenderer.invoke('candidates:evaluate', id, jobId),
  
  // App version and info
  getAppVersion: () => process.env.npm_package_version
};

// Expose functions to renderer
try {
  console.log('Attempting to expose API via contextBridge...');
  contextBridge.exposeInMainWorld('api', apiObject);
  console.log('API successfully exposed! Available methods:', Object.keys(apiObject).join(', '));
} catch (error) {
  console.error('Failed to expose API:', error);
}

// Add a global variable to check if preload is loaded properly
console.log('Preload script executed completely!');

// Secure the window object
delete window.module;
delete window.require;
delete window.process;