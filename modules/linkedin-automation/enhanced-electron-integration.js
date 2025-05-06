/**
 * Enhanced Electron Integration for LinkedIn Automation
 * 
 * This implementation integrates the enhanced LinkedIn Automation module
 * with an Electron application, supporting all new features including:
 * - Batch processing
 * - Progress tracking
 * - Pause/resume functionality
 * - Enhanced error handling
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { EnhancedLinkedInAutomation } = require('./index');

// Keep a global reference of the automation instance
let linkedInAutomation = null;

// Keep a global reference of the window object
let mainWindow = null;

// Application settings
const appSettings = {
  userDataPath: path.join(app.getPath('userData'), 'LinkedInAutomation'),
  downloadsPath: path.join(app.getPath('downloads'), 'LinkedInAutomation'),
};

// Ensure directories exist
if (!fs.existsSync(appSettings.userDataPath)) {
  fs.mkdirSync(appSettings.userDataPath, { recursive: true });
}

if (!fs.existsSync(appSettings.downloadsPath)) {
  fs.mkdirSync(appSettings.downloadsPath, { recursive: true });
}

// Generate a secure encryption key for the session
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Event types to forward to the renderer process
const eventTypes = [
  'extraction-started', 'extraction-progress', 'extraction-paused',
  'extraction-resumed', 'extraction-completed', 'extraction-error',
  'cv-download-started', 'cv-download-progress', 'cv-download-completed',
  'cv-download-error', 'batch-started', 'batch-completed'
];

/**
 * Initialize the Enhanced LinkedIn Automation module
 */
