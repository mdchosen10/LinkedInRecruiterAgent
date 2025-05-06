/**
 * WorkflowManager - Coordinates workflows between all modules
 */
class WorkflowManager extends require('events').EventEmitter {
  constructor({ dataStorage, linkedInAutomation, evaluationEngine, messageGenerator }) {
    super();
    this.dataStorage = dataStorage;
    this.linkedInAutomation = linkedInAutomation;
    this.evaluationEngine = evaluationEngine;
    this.messageGenerator = messageGenerator;
    
    // Extraction state
    this.extractionState = {
      isExtracting: false,
      isPaused: false,
      jobId: null,
      totalApplicants: 0,
      processedApplicants: 0,
      startTime: null,
      pauseTime: null,
      currentBatch: 0,
      totalBatches: 0,
      errors: []
    };
    
    // Batch processing configuration
    this.batchConfig = {
      batchSize: 10,
      concurrency: 2,
      pauseBetweenBatches: 2000
    };
    
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
        
        // Update extraction progress and emit event
        if (this.extractionState.isExtracting) {
          this.extractionState.processedApplicants++;
          this._emitExtractionProgress();
        }
      } catch (error) {
        console.error('Error saving candidate from LinkedIn:', error);
        this._recordExtractionError(error, 'profile_save_failed', profileData);
      }
    });
    
    // Forward search completed events
    this.linkedInAutomation.on('searchCompleted', (applicants) => {
      if (this.extractionState.isExtracting) {
        this.extractionState.totalApplicants = applicants.length;
        this.emit('extraction-started', {
          jobId: this.extractionState.jobId,
          totalApplicants: applicants.length,
          estimatedTimeMinutes: this._estimateExtractionTime(applicants.length)
        });
      }
    });
    
    // Error events from LinkedIn automation
    this.linkedInAutomation.on('error', (error) => {
      console.error('LinkedIn automation error:', error);
      this._recordExtractionError(error, 'linkedin_automation_error');
      
      if (this.extractionState.isExtracting) {
        this.emit('extraction-error', {
          jobId: this.extractionState.jobId,
          error: error.message,
          code: 'LINKEDIN_ERROR',
          canRetry: true
        });
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
 * Connect to LinkedIn with existing session
 * @param {number} userId - User ID
 */
async connectToLinkedIn(userId) {
  try {
    // Initialize LinkedIn automation if it's not already initialized
    if (!this.linkedInAutomation.browser) {
      await this.linkedInAutomation.init();
    }
    
    // Check if we're logged in
    const isLoggedIn = await this.linkedInAutomation.ensureLoggedIn();
    
    if (!isLoggedIn) {
      return { 
        success: false, 
        message: 'Not logged in to LinkedIn. Please log in manually first.' 
      };
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
      
      if (!user) {
        // Create a default user record
        console.log('Creating default user account...');
        try {
          await this.dataStorage.userModel.create({
            id: effectiveUserId,
            username: 'defaultuser',  
            email: 'default@example.com',
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
    
    return { 
      success: true,
      message: 'Successfully connected to LinkedIn' 
    };
  } catch (error) {
    console.error('LinkedIn connection error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Analyze a CV file against job requirements
 * @param {string} cvPath - Path to the CV file
 * @param {Object} jobRequirements - Job requirements object
 * @returns {Promise<Object>} - Analysis results
 */
async analyzeCV(cvPath, jobRequirements) {
  try {
    // Import CV analyzer only when needed (lazy loading)
    const cvAnalyzer = require('../modules/evaluation-engine/cv-analyzer-complete');
    
    // Analyze the CV
    const analysisResult = await cvAnalyzer.analyzeCV({
      cvPath,
      jobRequirements
    });
    
    console.log(`CV analysis complete for ${cvPath}`);
    return {
      success: true,
      analysis: analysisResult
    };
  } catch (error) {
    console.error(`Failed to analyze CV at ${cvPath}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
  /**
   * Start LinkedIn browser and ensure user is logged in
   * @returns {Promise<Object>} Status of the browser startup
   */
  async startLinkedInBrowser() {
    try {
      if (!this.linkedInAutomation.browser) {
        await this.linkedInAutomation.init();
      }
      
      const isLoggedIn = await this.linkedInAutomation.ensureLoggedIn();
      return { success: true, isLoggedIn };
    } catch (error) {
      console.error('LinkedIn browser start error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Extract applicants from a LinkedIn job posting
   * @param {string} jobId LinkedIn job ID
   * @returns {Promise<Object>} Extraction result
   */
  async extractApplicantsFromJob(jobId) {
    try {
      // Check if we're already extracting
      if (this.extractionState.isExtracting && !this.extractionState.isPaused) {
        return {
          success: false,
          error: 'Extraction already in progress',
          code: 'ALREADY_RUNNING'
        };
      }
      
      // If we're resuming a paused extraction for the same job
      if (this.extractionState.isPaused && this.extractionState.jobId === jobId) {
        return this.resumeExtraction();
      }
      
      // Reset extraction state
      this._resetExtractionState();
      
      // Update extraction state
      this.extractionState.isExtracting = true;
      this.extractionState.jobId = jobId;
      this.extractionState.startTime = Date.now();
      
      // Make sure browser is initialized and logged in
      const browserStatus = await this.startLinkedInBrowser();
      if (!browserStatus.success || !browserStatus.isLoggedIn) {
        this._recordExtractionError(
          new Error('LinkedIn login required'), 
          'login_required'
        );
        return {
          success: false,
          error: 'LinkedIn login required',
          code: 'LOGIN_REQUIRED'
        };
      }
      
      // Start extraction in the background
      this._startExtractionProcess(jobId);
      
      // Return initial status
      return {
        success: true,
        message: 'Extraction started',
        jobId: jobId,
        status: 'extracting'
      };
    } catch (error) {
      console.error('Extraction start error:', error);
      this._resetExtractionState();
      return {
        success: false,
        error: error.message,
        code: 'EXTRACTION_START_FAILED'
      };
    }
  }
  
  /**
   * Pause the current extraction process
   * @returns {Promise<Object>} Status of pause operation
   */
  async pauseExtraction() {
    try {
      if (!this.extractionState.isExtracting) {
        return {
          success: false,
          error: 'No extraction in progress',
          code: 'NO_EXTRACTION'
        };
      }
      
      if (this.extractionState.isPaused) {
        return {
          success: true,
          message: 'Extraction already paused',
          status: 'paused'
        };
      }
      
      // Update state
      this.extractionState.isPaused = true;
      this.extractionState.pauseTime = Date.now();
      
      // Emit pause event
      this.emit('extraction-paused', {
        jobId: this.extractionState.jobId,
        processedApplicants: this.extractionState.processedApplicants,
        totalApplicants: this.extractionState.totalApplicants,
        progress: this._calculateProgress()
      });
      
      return {
        success: true,
        message: 'Extraction paused',
        status: 'paused',
        progress: this._calculateProgress()
      };
    } catch (error) {
      console.error('Pause extraction error:', error);
      return {
        success: false,
        error: error.message,
        code: 'PAUSE_FAILED'
      };
    }
  }
  
  /**
   * Resume a previously paused extraction
   * @returns {Promise<Object>} Status of resume operation
   */
  async resumeExtraction() {
    try {
      if (!this.extractionState.isExtracting) {
        return {
          success: false,
          error: 'No extraction to resume',
          code: 'NO_EXTRACTION'
        };
      }
      
      if (!this.extractionState.isPaused) {
        return {
          success: true,
          message: 'Extraction already running',
          status: 'extracting'
        };
      }
      
      // Update state
      this.extractionState.isPaused = false;
      
      // Resume the extraction process
      this._resumeExtractionProcess();
      
      // Emit resume event
      this.emit('extraction-resumed', {
        jobId: this.extractionState.jobId,
        processedApplicants: this.extractionState.processedApplicants,
        totalApplicants: this.extractionState.totalApplicants,
        progress: this._calculateProgress()
      });
      
      return {
        success: true,
        message: 'Extraction resumed',
        status: 'extracting',
        progress: this._calculateProgress()
      };
    } catch (error) {
      console.error('Resume extraction error:', error);
      return {
        success: false,
        error: error.message,
        code: 'RESUME_FAILED'
      };
    }
  }
  
  /**
   * Start the background extraction process
   * @param {string} jobId LinkedIn job ID
   * @private
   */
  async _startExtractionProcess(jobId) {
    try {
      // Start applicant extraction
      const applicants = await this.linkedInAutomation.getApplicants(jobId);
      
      if (applicants.length === 0) {
        this.emit('extraction-complete', {
          jobId,
          processedApplicants: 0,
          totalApplicants: 0,
          extractedProfiles: []
        });
        this._resetExtractionState();
        return;
      }
      
      // Plan batches for processing
      const batches = this._createBatches(applicants, this.batchConfig.batchSize);
      this.extractionState.totalBatches = batches.length;
      
      // Process batches unless paused
      for (let i = 0; i < batches.length; i++) {
        // Check if we should stop
        if (!this.extractionState.isExtracting) {
          console.log('Extraction stopped');
          return;
        }
        
        // Check if we should pause
        if (this.extractionState.isPaused) {
          console.log('Extraction paused at batch', i);
          this.extractionState.currentBatch = i;
          return;
        }
        
        // Update current batch
        this.extractionState.currentBatch = i;
        
        // Process batch
        await this._processBatch(batches[i], i + 1);
        
        // Small pause between batches to avoid detection
        await new Promise(resolve => setTimeout(resolve, this.batchConfig.pauseBetweenBatches));
      }
      
      // Extraction completed
      this.emit('extraction-complete', {
        jobId,
        processedApplicants: this.extractionState.processedApplicants,
        totalApplicants: this.extractionState.totalApplicants,
        errors: this.extractionState.errors.length > 0 ? this.extractionState.errors : null
      });
      
      this._resetExtractionState();
    } catch (error) {
      console.error('Extraction process error:', error);
      this._recordExtractionError(error, 'extraction_process_failed');
      
      this.emit('extraction-error', {
        jobId,
        error: error.message,
        code: 'EXTRACTION_PROCESS_FAILED',
        canRetry: true
      });
      
      this._resetExtractionState();
    }
  }
  
  /**
   * Resume the extraction process from where it was paused
   * @private
   */
  async _resumeExtractionProcess() {
    try {
      // Check if we have a valid state to resume
      if (!this.extractionState.isExtracting || 
          !this.extractionState.jobId ||
          this.extractionState.currentBatch === null) {
        throw new Error('Invalid extraction state for resume');
      }
      
      // Get applicants again (we might need to refresh)
      const applicants = await this.linkedInAutomation.getApplicants(this.extractionState.jobId);
      
      // Plan batches again
      const batches = this._createBatches(applicants, this.batchConfig.batchSize);
      
      // Continue from current batch
      for (let i = this.extractionState.currentBatch; i < batches.length; i++) {
        // Check if we should stop
        if (!this.extractionState.isExtracting) {
          console.log('Extraction stopped');
          return;
        }
        
        // Check if we should pause
        if (this.extractionState.isPaused) {
          console.log('Extraction paused at batch', i);
          this.extractionState.currentBatch = i;
          return;
        }
        
        // Update current batch
        this.extractionState.currentBatch = i;
        
        // Process batch
        await this._processBatch(batches[i], i + 1);
        
        // Small pause between batches to avoid detection
        await new Promise(resolve => setTimeout(resolve, this.batchConfig.pauseBetweenBatches));
      }
      
      // Extraction completed
      this.emit('extraction-complete', {
        jobId: this.extractionState.jobId,
        processedApplicants: this.extractionState.processedApplicants,
        totalApplicants: this.extractionState.totalApplicants,
        errors: this.extractionState.errors.length > 0 ? this.extractionState.errors : null
      });
      
      this._resetExtractionState();
    } catch (error) {
      console.error('Resume extraction process error:', error);
      this._recordExtractionError(error, 'resume_process_failed');
      
      this.emit('extraction-error', {
        jobId: this.extractionState.jobId,
        error: error.message,
        code: 'RESUME_PROCESS_FAILED',
        canRetry: true
      });
      
      this._resetExtractionState();
    }
  }
  
  /**
   * Process a batch of applicants
   * @param {Array} batch Batch of applicants to process
   * @param {number} batchNumber Current batch number
   * @private
   */
  async _processBatch(batch, batchNumber) {
    try {
      // Update progress
      this.emit('batch-started', {
        jobId: this.extractionState.jobId,
        batchNumber,
        totalBatches: this.extractionState.totalBatches,
        batchSize: batch.length
      });
      
      // Process applicants concurrently but within concurrency limit
      const concurrency = this.batchConfig.concurrency;
      
      // Process in chunks according to concurrency setting
      for (let i = 0; i < batch.length; i += concurrency) {
        const chunk = batch.slice(i, i + concurrency);
        const promises = chunk.map(applicant => this._processApplicant(applicant));
        
        await Promise.all(promises);
        
        // Check if paused after each chunk
        if (this.extractionState.isPaused) {
          return;
        }
      }
      
      // Update progress
      this.emit('batch-completed', {
        jobId: this.extractionState.jobId,
        batchNumber,
        totalBatches: this.extractionState.totalBatches,
        processedApplicants: this.extractionState.processedApplicants
      });
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error);
      this._recordExtractionError(error, 'batch_processing_failed', { batchNumber });
    }
  }
  
  /**
   * Process a single applicant
   * @param {Object} applicant Applicant data
   * @private
   */
  async _processApplicant(applicant) {
    try {
      // Skip if no profile URL
      if (!applicant.profileUrl) {
        console.warn('Skipping applicant with no profile URL:', applicant.name);
        return;
      }
      
      // Get detailed profile data
      const profileData = await this.linkedInAutomation.getProfileData(applicant.profileUrl);
      
      // Try to download CV if available
      try {
        const cvDownload = await this.linkedInAutomation.downloadCV(applicant.profileUrl);
        if (cvDownload.success) {
          profileData.cvFilePath = cvDownload.filePath;
        }
      } catch (cvError) {
        console.warn(`Failed to download CV for ${applicant.name}:`, cvError);
        this._recordExtractionError(cvError, 'cv_download_failed', {
          applicantName: applicant.name,
          profileUrl: applicant.profileUrl
        });
      }
      
      // Save profile data to JSON
      await this.linkedInAutomation.saveProfileToJson(profileData);
      
      // Note: saving to database is handled by the profileExtracted event listener
    } catch (error) {
      console.error(`Error processing applicant ${applicant.name}:`, error);
      this._recordExtractionError(error, 'applicant_processing_failed', {
        applicantName: applicant.name,
        profileUrl: applicant.profileUrl
      });
    }
  }
  
  /**
   * Reset the extraction state
   * @private
   */
  _resetExtractionState() {
    this.extractionState = {
      isExtracting: false,
      isPaused: false,
      jobId: null,
      totalApplicants: 0,
      processedApplicants: 0,
      startTime: null,
      pauseTime: null,
      currentBatch: 0,
      totalBatches: 0,
      errors: []
    };
  }
  
  /**
   * Calculate current progress percentage
   * @returns {number} Progress percentage
   * @private
   */
  _calculateProgress() {
    if (this.extractionState.totalApplicants === 0) {
      return 0;
    }
    
    return Math.round(
      (this.extractionState.processedApplicants / this.extractionState.totalApplicants) * 100
    );
  }
  
  /**
   * Estimate remaining time for extraction
   * @returns {number} Estimated time remaining in seconds
   * @private
   */
  _estimateTimeRemaining() {
    if (this.extractionState.processedApplicants === 0 || 
        !this.extractionState.startTime ||
        this.extractionState.totalApplicants === 0) {
      return null;
    }
    
    const elapsedMs = Date.now() - this.extractionState.startTime;
    const msPerApplicant = elapsedMs / this.extractionState.processedApplicants;
    const remainingApplicants = this.extractionState.totalApplicants - this.extractionState.processedApplicants;
    
    return Math.round((msPerApplicant * remainingApplicants) / 1000);
  }
  
  /**
   * Estimate total extraction time based on number of applicants
   * @param {number} applicantCount Number of applicants
   * @returns {number} Estimated time in minutes
   * @private
   */
  _estimateExtractionTime(applicantCount) {
    // Rough estimate: 30 seconds per applicant
    const estimatedSeconds = applicantCount * 30;
    return Math.ceil(estimatedSeconds / 60);
  }
  
  /**
   * Create batches from an array of items
   * @param {Array} items Items to batch
   * @param {number} batchSize Size of each batch
   * @returns {Array} Array of batches
   * @private
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * Record an extraction error
   * @param {Error} error Error object
   * @param {string} code Error code
   * @param {Object} context Additional context
   * @private
   */
  _recordExtractionError(error, code, context = {}) {
    this.extractionState.errors.push({
      message: error.message,
      code,
      timestamp: new Date().toISOString(),
      context
    });
  }
  
  /**
   * Emit extraction progress event
   * @private
   */
  _emitExtractionProgress() {
    this.emit('extraction-progress', {
      jobId: this.extractionState.jobId,
      processedApplicants: this.extractionState.processedApplicants,
      totalApplicants: this.extractionState.totalApplicants,
      progress: this._calculateProgress(),
      estimatedTimeRemaining: this._estimateTimeRemaining()
    });
  }
}

module.exports = WorkflowManager;