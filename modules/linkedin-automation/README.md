# Enhanced LinkedIn Automation Module

This module provides enhanced LinkedIn automation capabilities for the LinkedIn Recruiter Agent, focusing on applicant extraction, batch processing, and CV downloading with comprehensive event-based progress tracking.

## Features

### 1. Standardized Event Emission
- Real-time progress tracking for all operations
- Standardized event names and data structures
- Consistent error codes and handling

### 2. Batch Processing Support
- Configurable batch sizes for efficient applicant processing
- Cooldown periods between batches to avoid rate limiting
- Progress tracking per batch and overall operation

### 3. Pause/Resume Functionality
- State tracking for long-running processes
- Clean pause points that preserve operation state
- Methods to control ongoing operations

### 4. Enhanced Error Handling
- Multi-level retry mechanisms with exponential backoff
- Preservation of partial results on failure
- Detailed error reporting with context information

### 5. Optimized CV Downloading
- Multiple download detection strategies
- Improved reliability with automatic retries
- Detailed download progress tracking

## Installation

The enhanced LinkedIn automation module is designed to be used within an Electron application. It's already integrated with the LinkedIn Recruiter Agent project.

```bash
# No additional installation needed - module is included in project
```

## Usage

### Basic Initialization

```javascript
const { EnhancedLinkedInAutomation } = require('./modules/linkedin-automation');

const automation = new EnhancedLinkedInAutomation({
  headless: false,
  downloadPath: './downloads',
  userDataDir: './user_data',
  batchOptions: {
    batchSize: 5,
    pauseBetweenBatches: 3000
  }
});

await automation.init();
await automation.ensureLoggedIn();
```

### Extracting Applicants with Progress Tracking

```javascript
// Set up event listeners for progress tracking
automation.on('extraction-started', data => {
  console.log(`Starting extraction. Estimated applicants: ${data.estimatedTotal}`);
  // Update UI with start information
});

automation.on('extraction-progress', data => {
  console.log(`Progress: ${data.current}/${data.total} (${data.percentage}%)`);
  console.log(`Current applicant: ${data.currentApplicant}`);
  // Update progress bar in UI
});

automation.on('extraction-completed', data => {
  console.log(`Extraction completed. Total applicants: ${data.applicants.length}`);
  // Process the extracted applicants
});

// Start extraction
const jobId = '3175553313'; // LinkedIn job ID
const options = {
  batchSize: 5,
  maxApplicants: 100,
  pauseBetweenBatches: 3000
};

const applicants = await automation.getApplicants(jobId, options);
```

### Pause and Resume Operations

```javascript
// Start extraction in a non-blocking way
const extractionPromise = automation.getApplicants(jobId, options);

// Later, pause the operation
await automation.pauseOperation();
console.log('Operation paused');

// Get current state
const state = automation.getOperationState();
console.log(`Current progress: ${state.progress.percentage}%`);

// Resume when ready
await automation.resumeOperation();
console.log('Operation resumed');

// Wait for completion
const applicants = await extractionPromise;
```

### Processing Job Applicants with Full Features

```javascript
// Process job applicants with detailed profiles and CV downloads
const enhancedApplicants = await automation.processJobApplicants(jobId, {
  batchSize: 5,
  maxApplicants: 50,
  getDetailedProfiles: true,
  downloadCVs: true
});
```

### Enhanced CV Downloading

```javascript
// Listen for CV download events
automation.on('cv-download-started', data => {
  console.log(`Starting CV download for ${data.profileName}`);
});

automation.on('cv-download-progress', data => {
  console.log(`Download progress: ${data.percentage}%`);
});

automation.on('cv-download-completed', data => {
  console.log(`Download completed: ${data.filePath}`);
});

// Download CV for a profile
const result = await automation.downloadCV(
  'https://www.linkedin.com/in/john-doe-123456/',
  'John_Doe_CV.pdf'
);

if (result.success) {
  console.log(`CV downloaded to: ${result.filePath}`);
} else {
  console.error(`Download failed: ${result.message}`);
}
```

