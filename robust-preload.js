/**
 * Robust preload script for LinkedIn Recruiter Agent
 * This script properly bridges the gap between Electron main process and React renderer
 */
const { contextBridge, ipcRenderer } = require('electron');

console.log('Robust preload script starting...');

// Helper to add debug logging to API calls
function debugWrap(name, fn) {
  return async (...args) => {
    console.log(`API CALL: ${name}`, ...args);
    try {
      const result = await fn(...args);
      console.log(`API RESULT: ${name}`, result);
      return result;
    } catch (err) {
      console.error(`API ERROR: ${name}`, err);
      throw err;
    }
  };
}

// Helper to create events
function createEventEmitter() {
  const eventListeners = {};
  
  // Register ipcRenderer listeners for all known channels
  const knownChannels = [
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
  
  // Setup listeners for known channels
  knownChannels.forEach(channel => {
    eventListeners[channel] = [];
    ipcRenderer.on(channel, (event, ...args) => {
      console.log(`EVENT RECEIVED: ${channel}`, ...args);
      const listeners = eventListeners[channel] || [];
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (err) {
          console.error(`Error in event listener for ${channel}:`, err);
        }
      });
    });
  });
  
  return {
    on: (channel, listener) => {
      console.log(`Adding listener for ${channel}`);
      if (!eventListeners[channel]) {
        eventListeners[channel] = [];
      }
      eventListeners[channel].push(listener);
      
      // Return unsubscribe function
      return () => {
        console.log(`Removing listener for ${channel}`);
        const idx = eventListeners[channel].indexOf(listener);
        if (idx >= 0) {
          eventListeners[channel].splice(idx, 1);
        }
      };
    },
    off: (channel, listener) => {
      console.log(`Removing listener for ${channel}`);
      if (!eventListeners[channel]) return;
      
      const idx = eventListeners[channel].indexOf(listener);
      if (idx >= 0) {
        eventListeners[channel].splice(idx, 1);
      }
    },
    emit: (channel, ...args) => {
      console.log(`Emitting event: ${channel}`, ...args);
      const listeners = eventListeners[channel] || [];
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (err) {
          console.error(`Error in event listener for ${channel}:`, err);
        }
      });
    }
  };
}

// Create event system
const events = createEventEmitter();

