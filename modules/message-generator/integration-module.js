/**
 * MessageGeneratorAPI - Integration module for connecting the message generation
 * with other parts of the recruiting system
 * 
 * This module provides the APIs and interfaces needed to integrate
 * the MessageGenerator with other system components.
 */

const MessageGenerator = require('./MessageGenerator');
const fs = require('fs');
const path = require('path');

class MessageGeneratorAPI {
  constructor(options = {}) {
    this.templatesDir = options.templatesDir || path.join(__dirname, 'templates');
    this.messageGenerator = new MessageGenerator({ templatesDir: this.templatesDir });
    this.defaultSubjects = this._loadDefaultSubjects();
    this.eventHandlers = {};
  }
  
  /**
   * Load default email subjects for different message types
   * @private
   * @returns {Object} Map of message types to default subjects
   */
  _loadDefaultSubjects() {
    return {
      'interview': '{position} Interview Invitation | {companyName}',
      'video': 'Video Interview Request for {position} Role | {companyName}',
      'reject': 'Update on Your Application for {position} | {companyName}',
      'offer': 'Job Offer for {position} at {companyName}',
      'follow_up': 'Following Up on Your Recent Interview | {companyName}',
      'general': 'Your Application for {position} at {companyName}',
      'technical_assessment': 'Technical Assessment for {position} | {companyName}'
    };
  }
  
  /**
   * Format a subject line by replacing variables with values from candidate data
   * @param {string} subjectTemplate - Subject template with variables in {varName} format
   * @param {Object} candidateData - Candidate data for variable substitution
   * @returns {string} Formatted subject line
   * @private
   */
  _formatSubject(subjectTemplate, candidateData) {
    let subject = subjectTemplate;
    
    // Replace each {variableName} with the corresponding value from candidateData
    Object.keys(candidateData).forEach(key => {
      const placeholder = `{${key}}`;
      if (subject.includes(placeholder)) {
        subject = subject.replace(new RegExp(placeholder, 'g'), candidateData[key]);
      }
    });
    
    return subject;
  }
  
  /**
   * Generate a message with appropriate subject for sending
   * @param {string} templateNameOrScenario - Template name or scenario type
   * @param {Object} candidateData - Candidate data for personalization
   * @param {Object} options - Additional options
   * @param {string} options.customSubject - Custom subject line (optional)
   * @param {boolean} options.useScenario - Whether to use scenario-based generation (default: false)
   * @returns {Object} Object containing message body and subject
   */
  generateMessage(templateNameOrScenario, candidateData, options = {}) {
    const { customSubject, useScenario = false } = options;
    let messageBody;
    
    // Generate message body based on specific template or scenario
    if (useScenario) {
      messageBody = this.messageGenerator.generateMessageForScenario(
        templateNameOrScenario, 
        candidateData
      );
    } else {
      messageBody = this.messageGenerator.generateMessage(
        templateNameOrScenario,
        candidateData
      );
    }
    
    if (!messageBody) {
      throw new Error(`Failed to generate message with ${useScenario ? 'scenario' : 'template'}: ${templateNameOrScenario}`);
    }
    
    // Determine the appropriate subject line
    let subject;
    if (customSubject) {
      subject = this._formatSubject(customSubject, candidateData);
    } else {
      // Get template metadata to determine category for default subject
      let category;
      
      if (useScenario) {
        category = templateNameOrScenario;
      } else {
        const template = this.messageGenerator.getTemplateForEditing(templateNameOrScenario);
        category = template?.metadata?.category || 'general';
      }
      
      const defaultSubject = this.defaultSubjects[category] || this.defaultSubjects.general;
      subject = this._formatSubject(defaultSubject, candidateData);
    }
    
    // Fire event for message generation
    this._fireEvent('messageGenerated', {
      templateOrScenario: templateNameOrScenario,
      useScenario,
      candidateData,
      subject,
      messageBody
    });
    
    return {
      subject,
      body: messageBody
    };
  }
  
