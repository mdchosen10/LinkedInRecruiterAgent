/**
 * Integration Test Script
 * Tests the integration between modules to ensure they work together properly
 */
const path = require('path');
const fs = require('fs');

// Determine whether to use test or default config
const configName = process.env.NODE_ENV === 'test' ? 'test' : 'default';
const config = require(`./config/${configName}`);

// This correctly imports the initialize function from data-storage.js
const { initialize: initializeDataStorage } = require('./modules/data-storage/data-storage');

// Check that these match the actual exports
const LinkedInAutomation = require('./modules/linkedin-automation/linkedin-automation');
const CandidateEvaluationEngine = require('./modules/evaluation-engine/candidate-evaluation-engine');
const { createMessageGenerator } = require('./modules/message-generator');
const WorkflowManager = require('./integration/workflow-manager');

// Create test database directory if it doesn't exist
const testDbDir = path.dirname(config.dataStorage.database.path);
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

const backupDir = config.dataStorage.database.backupPath;
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function runIntegrationTest() {
  console.log(`Starting integration test with ${configName} configuration...`);
  
  try {
    console.log('1. Initializing data storage...');
    const storageComponents = await initializeDataStorage({
      databasePath: config.dataStorage.database.path,
      backupPath: config.dataStorage.database.backupPath
    });
    
    const dataStorage = storageComponents.dbManager;
    const integrationService = storageComponents.integrationService;
    
    console.log('2. Initializing LinkedIn automation...');
    const linkedInAutomation = new LinkedInAutomation({
      rateLimiting: config.linkedInAutomation.rateLimiting,
      browser: config.linkedInAutomation.browser
    });
    
    console.log('3. Initializing evaluation engine...');
    const evaluationEngine = new CandidateEvaluationEngine({
      apiKey: config.evaluationEngine.apiKey,
      model: config.evaluationEngine.model
    });
    
    console.log('4. Initializing message generator...');
    const messageGenerator = createMessageGenerator({
      templatesDir: config.messageGenerator.templatesDir,
      defaultTemplatesDir: config.messageGenerator.defaultTemplatesDir
    });
    
    console.log('5. Initializing workflow manager...');
    const workflowManager = new WorkflowManager({
      dataStorage: integrationService,
      linkedInAutomation,
      evaluationEngine,
      messageGenerator
    });
    
    // Test LinkedIn authentication
    console.log('6. Testing LinkedIn authentication...');
    const credentials = config.linkedInAutomation.credentials;
    
    try {
      if (credentials.username !== 'test@example.com' && credentials.password !== 'replaceme') {
        const loginResult = await workflowManager.loginToLinkedIn(credentials, 1);
        console.log('LinkedIn login result:', loginResult);
      } else {
        console.log('Skipping LinkedIn login test - no valid credentials provided');
      }
    } catch (error) {
      console.error('LinkedIn login error:', error);
      console.log('Continuing with other tests...');
    }
    
    // Test database operations
    console.log('7. Testing database operations...');
    const testUser = config.test.user;
    
    try {
      // Create test user
      const userResult = await integrationService.createUser(testUser);
      console.log('User creation result:', userResult);
      
      // Create test job
      const jobResult = await integrationService.createJob(config.test.job, userResult.user.id);
      console.log('Job creation result:', jobResult);
      
      // Mock candidate data if not using LinkedIn
      if (credentials.username === 'test@example.com' || credentials.password === 'replaceme') {
        console.log('Using mock candidate data...');
        for (const candidate of config.test.mockCandidates) {
          const savedCandidate = await integrationService.saveCandidate(candidate, userResult.user.id);
          console.log(`Saved mock candidate: ${candidate.name}`);
        }
      }
    } catch (error) {
      console.error('Database operation error:', error);
    }
    
    // Test message generation
    console.log('8. Testing message generation...');
    try {
      const messageData = {
        candidateName: 'John Smith',
        position: config.test.job.title,
        companyName: config.test.job.company,
        recruiterName: config.test.user.name,
        candidateSkills: ['JavaScript', 'React', 'Node.js']
      };
      
      const message = messageGenerator.generateMessageForScenario('interview', messageData);
      console.log('Generated message:', message);
    } catch (error) {
      console.error('Message generation error:', error);
    }
    
    // Test candidate evaluation
    console.log('9. Testing candidate evaluation...');
    try {
      // Retrieve a candidate from the database
      const candidates = await integrationService.candidateModel.getAll({ limit: 1 });
      if (candidates && candidates.length > 0) {
        const jobId = 1; // Assuming the first job
        const evaluation = await workflowManager.evaluateCandidate(candidates[0].id, jobId, 1);
        console.log('Candidate evaluation result:', evaluation);
      } else {
        console.log('No candidates available for evaluation test');
      }
    } catch (error) {
      console.error('Candidate evaluation error:', error);
    }
    
    console.log('Integration test completed.');
    
    // Clean up
    if (linkedInAutomation.close) {
      await linkedInAutomation.close();
    }
    
  } catch (error) {
    console.error('Integration test failed:', error);
  }
}

// Run the test
runIntegrationTest().catch(console.error);