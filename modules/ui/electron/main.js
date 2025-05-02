const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'secure-linkedin-recruiter-key',
  name: 'secure-credentials'
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  // Load the React app in development or production
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Only show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Garbage collection
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app when ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for secure credential storage
ipcMain.handle('save-credentials', async (event, credentials) => {
  try {
    store.set('linkedin', credentials);
    return { success: true };
  } catch (error) {
    console.error('Error saving credentials:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-credentials', async () => {
  try {
    const credentials = store.get('linkedin');
    return { success: true, credentials };
  } catch (error) {
    console.error('Error retrieving credentials:', error);
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

// For development: Install React and Redux DevTools in development mode
if (process.env.NODE_ENV === 'development') {
  app.whenReady().then(async () => {
    try {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
      await installExtension(REACT_DEVELOPER_TOOLS);
    } catch (e) {
      console.error('React DevTools failed to install:', e);
    }
  });
}