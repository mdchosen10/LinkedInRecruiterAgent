// Setup IPC handlers for communication with renderer process
const { ipcMain } = require('electron');

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
  
  ipcMain.handle('linkedin:search', async (event, criteria) => {
    try {
      return await workflowManager.linkedInAutomation.searchForCandidates(criteria);
    } catch (error) {
      console.error('LinkedIn search error:', error);
      return { success: false, error: error.message };
    }
  });


  
  // Handle all other IPC events...
}

// Export the setup function
module.exports = { setupIpcHandlers };