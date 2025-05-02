/**
 * Electron Integration Example for LinkedIn Automation
 * 
 * This example shows how to integrate the LinkedIn Automation module
 * with an Electron application for secure local usage.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const LinkedInAutomation = require('./linkedin-automation');
const crypto = require('crypto');

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

/**
 * Initialize the LinkedIn Automation module
 */
async function initializeAutomation() {
  try {
    linkedInAutomation = new LinkedInAutomation({
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
      }
    });
    
    await linkedInAutomation.init();
    return true;
  } catch (error) {
    console.error('Failed to initialize LinkedIn automation:', error);
    return false;
  }
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
ipcMain.handle('initialize-automation', async () => {
  try {
    const success = await initializeAutomation();
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Login to LinkedIn
ipcMain.handle('login', async (event, { email, password, rememberCredentials }) => {
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

// Get all applicants for a job
ipcMain.handle('get-applicants', async (event, { jobId }) => {
  try {
    const applicants = await linkedInAutomation.getApplicants(jobId);
    return { success: true, applicants };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get detailed profile data
ipcMain.handle('get-profile-data', async (event, { profileUrl }) => {
  try {
    const profileData = await linkedInAutomation.getProfileData(profileUrl);
    return { success: true, profileData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download CV if available
ipcMain.handle('download-cv', async (event, { profileUrl }) => {
  try {
    const result = await linkedInAutomation.downloadCV(profileUrl);
    return { success: result.success, filePath: result.filePath, message: result.message };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export profiles to JSON
ipcMain.handle('export-profiles', async (event, { profiles }) => {
  try {
    const saveDirectory = dialog.showOpenDialogSync(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Directory to Save Profiles',
      defaultPath: appSettings.downloadsPath
    });
    
    if (!saveDirectory || saveDirectory.length === 0) {
      return { success: false, message: 'Operation cancelled' };
    }
    
    const exportPath = saveDirectory[0];
    const timestamp = Date.now();
    const filePath = path.join(exportPath, `linkedin_profiles_${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2), 'utf8');
    
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Logout from LinkedIn
ipcMain.handle('logout', async () => {
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
ipcMain.handle('close-automation', async () => {
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