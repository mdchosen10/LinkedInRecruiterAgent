/**
 * API Gateway for the LinkedIn Recruitment Automation System
 * Provides a unified API for the UI to interact with all modules
 */
const express = require('express');
const bodyParser = require('body-parser');

class ApiGateway {
  constructor({ workflowManager }) {
    this.workflowManager = workflowManager;
    this.app = express();
    
    // Configure middleware
    this.app.use(bodyParser.json());
    
    // Set up routes
    this._setupRoutes();
  }
  
  /**
   * Set up API routes
   * @private
   */
  _setupRoutes() {
    // Authentication routes
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const authResult = await this.workflowManager.dataStorage.authenticateUser(
          username, 
          password,
          { ip_address: req.ip, user_agent: req.headers['user-agent'] }
        );
        
        if (authResult.success) {
          res.json(authResult);
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // LinkedIn routes
    this.app.post('/api/linkedin/login', async (req, res) => {
      try {
        const { credentials, userId } = req.body;
        const result = await this.workflowManager.loginToLinkedIn(credentials, userId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.post('/api/linkedin/search', async (req, res) => {
      try {
        const { criteria } = req.body;
        const candidates = await this.workflowManager.linkedInAutomation.searchForCandidates(criteria);
        res.json({ candidates });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Candidate routes
    this.app.get('/api/candidates', async (req, res) => {
      try {
        const candidates = await this.workflowManager.dataStorage.candidateModel.getAll(req.query);
        res.json({ candidates });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    this.app.get('/api/candidates/:id', async (req, res) => {
      try {
        const candidate = await this.workflowManager.dataStorage.candidateModel.getWithDetails(req.params.id);
        
        if (!candidate) {
          return res.status(404).json({ error: 'Candidate not found' });
        }
        
        res.json({ candidate });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Evaluation routes
    this.app.post('/api/candidates/:id/evaluate', async (req, res) => {
      try {
        const { jobId, userId } = req.body;
        const evaluation = await this.workflowManager.evaluateCandidate(
          parseInt(req.params.id),
          jobId,
          userId
        );
        
        res.json({ evaluation });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Messaging routes
    this.app.post('/api/messages/send', async (req, res) => {
      try {
        const { candidateIds, messageType, userId } = req.body;
        const results = await this.workflowManager.sendMessages(
          candidateIds,
          messageType,
          userId
        );
        
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Workflow routes
    this.app.post('/api/workflows/recruitment', async (req, res) => {
      try {
        const { jobData, searchCriteria, options } = req.body;
        const results = await this.workflowManager.startRecruitmentWorkflow(
          jobData,
          searchCriteria,
          options
        );
        
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
  
  /**
   * Start the API server
   * @param {number} port - Port to listen on
   */
  start(port) {
    this.server = this.app.listen(port, () => {
      console.log(`API Gateway listening on port ${port}`);
    });
    
    return this.server;
  }
  
  /**
   * Stop the API server
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = ApiGateway;