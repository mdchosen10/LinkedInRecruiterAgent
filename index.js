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
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-app/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableWebSQL: false,
      webgl: false
    }
  });

  
  mainWindow.loadFile(path.join(__dirname, 'modules/ui/index.html'));
  mainWindow.webContents.openDevTools();
}

// Electron app events
app.whenReady().then(async () => {
  try {
    // Initialize modules
    const { workflowManager } = await initializeApplication();
    
    // Set up IPC handlers - add this line
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

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});