# Recruiting Message Generator

A powerful Node.js module for generating personalized recruiting messages based on customizable templates and candidate data.

## Features

- **Template Management**: Create, save, load, and delete message templates
- **Variable Substitution**: Dynamic personalization using candidate data
- **Support for Different Message Types**: Interview invitations, video requests, rejections, offers, etc.
- **Natural Language Processing**: Ensures messages sound human and personalized
- **API Integration**: Easy integration with existing recruiting systems
- **Batch Processing**: Send messages to multiple candidates efficiently
- **Scheduling**: Schedule messages to be sent at specific times

## Installation

```bash
npm install
npm run setup
npm run create-templates
```

## Quick Start

```javascript
const { createMessageGenerator } = require('./index');

// Create message generator instance
const messageGenerator = createMessageGenerator();

// Generate a personalized interview invitation
const candidateData = {
  candidateName: 'John Smith',
  position: 'Software Engineer',
  companyName: 'TechCorp',
  interviewDate: '2025-06-01',
  interviewTime: '2:00 PM',
  interviewerName: 'Sarah Johnson',
  recruiterName: 'Mike Thompson'
};

const message = messageGenerator.generateMessage(
  'interview_invitation_standard', 
  candidateData
);

console.log(message);
```

## API Usage

### Core Components

1. **MessageGenerator**: The core class for template management and message generation
2. **MessageGeneratorAPI**: Integration class for connecting with other systems
3. **Default Templates**: Pre-built templates for common recruiting scenarios

### MessageGenerator Class

The main class for managing templates and generating messages.

```javascript
const MessageGenerator = require('./MessageGenerator');

// Create a new instance
const messageGenerator = new MessageGenerator({
  templatesDir: './templates' // Custom templates directory (optional)
});

// Available methods:
// - getAvailableTemplates(category)
// - saveTemplate(name, content, metadata)
// - deleteTemplate(name)
// - generateMessage(templateName, candidateData)
// - generateMessageForScenario(scenario, candidateData)
// - exportTemplate(templateName, outputPath)
// - importTemplate(filePath, newName)
// - getTemplateForEditing(templateName)
```

### MessageGeneratorAPI Class

Integration class with event handling and communication features.

```javascript
const MessageGeneratorAPI = require('./MessageGeneratorAPI');

// Create a new instance
const api = new MessageGeneratorAPI({
  templatesDir: './templates' // Custom templates directory (optional)
});

// Available methods:
// - generateMessage(templateNameOrScenario, candidateData, options)
// - sendMessage(recipient, templateNameOrScenario, candidateData, options)
// - batchSendMessages(candidates, templateNameOrScenario, options)
// - scheduleMessage(scheduledTime, recipient, templateNameOrScenario, candidateData, options)
// - getTemplates(category)
// - createOrUpdateTemplate(name, content, metadata)
// - deleteTemplate(name)
// - on(eventName, handler) - Register event handler
// - off(eventName, handler) - Remove event handler
// - previewMessage(templateNameOrScenario, candidateData, options)
// - generateMessageForCandidate(candidateId, messageType, profileLoader)
```

## Templates

Templates use Handlebars syntax for flexible personalization. Variables are enclosed in double curly braces: `{{variableName}}`.

### Sample Template

```handlebars
{{!--{"category":"interview","description":"Standard interview invitation","variables":["candidateName","position","companyName","interviewDate","interviewTime","interviewerName"]}--}}
Hi {{candidateName}},

Thank you for your interest in the {{position}} role at {{companyName}}. We've reviewed your application and would like to invite you for an interview.

{{#if interviewDate}}
We'd like to schedule the interview for {{formatDate interviewDate "MMMM D, YYYY"}} at {{interviewTime}}. 
{{else}}
We'd like to schedule an interview at your earliest convenience.
{{/if}}

{{#if interviewerName}}
You'll be speaking with {{interviewerName}}, who is looking forward to learning more about your experience and background.
{{/if}}

Please let me know if this time works for you, or if you need to suggest an alternative.

Looking forward to your response!

Best regards,
{{recruiterName}}
{{companyName}} Recruiting Team
```

### Template Helpers

The module includes several Handlebars helpers for advanced formatting:

- `{{titleCase str}}` - Capitalize first letter of each word
- `{{formatDate date format}}` - Format dates (e.g., "MMMM D, YYYY")
- `{{#ifCond v1 operator v2}}...{{/ifCond}}` - Conditional blocks
- `{{random item1 item2 item3}}` - Choose a random item from a list

## REST API

When running as a server, the module exposes a REST API:

- `POST /api/messages/generate` - Generate a message
- `POST /api/messages/send` - Send a message to a recipient
- `POST /api/messages/batch-send` - Send messages to multiple recipients
- `POST /api/messages/schedule` - Schedule a message for later delivery
- `GET /api/templates` - Get all templates or filter by category
- `GET /api/templates/:name` - Get a specific template
- `POST /api/templates` - Create or update a template
- `DELETE /api/templates/:name` - Delete a template
- `POST /api/templates/import` - Import a template from a file
- `POST /api/templates/export` - Export a template to a file

## Integration Examples

### Integration with Candidate Profile System

```javascript
function getCandidateProfile(candidateId) {
  // Query your database or API
  return {
    candidateName: 'Jane Smith',
    email: 'jane.smith@example.com',
    position: 'UX Designer',
    // other candidate data...
  };
}

function sendEmail(recipient, subject, body) {
  // Your email sending logic
}

// Process a candidate for an interview invitation
function inviteCandidateToInterview(candidateId) {
  const profile = getCandidateProfile(candidateId);
  const message = messageGenerator.generateMessageForScenario('interview', profile);
  const subject = `Interview Invitation: ${profile.position} at ${profile.companyName}`;
  
  return sendEmail(profile.email, subject, message);
}
```

## Running Tests

```bash
npm test
```

## License

MIT