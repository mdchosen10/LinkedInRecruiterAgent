/**
 * LinkedIn Automation Integration Tests
 * 
 * These tests validate the enhanced LinkedInAutomation features according to
 * the testing workflows defined in the Project Coordination Package.
 */

const EnhancedLinkedInAutomation = require('./enhanced-linkedin-automation');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Test the enhanced getApplicants method with event tracking
 * @param {string} jobId - Job ID to test with
 */
async function testApplicantExtraction(jobId) {
  console.log('STARTING TEST: Applicant Extraction');
  
  const automation = new EnhancedLinkedInAutomation({
    headless: false,
    downloadPath: path.join(__dirname, '../../data/downloads'),
    userDataDir: path.join(__dirname, '../../user_data'),
  });
  
  // Track events
  const events = [];
  automation.on('extraction-started', data => {
    console.log('Event: extraction-started', JSON.stringify(data, null, 2));
    events.push({ type: 'extraction-started', data, timestamp: Date.now() });
  });
  
  automation.on('extraction-progress', data => {
    console.log('Event: extraction-progress', data.current, '/', data.total, '(', data.percentage, '%)');
    events.push({ type: 'extraction-progress', data, timestamp: Date.now() });
  });
  
  automation.on('extraction-completed', data => {
    console.log('Event: extraction-completed', 'Applicants:', data.applicants.length);
    events.push({ type: 'extraction-completed', data, timestamp: Date.now() });
  });
  
  automation.on('extraction-error', data => {
    console.error('Event: extraction-error', data.error, data.context);
    events.push({ type: 'extraction-error', data, timestamp: Date.now() });
  });
  
  automation.on('extraction-paused', data => {
    console.log('Event: extraction-paused', data.current, '/', data.total);
    events.push({ type: 'extraction-paused', data, timestamp: Date.now() });
  });
  
  automation.on('extraction-resumed', data => {
    console.log('Event: extraction-resumed', data.current, '/', data.total);
    events.push({ type: 'extraction-resumed', data, timestamp: Date.now() });
  });
  
  automation.on('batch-started', data => {
    console.log('Event: batch-started', 'Batch', data.currentBatch, 'of', data.totalBatches);
    events.push({ type: 'batch-started', data, timestamp: Date.now() });
  });
  
  automation.on('batch-completed', data => {
    console.log('Event: batch-completed', 'Processed:', data.processedItems, 'Success:', data.successfulItems);
    events.push({ type: 'batch-completed', data, timestamp: Date.now() });
  });
  
  try {
    await automation.init();
    await automation.ensureLoggedIn();
    
    console.log('Starting applicant extraction for job', jobId);
    
    // Start the extraction process
    const options = {
      batchSize: 3, // Small batch size for testing
      maxApplicants: 10, // Limit for testing
      pauseBetweenBatches: 2000
    };
    
    // Start in a separate process so we can test pause/resume
    const extractionPromise = automation.getApplicants(jobId, options);
    
    // Wait 5 seconds then pause
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Testing pause functionality...');
    await automation.pauseOperation();
    
    // Wait 3 seconds then resume
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Testing resume functionality...');
    await automation.resumeOperation();
    
    // Wait for completion
    const applicants = await extractionPromise;
    
    console.log('Extraction completed, found', applicants.length, 'applicants');
    
    // Save test results
    const resultsPath = path.join(__dirname, '../../data/test-results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsPath, `extraction-test-${Date.now()}.json`),
      JSON.stringify({ 
        applicants, 
        events, 
        stats: automation.getOperationState() 
      }, null, 2)
    );
    
    console.log('Test results saved to', resultsPath);
    
    // Close the browser
    await automation.close();
    console.log('TEST COMPLETED: Applicant Extraction');
    
    return {
      success: true,
      applicantCount: applicants.length,
      eventCount: events.length
    };
  } catch (error) {
    console.error('Test failed:', error);
    
    // Try to close browser even if test fails
    try {
      await automation.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test the CV download functionality
 * @param {string} profileUrl - Profile URL to test with
 */
async function testCVDownload(profileUrl) {
  console.log('STARTING TEST: CV Download');
  
  const automation = new EnhancedLinkedInAutomation({
    headless: false,
    downloadPath: path.join(__dirname, '../../data/downloads'),
    userDataDir: path.join(__dirname, '../../user_data'),
  });
  
  // Track events
  const events = [];
  automation.on('cv-download-started', data => {
    console.log('Event: cv-download-started', JSON.stringify(data, null, 2));
    events.push({ type: 'cv-download-started', data, timestamp: Date.now() });
  });
  
  automation.on('cv-download-progress', data => {
    console.log('Event: cv-download-progress', data.percentage, '%');
    events.push({ type: 'cv-download-progress', data, timestamp: Date.now() });
  });
  
  automation.on('cv-download-completed', data => {
    console.log('Event: cv-download-completed', data.filePath);
    events.push({ type: 'cv-download-completed', data, timestamp: Date.now() });
  });
  
  automation.on('cv-download-error', data => {
    console.error('Event: cv-download-error', data.error);
    events.push({ type: 'cv-download-error', data, timestamp: Date.now() });
  });
  
  try {
    await automation.init();
    await automation.ensureLoggedIn();
    
    console.log('Testing CV download for profile', profileUrl);
    
    // Perform CV download
    const result = await automation.downloadCV(profileUrl);
    
    console.log('Download result:', result);
    
    // Save test results
    const resultsPath = path.join(__dirname, '../../data/test-results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsPath, `cv-download-test-${Date.now()}.json`),
      JSON.stringify({ result, events }, null, 2)
    );
    
    // Close the browser
    await automation.close();
    console.log('TEST COMPLETED: CV Download');
    
    return {
      success: true,
      downloadSuccess: result.success,
      filePath: result.filePath,
      eventCount: events.length
    };
  } catch (error) {
    console.error('Test failed:', error);
    
    // Try to close browser even if test fails
    try {
      await automation.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test batch processing functionality
 * @param {string} jobId - Job ID to test with
 */
async function testBatchProcessing(jobId) {
  console.log('STARTING TEST: Batch Processing');
  
  const automation = new EnhancedLinkedInAutomation({
    headless: false,
    downloadPath: path.join(__dirname, '../../data/downloads'),
    userDataDir: path.join(__dirname, '../../user_data'),
    batchOptions: {
      batchSize: 3,
      pauseBetweenBatches: 2000,
      maxConcurrent: 1
    }
  });
  
  // Track events
  const events = [];
  ['extraction-started', 'extraction-progress', 'extraction-completed', 
   'extraction-error', 'batch-started', 'batch-completed'].forEach(eventType => {
    automation.on(eventType, data => {
      console.log(`Event: ${eventType}`, data);
      events.push({ type: eventType, data, timestamp: Date.now() });
    });
  });
  
  try {
    await automation.init();
    await automation.ensureLoggedIn();
    
    console.log('Testing batch processing for job', jobId);
    
    // Test full job processing with detailed profiles
    const results = await automation.processJobApplicants(jobId, {
      maxApplicants: 10,
      getDetailedProfiles: true,
      downloadCVs: false // Set to true to also test CV downloads
    });
    
    console.log('Processing completed, processed', results.length, 'applicants');
    
    // Save test results
    const resultsPath = path.join(__dirname, '../../data/test-results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsPath, `batch-test-${Date.now()}.json`),
      JSON.stringify({
        results,
        events,
        stats: automation.getOperationState()
      }, null, 2)
    );
    
    // Export operation results
    automation.exportOperationResults(
      path.join(resultsPath, `batch-stats-${Date.now()}.json`)
    );
    
    // Close the browser
    await automation.close();
    console.log('TEST COMPLETED: Batch Processing');
    
    return {
      success: true,
      applicantCount: results.length,
      eventCount: events.length
    };
  } catch (error) {
    console.error('Test failed:', error);
    
    // Try to close browser even if test fails
    try {
      await automation.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests
 * @param {Object} config - Test configuration
 */
async function runAllTests(config = {}) {
  const results = {
    extractionTest: null,
    cvDownloadTest: null,
    batchProcessingTest: null,
    timestamp: Date.now()
  };
  
  // Run extraction test if job ID provided
  if (config.jobId) {
    results.extractionTest = await testApplicantExtraction(config.jobId);
  }
  
  // Run CV download test if profile URL provided
  if (config.profileUrl) {
    results.cvDownloadTest = await testCVDownload(config.profileUrl);
  }
  
  // Run batch processing test if job ID provided
  if (config.jobId) {
    results.batchProcessingTest = await testBatchProcessing(config.jobId);
  }
  
  // Print summary
  console.log('\n===== TEST SUMMARY =====');
  console.log('Extraction Test:', results.extractionTest ? 
    (results.extractionTest.success ? 'PASS' : 'FAIL') : 'SKIPPED');
  console.log('CV Download Test:', results.cvDownloadTest ? 
    (results.cvDownloadTest.success ? 'PASS' : 'FAIL') : 'SKIPPED');
  console.log('Batch Processing Test:', results.batchProcessingTest ? 
    (results.batchProcessingTest.success ? 'PASS' : 'FAIL') : 'SKIPPED');
  
  return results;
}

// Allow running from command line
if (require.main === module) {
  const argv = require('minimist')(process.argv.slice(2));
  
  // Show usage if no args
  if (!argv.jobId && !argv.profileUrl) {
    console.log('Usage: node integration-test.js --jobId=<linkedin_job_id> --profileUrl=<linkedin_profile_url>');
    console.log('Example: node integration-test.js --jobId=3175553313 --profileUrl=john-doe-123456');
    process.exit(1);
  }
  
  // Run tests with provided configs
  runAllTests({
    jobId: argv.jobId,
    profileUrl: argv.profileUrl,
    mode: argv.mode || 'all'
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  testApplicantExtraction,
  testCVDownload,
  testBatchProcessing,
  runAllTests
};