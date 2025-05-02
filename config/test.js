/**
 * Test configuration for the LinkedIn Recruitment Automation System
 * This file contains test-specific settings that override the default configuration
 */

// Import default config to extend it
const defaultConfig = require('./default');

// Test-specific configuration
const testConfig = {
  // Application settings
  app: {
    ...defaultConfig.app,
    name: 'LinkedIn Recruitment Automation (Test)',
    port: 3001 // Use a different port for testing
  },

  // LinkedIn Automation settings
  linkedInAutomation: {
    ...defaultConfig.linkedInAutomation,
    rateLimiting: {
      maxRequestsPerHour: 10, // Reduced rate for testing
      delayBetweenRequests: 5000 // Longer delay for testing
    },
    browser: {
      headless: false, // Show browser for testing
      slowMo: 100 // Slow down browser actions for visibility
    },
    // Test credentials - replace with real ones or use environment variables
    credentials: {
      username: process.env.LINKEDIN_TEST_USERNAME || 'test@example.com',
      password: process.env.LINKEDIN_TEST_PASSWORD || 'replaceme'
    }
  },

  // Evaluation Engine settings
  evaluationEngine: {
    ...defaultConfig.evaluationEngine,
    apiKey: process.env.CLAUDE_API_KEY || defaultConfig.evaluationEngine.apiKey,
    // Use a smaller model for testing if available
    model: process.env.TEST_MODEL || defaultConfig.evaluationEngine.model
  },

  // Message Generator settings
  messageGenerator: {
    ...defaultConfig.messageGenerator,
    // Use same templates as default
  },

  // Data Storage settings
  dataStorage: {
    database: {
      path: './data/test.db', // Use a separate test database
      backupPath: './data/test_backups/'
    }
  },
  
  // Test specific settings
  test: {
    // Test user
    user: {
      username: 'testuser',
      password: 'testpassword123',
      name: 'Test User',
      email: 'test@example.com'
    },
    // Test job
    job: {
      title: 'Senior Software Engineer',
      description: 'We are looking for a skilled software engineer with expertise in Node.js and React.',
      requirements: ['Node.js', 'React', 'JavaScript', '5+ years experience'],
      company: 'Example Tech Corp',
      location: 'Remote'
    },
    // LinkedIn search criteria for testing
    searchCriteria: {
      keywords: 'software engineer node.js react',
      location: 'United States',
      connectionDegree: '2nd',
      resultCount: 5
    },
    // Mock candidate data for testing without LinkedIn
    mockCandidates: [
      {
        name: 'John Smith',
        current_title: 'Senior Frontend Developer',
        current_company: 'Tech Innovators',
        skills: ['JavaScript', 'React', 'TypeScript', 'Redux'],
        profileUrl: 'https://linkedin.com/in/john-smith-123'
      },
      {
        name: 'Sarah Johnson',
        current_title: 'Full Stack Engineer',
        current_company: 'WebSolutions Inc',
        skills: ['Node.js', 'React', 'MongoDB', 'AWS'],
        profileUrl: 'https://linkedin.com/in/sarah-johnson-456'
      }
    ]
  }
};

module.exports = testConfig;