## Event System

The module uses a standardized event system for real-time progress tracking:

| Event Name | Description | Data Structure |
|------------|-------------|----------------|
| `extraction-started` | Emitted when extraction begins | `{ jobId, estimatedTotal, timestamp }` |
| `extraction-progress` | Emitted during extraction | `{ current, total, percentage, currentApplicant, timestamp }` |
| `extraction-paused` | Emitted when extraction is paused | `{ current, total, percentage, timestamp, pauseReason }` |
| `extraction-resumed` | Emitted when extraction is resumed | `{ current, total, percentage, timestamp }` |
| `extraction-completed` | Emitted when extraction is finished | `{ applicants, total, timestamp, completionTime }` |
| `extraction-error` | Emitted when an error occurs | `{ error, errorCode, context, timestamp, recoverable, partial }` |
| `cv-download-started` | Emitted when CV download begins | `{ profileId, profileName, timestamp }` |
| `cv-download-progress` | Emitted during CV download | `{ profileId, profileName, percentage, timestamp }` |
| `cv-download-completed` | Emitted when CV download is completed | `{ profileId, profileName, filePath, fileSize, timestamp }` |
| `cv-download-error` | Emitted when download error occurs | `{ profileId, profileName, error, errorCode, timestamp }` |
| `batch-started` | Emitted when batch processing begins | `{ batchId, batchSize, totalBatches, currentBatch, timestamp }` |
| `batch-completed` | Emitted when batch is completed | `{ batchId, processedItems, successfulItems, failedItems, totalBatches, currentBatch, timestamp }` |

## Electron Integration

The module includes enhanced Electron integration for seamless usage in the LinkedIn Recruiter Agent:

```javascript
const { app } = require('electron');
const { initializeAutomation } = require('./modules/linkedin-automation/enhanced-electron-integration');

app.on('ready', () => {
  // Initialize automation when app is ready
  initializeAutomation({
    batchOptions: {
      batchSize: 10,
      pauseBetweenBatches: 5000
    }
  });
  
  // Create window and set up UI
  createWindow();
});
```

## Configuration Options

### Main Options

| Option | Description | Default |
|--------|-------------|---------|
| `headless` | Run browser in headless mode | `false` |
| `downloadPath` | Path for downloads | `'./downloads'` |
| `userDataDir` | Path for browser user data | `'./user_data'` |

### Rate Limiting Options

| Option | Description | Default |
|--------|-------------|---------|
| `rateLimit.requestsPerHour` | Maximum requests per hour | `30` |
| `rateLimit.cooldownPeriod` | Milliseconds between actions | `10000` |

### Batch Processing Options

| Option | Description | Default |
|--------|-------------|---------|
| `batchOptions.batchSize` | Number of items per batch | `5` |
| `batchOptions.pauseBetweenBatches` | Milliseconds between batches | `3000` |
| `batchOptions.maxConcurrent` | Maximum concurrent operations | `1` |

### Retry Options

| Option | Description | Default |
|--------|-------------|---------|
| `retryOptions.maxRetries` | Maximum retry attempts | `3` |
| `retryOptions.retryDelay` | Base delay between retries (ms) | `5000` |

### Download Options

| Option | Description | Default |
|--------|-------------|---------|
| `downloadOptions.timeout` | Download timeout (ms) | `30000` |
| `downloadOptions.retryAttempts` | Download retry attempts | `3` |

## Testing

The module includes comprehensive integration tests:

```javascript
const { integrationTests } = require('./modules/linkedin-automation');

// Run applicant extraction test
integrationTests.testApplicantExtraction('3175553313')
  .then(result => console.log('Test result:', result))
  .catch(error => console.error('Test error:', error));
```

## Backward Compatibility

The module maintains backward compatibility with the original LinkedIn Automation implementation:

```javascript
const { LinkedInAutomation } = require('./modules/linkedin-automation');

// Use original implementation if needed
const originalAutomation = new LinkedInAutomation();
```

## License

This module is proprietary and for use only within the LinkedIn Recruiter Agent application.