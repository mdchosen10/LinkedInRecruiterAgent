/**
 * Enhanced IPC Handlers for LinkedIn Recruiter Agent
 * 
 * This file contains improved IPC handlers with standardized error handling,
 * event forwarding, and proper integration with all components.
 */

const { ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

// Import error handling utilities
const { 
  createErrorResponse, 
  createIpcErrorHandler, 
  ErrorCodes 
} = require('./utils/error-handler');

// Initialize secure storage
const store = new Store({
  encryptionKey: 'secure-linkedin-recruiter-key',
  name: 'secure-credentials'
});

// Create a global event bus for communicating between main and renderer processes
const eventBus = new EventEmitter();

// Set maximum listeners to avoid memory leak warnings
eventBus.setMaxListeners(50);

/**
 * Setup all IPC handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupIpcHandlers(workflowManager) {
  console.log('Setting up enhanced IPC handlers...');
  
  // Forward events from workflow manager components to the UI
  setupEventForwarding(workflowManager);
  
  // Authentication handlers
  setupAuthHandlers(workflowManager);
  
  // LinkedIn automation handlers
  setupLinkedInHandlers(workflowManager);
  
  // CV analysis handlers
  setupCVAnalysisHandlers(workflowManager);
  
  // Job management handlers
  setupJobHandlers(workflowManager);
  
  // Candidate management handlers
  setupCandidateHandlers(workflowManager);
  
  console.log('Enhanced IPC handlers setup complete');
}

/**
 * Setup event forwarding from backend to frontend
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupEventForwarding(workflowManager) {
  // Define all events that should be forwarded to the UI
  const eventsToForward = [
    // LinkedIn extraction events
    'extraction-started',
    'extraction-progress',
    'extraction-paused',
    'extraction-resumed',
    'extraction-completed',
    'extraction-error',
    
    // CV download events
    'cv-download-started',
    'cv-download-progress',
    'cv-download-completed',
    'cv-download-error',
    
    // CV analysis events
    'cv-analysis-progress',
    'cv-analysis-completed'
  ];
  
  // Setup event forwarding for LinkedIn automation events
  if (workflowManager.linkedInAutomation) {
    workflowManager.linkedInAutomation.on('extractionProgress', (data) => {
      eventBus.emit('extraction-progress', data);
    });
    
    workflowManager.linkedInAutomation.on('extractionCompleted', (data) => {
      eventBus.emit('extraction-completed', data);
    });
    
    workflowManager.linkedInAutomation.on('extractionError', (error) => {
      eventBus.emit('extraction-error', {
        error: error.message,
        context: error.context || 'LinkedIn automation error'
      });
    });
  }
  
  // Setup event listeners to forward events to renderer process
  eventsToForward.forEach(eventName => {
    eventBus.on(eventName, (data) => {
      // Forward the event to all renderer processes
      const windows = require('electron').BrowserWindow.getAllWindows();
      windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.webContents.send(eventName, data);
        }
      });
    });
  });
  
  // Add IPC handlers for listening to events
  ipcMain.on('register-event-listener', (event, { channel }) => {
    console.log(`Renderer process registered listener for ${channel}`);
  });
  
  ipcMain.on('unregister-event-listener', (event, { channel }) => {
    console.log(`Renderer process unregistered listener for ${channel}`);
  });
}

/**
 * Setup authentication handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupAuthHandlers(workflowManager) {
  // Login handler
  ipcMain.handle('auth:login', createIpcErrorHandler('auth:login', async (event, credentials) => {
    const { username, password } = credentials;
    const result = await workflowManager.dataStorage.authenticateUser(username, password);
    
    if (result.success) {
      return {
        success: true,
        user: result.user
      };
    } else {
      return createErrorResponse(
        result.error || 'Authentication failed',
        ErrorCodes.AUTH_ERROR
      );
    }
  }));
  
  // Logout handler
  ipcMain.handle('auth:logout', createIpcErrorHandler('auth:logout', async (event, sessionId) => {
    return await workflowManager.dataStorage.logout(sessionId);
  }));
  
  // Credential management handlers
  ipcMain.handle('get-credentials', createIpcErrorHandler('get-credentials', async () => {
    const credentials = store.get('linkedin');
    return { success: true, credentials };
  }));

  ipcMain.handle('save-credentials', createIpcErrorHandler('save-credentials', async (event, credentials) => {
    store.set('linkedin', credentials);
    return { success: true };
  }));

  ipcMain.handle('clear-credentials', createIpcErrorHandler('clear-credentials', async () => {
    store.delete('linkedin');
    return { success: true };
  }));
}

/**
 * Setup LinkedIn automation handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupLinkedInHandlers(workflowManager) {
  // Start LinkedIn browser
  ipcMain.handle('linkedin:startBrowser', createIpcErrorHandler('linkedin:startBrowser', async (event, options) => {
    console.log('linkedin:startBrowser handler called with options:', options);
    
    try {
      if (!workflowManager.linkedInAutomation || !workflowManager.linkedInAutomation.init) {
        console.error('linkedInAutomation is not available or init method is missing');
        return { 
          success: false, 
          error: 'LinkedIn automation module is not available' 
        };
      }
      
      console.log('Initializing LinkedIn browser...');
      if (!workflowManager.linkedInAutomation.browser) {
        await workflowManager.linkedInAutomation.init();
      }
      
      console.log('Checking if logged in...');
      const isLoggedIn = await workflowManager.linkedInAutomation.ensureLoggedIn();
      console.log('LinkedIn login status:', isLoggedIn);
      
      // Emit event to notify UI
      eventBus.emit('extraction-started', {
        status: 'browser-launched',
        isLoggedIn
      });
      
      console.log('linkedin:startBrowser completed successfully');
      return { 
        success: true, 
        isLoggedIn
      };
    } catch (error) {
      console.error('Error in linkedin:startBrowser handler:', error);
      eventBus.emit('extraction-error', {
        error: error.message,
        context: 'Browser startup failed'
      });
      throw error;
    }
  }));
  
  // LinkedIn login
  ipcMain.handle('linkedin:login', createIpcErrorHandler('linkedin:login', async (event, credentials) => {
    const userId = credentials.userId;
    delete credentials.userId;
    
    return await workflowManager.loginToLinkedIn(credentials, userId);
  }));
  
  // Extract applicants
  ipcMain.handle('linkedin:extractApplicants', createIpcErrorHandler('linkedin:extractApplicants', async (event, options) => {
    // Handle both string jobId and object with options
    let jobId, applicantViewId;
    
    if (typeof options === 'string') {
      jobId = options;
    } else if (typeof options === 'object') {
      jobId = options.jobId;
      applicantViewId = options.applicantViewId;
    } else {
      return createErrorResponse(
        'Invalid job ID or options provided',
        ErrorCodes.EXTRACTION_ERROR
      );
    }
    
    console.log(`Extracting applicants for job ID: ${jobId}${applicantViewId ? `, applicant view: ${applicantViewId}` : ''}`);
    
    // Start the extraction process
    eventBus.emit('extraction-started', {
      jobId,
      applicantViewId,
      estimatedApplicants: 0 // Will be updated when known
    });
    
    try {
      // Check if we're logged in first
      if (!workflowManager.linkedInAutomation.isLoggedIn) {
        await workflowManager.linkedInAutomation.ensureLoggedIn();
      }
      
      // Build options for the automation
      const extractionOptions = { jobId };
      if (applicantViewId) {
        extractionOptions.applicantViewId = applicantViewId;
      }
      
      // Navigate to applicants section
      await workflowManager.linkedInAutomation.navigateToApplicants(extractionOptions);
      
      // Get applicants with progress tracking
      const applicants = await workflowManager.linkedInAutomation.getApplicants(extractionOptions, {
        progressCallback: (progress) => {
          eventBus.emit('extraction-progress', progress);
        }
      });
      
      // Emit completion event
      eventBus.emit('extraction-completed', {
        jobId,
        applicantCount: applicants.length,
        applicants
      });
      
      return {
        success: true,
        applicants
      };
    } catch (error) {
      // Emit error event
      eventBus.emit('extraction-error', {
        jobId,
        error: error.message,
        context: 'Applicant extraction'
      });
      
      throw error;
    }
  }));
  
  // Pause extraction
  ipcMain.handle('linkedin:pauseExtraction', createIpcErrorHandler('linkedin:pauseExtraction', async () => {
    if (workflowManager.linkedInAutomation.pauseExtraction) {
      const result = await workflowManager.linkedInAutomation.pauseExtraction();
      eventBus.emit('extraction-paused', {
        pausedAt: Date.now()
      });
      return { success: true };
    } else {
      return createErrorResponse(
        'Pause functionality not available or no extraction in progress',
        ErrorCodes.EXTRACTION_ERROR
      );
    }
  }));
  
  // Resume extraction
  ipcMain.handle('linkedin:resumeExtraction', createIpcErrorHandler('linkedin:resumeExtraction', async () => {
    if (workflowManager.linkedInAutomation.resumeExtraction) {
      const result = await workflowManager.linkedInAutomation.resumeExtraction();
      eventBus.emit('extraction-resumed', {
        resumedAt: Date.now()
      });
      return { success: true };
    } else {
      return createErrorResponse(
        'Resume functionality not available or no extraction was paused',
        ErrorCodes.EXTRACTION_ERROR
      );
    }
  }));
  
  // Add App version handler
  ipcMain.handle('app:getVersion', createIpcErrorHandler('app:getVersion', async () => {
    console.log('app:getVersion handler called');
    try {
      const packageJson = require('./package.json');
      return { 
        success: true, 
        version: packageJson.version || '1.0.0'
      };
    } catch (error) {
      console.error('Error getting app version:', error);
      return { 
        success: true, 
        version: '1.0.0' // Fallback version
      };
    }
  }));
  
  // Cancel extraction
  ipcMain.handle('linkedin:cancelExtraction', createIpcErrorHandler('linkedin:cancelExtraction', async () => {
    if (workflowManager.linkedInAutomation.stopExtraction) {
      const result = await workflowManager.linkedInAutomation.stopExtraction();
      return { success: true };
    } else {
      return createErrorResponse(
        'Cancel functionality not available or no extraction in progress',
        ErrorCodes.EXTRACTION_ERROR
      );
    }
  }));
  
  // Connect to LinkedIn
  ipcMain.handle('connectToLinkedIn', createIpcErrorHandler('connectToLinkedIn', async (event, data) => {
    return await workflowManager.connectToLinkedIn(data?.userId);
  }));
}

/**
 * Setup CV analysis handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupCVAnalysisHandlers(workflowManager) {
  // Analyze CV
  ipcMain.handle('cv:analyze', createIpcErrorHandler('cv:analyze', async (event, data) => {
    try {
      const { cvPath, jobRequirements } = data;
      
      // Verify the file exists
      if (!fs.existsSync(cvPath)) {
        return createErrorResponse(
          `CV file not found at path: ${cvPath}`,
          ErrorCodes.DOWNLOAD_ERROR
        );
      }
      
      // Notify UI that analysis has started
      eventBus.emit('cv-analysis-progress', {
        stage: 'starting',
        progress: 0,
        filePath: cvPath
      });
      
      // Analyze the CV with progress updates
      const analysisPromise = workflowManager.analyzeCV(cvPath, jobRequirements);
      
      // Simulate progress updates (since the current implementation might not have them)
      const progressStages = [
        { stage: 'extraction', progress: 25 },
        { stage: 'parsing', progress: 50 },
        { stage: 'matching', progress: 75 },
        { stage: 'scoring', progress: 90 }
      ];
      
      // Send progress updates with delays
      for (const stage of progressStages) {
        await new Promise(resolve => setTimeout(resolve, 500));
        eventBus.emit('cv-analysis-progress', {
          ...stage,
          filePath: cvPath
        });
      }
      
      // Wait for analysis to complete
      const result = await analysisPromise;
      
      // Notify UI that analysis has completed
      eventBus.emit('cv-analysis-completed', {
        filePath: cvPath,
        analysis: result.analysis
      });
      
      return result;
    } catch (error) {
      // Notify UI of analysis error
      eventBus.emit('cv-analysis-progress', {
        stage: 'error',
        error: error.message,
        filePath: data?.cvPath
      });
      
      throw error;
    }
  }));
  
  // List downloaded CVs
  ipcMain.handle('cv:list', createIpcErrorHandler('cv:list', async () => {
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
      return createErrorResponse(
        `Error listing CV files: ${error.message}`,
        ErrorCodes.DOWNLOAD_ERROR,
        'CV file listing'
      );
    }
  }));
}

/**
 * Setup job management handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupJobHandlers(workflowManager) {
  // Get all jobs
  ipcMain.handle('jobs:getAll', createIpcErrorHandler('jobs:getAll', async () => {
    if (!workflowManager.dataStorage?.jobModel) {
      return createErrorResponse(
        'Job model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const jobs = await workflowManager.dataStorage.jobModel.getAll();
    return { success: true, jobs };
  }));
  
  // Get job details
  ipcMain.handle('jobs:getDetails', createIpcErrorHandler('jobs:getDetails', async (event, jobId) => {
    if (!workflowManager.dataStorage?.jobModel) {
      return createErrorResponse(
        'Job model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const job = await workflowManager.dataStorage.jobModel.getById(jobId);
    return { success: true, job };
  }));
  
  // Create job
  ipcMain.handle('jobs:create', createIpcErrorHandler('jobs:create', async (event, jobData) => {
    if (!workflowManager.dataStorage?.jobModel) {
      return createErrorResponse(
        'Job model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const job = await workflowManager.dataStorage.jobModel.create(jobData);
    return { success: true, job };
  }));
  
  // Update job
  ipcMain.handle('jobs:update', createIpcErrorHandler('jobs:update', async (event, jobId, jobData) => {
    if (!workflowManager.dataStorage?.jobModel) {
      return createErrorResponse(
        'Job model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const job = await workflowManager.dataStorage.jobModel.update(jobId, jobData);
    return { success: true, job };
  }));
}

/**
 * Setup candidate management handlers
 * @param {Object} workflowManager - The workflow manager instance
 */
function setupCandidateHandlers(workflowManager) {
  // Get all candidates
  ipcMain.handle('candidates:getAll', createIpcErrorHandler('candidates:getAll', async (event, options = {}) => {
    if (!workflowManager.dataStorage?.candidateModel) {
      return createErrorResponse(
        'Candidate model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const candidates = await workflowManager.dataStorage.candidateModel.getAll(options);
    return { success: true, candidates };
  }));
  
  // Get candidate details
  ipcMain.handle('candidates:getDetails', createIpcErrorHandler('candidates:getDetails', async (event, id) => {
    if (!workflowManager.dataStorage?.candidateModel) {
      return createErrorResponse(
        'Candidate model not available',
        ErrorCodes.DATABASE_ERROR
      );
    }
    
    const candidate = await workflowManager.dataStorage.candidateModel.getWithDetails(id);
    return { success: true, candidate };
  }));
  
  // Evaluate candidate
  ipcMain.handle('candidates:evaluate', createIpcErrorHandler('candidates:evaluate', async (event, id, jobId) => {
    try {
      const evaluation = await workflowManager.evaluateCandidate(id, jobId);
      return { success: true, evaluation };
    } catch (error) {
      return createErrorResponse(
        `Failed to evaluate candidate: ${error.message}`,
        ErrorCodes.ANALYSIS_ERROR,
        'Candidate evaluation'
      );
    }
  }));
}

module.exports = { 
  setupIpcHandlers,
  eventBus
};