/**
 * Test configuration for LinkedIn Recruiter Agent
 * This configuration is used for testing purposes only.
 */

module.exports = {
  // Authentication configuration
  auth: {
    jwtSecret: 'test-jwt-secret-key-for-development-only',
    tokenExpiration: '24h',
    refreshTokenExpiration: '7d'
  },
  
  // Database configuration
  database: {
    dialect: 'sqlite',
    storage: ':memory:', // In-memory database for testing
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // LinkedIn automation configuration
  linkedInAutomation: {
    headless: false, // Set to true for automated testing
    rateLimit: {
      requestsPerHour: 30,
      cooldownPeriod: 10000 // 10 seconds between actions
    },
    retryOptions: {
      maxRetries: 3,
      retryDelay: 5000
    },
    downloadPath: './test_downloads',
    userDataDir: './test_user_data'
  },
  
  // Evaluation engine configuration
  evaluationEngine: {
    apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-api-key-for-testing',
    model: 'claude-3-5-sonnet-20240620',
    criteriaWeights: {
      technicalSkills: 0.3,
      relevantExperience: 0.3,
      education: 0.15,
      cultureFit: 0.1,
      achievements: 0.15
    },
    thresholds: {
      interview: 8.0,
      video: 6.0
    }
  },
  
  // Test data
  testData: {
    jobPostings: [
      {
        id: '4206700740',
        title: 'Software Engineering role at Duolingo',
        url: 'https://www.linkedin.com/hiring/jobs/4206700740/detail/'
      },
      {
        id: '4206700740',
        title: 'Creative Recruiter Job',
        url: 'https://www.linkedin.com/hiring/jobs/4206700740/detail/'
      },
      {
        id: '4206399817',
        title: 'Senior Graphic Designer Job',
        url: 'https://www.linkedin.com/hiring/jobs/4206399817/detail/'
      },
      {
        id: '4206700760',
        title: 'Project Manager Job',
        url: 'https://www.linkedin.com/hiring/jobs/4206700760/detail/'
      }
    ],
    sampleUser: {
      id: 1,
      username: 'test-user',
      password: 'test-password',
      email: 'test@example.com',
      name: 'Test User',
      role: 'recruiter'
    }
  }
};