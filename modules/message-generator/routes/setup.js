/**
 * Setup script for initial configuration of the message generator
 * 
 * This script:
 * 1. Creates necessary directories
 * 2. Generates default templates
 * 3. Sets up initial configuration
 */

const fs = require('fs');
const path = require('path');
const { createMessageGenerator } = require('./index');

console.log('Setting up the recruiting message generator...');

// Create directories
const directories = [
  './templates',
  './default_templates',
  './logs'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Create default .env file if it doesn't exist
const envPath = './.env';
const defaultEnv = `# Configuration for the recruiting message generator
PORT=3000
TEMPLATES_DIR=./templates
LOG_LEVEL=info
# Email configuration (if using a real email service)
# EMAIL_SERVICE=smtp
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_USER=user@example.com
# EMAIL_PASSWORD=password
# EMAIL_FROM=recruiting@example.com
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, defaultEnv);
  console.log('Created default .env file');
} else {
  console.log('.env file already exists');
}

// Initialize the message generator
const messageGenerator = createMessageGenerator();

// Load default templates
console.log('Loading default templates...');
// This is handled by the DefaultTemplates.js script

// Create a sample custom template
const sampleTemplate = {
  name: 'custom_welcome',
  content: `Hi {{candidateName}},

Thank you for your interest in {{companyName}}! We're delighted that you're considering joining our team.

We've received your application for the {{position}} position and are excited to review your qualifications. Our team will be going through applications in the coming days, and we'll be in touch soon about next steps.

In the meantime, you can learn more about our company culture and values by visiting our website or following us on social media.

If you have any questions about the role or the application process, please don't hesitate to reach out.

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team`,
  metadata: {
    category: 'general',
    description: 'Custom welcome message for new applicants',
    variables: ['candidateName', 'position', 'companyName', 'recruiterName']
  }
};

// Save the sample custom template
try {
  const result = messageGenerator.saveTemplate(
    sampleTemplate.name,
    sampleTemplate.content,
    sampleTemplate.metadata
  );
  
  if (result) {
    console.log(`Created sample custom template: ${sampleTemplate.name}`);
  } else {
    console.log(`Failed to create sample custom template: ${sampleTemplate.name}`);
  }
} catch (error) {
  console.error('Error creating sample template:', error);
}

console.log('\nSetup complete! You can now start using the recruiting message generator.');
console.log('Run the following commands:');
console.log('- npm run create-templates   # Create default templates');
console.log('- npm start                  # Start the API server');