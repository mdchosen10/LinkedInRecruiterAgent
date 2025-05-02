// Setup IPC handlers for communication with renderer process
const { ipcMain } = require('electron');
const Store = require('electron-store'); // Add this import

// Initialize secure storage
const store = new Store({
  encryptionKey: 'secure-linkedin-recruiter-key',
  name: 'secure-credentials'
});

function setupIpcHandlers(workflowManager) {
  // Authentication
  ipcMain.handle('auth:login', async (event, credentials) => {
    try {
      const { username, password } = credentials;
      return await workflowManager.dataStorage.authenticateUser(username, password);
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('auth:logout', async (event, sessionId) => {
    try {
      return await workflowManager.dataStorage.logout(sessionId);
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // LinkedIn interactions
  ipcMain.handle('linkedin:login', async (event, credentials) => {
    try {
      const userId = credentials.userId;
      delete credentials.userId;
      return await workflowManager.loginToLinkedIn(credentials, userId);
    } catch (error) {
      console.error('LinkedIn login error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Add these credential handlers
  ipcMain.handle('get-credentials', async () => {
    try {
      const credentials = store.get('linkedin');
      return { success: true, credentials };
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-credentials', async (event, credentials) => {
    try {
      store.set('linkedin', credentials);
      return { success: true };
    } catch (error) {
      console.error('Error saving credentials:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clear-credentials', async () => {
    try {
      store.delete('linkedin');
      return { success: true };
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return { success: false, error: error.message };
    }
  });
  
  // LinkedIn search
  ipcMain.handle('linkedin:search', async (event, criteria) => {
    try {
      return await workflowManager.linkedInAutomation.searchForCandidates(criteria);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      return { success: false, error: error.message };
    }
  });

  // Rest of your handlers...
}

// Export the setup function
module.exports = { setupIpcHandlers };