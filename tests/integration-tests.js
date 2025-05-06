/**
 * LinkedIn Recruiter Agent - Integration Tests
 * 
 * This script tests the integration between different components of the application.
 * Run with: node tests/integration-tests.js
 */

const assert = require('assert');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Import modules
const LinkedInAutomation = require('../modules/linkedin-automation/linkedin-automation');
const CandidateEvaluationEngine = require('../modules/evaluation-engine/candidate-evaluation-engine');
const WorkflowManager = require('../integration/workflow-manager');
const { setupIpcHandlers } = require('../ipc-handlers');

// Mock IPC for testing
class MockIPC {
  constructor() {
    this.handlers = {};
    this.events = {};
  }
  
  handle(channel, handler) {
    this.handlers[channel] = handler;
  }
  
  invoke(channel, ...args) {
    if (!this.handlers[channel]) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }
    return this.handlers[channel]({}, ...args);
  }
  
  on(channel, listener) {
    if (!this.events[channel]) {
      this.events[channel] = [];
    }
    this.events[channel].push(listener);
  }
  
  emit(channel, ...args) {
    if (this.events[channel]) {
      this.events[channel].forEach(listener => listener({}, ...args));
    }
  }
}

// Test runner
async function runTests() {
  console.log('Starting integration tests...');
  
  // Create mock services
  const mockLinkedInAutomation = new LinkedInAutomation({
    headless: true,
    downloadPath: path.join(__dirname, 'test_downloads'),
    userDataDir: path.join(__dirname, 'test_user_data')
  });
  
  const mockEvaluationEngine = {
    evaluateCandidate: async () => ({
      overallScore: 8.5,
      scores: {
        technicalSkills: 9,
        relevantExperience: 8,
        education: 7,
        cultureFit: 9,
        achievements: 8
      },
      strengths: ['Strong technical skills', 'Good cultural fit'],
      weaknesses: ['Limited industry experience'],
      recommendation: 'interview'
    })
  };
  
  const mockDataStorage = {
    candidateModel: {
      getWithDetails: async () => ({
        id: 1,
        name: 'John Doe',
        current_title: 'Software Engineer',
        current_company: 'Tech Corp',
        skills: [{ skill: 'JavaScript' }, { skill: 'React' }],
        experiences: [],
        education: []
      })
    },
    jobModel: {
      getById: async () => ({
        id: 1,
        title: 'Senior Developer',
        description: 'Development role',
        requirements: 'JavaScript, React, Node.js'
      })
    },
    evaluateCandidate: async data => ({
      id: 1,
      ...data
    }),
    saveCandidate: async data => ({ isNew: true, candidate: data })
  };
  
  // Create workflow manager with mock services
  const workflowManager = new WorkflowManager({
    dataStorage: mockDataStorage,
    linkedInAutomation: mockLinkedInAutomation,
    evaluationEngine: mockEvaluationEngine
  });
  
  // Create mock IPC
  const mockIPC = new MockIPC();
  
  // Setup IPC handlers with our mock
  setupIpcHandlers(workflowManager, mockIPC);
  
  // Run tests
  try {
    // Test 1: LinkedIn browser start
    console.log('Test 1: LinkedIn browser start');
    const browserResult = await mockIPC.invoke('linkedin:startBrowser');
    assert(browserResult.success === true, 'Browser start should succeed');
    console.log('✅ LinkedIn browser start test passed');
    
    // Test 2: CV analysis
    console.log('Test 2: CV analysis');
    // Create a test CV path
    const testCvPath = path.join(__dirname, 'test_data', 'test_cv.pdf');
    if (!fs.existsSync(path.dirname(testCvPath))) {
      fs.mkdirSync(path.dirname(testCvPath), { recursive: true });
    }
    
    // Create a dummy PDF file if it doesn't exist
    if (!fs.existsSync(testCvPath)) {
      fs.writeFileSync(testCvPath, 'Test CV content', 'utf8');
    }
    
    // Mock the analyzeCV function
    workflowManager.analyzeCV = async () => ({
      success: true,
      analysis: {
        score: 0.85,
        matched: {
          skills: ['JavaScript', 'React'],
          certifications: [],
          languages: ['English']
        },
        unmatched: {
          skills: ['Python'],
          certifications: [],
          languages: []
        }
      }
    });
    
    const cvResult = await mockIPC.invoke('cv:analyze', {
      cvPath: testCvPath,
      jobRequirements: {
        skills: ['JavaScript', 'React', 'Python'],
        certifications: [],
        languages: ['English']
      }
    });
    
    assert(cvResult.success === true, 'CV analysis should succeed');
    assert(cvResult.analysis.score === 0.85, 'CV analysis should return a score');
    console.log('✅ CV analysis test passed');
    
    // Test 3: Event propagation
    console.log('Test 3: Event propagation');
    let eventReceived = false;
    
    // Setup event listener
    mockIPC.on('extraction-progress', (event, data) => {
      eventReceived = true;
      assert(data.current === 5, 'Progress event should contain current count');
      assert(data.total === 10, 'Progress event should contain total count');
    });
    
    // Emit event
    mockIPC.emit('extraction-progress', {
      current: 5,
      total: 10,
      percentage: 50,
      currentApplicant: 'Jane Smith'
    });
    
    assert(eventReceived, 'Event should be received by listener');
    console.log('✅ Event propagation test passed');
    
    // Test 4: Candidate evaluation
    console.log('Test 4: Candidate evaluation');
    const evaluationResult = await mockIPC.invoke('candidates:evaluate', 1, 1);
    
    assert(evaluationResult.id === 1, 'Evaluation should have an ID');
    assert(evaluationResult.candidate_id === 1, 'Evaluation should reference candidate');
    console.log('✅ Candidate evaluation test passed');
    
    console.log('All integration tests passed! ✅');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Test runner error:', err);
      process.exit(1);
    });
}