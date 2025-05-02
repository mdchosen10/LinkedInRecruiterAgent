/**
 * LinkedIn Recruitment Automation System
 * Main application entry point
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
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
  console.log('__dirname:', __dirname);
  
  // Check key directories and files
  const directoriesToCheck = [
    'modules/ui',
    'modules/ui/build',
    'modules/ui/electron',
    'electron-app'
  ];
  
  directoriesToCheck.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${dir} directory exists`);
      console.log(`Contents of ${dir}:`, fs.readdirSync(fullPath));
    } else {
      console.log(`❌ ${dir} directory does not exist`);
    }
  });
  
  // Check for preload files at various locations
  const preloadPaths = [
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'electron-app/preload.js'),
    path.join(__dirname, 'modules/ui/electron/preload.js')
  ];
  
  let availablePreloadPath = null;
  
  preloadPaths.forEach(p => {
    const exists = fs.existsSync(p);
    console.log(`Checking preload at ${p}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    if (exists && !availablePreloadPath) {
      availablePreloadPath = p;
    }
  });
  
  // Make sure we have a valid preload path
  if (!availablePreloadPath) {
    console.error('No valid preload script found! Cannot proceed.');
    throw new Error('No valid preload script found');
  }
  
  console.log('Using preload path:', availablePreloadPath);
  
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: availablePreloadPath,
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
      console.log('Script tags count:', document.querySelectorAll('script').length);
      console.log('Body HTML snippet:', document.body.innerHTML.substring(0, 200) + '...');
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
    
    // Check for API availability
    mainWindow.webContents.executeJavaScript(`
      console.log("DOM ready, window.api:", window.api ? "Available" : "Not available");
      if (window.api) console.log("API methods:", Object.keys(window.api));
    `)
    .catch(err => console.error('Error checking API availability:', err));
  });
  
  mainWindow.webContents.on('crashed', () => {
    console.error('WebContents has crashed!');
  });
  
  mainWindow.on('unresponsive', () => {
    console.error('Window has become unresponsive');
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
      const htmlPath = path.resolve(__dirname, 'modules/ui/build/index.html');
      console.log('Checking build path:', htmlPath);
      
      if (!fs.existsSync(htmlPath)) {
        console.error('Build file does not exist!');
        // Create a simple error page
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Build File Not Found</h1>
              <p>The build file at ${htmlPath} does not exist.</p>
              <p>Please run 'npm run build' in the modules/ui directory.</p>
            </body>
          </html>
        `;
        const errorPath = path.join(__dirname, 'error.html');
        fs.writeFileSync(errorPath, errorHtml);
        mainWindow.loadFile(errorPath);
        return;
      }
      
      // Check build directory for required files
      const buildDir = path.dirname(htmlPath);
      console.log('Build directory contents:', fs.readdirSync(buildDir));
      
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        console.log('Static directory exists, contains:', fs.readdirSync(staticDir));
        
        const jsDir = path.join(staticDir, 'js');
        if (fs.existsSync(jsDir)) {
          console.log('JS directory exists, contains:', fs.readdirSync(jsDir));
        } else {
          console.error('JS directory not found!');
        }
        
        const cssDir = path.join(staticDir, 'css');
        if (fs.existsSync(cssDir)) {
          console.log('CSS directory exists, contains:', fs.readdirSync(cssDir));
        } else {
          console.error('CSS directory not found!');
        }
      } else {
        console.error('Static directory not found!');
      }
      
      // Load the HTML file with explicit file:// protocol
      const fileUrl = `file://${htmlPath}`;
      console.log('Loading production build from:', fileUrl);
      
      mainWindow.loadURL(fileUrl)
        .catch(err => {
          console.error('Error loading production build:', err);
          
          // Fallback to direct file loading
          console.log('Attempting fallback to loadFile...');
          mainWindow.loadFile(htmlPath)
            .catch(fileErr => {
              console.error('Fallback loading also failed:', fileErr);
              
              // Last resort: load a basic HTML page
              const baseHtml = `
                <!DOCTYPE html>
                <html>
                  <head><title>Emergency Fallback</title></head>
                  <body>
                    <h1>Loading Error</h1>
                    <p>Failed to load application: ${err.message}</p>
                    <p>Fallback also failed: ${fileErr.message}</p>
                  </body>
                </html>
              `;
              const fallbackPath = path.join(__dirname, 'fallback.html');
              fs.writeFileSync(fallbackPath, baseHtml);
              mainWindow.loadFile(fallbackPath);
            });
        });
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
    
    // Set up IPC handlers
    console.log('Setting up IPC handlers...');
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

app.on('quit', () => {
  console.log('App quitting');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in main process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in main process:', reason);
});