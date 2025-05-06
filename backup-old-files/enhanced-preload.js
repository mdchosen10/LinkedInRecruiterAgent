const { contextBridge, ipcRenderer } = require('electron');

console.log('Enhanced preload script starting...');

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
    return ipcRenderer.invoke('clear-credentials')
      .then(result => {
        console.log('clearCredentials result:', result);
        return result;
      })
      .catch(err => {
        console.error('Error clearing credentials:', err);
        // Return a fallback success response
        return { success: true };
      });
  },
  
  // Other methods
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  connectToLinkedIn: (data) => ipcRenderer.invoke('connectToLinkedIn', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  loginToLinkedIn: (credentials) => ipcRenderer.invoke('linkedin:login', credentials),
  
  // LinkedIn automation methods
  startLinkedInBrowser: (options) => {
    console.log('startLinkedInBrowser called with options:', options);
    return ipcRenderer.invoke('linkedin:startBrowser', options || {})
      .then(result => {
        console.log('startLinkedInBrowser result:', result);
        return result;
      })
      .catch(err => {
        console.error('Error in startLinkedInBrowser:', err);
        throw err; // Re-throw to allow component to handle it
      });
  },
  extractApplicants: (jobId) => ipcRenderer.invoke('linkedin:extractApplicants', jobId),
  pauseExtraction: () => ipcRenderer.invoke('linkedin:pauseExtraction'),
  resumeExtraction: () => ipcRenderer.invoke('linkedin:resumeExtraction'),
  cancelExtraction: () => ipcRenderer.invoke('linkedin:cancelExtraction'),
  
  // CV analysis methods
  analyzeCV: (cvData) => ipcRenderer.invoke('cv:analyze', cvData),
  listDownloadedCVs: () => ipcRenderer.invoke('cv:list'),
  
  // Job management
  getJobs: () => ipcRenderer.invoke('jobs:getAll'),
  getJobDetails: (jobId) => ipcRenderer.invoke('jobs:getDetails', jobId),
  createJob: (jobData) => ipcRenderer.invoke('jobs:create', jobData),
  updateJob: (jobId, jobData) => ipcRenderer.invoke('jobs:update', jobId, jobData),
  
  // Candidate management
  getCandidates: (options) => ipcRenderer.invoke('candidates:getAll', options),
  getCandidateDetails: (id) => ipcRenderer.invoke('candidates:getDetails', id),
  evaluateCandidate: (id, jobId) => ipcRenderer.invoke('candidates:evaluate', id, jobId),
  
  // Event listeners for progress updates
  on: (channel, func) => {
    // Validate channels to ensure only allowed events can be subscribed to
    const allowedChannels = [
      'extraction-started',
      'extraction-progress',
      'extraction-paused',
      'extraction-resumed',
      'extraction-completed',
      'extraction-error',
      'cv-download-started',
      'cv-download-progress',
      'cv-download-completed',
      'cv-download-error',
      'cv-analysis-progress',
      'cv-analysis-completed'
    ];
    
    if (allowedChannels.includes(channel)) {
      // Create a wrapper function that removes the event object
      const validatedFunc = (_, ...args) => func(...args);
      ipcRenderer.on(channel, validatedFunc);
      
      // Return a function to unsubscribe
      return () => {
        ipcRenderer.removeListener(channel, validatedFunc);
        console.log(`Unsubscribed from ${channel}`);
      };
    } else {
      console.warn(`Attempted to subscribe to invalid channel: ${channel}`);
      return () => {}; // Return empty function if channel is invalid
    }
  },
  
  off: (channel, func) => {
    const allowedChannels = [
      'extraction-started',
      'extraction-progress',
      'extraction-paused',
      'extraction-resumed',
      'extraction-completed',
      'extraction-error',
      'cv-download-started',
      'cv-download-progress',
      'cv-download-completed',
      'cv-download-error',
      'cv-analysis-progress',
      'cv-analysis-completed'
    ];
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
      console.log(`Manually unsubscribed from ${channel}`);
    }
  },
  
  // App version and info
  getAppVersion: () => {
    console.log('getAppVersion called');
    return ipcRenderer.invoke('app:getVersion')
      .then(result => {
        console.log('getAppVersion result:', result);
        return result.version || '1.0.0';
      })
      .catch(err => {
        console.error('Error getting app version:', err);
        return '1.0.0'; // Fallback version if there's an error
      });
  },
  
  // Debug helper
  checkAPIAvailability: () => {
    return {
      available: true,
      methods: Object.keys(apiObject)
    };
  }
};

// Expose functions to renderer
try {
  console.log('Attempting to expose enhanced API via contextBridge...');
  contextBridge.exposeInMainWorld('api', apiObject);
  console.log('Enhanced API successfully exposed! Available methods:', Object.keys(apiObject).join(', '));
} catch (error) {
  console.error('Failed to expose enhanced API:', error);
}

// Add a global variable to check if preload is loaded properly
console.log('Enhanced preload script executed completely!');

// Secure the window object
delete window.module;
delete window.require;
delete window.process;