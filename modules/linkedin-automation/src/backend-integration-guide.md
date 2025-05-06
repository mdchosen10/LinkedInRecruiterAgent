# LinkedIn Automation - Backend Integration Guide

This document provides detailed specifications for integrating the enhanced LinkedIn Automation module with the backend systems of the LinkedIn Recruiter Agent. It's specifically designed for the Backend Integration Engineer.

## Event System Integration

The enhanced LinkedIn Automation module uses a standardized event system based on Node.js EventEmitter. All events follow the standardized format specified in the API Contract.

### Event Names and Data Structures

| Event Name | Description | Data Structure |
|------------|-------------|----------------|
| `extraction-started` | Emitted when applicant extraction begins | `{ jobId, estimatedTotal, timestamp }` |
| `extraction-progress` | Emitted during extraction with current progress | `{ current, total, percentage, currentApplicant, timestamp }` |
| `extraction-paused` | Emitted when extraction is paused | `{ current, total, percentage, timestamp, pauseReason }` |
| `extraction-resumed` | Emitted when extraction is resumed | `{ current, total, percentage, timestamp }` |
| `extraction-completed` | Emitted when extraction is finished | `{ applicants, total, timestamp, completionTime }` |
| `extraction-error` | Emitted when an error occurs during extraction | `{ error, errorCode, context, timestamp, recoverable, partial }` |
| `cv-download-started` | Emitted when CV download begins | `{ profileId, profileName, timestamp }` |
| `cv-download-progress` | Emitted during CV download with progress | `{ profileId, profileName, percentage, timestamp }` |
| `cv-download-completed` | Emitted when CV download is completed | `{ profileId, profileName, filePath, fileSize, timestamp }` |
| `cv-download-error` | Emitted when an error occurs during CV download | `{ profileId, profileName, error, errorCode, timestamp }` |
| `batch-started` | Emitted when a batch processing begins | `{ batchId, batchSize, totalBatches, currentBatch, timestamp }` |
| `batch-completed` | Emitted when a batch is completed | `{ batchId, processedItems, successfulItems, failedItems, totalBatches, currentBatch, timestamp }` |

### Error Codes

All error events include a standardized error code from this list:

- `AUTH_ERROR` - Authentication-related errors
- `NAVIGATION_ERROR` - Page navigation failures
- `TIMEOUT_ERROR` - Operation timeouts
- `RATE_LIMIT_ERROR` - LinkedIn rate limiting detected
- `SECURITY_CHECK_ERROR` - Security checks or CAPTCHA detected
- `DOWNLOAD_ERROR` - File download issues
- `PARSING_ERROR` - Data parsing/extraction problems
- `GENERAL_ERROR` - Other general errors
- `UNKNOWN_ERROR` - Unclassified errors

## IPC Handler Implementation

Here's how to implement IPC (Inter-Process Communication) handlers for the LinkedIn Automation module in the Electron main process:

