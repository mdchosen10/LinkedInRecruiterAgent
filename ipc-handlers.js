// Setup IPC handlers for communication with renderer process
const { ipcMain, BrowserWindow } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'secure-linkedin-recruiter-key',
  name: 'secure-credentials'
});

/**
 * Set up event forwarding from backend to frontend
 * @param {Object} workflowManager WorkflowManager instance
 * @param {BrowserWindow} mainWindow Main window instance
 */
function setupEventForwarding(workflowManager, mainWindow) {
  // List of events to forward
  const events = [
    'extraction-started',
    'extraction-progress',
    'extraction-complete',
    'extraction-error',
    'extraction-paused',
    'extraction-resumed',
    'batch-started',
    'batch-completed',
    'cv-analysis-progress',
    'cv-analysis-complete'
  ];
  
  // Set up listeners for each event
  events.forEach(eventName => {
    workflowManager.on(eventName, (data) => {
      // Log event for debugging
      console.log(`Event forwarded to UI: ${eventName}`, data);
      
      // Only forward to renderer if window exists and is not destroyed
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(eventName, data);
      }
    });
  });
}

function setupIpcHandlers(workflowManager, mainWindow) {
  // Set up event forwarding
  if (mainWindow) {
    setupEventForwarding(workflowManager, mainWindow);
  }
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

  // CV Analysis handlers
  ipcMain.handle('cv:analyze', async (event, data) => {
    try {
      const { cvPath, jobRequirements } = data;
      
      // Verify the file exists
      if (!fs.existsSync(cvPath)) {
        return { 
          success: false, 
          error: `CV file not found at path: ${cvPath}` 
        };
      }
      
      // Analyze the CV
      return await workflowManager.analyzeCV(cvPath, jobRequirements);
    } catch (error) {
      console.error('CV analysis error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Get list of downloaded CVs
  ipcMain.handle('cv:list', async () => {
    try {
      const downloadsPath = path.join(process.cwd(), 'downloads');
      
      if (!fs.existsSync(downloadsPath)) {
        fs.mkdirSync(downloadsPath, { recursive: true });
        return { success: true, cvFiles: [] };
      }
      
      const files = fs.readdirSync(downloadsPath)
        .filter(file => file.endsWith('.pdf') || file.endsWith('.docx'))
        .map(file => ({
          filename: file,
          path: path.join(downloadsPath, file),
          size: fs.statSync(path.join(downloadsPath, file)).size,
          lastModified: fs.statSync(path.join(downloadsPath, file)).mtime
        }));
      
      return { success: true, cvFiles: files };
    } catch (error) {
      console.error('Error listing CV files:', error);
      return { success: false, error: error.message };
    }
  });

  // LinkedIn extraction handlers
  ipcMain.handle('linkedin:startBrowser', async () => {
    try {
      return await workflowManager.startLinkedInBrowser();
    } catch (error) {
      console.error('LinkedIn browser start error:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:extractApplicants', async (event, jobId) => {
    try {
      return await workflowManager.extractApplicantsFromJob(jobId);
    } catch (error) {
      console.error('LinkedIn applicant extraction error:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:pauseExtraction', async () => {
    try {
      return await workflowManager.pauseExtraction();
    } catch (error) {
      console.error('LinkedIn extraction pause error:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:resumeExtraction', async () => {
    try {
      return await workflowManager.resumeExtraction();
    } catch (error) {
      console.error('LinkedIn extraction resume error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Rest of your handlers...
}

// Export the setup function
module.exports = { setupIpcHandlers };