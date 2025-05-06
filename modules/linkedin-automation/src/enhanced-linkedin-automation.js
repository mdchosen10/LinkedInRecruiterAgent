/**
 * Enhanced LinkedIn Automation Module
 * 
 * This extended version includes:
 * - Standardized event emission for real-time progress tracking
 * - Batch processing for efficient applicant extraction
 * - Pause/resume functionality for long-running operations
 * - Enhanced error handling and recovery
 * - Optimized CV downloading
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const keytar = require('keytar');
const EventEmitter = require('events');
const EventStandardization = require('./event-standardization');

class EnhancedLinkedInAutomation extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      headless: false,
      downloadPath: path.join(process.cwd(), 'downloads'),
      userDataDir: path.join(process.cwd(), 'user_data'),
      rateLimit: {
        requestsPerHour: 30,
        cooldownPeriod: 10000,
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 5000,
      },
      batchOptions: {
        batchSize: 5,
        pauseBetweenBatches: 3000,
        maxConcurrent: 1, // Default to sequential processing
      },
      downloadOptions: {
        timeout: 30000,
        retryAttempts: 3,
      },
      ...options
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.requestCounter = 0;
    this.lastRequestTime = 0;
    this.serviceId = 'linkedin-automation';
    this.isLoggedIn = false;
    
    // Operation state tracking
    this.operationState = {
      isRunning: false,
      isPaused: false,
      shouldStop: false,
      currentOperation: null,
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        currentItem: null
      },
      startTime: null,
      lastProcessedIndex: -1,
      processedItems: [],
      errors: [],
      batches: {
        current: 0,
        total: 0,
        completed: 0,
        failed: 0
      }
    };
    
    // Initialize event standardization layer
    this.eventStandardization = new EventStandardization(this);
    
    // Create necessary directories
    if (!fs.existsSync(this.options.downloadPath)) {
      fs.mkdirSync(this.options.downloadPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.options.userDataDir)) {
      fs.mkdirSync(this.options.userDataDir, { recursive: true });
    }
  }

  /**
   * Initialize the browser instance using an existing profile
   */
  async init() {
    try {
      this.browser = await chromium.launchPersistentContext(this.options.userDataDir, {
        headless: false,
        slowMo: 50,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=AutomationControlled',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        ],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,
        deviceScaleFactor: 1,
        hasTouch: false,
        defaultBrowserType: 'chromium',
        bypassCSP: true,
        downloadsPath: this.options.downloadPath,
        ignoreHTTPSErrors: true
      });
      
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(60000);
      await this._setupAntiDetection();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Set up enhanced anti-detection measures
   * @private
   */
  async _setupAntiDetection() {
    // Add browser fingerprint evasion (same as original implementation)
    await this.page.addInitScript(() => {
      // Override property descriptors to avoid detection
      const originalDescriptorGetter = Object.getOwnPropertyDescriptor;
      Object.getOwnPropertyDescriptor = function(obj, prop) {
        const originalDescriptor = originalDescriptorGetter(obj, prop);
        
        if (obj === navigator && prop === 'webdriver') {
          return { get: () => false };
        }
        
        return originalDescriptor;
      };
      
      // Override all the obvious automation flags
      const overrides = {
        webdriver: false,
        __driver_evaluate: undefined,
        __webdriver_evaluate: undefined,
        __selenium_evaluate: undefined,
        __fxdriver_evaluate: undefined,
        __driver_unwrapped: undefined,
        __webdriver_unwrapped: undefined,
        __selenium_unwrapped: undefined,
        __fxdriver_unwrapped: undefined,
        _Selenium_IDE_Recorder: undefined,
        _selenium: undefined,
        calledSelenium: undefined,
        _WEBDRIVER_ELEM_CACHE: undefined,
        ChromeDriverw: undefined,
        domAutomation: undefined,
        domAutomationController: undefined,
        __lastWatirAlert: undefined,
        __lastWatirConfirm: undefined,
        __lastWatirPrompt: undefined,
        '$cdc_asdjflasutopfhvcZLmcfl_': undefined,
        '$chrome_asyncScriptInfo': undefined
      };
      
      // Apply all overrides
      for (const key in overrides) {
        if (key in window) {
          Object.defineProperty(window, key, {
            get: () => overrides[key],
            configurable: true
          });
        }
      }
      
      // Override navigator properties
      const navigatorProps = {
        webdriver: false,
        userAgent: navigator.userAgent.replace(/HeadlessChrome\/[^ ]+/g, ''),
        hardwareConcurrency: 4 + Math.floor(Math.random() * 4), 
        deviceMemory: 8 + Math.floor(Math.random() * 8),
        languages: ['en-US', 'en', 'es'],
        platform: 'Win32',
      };
      
      for (const prop in navigatorProps) {
        if (prop in navigator) {
          Object.defineProperty(navigator, prop, {
            get: () => navigatorProps[prop],
            configurable: true
          });
        }
      }
      
      // Override Permissions API
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function(parameters) {
          if (parameters.name === 'notifications') {
            return Promise.resolve({ state: 'granted' });
          }
          return originalQuery.call(navigator.permissions, parameters);
        };
      }
      
      // Add fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const fakePlugins = {
            length: 5,
            item: index => fakePlugins[index] || null,
            namedItem: name => fakePlugins[name] || null,
            refresh: () => {},
            0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            2: { name: 'Native Client', filename: 'internal-nacl-plugin' },
            3: { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll' },
            4: { name: 'Shockwave Flash', filename: 'pepflashplayer.dll' }
          };
          
          return fakePlugins;
        },
        configurable: true
      });
    });
    
    this.page.on('request', req => {
      this.requestCounter++;
      this.lastRequestTime = Date.now();
    });
    
    // Setup download handling
    this.page.on('download', async download => {
      const fileName = download.suggestedFilename();
      const filePath = path.join(this.options.downloadPath, fileName);
      await download.saveAs(filePath);
      console.log(`File downloaded: ${filePath}`);
    });
    
    // Listen for console messages 
    this.page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Add random mouse movements to appear more human
    await this.page.evaluate(() => {
      // Simulate some mouse movements
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        const event = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        document.dispatchEvent(event);
      }
    });
  }

  /**
   * Resets the operation state for a new operation
   * @param {string} operationType - Type of operation being started
   * @param {number} totalItems - Total items to process (if known)
   * @private
   */
  _resetOperationState(operationType, totalItems = 0) {
    this.operationState = {
      isRunning: true,
      isPaused: false,
      shouldStop: false,
      currentOperation: operationType,
      progress: {
        current: 0,
        total: totalItems,
        percentage: 0,
        currentItem: null
      },
      startTime: Date.now(),
      lastProcessedIndex: -1,
      processedItems: [],
      errors: [],
      batches: {
        current: 0,
        total: Math.ceil(totalItems / this.options.batchOptions.batchSize) || 0,
        completed: 0,
        failed: 0
      }
    };
  }

  /**
   * Get current operation state
   * @returns {Object} - Current operation state
   */
  getOperationState() {
    return {
      ...this.operationState,
      runningTime: this.operationState.startTime ? Date.now() - this.operationState.startTime : 0
    };
  }

  /**
   * Request pause of current operation
   * @returns {boolean} - Whether pause was requested successfully
   */
  async pauseOperation() {
    if (!this.operationState.isRunning || this.operationState.shouldStop) {
      return false;
    }
    
    this.operationState.isPaused = true;
    this.operationState.pauseRequestTime = Date.now();
    
    // Emit pause event with current progress
    const pauseData = {
      current: this.operationState.progress.current,
      total: this.operationState.progress.total,
      reason: 'user_requested'
    };
    
    this.eventStandardization.emitExtractionPaused(pauseData);
    
    return true;
  }

  /**
   * Resume current paused operation
   * @returns {boolean} - Whether resume was successful
   */
  async resumeOperation() {
    if (!this.operationState.isPaused || this.operationState.shouldStop) {
      return false;
    }
    
    this.operationState.isPaused = false;
    this.operationState.pauseRequestTime = null;
    
    // Emit resume event with current progress
    const resumeData = {
      current: this.operationState.progress.current,
      total: this.operationState.progress.total
    };
    
    this.eventStandardization.emitExtractionResumed(resumeData);
    
    return true;
  }

  /**
   * Stop the current operation
   * @returns {boolean} - Whether stop was successful
   */
  async stopOperation() {
    if (!this.operationState.isRunning) {
      return false;
    }
    
    this.operationState.shouldStop = true;
    this.operationState.isPaused = false;
    
    return true;
  }

  /**
   * Enforce rate limiting to avoid detection
   * @private
   */
  async _enforceRateLimit() {
    const hourlyLimit = this.options.rateLimit.requestsPerHour;
    const cooldownPeriod = this.options.rateLimit.cooldownPeriod;
    
    if (this.requestCounter >= hourlyLimit) {
      console.log(`Rate limit reached (${hourlyLimit} requests). Cooling down...`);
      await new Promise(resolve => setTimeout(resolve, 3600000)); // Wait an hour
      this.requestCounter = 0;
    }
    
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < cooldownPeriod) {
      // Add randomness to wait time to seem more human
      const waitTime = cooldownPeriod - timeSinceLastRequest + Math.floor(Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  /**
   * Add random human-like delays between actions
   * @private
   */
  async _addHumanDelay() {
    const baseDelay = 500;
    const randomDelay = Math.floor(Math.random() * 2000); // Random delay up to 2 seconds
    await this.page.waitForTimeout(baseDelay + randomDelay);
  }

  /**
   * Handles operation pause points
   * Waits if operation is paused until resumed or stopped
   * @private
   */
  async _handlePausePoint() {
    if (this.operationState.shouldStop) {
      throw new Error('Operation was stopped by user');
    }
    
    if (this.operationState.isPaused) {
      // Wait until the operation is resumed or stopped
      while (this.operationState.isPaused && !this.operationState.shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (this.operationState.shouldStop) {
        throw new Error('Operation was stopped by user');
      }
    }
  }

  /**
   * Estimate total number of applicants from pagination info
   * @returns {number} - Estimated total applicants
   * @private
   */
  async _estimateTotalApplicants() {
    try {
      // Look for pagination text like "1-25 of 142 applicants"
      const paginationText = await this.page.textContent('.artdeco-pagination__page-info');
      
      if (paginationText) {
        const match = paginationText.match(/of\s+(\d+)/i);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
      
      // Alternative: count the number of applicants on the first page
      const applicantCount = await this.page.evaluate(() => {
        return document.querySelectorAll('.jobs-applicant-list__applicant').length;
      });
      
      // If pagination exists but we couldn't extract the total,
      // estimate conservatively with multiple pages
      const hasNextButton = await this.page.$('button[aria-label="Next"]');
      return hasNextButton ? applicantCount * 5 : applicantCount;
    } catch (error) {
      console.error('Error estimating total applicants:', error);
      return 100; // Default conservative estimate
    }
  }

  /**
   * Check if we can navigate to next page
   * @returns {boolean} - Whether navigation to next page was successful
   * @private
   */
  async _navigateToNextPage() {
    try {
      const nextButton = await this.page.$('button[aria-label="Next"]');
      if (!nextButton) {
        return false;
      }
      
      const isNextButtonDisabled = await nextButton.evaluate(el => el.disabled);
      if (isNextButtonDisabled) {
        return false;
      }
      
      await nextButton.click();
      await this.page.waitForTimeout(2000); // Wait for page to load
      
      // Verify that we navigated to a new page
      const succeeded = await this.page.evaluate(() => {
        // This checks if the page reloaded by looking at network activity
        // or changes in the DOM
        return true; // Simplified for this example
      });
      
      return succeeded;
    } catch (error) {
      console.error('Error navigating to next page:', error);
      return false;
    }
  }

  /**
   * Extract applicants from the current page
   * @returns {Array} - Applicants on the current page
   * @private
   */
  async _extractApplicantsFromCurrentPage() {
    try {
      // Wait for applicant list to load
      await this.page.waitForSelector('.jobs-applicants-list__list');
      
      // Extract applicant data
      return await this.page.evaluate(() => {
        const applicantNodes = document.querySelectorAll('.jobs-applicant-list__applicant');
        return Array.from(applicantNodes).map(node => {
          // Get profile link
          const profileLinkElem = node.querySelector('a[href*="/in/"]');
          const profileUrl = profileLinkElem ? profileLinkElem.href : null;
          
          // Get name
          const nameElem = node.querySelector('.jobs-applicant-list__name-heading');
          const name = nameElem ? nameElem.textContent.trim() : null;
          
          // Get headline
          const headlineElem = node.querySelector('.jobs-applicant-list__headline');
          const headline = headlineElem ? headlineElem.textContent.trim() : null;
          
          // Get applicant location
          const locationElem = node.querySelector('.jobs-applicant-list__location');
          const location = locationElem ? locationElem.textContent.trim() : null;
          
          // Get additional info (date applied, etc.)
          const infoElem = node.querySelector('.jobs-applicant-list__subline');
          const info = infoElem ? infoElem.textContent.trim() : null;
          
          return {
            name,
            headline,
            location,
            info,
            profileUrl,
            profileId: profileUrl ? profileUrl.split('/in/')[1].replace(/\/$/, '') : null
          };
        });
      });
    } catch (error) {
      console.error('Error extracting applicants from current page:', error);
      throw error;
    }
  }

  /**
   * ENHANCED: Get all applicants for a job with progress tracking,
   * batch processing, and pause/resume functionality
   * 
   * @param {string} jobId - LinkedIn job ID
   * @param {Object} options - Optional configuration
   * @returns {Array} - List of applicant data with profile URLs
   */
  async getApplicants(jobId, options = {}) {
    const defaultOptions = {
      batchSize: this.options.batchOptions.batchSize,
      maxApplicants: 100,
      pauseBetweenBatches: this.options.batchOptions.pauseBetweenBatches,
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      // Reset operation state
      this._resetOperationState('extract_applicants');
      
      // First navigate to applicants page
      await this.navigateToApplicants(jobId);
      
      const applicants = [];
      let hasMorePages = true;
      let currentPage = 1;
      let processedCount = 0;
      
      // Estimate total by checking pagination
      const totalEstimate = await this._estimateTotalApplicants();
      
      // Update operation state with estimated total
      this.operationState.progress.total = Math.min(totalEstimate, config.maxApplicants);
      
      // Emit start event
      this.eventStandardization.emitExtractionStarted({
        jobId,
        estimatedApplicants: this.operationState.progress.total
      });
      
      while (hasMorePages && 
             processedCount < config.maxApplicants && 
             !this.operationState.shouldStop) {
        
        // Handle pause point
        await this._handlePausePoint();
        
        await this._enforceRateLimit();
        
        // Process applicants in current page
        try {
          const applicantsOnPage = await this._extractApplicantsFromCurrentPage();
          
          // Process in batches
          for (let i = 0; i < applicantsOnPage.length; i += config.batchSize) {
            // Handle pause point between batches
            await this._handlePausePoint();
            
            const batch = applicantsOnPage.slice(i, i + config.batchSize);
            
            // Update batch information
            this.operationState.batches.current++;
            
            // Emit batch started event
            this.eventStandardization.emitBatchStarted({
              batchId: `${jobId}-${currentPage}-${i}`,
              batchSize: batch.length,
              totalBatches: this.operationState.batches.total,
              currentBatch: this.operationState.batches.current
            });
            
            let batchSuccessCount = 0;
            let batchFailCount = 0;
            
            for (const applicant of batch) {
              // Emit progress for current applicant
              this.operationState.progress.current = processedCount + 1;
              this.operationState.progress.currentItem = applicant.name;
              this.operationState.progress.percentage = Math.round(
                ((processedCount + 1) / this.operationState.progress.total) * 100
              );
              
              this.eventStandardization.emitExtractionProgress({
                current: processedCount + 1,
                total: this.operationState.progress.total,
                percentage: this.operationState.progress.percentage,
                currentApplicant: applicant.name
              });
              
              // Track applicant in processed items
              this.operationState.processedItems.push({
                id: applicant.profileId,
                name: applicant.name,
                success: true,
                timestamp: Date.now()
              });
              
              applicants.push(applicant);
              processedCount++;
              batchSuccessCount++;
              
              // Update last processed index
              this.operationState.lastProcessedIndex = processedCount - 1;
              
              // Handle pause point between applicants
              await this._handlePausePoint();
              
              // Check if we need to stop
              if (this.operationState.shouldStop || 
                  processedCount >= config.maxApplicants) {
                break;
              }
            }
            
            // Emit batch completed event
            this.eventStandardization.emitBatchCompleted({
              batchId: `${jobId}-${currentPage}-${i}`,
              processedItems: batch.length,
              successfulItems: batchSuccessCount,
              failedItems: batchFailCount,
              totalBatches: this.operationState.batches.total,
              currentBatch: this.operationState.batches.current
            });
            
            // Add delay between batches if not the last batch
            if (i + config.batchSize < applicantsOnPage.length && 
                !this.operationState.shouldStop) {
              await new Promise(resolve => 
                setTimeout(resolve, config.pauseBetweenBatches)
              );
            }
            
            if (this.operationState.shouldStop || 
                processedCount >= config.maxApplicants) {
              break;
            }
          }
          
          // Check if we need to stop after processing this page
          if (this.operationState.shouldStop || 
              processedCount >= config.maxApplicants) {
            break;
          }
          
          // Navigate to next page if possible
          hasMorePages = await this._navigateToNextPage();
          currentPage++;
          
        } catch (error) {
          // Handle page extraction error
          console.error(`Error processing page ${currentPage}:`, error);
          
          this.operationState.errors.push({
            phase: `page_${currentPage}`,
            error: error.message,
            timestamp: Date.now()
          });
          
          // Emit error event
          this.eventStandardization.emitExtractionError({
            error: error.message,
            context: `Failed while extracting applicants on page ${currentPage} for job ${jobId}`,
            recoverable: true,
            partial: applicants.length > 0 ? { count: applicants.length } : null
          });
          
          // Attempt to continue with next page if possible
          try {
            hasMorePages = await this._navigateToNextPage();
            currentPage++;
          } catch (navigationError) {
            // If navigation also fails, we need to stop
            hasMorePages = false;
          }
        }
      }
      
      // Determine if operation completed normally or was stopped
      const completionReason = this.operationState.shouldStop ? 'stopped' : 
                              (processedCount >= config.maxApplicants ? 'max_reached' : 'completed');
      
      // Reset operation state
      this.operationState.isRunning = false;
      
      // Calculate completion time
      const completionTime = Date.now() - this.operationState.startTime;
      
      // Emit completion event
      this.eventStandardization.emitExtractionCompleted({
        applicants,
        completionTime,
        reason: completionReason
      });
      
      return applicants;
    } catch (error) {
      // Handle critical errors
      this.operationState.isRunning = false;
      
      // Add to error log
      this.operationState.errors.push({
        phase: 'extraction_main',
        error: error.message,
        timestamp: Date.now()
      });
      
      // Emit error event
      this.eventStandardization.emitExtractionError({
        error: error.message,
        context: `Failed while extracting applicants for job ${jobId}`,
        recoverable: false,
        partial: this.operationState.progress.current > 0 ? 
          { count: this.operationState.progress.current } : null
      });
      
      throw error;
    }
  }

  /**
   * Process job applicants in batches - extracts and enhances data
   * @param {string} jobId - LinkedIn job ID
   * @param {Object} options - Processing options
   * @returns {Array} - Enhanced applicant data
   */
  async processJobApplicants(jobId, options = {}) {
    const defaultOptions = {
      batchSize: this.options.batchOptions.batchSize,
      maxApplicants: 100,
      pauseBetweenBatches: this.options.batchOptions.pauseBetweenBatches,
      getDetailedProfiles: false,
      downloadCVs: false
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      // Extract basic applicant data first
      const applicants = await this.getApplicants(jobId, {
        batchSize: config.batchSize,
        maxApplicants: config.maxApplicants,
        pauseBetweenBatches: config.pauseBetweenBatches
      });
      
      // If no additional processing requested, return basic data
      if (!config.getDetailedProfiles && !config.downloadCVs) {
        return applicants;
      }
      
      // Reset operation state for enhancement phase
      this._resetOperationState('enhance_applicants', applicants.length);
      
      // Enhanced data processing
      const enhancedApplicants = [];
      
      // Calculate total batches for this operation
      this.operationState.batches.total = Math.ceil(applicants.length / config.batchSize);
      
      // Process in batches
      for (let i = 0; i < applicants.length; i += config.batchSize) {
        // Handle pause point between batches
        await this._handlePausePoint();
        
        // Create batch
        const batch = applicants.slice(i, i + config.batchSize);
        
        // Update batch information
        this.operationState.batches.current++;
        
        // Emit batch started event
        this.eventStandardization.emitBatchStarted({
          batchId: `enhance-${jobId}-${i}`,
          batchSize: batch.length,
          totalBatches: this.operationState.batches.total,
          currentBatch: this.operationState.batches.current
        });
        
        let batchSuccessCount = 0;
        let batchFailCount = 0;
        
        // Process each applicant in the batch
        for (let j = 0; j < batch.length; j++) {
          const applicant = batch[j];
          const enhancedApplicant = { ...applicant };
          
          // Handle pause point between applicants
          await this._handlePausePoint();
          
          // Update progress
          const currentIndex = i + j;
          this.operationState.progress.current = currentIndex + 1;
          this.operationState.progress.currentItem = applicant.name;
          this.operationState.progress.percentage = Math.round(
            ((currentIndex + 1) / applicants.length) * 100
          );
          
          // Emit progress event
          this.eventStandardization.emitExtractionProgress({
            current: this.operationState.progress.current,
            total: applicants.length,
            percentage: this.operationState.progress.percentage,
            currentApplicant: applicant.name
          });
          
          try {
            // Get detailed profile if requested
            if (config.getDetailedProfiles && applicant.profileUrl) {
              enhancedApplicant.profileDetails = await this.getProfileData(applicant.profileUrl);
            }
            
            // Download CV if requested
            if (config.downloadCVs && applicant.profileUrl) {
              enhancedApplicant.cvDownload = await this.downloadCV(
                applicant.profileUrl,
                `${applicant.name.replace(/\s+/g, '_')}_CV.pdf`
              );
            }
            
            // Track success
            this.operationState.processedItems.push({
              id: applicant.profileId,
              name: applicant.name,
              success: true,
              timestamp: Date.now()
            });
            
            batchSuccessCount++;
          } catch (error) {
            // Track failure but continue with next applicant
            this.operationState.errors.push({
              phase: 'enhance_applicant',
              applicantId: applicant.profileId,
              error: error.message,
              timestamp: Date.now()
            });
            
            enhancedApplicant.processingError = error.message;
            
            // Track failure
            this.operationState.processedItems.push({
              id: applicant.profileId,
              name: applicant.name,
              success: false,
              error: error.message,
              timestamp: Date.now()
            });
            
            batchFailCount++;
          }
          
          // Add to results regardless of success/failure
          enhancedApplicants.push(enhancedApplicant);
          
          // Update last processed index
          this.operationState.lastProcessedIndex = currentIndex;
          
          // Check if we need to stop
          if (this.operationState.shouldStop) {
            break;
          }
        }
        
        // Emit batch completed event
        this.eventStandardization.emitBatchCompleted({
          batchId: `enhance-${jobId}-${i}`,
          processedItems: batch.length,
          successfulItems: batchSuccessCount,
          failedItems: batchFailCount,
          totalBatches: this.operationState.batches.total,
          currentBatch: this.operationState.batches.current
        });
        
        // Add delay between batches
        if (i + config.batchSize < applicants.length && !this.operationState.shouldStop) {
          await new Promise(resolve => 
            setTimeout(resolve, config.pauseBetweenBatches)
          );
        }
        
        // Check if we need to stop
        if (this.operationState.shouldStop) {
          break;
        }
      }
      
      // Reset operation state
      this.operationState.isRunning = false;
      
      // Calculate completion time
      const completionTime = Date.now() - this.operationState.startTime;
      
      // Emit completion event
      this.eventStandardization.emitExtractionCompleted({
        applicants: enhancedApplicants,
        completionTime,
        reason: this.operationState.shouldStop ? 'stopped' : 'completed'
      });
      
      return enhancedApplicants;
      
    } catch (error) {
      // Handle critical errors
      this.operationState.isRunning = false;
      
      // Add to error log
      this.operationState.errors.push({
        phase: 'process_applicants_main',
        error: error.message,
        timestamp: Date.now()
      });
      
      // Emit error event
      this.eventStandardization.emitExtractionError({
        error: error.message,
        context: `Failed while processing applicants for job ${jobId}`,
        recoverable: false,
        partial: this.operationState.processedItems.length > 0 ? 
          { count: this.operationState.processedItems.length } : null
      });
      
      throw error;
    }
  }

  /**
   * ENHANCED: Download CV with improved reliability and progress tracking
   * @param {string} profileUrl - LinkedIn profile URL or ID
   * @param {string} preferredFileName - Optional preferred file name
   * @param {Object} options - Additional download options
   * @returns {Object} - Status and file path if successful
   */
  async downloadCV(profileUrl, preferredFileName = null, options = {}) {
    if (!this.isLoggedIn) {
      throw new Error('You must be logged in to download CVs');
    }
    
    const downloadOptions = {
      timeout: this.options.downloadOptions.timeout,
      retryAttempts: this.options.downloadOptions.retryAttempts,
      ...options
    };
    
    // Extract profile ID for tracking
    const profileId = profileUrl.includes('/in/') ? 
      profileUrl.split('/in/')[1].replace(/\/$/, '') : profileUrl;
    
    // Get profile name if available
    let profileName = profileId;
    try {
      const url = this.page.url();
      const nameElement = await this.page.$('.pv-top-card .text-heading-xlarge');
      if (nameElement) {
        profileName = await nameElement.textContent();
        profileName = profileName.trim();
      }
    } catch (e) {
      // Ignore errors when trying to get name
    }
    
    // Emit download started event
    this.eventStandardization.emitCVDownloadStarted({
      profileId,
      profileName
    });
    
    try {
      await this._enforceRateLimit();
      
      // Normalize the URL
      const fullProfileUrl = profileUrl.includes('linkedin.com') ? 
        profileUrl : `https://www.linkedin.com/in/${profileUrl}/`;
      
      // Navigate to profile detail page if not already there
      const currentUrl = this.page.url();
      if (!currentUrl.includes(profileId)) {
        await this.page.goto(fullProfileUrl, {
          waitUntil: 'networkidle',
          timeout: downloadOptions.timeout
        });
      }
      
      // Strategies to find resume button/link
      const resumeSelectors = [
        'button:has-text("Resume")', 
        'a:has-text("Resume")', 
        'a:has-text("CV")',
        'button[aria-label*="resume" i]',
        'button[aria-label*="cv" i]',
        'div[aria-label*="resume" i]',
        '.pv-top-card-v2-section__actions a[download]'
      ];
      
      // Try all selectors
      let resumeButton = null;
      for (const selector of resumeSelectors) {
        resumeButton = await this.page.$(selector);
        if (resumeButton) break;
      }
      
      // If still not found, look for it in the More dropdown
      if (!resumeButton) {
        const moreButton = await this.page.$('button:has-text("More")');
        if (moreButton) {
          await moreButton.click();
          await this.page.waitForTimeout(1000);
          
          // Check dropdown items
          for (const selector of resumeSelectors) {
            resumeButton = await this.page.$(selector);
            if (resumeButton) break;
          }
        }
      }
      
      // If still not found, try checking the contact info
      if (!resumeButton) {
        const contactInfoButton = await this.page.$('a[href="#contact-info"], a[data-control-name="contact_see_more"]');
        if (contactInfoButton) {
          await contactInfoButton.click();
          await this.page.waitForTimeout(1000);
          
          // Check contact info for CV links
          resumeButton = await this.page.$('section.pv-contact-info a:has-text("Resume"), section.pv-contact-info a:has-text("CV")');
        }
      }
      
      if (!resumeButton) {
        // Emit download error event
        this.eventStandardization.emitCVDownloadError({
          profileId,
          profileName,
          error: 'No CV/resume found on profile'
        });
        
        return {
          success: false,
          message: 'No CV/resume found on profile',
          filePath: null
        };
      }
      
      // Progress update - found the download button (50%)
      this.eventStandardization.emitCVDownloadProgress({
        profileId,
        profileName,
        percentage: 50
      });
      
      // Set up download listener
      const downloadPromise = this.page.waitForEvent('download', {
        timeout: downloadOptions.timeout
      });
      
      // Click the CV/resume button
      await resumeButton.click();
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Progress update - download started (75%)
      this.eventStandardization.emitCVDownloadProgress({
        profileId,
        profileName,
        percentage: 75
      });
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = preferredFileName || 
        `${profileId}_CV_${timestamp}.pdf`;
      
      const downloadPath = path.join(this.options.downloadPath, fileName);
      
      // Save the file
      await download.saveAs(downloadPath);
      
      // Verify file was actually saved
      if (!fs.existsSync(downloadPath)) {
        throw new Error('Download completed but file not found');
      }
      
      // Get file size
      const stats = fs.statSync(downloadPath);
      const fileSize = stats.size;
      
      // Emit download completed event
      this.eventStandardization.emitCVDownloadCompleted({
        profileId,
        profileName,
        filePath: downloadPath,
        fileSize
      });
      
      return {
        success: true,
        message: 'CV downloaded successfully',
        filePath: downloadPath,
        fileSize
      };
    } catch (error) {
      console.error(`Failed to download CV for ${profileUrl}:`, error);
      
      // Emit download error event
      this.eventStandardization.emitCVDownloadError({
        profileId,
        profileName,
        error: error.message
      });
      
      // Try again if we still have retry attempts left
      if (downloadOptions.retryAttempts > 0) {
        console.log(`Retrying CV download for ${profileUrl}, ${downloadOptions.retryAttempts} attempts left`);
        return this.downloadCV(profileUrl, preferredFileName, {
          ...downloadOptions,
          retryAttempts: downloadOptions.retryAttempts - 1
        });
      }
      
      return {
        success: false,
        message: `CV download failed: ${error.message}`,
        filePath: null
      };
    }
  }

  /**
   * Retry an operation with exponential backoff
   * @param {Function} operation - The operation to retry
   * @param {Object} options - Optional retry options
   * @private
   */
  async _retryOperation(operation, options = {}) {
    const maxRetries = options.maxRetries || this.options.retryOptions.maxRetries;
    const retryDelay = options.retryDelay || this.options.retryOptions.retryDelay;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) break;
        
        // Calculate delay with exponential backoff and jitter
        const delay = retryDelay * Math.pow(1.5, attempt - 1) * (0.9 + Math.random() * 0.2);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Export operations results to JSON
   * @param {string} filePath - Path to save results
   * @returns {boolean} - Success status
   */
  exportOperationResults(filePath) {
    try {
      const results = {
        operationState: this.getOperationState(),
        timestamp: Date.now(),
        processedItems: this.operationState.processedItems,
        errors: this.operationState.errors,
        stats: {
          successRate: this.operationState.processedItems.length > 0 ? 
            (this.operationState.processedItems.filter(item => item.success).length / 
             this.operationState.processedItems.length) * 100 : 0,
          totalTime: this.operationState.startTime ? 
            Date.now() - this.operationState.startTime : 0,
          batchStats: {
            total: this.operationState.batches.total,
            completed: this.operationState.batches.completed,
            failed: this.operationState.batches.failed
          }
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to export operation results:', error);
      return false;
    }
  }
}

module.exports = EnhancedLinkedInAutomation;