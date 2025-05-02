/**
 * LinkedIn Recruitment Automation System
 * Main application entry point
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const config = require('./config/default');

// Add these lines before your window creation to help prevent GPU issues
app.commandLine.appendSwitch('disable-gpu');
app.disableHardwareAcceleration();
// Allow unrestricted script execution:
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Import modules
const { initialize: initializeDataStorage } = require('./modules/data-storage/data-storage');
const LinkedInAutomation = require('./modules/linkedin-automation/linkedin-automation');
const CandidateEvaluationEngine = require('./modules/evaluation-engine/candidate-evaluation-engine');
const { createMessageGenerator } = require('./modules/message-generator');
const WorkflowManager = require('./integration/workflow-manager');
const { setupIpcHandlers } = require('./ipc-handlers');
// Initialize data storage and get integration service
let dataStorage;
let integrationService;

// Initialize all components
async function initializeApplication() {
  try {
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
  const fs = require('fs');
  
  // Check parent directories
  console.log('__dirname:', __dirname);
  const parentDir = path.join(__dirname, 'modules/ui');
  if (fs.existsSync(parentDir)) {
    console.log('✅ modules/ui directory exists');
    console.log('Contents of modules/ui:', fs.readdirSync(parentDir));
    
    const electronDir = path.join(parentDir, 'electron');
    if (fs.existsSync(electronDir)) {
      console.log('✅ modules/ui/electron directory exists');
      console.log('Contents of modules/ui/electron:', fs.readdirSync(electronDir));
    } else {
      console.log('❌ modules/ui/electron directory does not exist');
    }
  } else {
    console.log('❌ modules/ui directory does not exist');
  }
  
  // Check for preload files at various locations
  const preloadPaths = [
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'electron-app/preload.js'),
    path.join(__dirname, 'modules/ui/electron/preload.js')
  ];
  
  preloadPaths.forEach(p => {
    console.log(`Checking preload at ${p}: ${fs.existsSync(p) ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  });
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, 'electron-app/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false
    }
  });

  // Add debugging code
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      console.log("DOM ready, window.api:", window.api ? "Available" : "Not available");
      if (window.api) console.log("API methods:", Object.keys(window.api));
    `);
  });
  
  // Load the built React app
  const reactAppPath = path.join(__dirname, 'modules/ui/build/index.html');
  console.log('Loading React app from:', reactAppPath);
  
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const filePath = path.join(__dirname, 'modules/ui/build/index.html');
    mainWindow.loadURL(`file://${filePath}`);
  }

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
  return mainWindow;
}

// Electron app events
app.whenReady().then(async () => {
  try {
    // Initialize modules
    const { workflowManager } = await initializeApplication();
    
    // Set up IPC handlers
    setupIpcHandlers(workflowManager);
    
    // Expose integration APIs to the UI via preload script
    global.workflowManager = workflowManager;

    // Create UI window
    createWindow();
  } catch (error) {
    console.error('Application initialization failed:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});