```javascript
const { ipcMain } = require('electron');
const EnhancedLinkedInAutomation = require('./enhanced-linkedin-automation');

// Single instance of the automation class
let linkedInAutomation = null;

// Initialize LinkedIn automation
function initLinkedInAutomation(options = {}) {
  if (!linkedInAutomation) {
    linkedInAutomation = new EnhancedLinkedInAutomation(options);
    
    // Forward all events to renderer process
    const eventTypes = [
      'extraction-started', 'extraction-progress', 'extraction-paused',
      'extraction-resumed', 'extraction-completed', 'extraction-error',
      'cv-download-started', 'cv-download-progress', 'cv-download-completed',
      'cv-download-error', 'batch-started', 'batch-completed'
    ];
    
    eventTypes.forEach(eventType => {
      linkedInAutomation.on(eventType, (data) => {
        // Send to all renderer processes or specific window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(`linkedin:${eventType}`, data);
        }
      });
    });
  }
  
  return linkedInAutomation;
}

// Set up IPC handlers
function setupLinkedInAutomationHandlers() {
  // Initialize and login
  ipcMain.handle('linkedin:init', async (event, options) => {
    try {
      const automation = initLinkedInAutomation(options);
      await automation.init();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:login', async (event, { useStoredCredentials, email, password, rememberCredentials }) => {
    try {
      const automation = initLinkedInAutomation();
      if (useStoredCredentials) {
        await automation.ensureLoggedIn();
      } else {
        await automation.login(email, password, rememberCredentials);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Extraction methods
  ipcMain.handle('linkedin:getApplicants', async (event, { jobId, options }) => {
    try {
      const automation = initLinkedInAutomation();
      // Start the extraction in a non-blocking way
      // Actual results will come through events
      automation.getApplicants(jobId, options).catch(error => {
        console.error('Extraction error:', error);
      });
      
      return { success: true, message: 'Extraction started' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:processJobApplicants', async (event, { jobId, options }) => {
    try {
      const automation = initLinkedInAutomation();
      // Start the processing in a non-blocking way
      automation.processJobApplicants(jobId, options).catch(error => {
        console.error('Processing error:', error);
      });
      
      return { success: true, message: 'Processing started' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Control methods
  ipcMain.handle('linkedin:pauseOperation', async () => {
    try {
      const automation = initLinkedInAutomation();
      const result = await automation.pauseOperation();
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:resumeOperation', async () => {
    try {
      const automation = initLinkedInAutomation();
      const result = await automation.resumeOperation();
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:stopOperation', async () => {
    try {
      const automation = initLinkedInAutomation();
      const result = await automation.stopOperation();
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('linkedin:getOperationState', async () => {
    try {
      const automation = initLinkedInAutomation();
      const state = automation.getOperationState();
      return { success: true, state };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // CV Download
  ipcMain.handle('linkedin:downloadCV', async (event, { profileUrl, fileName }) => {
    try {
      const automation = initLinkedInAutomation();
      // Start download in a non-blocking way
      automation.downloadCV(profileUrl, fileName).catch(error => {
        console.error('Download error:', error);
      });
      
      return { success: true, message: 'Download started' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

## Batch Size Configuration Guidelines

Batch sizes can be configured based on the environment and performance needs:

| Environment | Recommended Batch Size | Pause Between Batches | Max Concurrent |
|-------------|------------------------|------------------------|----------------|
| Development | 3-5 | 2000ms | 1 |
| Testing | 5-10 | 3000ms | 1 |
| Production (Standard) | 10-15 | 5000ms | 1 |
| Production (High Performance) | 20-30 | 8000ms | 2 |

### Configuration Factors

When adjusting batch sizes, consider:

1. **LinkedIn Rate Limits**: LinkedIn may throttle requests if they come too frequently
2. **Network Reliability**: Larger batch sizes are more vulnerable to network issues
3. **Memory Usage**: Processing many profiles at once requires more memory
4. **User Experience**: Smaller batches provide more frequent progress updates

## Integration Testing

To test the integration, use the provided integration test script:

```javascript
const { testApplicantExtraction, testCVDownload, testBatchProcessing } = require('./integration-test');

// Test with a specific LinkedIn job ID
testApplicantExtraction('3175553313')
  .then(result => console.log('Test result:', result))
  .catch(error => console.error('Test error:', error));
```

## Common Integration Issues

| Issue | Solution |
|-------|----------|
| Events not received in renderer | Ensure proper event forwarding in the main process |
| Extraction stops unexpectedly | Check for rate limiting or LinkedIn security checks |
| High memory usage | Reduce batch size or max concurrent operations |
| Slow extraction speed | Increase batch size but ensure it doesn't trigger rate limiting |
| IPC timeout errors | Increase IPC timeout settings in Electron |

## Additional Resources

For further assistance with integration, refer to:

1. The LinkedIn Automation event standardization module
2. Integration test examples
3. The EnhancedLinkedInAutomation class documentation
