/**
 * Setup script for the LinkedIn Recruitment Automation System
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to create
const directories = [
  'config',
  'modules/linkedin-automation',
  'modules/evaluation-engine',
  'modules/message-generator',
  'modules/data-storage',
  'modules/ui',
  'integration',
  'electron-app',
  'data'
];

// Create directories
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy module files to their appropriate locations
function copyModuleFiles(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    return;
  }
  
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }
  
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(destinationDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyModuleFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  });
}

// Create default config file
const defaultConfig = `/**
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
};`;

fs.writeFileSync(
  path.join(__dirname, 'config', 'default.js'),
  defaultConfig
);
console.log('Created default configuration file');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

console.log('\nSetup completed successfully!');
console.log('\nNext steps:');
console.log('1. Copy your module files to their respective directories');
console.log('2. Configure your API keys in the config file');
console.log('3. Run the application with: npm start');