  /**
   * Send a message using the configured communication service
   * @param {string} recipient - Email address or recipient ID
   * @param {string} templateNameOrScenario - Template name or scenario type
   * @param {Object} candidateData - Candidate data for personalization
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result of the send operation
   */
  async sendMessage(recipient, templateNameOrScenario, candidateData, options = {}) {
    // Ensure recipient email is set
    if (!recipient) {
      throw new Error('Recipient is required for sending messages');
    }
    
    // Set recipient email in candidate data if not already present
    if (!candidateData.recipientEmail) {
      candidateData.recipientEmail = recipient;
    }
    
    // Generate the message
    const message = this.generateMessage(templateNameOrScenario, candidateData, options);
    
    // Fire event before sending
    this._fireEvent('beforeMessageSend', {
      recipient,
      subject: message.subject,
      body: message.body,
      candidateData,
      options
    });
    
    // In a real system, this would connect to an email service or messaging API
    // For this example, we'll just log the message and simulate a successful send
    console.log(`Sending message to: ${recipient}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body: ${message.body}`);
    
    // Record message in communication history
    const messageRecord = {
      timestamp: new Date(),
      recipient,
      subject: message.subject,
      body: message.body,
      templateOrScenario: templateNameOrScenario,
      candidateId: candidateData.id || 'unknown',
      status: 'sent'
    };
    
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Fire event after sending
        this._fireEvent('messageSent', messageRecord);
        
        resolve({
          success: true,
          messageId: `msg_${Date.now()}`,
          timestamp: messageRecord.timestamp,
          ...messageRecord
        });
      }, 100);
    });
  }
  
  /**
   * Batch send messages to multiple candidates
   * @param {Array<Object>} candidates - Array of candidate objects with recipient info
   * @param {string} templateNameOrScenario - Template name or scenario type
   * @param {Object} options - Additional options
   * @returns {Promise<Array<Object>>} Results of all send operations
   */
  async batchSendMessages(candidates, templateNameOrScenario, options = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new Error('Candidates array is required and cannot be empty');
    }
    
    const { useScenario = false } = options;
    
    // Fire event for batch start
    this._fireEvent('batchSendStarted', {
      candidateCount: candidates.length,
      templateOrScenario: templateNameOrScenario,
      useScenario
    });
    
    // Send messages to all candidates
    const results = [];
    for (const candidate of candidates) {
      try {
        // Extract recipient from candidate object
        const recipient = candidate.email || candidate.recipientEmail;
        
        if (!recipient) {
          throw new Error(`Candidate is missing email address: ${JSON.stringify(candidate)}`);
        }
        
        // Send individual message
        const result = await this.sendMessage(
          recipient,
          templateNameOrScenario,
          candidate,
          options
        );
        
        results.push({
          candidateId: candidate.id || 'unknown',
          success: true,
          result
        });
      } catch (error) {
        results.push({
          candidateId: candidate.id || 'unknown',
          success: false,
          error: error.message
        });
      }
    }
    
    // Fire event for batch completion
    this._fireEvent('batchSendCompleted', {
      candidateCount: candidates.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      results
    });
    
    return results;
  }
  
  /**
   * Schedule a message to be sent at a later time
   * @param {Date} scheduledTime - When to send the message
   * @param {string} recipient - Email address or recipient ID
   * @param {string} templateNameOrScenario - Template name or scenario type
   * @param {Object} candidateData - Candidate data for personalization
   * @param {Object} options - Additional options
   * @returns {Object} Scheduled message information
   */
  scheduleMessage(scheduledTime, recipient, templateNameOrScenario, candidateData, options = {}) {
    if (!(scheduledTime instanceof Date)) {
      throw new Error('scheduledTime must be a valid Date object');
    }
    
    // Generate the message now to validate template
    const message = this.generateMessage(templateNameOrScenario, candidateData, options);
    
    // Create a scheduled message record
    const scheduledMessage = {
      id: `scheduled_${Date.now()}`,
      scheduledTime,
      recipient,
      templateNameOrScenario,
      candidateData,
      options,
      status: 'scheduled',
      subject: message.subject
    };
    
    // In a real system, this would be stored in a database
    // and a scheduler would pick it up at the appropriate time
    console.log(`Message scheduled for ${scheduledTime.toISOString()}:`);
    console.log(scheduledMessage);
    
    // Fire event for scheduling
    this._fireEvent('messageScheduled', scheduledMessage);
    
    return scheduledMessage;
  }
  
  /**
   * Get available templates filtered by category
   * @param {string} [category] - Optional category to filter by
   * @returns {Object} Available templates
   */
  getTemplates(category = null) {
    return this.messageGenerator.getAvailableTemplates(category);
  }
  
  /**
   * Create a new template or update an existing one
   * @param {string} name - Template name
   * @param {string} content - Template content
   * @param {Object} metadata - Template metadata
   * @returns {boolean} Success status
   */
  createOrUpdateTemplate(name, content, metadata = {}) {
    const result = this.messageGenerator.saveTemplate(name, content, metadata);
    
    if (result) {
      this._fireEvent('templateUpdated', {
        name,
        isNew: !this.messageGenerator.getTemplateForEditing(name),
        metadata
      });
    }
    
    return result;
  }
  
  /**
   * Delete a template
   * @param {string} name - Template name
   * @returns {boolean} Success status
   */
  deleteTemplate(name) {
    const result = this.messageGenerator.deleteTemplate(name);
    
    if (result) {
      this._fireEvent('templateDeleted', { name });
    }
    
    return result;
  }
  
  /**
   * Register an event handler
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} handler - Handler function to call when event occurs
   * @returns {void}
   */
  on(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    
    this.eventHandlers[eventName].push(handler);
  }
  
  /**
   * Remove an event handler
   * @param {string} eventName - Name of the event
   * @param {Function} handler - Handler to remove
   * @returns {boolean} Whether handler was removed
   */
  off(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      return false;
    }
    
    const index = this.eventHandlers[eventName].indexOf(handler);
    if (index !== -1) {
      this.eventHandlers[eventName].splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Fire an event with data
   * @param {string} eventName - Name of the event to fire
   * @param {Object} data - Event data
   * @private
   */
  _fireEvent(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }
  
  /**
   * Create a preview of a message without sending
   * @param {string} templateNameOrScenario - Template name or scenario type
   * @param {Object} candidateData - Candidate data for personalization
   * @param {Object} options - Additional options
   * @returns {Object} Preview with subject and body
   */
  previewMessage(templateNameOrScenario, candidateData, options = {}) {
    return this.generateMessage(templateNameOrScenario, candidateData, options);
  }
  
  /**
   * Load a candidate profile and generate appropriate message
   * @param {string} candidateId - ID of the candidate
   * @param {string} messageType - Type of message to generate
   * @param {Function} profileLoader - Function to load candidate profile
   * @returns {Object} Generated message with subject
   */
  generateMessageForCandidate(candidateId, messageType, profileLoader) {
    if (!profileLoader || typeof profileLoader !== 'function') {
      throw new Error('Profile loader function is required');
    }
    
    // Load candidate profile
    const candidateProfile = profileLoader(candidateId);
    
    if (!candidateProfile) {
      throw new Error(`Candidate profile not found for ID: ${candidateId}`);
    }
    
    // Determine appropriate template or scenario based on message type
    let templateOrScenario;
    let useScenario = false;
    
    // Map message types to template names or scenarios
    switch (messageType) {
      case 'interview_invitation':
        templateOrScenario = 'interview';
        useScenario = true;
        break;
      case 'video_request':
        templateOrScenario = 'video_interview_request';
        break;
      case 'rejection':
        templateOrScenario = candidateProfile.hasInterviewed ? 
          'rejection_after_interview' : 'rejection_standard';
        break;
      case 'offer':
        templateOrScenario = 'offer_announcement';
        break;
      case 'follow_up':
        templateOrScenario = 'follow_up_after_interview';
        break;
      default:
        throw new Error(`Unknown message type: ${messageType}`);
    }
    
    // Generate the message
    return this.generateMessage(templateOrScenario, candidateProfile, { useScenario });
  }
}