async function initializeAutomation(options = {}) {
  try {
    const defaultOptions = {
      headless: false, // Set to true in production
      downloadPath: appSettings.downloadsPath,
      userDataDir: appSettings.userDataPath,
      rateLimit: {
        requestsPerHour: 25, // Conservative limit to avoid detection
        cooldownPeriod: 15000, // 15 seconds between actions
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 5000,
      },
      batchOptions: {
        batchSize: 5,
        pauseBetweenBatches: 3000,
        maxConcurrent: 1,
      },
      downloadOptions: {
        timeout: 30000,
        retryAttempts: 3,
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    linkedInAutomation = new EnhancedLinkedInAutomation(mergedOptions);
    
    // Set up event forwarding to renderer process
    setupEventForwarding();
    
    await linkedInAutomation.init();
    return true;
  } catch (error) {
    console.error('Failed to initialize LinkedIn automation:', error);
    return false;
  }
}

/**
 * Set up event forwarding from automation to renderer process
 */
function setupEventForwarding() {
  if (!linkedInAutomation) return;
  
  // Remove any existing listeners to prevent duplicates
  eventTypes.forEach(eventType => {
    linkedInAutomation.removeAllListeners(eventType);
  });
  
  // Set up new listeners
  eventTypes.forEach(eventType => {
    linkedInAutomation.on(eventType, (data) => {
      // Forward to renderer if window exists
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(`linkedin:${eventType}`, data);
      }
      
      // Log events for debugging
      console.log(`LinkedIn Automation Event: ${eventType}`, 
        eventType.includes('progress') ? 
          `${data.current}/${data.total} (${data.percentage}%)` : 
          JSON.stringify(data, null, 2));
    });
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // For security
      contextIsolation: true, // For security
      preload: path.join(__dirname, 'preload.js'), // Load preload script
    },
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App lifecycle events
 */
app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', async () => {
  // Cleanup automation
  if (linkedInAutomation) {
    try {
      await linkedInAutomation.close();
    } catch (error) {
      console.error('Error closing automation:', error);
    }
  }
  
  // Quit the app on all platforms except macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate the window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  // Properly close the browser before quitting
  if (linkedInAutomation) {
    try {
      event.preventDefault();
      
      // Stop any ongoing operations
      if (linkedInAutomation.getOperationState().isRunning) {
        await linkedInAutomation.stopOperation();
        // Give it a moment to clean up
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await linkedInAutomation.close();
      app.quit();
    } catch (error) {
      console.error('Error during cleanup:', error);
      app.exit(1);
    }
  }
});

/**
 * IPC Communication with Renderer Process
 */

// Initialize automation
ipcMain.handle('linkedin:init', async (event, options) => {
  try {
    const success = await initializeAutomation(options);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Login to LinkedIn
ipcMain.handle('linkedin:login', async (event, { email, password, rememberCredentials }) => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    const success = await linkedInAutomation.login(email, password, rememberCredentials);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Manual login option for case where user has to solve CAPTCHA
ipcMain.handle('linkedin:ensureLoggedIn', async () => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    const success = await linkedInAutomation.ensureLoggedIn();
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enhanced applicant extraction with events
ipcMain.handle('linkedin:getApplicants', async (event, { jobId, options }) => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    // Start extraction in background to allow for non-blocking operation
    // Results will come through events
    linkedInAutomation.getApplicants(jobId, options).catch(error => {
      console.error('Extraction error in background process:', error);
      
      // If no listener caught this error, we need to emit it manually
      if (linkedInAutomation.listenerCount('extraction-error') === 0) {
        linkedInAutomation.emit('extraction-error', {
          error: error.message,
          errorCode: 'GENERAL_ERROR',
          context: 'Background extraction process',
          timestamp: Date.now(),
          recoverable: false
        });
      }
    });
    
    return { 
      success: true, 
      message: 'Extraction started',
      operationId: `extract-${jobId}-${Date.now()}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Process job applicants with enhanced features
ipcMain.handle('linkedin:processJobApplicants', async (event, { jobId, options }) => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    // Start processing in background
    linkedInAutomation.processJobApplicants(jobId, options).catch(error => {
      console.error('Processing error in background process:', error);
      
      // If no listener caught this error, we need to emit it manually
      if (linkedInAutomation.listenerCount('extraction-error') === 0) {
        linkedInAutomation.emit('extraction-error', {
          error: error.message,
          errorCode: 'GENERAL_ERROR',
          context: 'Background job processing',
          timestamp: Date.now(),
          recoverable: false
        });
      }
    });
    
    return { 
      success: true, 
      message: 'Job processing started',
      operationId: `process-${jobId}-${Date.now()}`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get detailed profile data (blocking call)
ipcMain.handle('linkedin:getProfileData', async (event, { profileUrl }) => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    const profileData = await linkedInAutomation.getProfileData(profileUrl);
    return { success: true, profileData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enhanced CV download with events
ipcMain.handle('linkedin:downloadCV', async (event, { profileUrl, preferredFileName }) => {
  try {
    if (!linkedInAutomation) {
      await initializeAutomation();
    }
    
    // Start download in background
    linkedInAutomation.downloadCV(profileUrl, preferredFileName).catch(error => {
      console.error('CV download error in background process:', error);
    });
    
    return { 
      success: true, 
      message: 'CV download started',
      profileId: profileUrl.includes('/in/') ? 
        profileUrl.split('/in/')[1].replace(/\/$/, '') : profileUrl
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Pause current operation
ipcMain.handle('linkedin:pauseOperation', async () => {
  try {
    if (!linkedInAutomation) {
      return { success: false, error: 'Automation not initialized' };
    }
    
    const result = await linkedInAutomation.pauseOperation();
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Resume current operation
ipcMain.handle('linkedin:resumeOperation', async () => {
  try {
    if (!linkedInAutomation) {
      return { success: false, error: 'Automation not initialized' };
    }
    
    const result = await linkedInAutomation.resumeOperation();
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Stop current operation
ipcMain.handle('linkedin:stopOperation', async () => {
  try {
    if (!linkedInAutomation) {
      return { success: false, error: 'Automation not initialized' };
    }
    
    const result = await linkedInAutomation.stopOperation();
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get current operation state
ipcMain.handle('linkedin:getOperationState', async () => {
  try {
    if (!linkedInAutomation) {
      return { success: false, error: 'Automation not initialized' };
    }
    
    const state = linkedInAutomation.getOperationState();
    return { success: true, state };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export operation results
ipcMain.handle('linkedin:exportOperationResults', async (event, { fileName }) => {
  try {
    if (!linkedInAutomation) {
      return { success: false, error: 'Automation not initialized' };
    }
    
    const timestamp = Date.now();
    const defaultFileName = `operation-results-${timestamp}.json`;
    const actualFileName = fileName || defaultFileName;
    const filePath = path.join(appSettings.downloadsPath, actualFileName);
    
    const success = linkedInAutomation.exportOperationResults(filePath);
    
    return { 
      success, 
      filePath: success ? filePath : null 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Logout from LinkedIn
ipcMain.handle('linkedin:logout', async () => {
  try {
    if (linkedInAutomation) {
      await linkedInAutomation.logout();
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Close automation and cleanup
ipcMain.handle('linkedin:close', async () => {
  try {
    if (linkedInAutomation) {
      await linkedInAutomation.close();
      linkedInAutomation = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Module exports for use in main Electron app
 */
module.exports = {
  initializeAutomation,
  setupEventForwarding,
  getLinkedInAutomation: () => linkedInAutomation,
  eventTypes
};