/**
 * API routes for the message generator
 * These routes expose the functionality of the MessageGeneratorAPI via HTTP
 */

module.exports = (app, messageGeneratorAPI) => {
  /**
   * Generate a message but don't send it
   * POST /api/messages/generate
   */
  app.post('/api/messages/generate', (req, res) => {
    try {
      const { templateOrScenario, candidateData, options } = req.body;
      
      if (!templateOrScenario) {
        return res.status(400).json({ 
          error: 'Template name or scenario is required' 
        });
      }
      
      if (!candidateData || typeof candidateData !== 'object') {
        return res.status(400).json({ 
          error: 'Candidate data object is required' 
        });
      }
      
      const message = messageGeneratorAPI.generateMessage(
        templateOrScenario,
        candidateData,
        options || {}
      );
      
      res.json(message);
    } catch (error) {
      console.error('Error generating message:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * Send a message to a recipient
   * POST /api/messages/send
   */
  app.post('/api/messages/send', async (req, res) => {
    try {
      const { recipient, templateOrScenario, candidateData, options } = req.body;
      
      if (!recipient) {
        return res.status(400).json({ 
          error: 'Recipient is required' 
        });
      }
      
      if (!templateOrScenario) {
        return res.status(400).json({ 
          error: 'Template name or scenario is required' 
        });
      }
      
      if (!candidateData || typeof candidateData !== 'object') {
        return res.status(400).json({ 
          error: 'Candidate data object is required' 
        });
      }
      
      const result = await messageGeneratorAPI.sendMessage(
        recipient,
        templateOrScenario,
        candidateData,
        options || {}
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * Send messages to multiple recipients
   * POST /api/messages/batch-send
   */
  app.post('/api/messages/batch-send', async (req, res) => {
    try {
      const { candidates, templateOrScenario, options } = req.body;
      
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ 
          error: 'Candidates array is required and must not be empty' 
        });
      }
      
      if (!templateOrScenario) {
        return res.status(400).json({ 
          error: 'Template name or scenario is required' 
        });
      }
      
      const results = await messageGeneratorAPI.batchSendMessages(
        candidates,
        templateOrScenario,
        options || {}
      );
      
      res.json(results);
    } catch (error) {
      console.error('Error batch sending messages:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * Schedule a message to be sent later
   * POST /api/messages/schedule
   */
  app.post('/api/messages/schedule', (req, res) => {
    try {
      const { scheduledTime, recipient, templateOrScenario, candidateData, options } = req.body;
      
      if (!scheduledTime) {
        return res.status(400).json({ 
          error: 'Scheduled time is required' 
        });
      }
      
      if (!recipient) {
        return res.status(400).json({ 
          error: 'Recipient is required' 
        });
      }
      
      if (!templateOrScenario) {
        return res.status(400).json({ 
          error: 'Template name or scenario is required' 
        });
      }
      
      if (!candidateData || typeof candidateData !== 'object') {
        return res.status(400).json({ 
          error: 'Candidate data object is required' 
        });
      }
      
      const result = messageGeneratorAPI.scheduleMessage(
        new Date(scheduledTime),
        recipient,
        templateOrScenario,
        candidateData,
        options || {}
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error scheduling message:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * Get all templates or filter by category
   * GET /api/templates
   */
  app.get('/api/templates', (req, res) => {
    try {
      const { category } = req.query;
      const templates = messageGeneratorAPI.getTemplates(category || null);
      res.json(templates);
    } catch (error) {
      console.error('Error retrieving templates:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * Get a specific template by name
   * GET /api/templates/:name
   */
  app.get('/api/templates/:name', (req, res) => {
    try {
      const { name } = req.params;
      const template = messageGeneratorAPI.messageGenerator.getTemplateForEditing(name);
      
      if (!template) {
        return res.status(404).json({ error: `Template '${name}' not found` });
      }
      
      res.json(template);
    } catch (error) {
      console.error('Error retrieving template:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * Create or update a template
   * POST /api/templates
   */
  app.post('/api/templates', (req, res) => {
    try {
      const { name, content, metadata } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Template name is required' });
      }
      
      if (!content) {
        return res.status(400).json({ error: 'Template content is required' });
      }
      
      const result = messageGeneratorAPI.createOrUpdateTemplate(
        name, 
        content, 
        metadata || {}
      );
      
      if (result) {
        res.json({ success: true, name });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Failed to save template' 
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
  
  /**
   * Delete a template
   * DELETE /api/templates/:name
   */
  app.delete('/api/templates/:name', (req, res) => {
    try {
      const { name } = req.params;
      const result = messageGeneratorAPI.deleteTemplate(name);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ 
          success: false, 
          error: 'Template not found or could not be deleted' 
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
  
  /**
   * Preview a message for a candidate
   * POST /api/messages/preview-for-candidate
   */
  app.post('/api/messages/preview-for-candidate', (req, res) => {
    try {
      const { candidateId, messageType, profileLoader } = req.body;
      
      if (!candidateId) {
        return res.status(400).json({ error: 'Candidate ID is required' });
      }
      
      if (!messageType) {
        return res.status(400).json({ error: 'Message type is required' });
      }
      
      // Note: In a real API, you wouldn't pass a function here but would instead
      // reference a predefined loader or service. This is simplified for the example.
      const message = messageGeneratorAPI.generateMessageForCandidate(
        candidateId,
        messageType,
        (id) => {
          // Mock profile loader using the data passed in the request
          return req.body.candidateProfile;
        }
      );
      
      res.json(message);
    } catch (error) {
      console.error('Error previewing message for candidate:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  /**
   * Import a template from a file
   * POST /api/templates/import
   */
  app.post('/api/templates/import', (req, res) => {
    try {
      const { filePath, newName } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const result = messageGeneratorAPI.messageGenerator.importTemplate(
        filePath,
        newName || null
      );
      
      if (result) {
        res.json({ 
          success: true, 
          name: newName || require('path').basename(filePath, require('path').extname(filePath))
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Failed to import template' 
        });
      }
    } catch (error) {
      console.error('Error importing template:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
  
  /**
   * Export a template to a file
   * POST /api/templates/export
   */
  app.post('/api/templates/export', (req, res) => {
    try {
      const { templateName, outputPath } = req.body;
      
      if (!templateName) {
        return res.status(400).json({ error: 'Template name is required' });
      }
      
      if (!outputPath) {
        return res.status(400).json({ error: 'Output path is required' });
      }
      
      const result = messageGeneratorAPI.messageGenerator.exportTemplate(
        templateName,
        outputPath
      );
      
      if (result) {
        res.json({ 
          success: true, 
          path: outputPath
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Failed to export template' 
        });
      }
    } catch (error) {
      console.error('Error exporting template:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
};