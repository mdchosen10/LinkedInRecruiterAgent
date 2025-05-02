/**
 * WorkflowManager - Coordinates workflows between all modules
 */
class WorkflowManager {
  constructor({ dataStorage, linkedInAutomation, evaluationEngine, messageGenerator }) {
    this.dataStorage = dataStorage;
    this.linkedInAutomation = linkedInAutomation;
    this.evaluationEngine = evaluationEngine;
    this.messageGenerator = messageGenerator;
    
    // Set up event handlers between components
    this._setupEventHandlers();
  }
  
  /**
   * Set up event handlers between components
   * @private
   */
  _setupEventHandlers() {
    // Handle candidate data from LinkedIn
    this.linkedInAutomation.on('profileExtracted', async (profileData) => {
      try {
        // Save candidate to database
        const result = await this.dataStorage.saveCandidate(profileData);
        console.log(`Candidate ${result.isNew ? 'created' : 'updated'}: ${profileData.name}`);
      } catch (error) {
        console.error('Error saving candidate from LinkedIn:', error);
      }
    });
  }
  
  /**
   * Start a complete recruitment workflow
   * @param {Object} jobData - Job position data
   * @param {Object} searchCriteria - LinkedIn search criteria
   * @param {Object} options - Workflow options
   */
  async startRecruitmentWorkflow(jobData, searchCriteria, options = {}) {
    try {
      // 1. Create/update job in database
      const jobResult = await this.dataStorage.createJob(jobData, options.userId);
      console.log(`Job created: ${jobData.title}`);
      
      // 2. Search for candidates on LinkedIn
      const candidates = await this.linkedInAutomation.searchForCandidates(searchCriteria);
      console.log(`Found ${candidates.length} candidates on LinkedIn`);
      
      // 3. Extract detailed profiles for each candidate
      const detailedCandidates = [];
      for (const candidate of candidates) {
        const profile = await this.linkedInAutomation.getProfileDetails(candidate.profileUrl);
        detailedCandidates.push(profile);
        
        // Save to database
        await this.dataStorage.saveCandidate(profile, options.userId);
      }
      
      // 4. Evaluate candidates
      const evaluationPromises = detailedCandidates.map(candidate => 
        this.evaluateCandidate(candidate.id, jobResult.job.id, options.userId)
      );
      const evaluationResults = await Promise.all(evaluationPromises);
      
      // 5. Return workflow results
      return {
        job: jobResult.job,
        candidates: detailedCandidates,
        evaluations: evaluationResults
      };
    } catch (error) {
      console.error('Error in recruitment workflow:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate a single candidate
   * @param {number} candidateId - Candidate ID in database
   * @param {number} jobId - Job ID in database
   * @param {number} userId - User ID performing evaluation
   */
  async evaluateCandidate(candidateId, jobId, userId) {
    try {
      // 1. Get candidate data from database
      const candidate = await this.dataStorage.candidateModel.getWithDetails(candidateId);
      
      // 2. Get job data from database
      const job = await this.dataStorage.jobModel.getById(jobId);
      
      // 3. Prepare data for evaluation
      const evaluationData = {
        candidateProfile: {
          name: candidate.name,
          currentTitle: candidate.current_title,
          currentCompany: candidate.current_company,
          skills: candidate.skills.map(s => s.skill),
          experiences: candidate.experiences,
          education: candidate.education
        },
        jobRequirements: {
          title: job.title,
          description: job.description,
          requirements: job.requirements
        }
      };
      
      // 4. Evaluate with AI engine
      const evaluation = await this.evaluationEngine.evaluateCandidate(evaluationData);
      
      // 5. Save evaluation to database
      const savedEvaluation = await this.dataStorage.evaluateCandidate({
        candidate_id: candidateId,
        evaluator_id: userId,
        job_id: jobId,
        overall_rating: Math.round(evaluation.overallScore / 2), // Convert 0-10 to 1-5 scale
        skill_match_rating: Math.round(evaluation.categoryScores.skills / 2),
        experience_rating: Math.round(evaluation.categoryScores.experience / 2),
        culture_fit_rating: Math.round(evaluation.categoryScores.cultural / 2),
        comments: evaluation.explanation,
        status: this._determineInitialStatus(evaluation)
      });
      
      return savedEvaluation;
    } catch (error) {
      console.error(`Error evaluating candidate ${candidateId}:`, error);
      throw error;
    }
  }
  
  /**
   * Determine initial candidate status based on evaluation
   * @param {Object} evaluation - Evaluation result
   * @returns {string} Initial status
   * @private
   */
  _determineInitialStatus(evaluation) {
    // Convert evaluation recommendation to database status
    switch (evaluation.recommendation) {
      case 'interview':
        return 'pending';
      case 'video':
        return 'pending';
      case 'reject':
        return 'rejected';
      default:
        return 'pending';
    }
  }
  
  /**
   * Generate and send messages to candidates
   * @param {Array} candidateIds - Array of candidate IDs
   * @param {string} messageType - Type of message (interview, video, reject)
   * @param {number} userId - User ID sending messages
   */
  async sendMessages(candidateIds, messageType, userId) {
    try {
      const results = [];
      
      for (const candidateId of candidateIds) {
        // 1. Get candidate data
        const candidate = await this.dataStorage.candidateModel.getWithDetails(candidateId);
        
        // 2. Get latest evaluation
        const evaluations = await this.dataStorage.evaluationModel.getForCandidate(candidateId);
        const latestEvaluation = evaluations[0];
        
        // 3. Prepare data for message generation
        const messageData = {
          candidateName: candidate.name,
          position: latestEvaluation ? 
            (await this.dataStorage.jobModel.getById(latestEvaluation.job_id)).title : 
            'the position',
          companyName: 'Your Company', // Replace with actual company name
          recruiterName: (await this.dataStorage.userModel.getById(userId)).name,
          candidateSkills: candidate.skills.map(s => s.skill),
          // Add other data as needed
        };
        
        // 4. Generate message
        const message = this.messageGenerator.generateMessageForScenario(
          this._mapMessageTypeToScenario(messageType),
          messageData
        );
        
        // 5. Save message to database
        const savedMessage = await this.dataStorage.sendMessage({
          candidate_id: candidateId,
          user_id: userId,
          message_type: messageType,
          content: message,
          subject: this._generateSubject(messageType, messageData)
        });
        
        results.push({
          candidateId,
          messageId: savedMessage.message.id,
          success: true
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error sending messages:', error);
      throw error;
    }
  }
  
  /**
   * Map message type to scenario for message generator
   * @param {string} messageType - Message type
   * @returns {string} Corresponding scenario
   * @private
   */
  _mapMessageTypeToScenario(messageType) {
    const mapping = {
      'email': 'general',
      'linkedin': 'general',
      'interview_request': 'interview',
      'video_request': 'video',
      'rejection': 'reject',
      'offer': 'offer',
      'follow_up': 'follow_up'
    };
    
    return mapping[messageType] || 'general';
  }
  
  /**
   * Generate a subject line for a message
   * @param {string} messageType - Message type
   * @param {Object} messageData - Message data
   * @returns {string} Subject line
   * @private
   */
  _generateSubject(messageType, messageData) {
    const templates = {
      'interview_request': `Interview Invitation: ${messageData.position} at ${messageData.companyName}`,
      'video_request': `Video Interview Request for ${messageData.position} at ${messageData.companyName}`,
      'rejection': `Update on Your Application for ${messageData.position}`,
      'offer': `Job Offer: ${messageData.position} at ${messageData.companyName}`,
      'follow_up': `Following Up on Your Recent Interview with ${messageData.companyName}`
    };
    
    return templates[messageType] || `Regarding Your Application for ${messageData.position}`;
  }
  
  /**
   * Log in to LinkedIn with credentials
   * @param {Object} credentials - LinkedIn credentials
   * @param {number} userId - User ID
   */
async loginToLinkedIn(credentials, userId) {
  try {
    // Initialize LinkedIn automation if it's not already initialized
    if (this.linkedInAutomation.init && !this.linkedInAutomation.browser) {
      await this.linkedInAutomation.init();
    }
    
    // Fix the user ID issue - create a default user if one doesn't exist
    try {
      let user = null;
      // Use a default user ID if none is provided
      const effectiveUserId = userId || 1;
      
      try {
        user = await this.dataStorage.userModel.getById(effectiveUserId);
      } catch (error) {
        console.log('Error checking for user, will attempt to create one:', error.message);
      }
      
      // In workflow-manager.js
// Inside the loginToLinkedIn method, update the user creation part:

      if (!user) {
        // Create a default user record
        console.log('Creating default user account...');
        try {
          // Generate a username from the email address
          const email = credentials.username || 'default@example.com';
          const derivedUsername = email.split('@')[0]  // Take the part before @ symbol
            .replace(/[^a-zA-Z0-9]/g, '')  // Remove non-alphanumeric characters
            .substring(0, 30);  // Limit length to 30 characters
            
          await this.dataStorage.userModel.create({
            id: effectiveUserId,
            username: derivedUsername || 'defaultuser',  // Use derived username
            email: email,  // Store the full email as the email field
            password: 'defaultpassword',
            name: 'Default User',
            role: 'recruiter'
          });
          console.log(`Created default user with ID ${effectiveUserId}`);
        } catch (userCreateError) {
          console.error('Failed to create default user:', userCreateError);
          return { 
            success: false, 
            message: 'Could not create user account: ' + userCreateError.message 
          };
        }
      }
    } catch (error) {
      console.error('Error handling user:', error);
      // Continue anyway - we've tried our best to create a user
    }
    
    // Rest of your existing code...
    // Only save credentials if explicitly requested
    if (credentials.rememberCredentials) {
      try {
        await this.dataStorage.saveLinkedInCredentials(userId || 1, credentials);
        console.log('LinkedIn credentials saved for user', userId || 1);
      } catch (error) {
        console.error('Error saving credentials:', error);
        // We'll continue with login even if saving fails
      }
    }
    
    // Proceed with LinkedIn login
    const result = await this.linkedInAutomation.login(
      credentials.username,
      credentials.password,
      credentials.rememberCredentials || false
    );
    
    return { success: true };
  } catch (error) {
    console.error('LinkedIn login error:', error);
    return { success: false, message: error.message };
  }
}
}

module.exports = WorkflowManager;