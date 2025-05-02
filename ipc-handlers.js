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
  
  // Update the LinkedIn login handler
  ipcMain.handle('connectToLinkedIn', async (event, data) => {
    try {
      return await workflowManager.connectToLinkedIn(data.userId);
    } catch (error) {
      console.error('LinkedIn connection error:', error);
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


  // Add these handlers to your ipc-handlers.js file
ipcMain.handle('get-credentials', async () => {
  try {
    // For testing, return mock credentials
    return { success: true, credentials: { name: 'Test User', email: 'test@example.com' } };
    
    // Or if you're using store like in your existing handlers:
    // const credentials = store.get('linkedin');
    // return { success: true, credentials };
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-credentials', async (event, credentials) => {
  try {
    // For testing, just log the credentials
    console.log('Saving credentials:', credentials);
    return { success: true };
    
    // Or if you're using store:
    // store.set('linkedin', credentials);
    // return { success: true };
  } catch (error) {
    console.error('Error saving credentials:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-credentials', async () => {
  try {
    // For testing
    console.log('Clearing credentials');
    return { success: true };
    
    // Or if you're using store:
    // store.delete('linkedin');
    // return { success: true };
  } catch (error) {
    console.error('Error clearing credentials:', error);
    return { success: false, error: error.message };
  }
});
}

// Export the setup function
module.exports = { setupIpcHandlers };