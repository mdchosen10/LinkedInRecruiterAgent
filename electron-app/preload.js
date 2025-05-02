/**
 * Electron preload script
 * Securely exposes APIs to the renderer process
 */
const { contextBridge, ipcRenderer } = require('electron');

// Expose validated data from the main process to the renderer
contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),  // Changed this line
  logout: () => ipcRenderer.invoke('auth:logout'),
  
  // LinkedIn
  loginToLinkedIn: (credentials) => ipcRenderer.invoke('linkedin:login', credentials),
  searchLinkedIn: (criteria) => ipcRenderer.invoke('linkedin:search', criteria),
  getProfileDetails: (profileUrl) => ipcRenderer.invoke('linkedin:getProfile', profileUrl),
  
  // Candidates
  getCandidates: (options) => ipcRenderer.invoke('candidates:getAll', options),
  getCandidateDetails: (id) => ipcRenderer.invoke('candidates:getDetails', id),
  evaluateCandidate: (id, jobId) => ipcRenderer.invoke('candidates:evaluate', id, jobId),
  
  // Messaging
  sendMessages: (candidateIds, messageType) => ipcRenderer.invoke('messages:send', candidateIds, messageType),
  getTemplates: (category) => ipcRenderer.invoke('messages:getTemplates', category),
  previewMessage: (templateName, candidateData) => ipcRenderer.invoke('messages:preview', templateName, candidateData),
  
  // Workflows
  startRecruitmentWorkflow: (jobData, searchCriteria, options) => 
    ipcRenderer.invoke('workflows:recruitment', jobData, searchCriteria, options)
});

// Forward user interface events to main process
contextBridge.exposeInMainWorld('events', {
  on: (channel, callback) => {
    // Whitelist channels for security
    const validChannels = ['auth:status', 'linkedin:status', 'workflow:progress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    const validChannels = ['auth:status', 'linkedin:status', 'workflow:progress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});