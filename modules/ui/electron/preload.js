const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Authentication methods
    saveCredentials: (credentials) => {
      return ipcRenderer.invoke('save-credentials', credentials);
    },
    getCredentials: () => {
      return ipcRenderer.invoke('get-credentials');
    },
    clearCredentials: () => {
      return ipcRenderer.invoke('clear-credentials');
    },
    
    // App version and info
    getAppVersion: () => {
      return process.env.npm_package_version;
    },

    // Event listeners for IPC events
    on: (channel, callback) => {
      // Whitelist valid channels
      const validChannels = ['auth-status-change', 'candidate-update'];
      if (validChannels.includes(channel)) {
        // Remove the event listener when it's no longer needed
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        
        // Return a function to clean up the event listener
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      
      return undefined;
    }
  }
);

// Secure the window object by removing node integration
delete window.module;
delete window.require;
delete window.process;