// Define the robust API object with direct methods
const apiObject = {
  // Event system
  on: events.on,
  off: events.off,
  
  // Authentication methods
  getCredentials: debugWrap('getCredentials', () => {
    return ipcRenderer.invoke('get-credentials');
  }),
  
  saveCredentials: debugWrap('saveCredentials', (credentials) => {
    return ipcRenderer.invoke('save-credentials', credentials);
  }),
  
  clearCredentials: debugWrap('clearCredentials', () => {
    console.log('clearCredentials called - this is the logout function');
    return ipcRenderer.invoke('clear-credentials')
      .then(result => {
        console.log('clearCredentials result:', result);
        // After successful API call, trigger UI update
        events.emit('auth-state-changed', { isAuthenticated: false });
        return result;
      })
      .catch(err => {
        console.error('Error clearing credentials:', err);
        // Return a fallback successful response
        return { success: true };
      });
  }),
  
  // Other authentication methods
  login: debugWrap('login', (credentials) => {
    return ipcRenderer.invoke('auth:login', credentials)
      .then(result => {
        if (result.success) {
          events.emit('auth-state-changed', { isAuthenticated: true, user: result.user });
        }
        return result;
      });
  }),
  
  logout: debugWrap('logout', () => {
    console.log('logout called');
    return ipcRenderer.invoke('auth:logout')
      .then(result => {
        console.log('logout result:', result);
        events.emit('auth-state-changed', { isAuthenticated: false });
        return result;
      });
  }),
  
  // LinkedIn automation methods
  startLinkedInBrowser: debugWrap('startLinkedInBrowser', (options) => {
    console.log('startLinkedInBrowser called with options:', options);
    return ipcRenderer.invoke('linkedin:startBrowser', options || {})
      .then(result => {
        console.log('startLinkedInBrowser result:', result);
        return result;
      })
      .catch(err => {
        console.error('Error in startLinkedInBrowser:', err);
        throw err;
      });
  }),
  
  extractApplicants: debugWrap('extractApplicants', (jobIdOrOptions) => {
    return ipcRenderer.invoke('linkedin:extractApplicants', jobIdOrOptions);
  }),
  
  pauseExtraction: debugWrap('pauseExtraction', () => {
    return ipcRenderer.invoke('linkedin:pauseExtraction');
  }),
  
  resumeExtraction: debugWrap('resumeExtraction', () => {
    return ipcRenderer.invoke('linkedin:resumeExtraction');
  }),
  
  cancelExtraction: debugWrap('cancelExtraction', () => {
    return ipcRenderer.invoke('linkedin:cancelExtraction');
  }),
  
  // CV analysis methods
  analyzeCV: debugWrap('analyzeCV', (cvData) => {
    return ipcRenderer.invoke('cv:analyze', cvData);
  }),
  
  listDownloadedCVs: debugWrap('listDownloadedCVs', () => {
    return ipcRenderer.invoke('cv:list');
  }),
  
  // Job management
  getJobs: debugWrap('getJobs', () => {
    return ipcRenderer.invoke('jobs:getAll');
  }),
  
  getJobDetails: debugWrap('getJobDetails', (jobId) => {
    return ipcRenderer.invoke('jobs:getDetails', jobId);
  }),
  
  createJob: debugWrap('createJob', (jobData) => {
    return ipcRenderer.invoke('jobs:create', jobData);
  }),
  
  updateJob: debugWrap('updateJob', (jobId, jobData) => {
    return ipcRenderer.invoke('jobs:update', jobId, jobData);
  }),
  
  // Candidate management
  getCandidates: debugWrap('getCandidates', (options) => {
    return ipcRenderer.invoke('candidates:getAll', options);
  }),
  
  getCandidateDetails: debugWrap('getCandidateDetails', (id) => {
    return ipcRenderer.invoke('candidates:getDetails', id);
  }),
  
  evaluateCandidate: debugWrap('evaluateCandidate', (id, jobId) => {
    return ipcRenderer.invoke('candidates:evaluate', id, jobId);
  }),
  
  // App version and info
  getAppVersion: debugWrap('getAppVersion', () => {
    return ipcRenderer.invoke('app:getVersion')
      .then(result => {
        return result.version || '1.0.0';
      })
      .catch(err => {
        console.error('Error getting app version:', err);
        return '1.0.0'; // Fallback version if there's an error
      });
  }),
  
  // Navigation helper for direct page navigation
  navigateTo: debugWrap('navigateTo', (pageName) => {
    console.log('Navigation requested to page:', pageName);
    
    // Emit an event that the renderer can listen for
    events.emit('navigation-requested', { page: pageName });
    
    // We also return a promise to maintain API consistency
    return Promise.resolve({ success: true, page: pageName });
  }),
  
  // Debug helper
  checkAPIAvailability: () => {
    console.log('API availability check');
    return {
      available: true,
      methods: Object.keys(apiObject)
    };
  }
};

// Expose functions to renderer
try {
  console.log('Exposing robust API via contextBridge...');
  contextBridge.exposeInMainWorld('api', apiObject);
  console.log('Robust API successfully exposed! Available methods:', Object.keys(apiObject).join(', '));
  
  // Also expose a debug flag
  contextBridge.exposeInMainWorld('debug', {
    isPreloadLoaded: true,
    timestamp: Date.now()
  });
} catch (error) {
  console.error('Failed to expose robust API:', error);
}

// Add a global variable to check if preload is loaded properly
console.log('Robust preload script executed completely!');

// Track readiness
ipcRenderer.send('preload-ready', { timestamp: Date.now() });

// Secure the window object
delete window.module;
delete window.require;
delete window.process;