module.exports = MessageGeneratorAPI;

// Example of an express API wrapper for this module
if (require.main === module) {
  const express = require('express');
  const bodyParser = require('body-parser');
  
  const app = express();
  app.use(bodyParser.json());
  
  const messageGeneratorAPI = new MessageGeneratorAPI();
  
  // Routes for the API
  app.post('/api/messages/generate', (req, res) => {
    try {
      const { templateOrScenario, candidateData, options } = req.body;
      const message = messageGeneratorAPI.generateMessage(
        templateOrScenario,
        candidateData,
        options
      );
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post('/api/messages/send', async (req, res) => {
    try {
      const { recipient, templateOrScenario, candidateData, options } = req.body;
      const result = await messageGeneratorAPI.sendMessage(
        recipient,
        templateOrScenario,
        candidateData,
        options
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post('/api/messages/batch-send', async (req, res) => {
    try {
      const { candidates, templateOrScenario, options } = req.body;
      const results = await messageGeneratorAPI.batchSendMessages(
        candidates,
        templateOrScenario,
        options
      );
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post('/api/messages/schedule', (req, res) => {
    try {
      const { scheduledTime, recipient, templateOrScenario, candidateData, options } = req.body;
      const result = messageGeneratorAPI.scheduleMessage(
        new Date(scheduledTime),
        recipient,
        templateOrScenario,
        candidateData,
        options
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.get('/api/templates', (req, res) => {
    const { category } = req.query;
    const templates = messageGeneratorAPI.getTemplates(category || null);
    res.json(templates);
  });
  
  app.post('/api/templates', (req, res) => {
    try {
      const { name, content, metadata } = req.body;
      const result = messageGeneratorAPI.createOrUpdateTemplate(name, content, metadata);
      
      if (result) {
        res.json({ success: true, name });
      } else {
        res.status(400).json({ success: false, error: 'Failed to save template' });
      }
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  app.delete('/api/templates/:name', (req, res) => {
    try {
      const { name } = req.params;
      const result = messageGeneratorAPI.deleteTemplate(name);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'Template not found' });
      }
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Message Generator API running on port ${PORT}`);
  });
}