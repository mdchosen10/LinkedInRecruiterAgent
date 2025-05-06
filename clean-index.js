/**
 * LinkedIn Recruitment Automation System
 * Clean Main Application Entry Point
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('./config/default');

// Add these lines before window creation to help prevent GPU issues
app.commandLine.appendSwitch('disable-gpu');
app.disableHardwareAcceleration();
// Allow unrestricted script execution
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Import modules
const { initialize: initializeDataStorage } = require('./modules/data-storage/data-storage');
const LinkedInAutomation = require('./modules/linkedin-automation/linkedin-automation');
const CandidateEvaluationEngine = require('./modules/evaluation-engine/candidate-evaluation-engine');
const { createMessageGenerator } = require('./modules/message-generator');
const WorkflowManager = require('./integration/workflow-manager');

// Initialize data storage and get integration service
let dataStorage;
let integrationService;

// Initialize all components
async function initializeApplication() {
  try {
    console.log('Initializing application components...');
    
    // Initialize database and data storage
    const storageComponents = await initializeDataStorage();
    dataStorage = storageComponents.dbManager;
    integrationService = storageComponents.integrationService;
    
    // Initialize LinkedIn automation
    const linkedInAutomation = new LinkedInAutomation({
      // Pass configuration options
    });
    
    // Initialize evaluation engine
    const evaluationEngine = new CandidateEvaluationEngine({
      apiKey: config.evaluationEngine.apiKey
    });
    
    // Initialize message generator
    const messageGenerator = createMessageGenerator({
      templatesDir: path.join(__dirname, 'modules/message-generator/templates')
    });
    
    // Initialize workflow manager to connect all components
    const workflowManager = new WorkflowManager({
      dataStorage: integrationService,
      linkedInAutomation,
      evaluationEngine,
      messageGenerator
    });
    
    console.log('All components initialized successfully');
    return { dataStorage, integrationService, workflowManager };
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
}

// Create main application window
function createWindow() {
  console.log('Creating main application window...');
  
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'robust-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false, // Disable sandbox for full preload functionality
      enableRemoteModule: false
    }
  });

  // Add detailed event handlers for diagnosing loading issues
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('WebContents: Started loading');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('WebContents: Finished loading');
    
    // Execute test script to verify DOM content
    mainWindow.webContents.executeJavaScript(`
      console.log('-----DOM INSPECTION-----');
      console.log('document.title:', document.title);
      console.log('Root element exists:', !!document.getElementById('root'));
      console.log('window.api available:', !!window.api);
      
      if (window.api) {
        console.log('API methods:', Object.keys(window.api));
      }
    `)
    .catch(err => console.error('Error executing JavaScript in renderer:', err));
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    console.error('WebContents: Failed to load', errorCode, errorDesc);
  });
  
  mainWindow.webContents.on('dom-ready', () => {
    console.log('WebContents: DOM is ready');
  });
  
  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  console.log('Environment:', isDev ? 'Development' : 'Production');
  
  if (isDev) {
    // Development mode - load from React dev server
    console.log('Loading from development server at http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000')
      .catch(err => console.error('Failed to load from dev server:', err));
  } else {
    // Production mode - load from build directory
    try {
      const reactAppPath = path.resolve(__dirname, 'modules/ui/build/index.html');
      console.log('Loading React application from:', reactAppPath);
      
      if (fs.existsSync(reactAppPath)) {
        mainWindow.loadFile(reactAppPath)
          .then(() => {
            console.log('React app loaded successfully');
            
            // Only inject the clean bridge solution
            const electronBridgePath = path.join(__dirname, 'clean-electron-bridge.js');
            const electronBridgeScript = fs.readFileSync(electronBridgePath, 'utf8');
            
            mainWindow.webContents.executeJavaScript(electronBridgeScript)
              .then(() => console.log('Clean Electron Bridge injected successfully'))
              .catch(err => console.error('Error injecting Clean Electron Bridge:', err));
            
          })
          .catch(err => {
            console.error('Error loading React app:', err);
          });
      } else {
        console.error('React app HTML not found at:', reactAppPath);
      }
    } catch (err) {
      console.error('Critical error during window creation:', err);
    }
  }

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  return mainWindow;
}

// Electron app events
app.whenReady().then(async () => {
  try {
    console.log('Electron app is ready');
    
    // Initialize modules
    const { workflowManager } = await initializeApplication();
    
    // Create UI window
    const mainWindow = createWindow();
    
    // Set up IPC handlers with event forwarding
    console.log('Setting up IPC handlers...');
    try {
      const enhancedHandlers = require('./enhanced-ipc-handlers');
      console.log('Using enhanced IPC handlers');
      enhancedHandlers.setupIpcHandlers(workflowManager);
    } catch (ipcError) {
      console.error('Failed to load enhanced IPC handlers, falling back to basic:', ipcError);
      const { setupIpcHandlers } = require('./ipc-handlers');
      setupIpcHandlers(workflowManager, mainWindow);
    }
    
    // Expose integration APIs to the UI via preload script
    global.workflowManager = workflowManager;
  } catch (error) {
    console.error('Application initialization failed:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in main process:', reason);
});