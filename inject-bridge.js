/**
 * This script injects the clean Electron bridge into
 * the renderer process after the app has loaded
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Wait for the app to be ready
app.whenReady().then(() => {
  console.log('Electron bridge injector is running');
  
  // Get all windows
  const windows = BrowserWindow.getAllWindows();
  
  if (windows.length === 0) {
    console.error('No windows found to inject bridge into');
    return;
  }
  
  // Get the main window
  const mainWindow = windows[0];
  
  // Read the clean bridge script
  const bridgePath = path.join(__dirname, 'clean-electron-bridge.js');
  
  if (!fs.existsSync(bridgePath)) {
    console.error('Bridge script not found at:', bridgePath);
    return;
  }
  
  const bridgeScript = fs.readFileSync(bridgePath, 'utf8');
  
  // Wait for the window to load
  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.once('did-finish-load', () => {
      injectBridge(mainWindow, bridgeScript);
    });
  } else {
    injectBridge(mainWindow, bridgeScript);
  }
});

// Function to inject the bridge
function injectBridge(window, script) {
  console.log('Injecting clean Electron bridge...');
  
  window.webContents.executeJavaScript(script)
    .then(() => {
      console.log('Clean Electron Bridge injected successfully');
    })
    .catch(err => {
      console.error('Error injecting bridge:', err);
    });
}
