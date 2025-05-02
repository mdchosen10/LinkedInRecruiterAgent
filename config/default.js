/**
 * Default configuration for the LinkedIn Recruitment Automation System
 */
module.exports = {
  // Application settings
  app: {
    name: 'LinkedIn Recruitment Automation',
    port: 3000
  },
  
  // LinkedIn Automation settings
  linkedInAutomation: {
    rateLimiting: {
      maxRequestsPerHour: 100,
      delayBetweenRequests: 2000
    },
    browser: {
      headless: true
    }
  },
  
  // Evaluation Engine settings
  evaluationEngine: {
    apiKey: process.env.CLAUDE_API_KEY || 'your-api-key-here',
    model: 'claude-3-opus-20240229'
  },
  
  // Message Generator settings
  messageGenerator: {
    templatesDir: './modules/message-generator/templates',
    defaultTemplatesDir: './modules/message-generator/default_templates'
  },
  
  // Data Storage settings
  dataStorage: {
    database: {
      path: './data/linkedin_recruiter.db',
      backupPath: './data/backups/'
    }
  }
};