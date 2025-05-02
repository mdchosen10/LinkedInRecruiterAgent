/**
 * LinkedIn Automation Module
 * 
 * A secure Playwright-based module for automating LinkedIn interactions
 * focused on job applicant data extraction for local Electron apps.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const keytar = require('keytar'); // For secure credential storage
const EventEmitter = require('events'); // Add this line

class LinkedInAutomation extends EventEmitter {
  constructor(options = {}) {
    super(); // Call the EventEmitter constructor
    this.options = {
      headless: false, // Default to visible browser for debugging
      downloadPath: path.join(process.cwd(), 'downloads'),
      userDataDir: path.join(process.cwd(), 'user_data'),
      rateLimit: {
        requestsPerHour: 30, // Conservative default to avoid detection
        cooldownPeriod: 10000, // 10 seconds between actions
      },
      retryOptions: {
        maxRetries: 3,
        retryDelay: 5000,
      },
      ...options
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.requestCounter = 0;
    this.lastRequestTime = 0;
    this.serviceId = 'linkedin-automation'; // For keytar
    this.isLoggedIn = false;
    
    // Create necessary directories
    if (!fs.existsSync(this.options.downloadPath)) {
      fs.mkdirSync(this.options.downloadPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.options.userDataDir)) {
      fs.mkdirSync(this.options.userDataDir, { recursive: true });
    }
  }

  /**
   * Initialize the browser instance
   */
  async init() {
    try {
      this.browser = await chromium.launchPersistentContext(this.options.userDataDir, {
        headless: this.options.headless,
        slowMo: 50, // Slow down operations by 50ms to appear more human-like
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        acceptDownloads: true,
        // Below options help avoid detection
        deviceScaleFactor: 1,
        hasTouch: false,
        defaultBrowserType: 'chromium',
        bypassCSP: true, // Needed for some operations on LinkedIn
        downloadsPath: this.options.downloadPath,
      });
      
      this.page = await this.browser.newPage();
      
      // Set default timeout
      this.page.setDefaultTimeout(60000);
      
      // Add random mouse movements and anti-detection measures
      await this._setupAntiDetection();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Set up anti-detection measures
   */
  async _setupAntiDetection() {
    // Override navigator properties that might be used for fingerprinting
    await this.page.addInitScript(() => {
      // Override properties used for bot detection
      const overrides = {
        webdriver: false,
        __selenium_unwrapped: undefined,
        __webdriver_evaluate: undefined,
        _phantom: undefined,
        callPhantom: undefined,
        phantom: undefined,
        navigator: {
          webdriver: false,
        },
      };
      
      // Apply the overrides
      for (const key in overrides) {
        if (overrides[key] === undefined) {
          delete window[key];
          continue;
        }
        
        // Otherwise define the property
        Object.defineProperty(window, key, {
          get() {
            return overrides[key];
          },
          configurable: true
        });
      }
      
      // Override navigator properties
      for (const key in overrides.navigator) {
        Object.defineProperty(Object.getPrototypeOf(navigator), key, {
          get() {
            return overrides.navigator[key];
          },
          configurable: true
        });
      }
      
      // Prevent detection of automation
      Object.defineProperty(navigator, 'plugins', {
        get: function() {
          return [1, 2, 3, 4, 5];
        },
      });
      
      // Add fake language array
      Object.defineProperty(navigator, 'languages', {
        get: function() {
          return ['en-US', 'en', 'es'];
        },
      });
    });
    
    // Add event listeners to handle rate limiting
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
    
    // Listen for console messages from the page for debugging
    this.page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });
  }

  /**
   * Store user credentials securely using keytar
   * @param {string} email 
   * @param {string} password 
   */
  async storeCredentials(email, password) {
    try {
      await keytar.setPassword(this.serviceId, email, password);
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      throw new Error(`Credential storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve stored credentials
   * @param {string} email 
   */
  async getCredentials(email) {
    try {
      const password = await keytar.getPassword(this.serviceId, email);
      if (!password) {
        throw new Error('Credentials not found');
      }
      return { email, password };
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      throw new Error(`Credential retrieval failed: ${error.message}`);
    }
  }

  /**
   * Delete stored credentials
   * @param {string} email 
   */
  async deleteCredentials(email) {
    try {
      await keytar.deletePassword(this.serviceId, email);
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      throw new Error(`Credential deletion failed: ${error.message}`);
    }
  }

  /**
   * Enforce rate limiting to avoid detection
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
   */
  async _addHumanDelay() {
    const baseDelay = 500;
    const randomDelay = Math.floor(Math.random() * 2000); // Random delay up to 2 seconds
    await this.page.waitForTimeout(baseDelay + randomDelay);
  }

  /**
   * Log in to LinkedIn
   * @param {string} email - LinkedIn email 
   * @param {string} password - LinkedIn password
   * @param {boolean} rememberCredentials - Whether to store credentials securely
   */
async loginToLinkedIn(credentials, userId) {
  try {
    // Initialize LinkedIn automation if it's not already initialized
    if (this.linkedInAutomation.init && !this.linkedInAutomation.browser) {
      await this.linkedInAutomation.init();
    }
    
    // Fix the user ID issue first - we need to check if the user exists
    try {
      const user = await this.dataStorage.userModel.getById(userId);
      if (!user) {
        // Create a temporary user record or return an error
        console.error('User not found in database. Please create a user account first.');
        return { 
          success: false, 
          message: 'User not found in database. Please create a user account first.' 
        };
      }
    } catch (error) {
      console.error('Error checking user:', error);
      return { success: false, message: 'Database error: ' + error.message };
    }
    
    // Only save credentials if explicitly requested
    if (credentials.rememberCredentials) {
      try {
        await this.dataStorage.saveLinkedInCredentials(userId, credentials);
        console.log('LinkedIn credentials saved for user', userId);
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
  
  /**
   * Handle potential security checks after login
   */
  async _handleSecurityChecks() {
    // Check for different security verification screens
    try {
      // Check for verification code entry
      const verificationCodeInput = await this.page.$(
        'input[name="pin"], input[placeholder="Verification code"]'
      );
      
      if (verificationCodeInput) {
        throw new Error('LinkedIn requires verification code. Please log in manually in browser first.');
      }
      
      // Check for CAPTCHA
      const captchaExists = await this.page.$(
        'iframe[src*="recaptcha"], iframe[src*="captcha"]'
      );
      
      if (captchaExists) {
        throw new Error('CAPTCHA detected. Please log in manually in browser first.');
      }
      
      // Check for "Unusual login activity" screen
      const unusualLoginText = await this.page.textContent('body');
      if (unusualLoginText && unusualLoginText.includes('unusual login')) {
        throw new Error('LinkedIn detected unusual login activity. Please log in manually in browser first.');
      }
      
    } catch (error) {
      if (error.message.includes('Please log in manually')) {
        throw error;
      }
      // If not a specific security check error, continue
    }
  }
  
  /**
   * Check if user is logged in
   */
  async _checkIfLoggedIn() {
    try {
      // Look for elements that would indicate a successful login
      const navBarExists = await this.page.$('nav.global-nav');
      const profileIconExists = await this.page.$('.global-nav__me-photo');
      const feedExists = await this.page.$('.feed-identity-module');
      
      return !!(navBarExists || profileIconExists || feedExists);
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  /**
   * Navigate to LinkedIn job posting
   * @param {string} jobId - LinkedIn job ID
   */
  async navigateToJob(jobId) {
    if (!this.isLoggedIn) {
      throw new Error('You must be logged in to navigate to a job');
    }
    
    try {
      await this._enforceRateLimit();
      
      // Go to job page
      await this.page.goto(`https://www.linkedin.com/jobs/view/${jobId}/`, {
        waitUntil: 'networkidle'
      });
      
      // Verify we're on the correct page
      const jobTitleElement = await this.page.$('.job-details-jobs-unified-top-card__job-title');
      if (!jobTitleElement) {
        throw new Error('Could not verify job page loaded correctly');
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to navigate to job ${jobId}:`, error);
      throw new Error(`Job navigation failed: ${error.message}`);
    }
  }
  
  /**
   * Navigate to applicants section of a job posting
   * @param {string} jobId - LinkedIn job ID
   */
  async navigateToApplicants(jobId) {
    if (!this.isLoggedIn) {
      throw new Error('You must be logged in to view applicants');
    }
    
    try {
      await this._enforceRateLimit();
      
      // Navigate to job first
      await this.navigateToJob(jobId);
      
      // Click on applicants tab/button
      const applicantsSelector = 'a[href*="applicants"], button:has-text("Applicants")';
      
      // Wait for the applicants link to appear with retry
      await this._retryOperation(async () => {
        const applicantsLink = await this.page.$(applicantsSelector);
        if (!applicantsLink) {
          throw new Error('Applicants link not found');
        }
        
        await applicantsLink.click();
        
        // Wait for applicants page to load
        await this.page.waitForSelector('.artdeco-pagination, .jobs-applicants-list__list');
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to navigate to applicants for job ${jobId}:`, error);
      throw new Error(`Applicants navigation failed: ${error.message}`);
    }
  }
  
  /**
   * Get all applicants for a job
   * @param {string} jobId - LinkedIn job ID
   * @returns {Array} - List of applicant data with profile URLs
   */
  async getApplicants(jobId) {
    try {
      // First navigate to applicants page
      await this.navigateToApplicants(jobId);
      
      const applicants = [];
      let hasMorePages = true;
      let currentPage = 1;
      
      while (hasMorePages) {
        await this._enforceRateLimit();
        
        // Wait for applicant list to load
        await this.page.waitForSelector('.jobs-applicants-list__list');
        
        // Extract applicant data
        const applicantsOnPage = await this.page.evaluate(() => {
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
        
        // Add applicants to our collection
        applicants.push(...applicantsOnPage);
        
        // Check if there are more pages
        const nextButton = await this.page.$('button[aria-label="Next"]');
        const isNextButtonDisabled = nextButton ? 
          await nextButton.evaluate(el => el.disabled) : true;
        
        if (nextButton && !isNextButtonDisabled) {
          await nextButton.click();
          await this.page.waitForTimeout(2000); // Wait for page to load
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }
  
      // Emit the searchCompleted event with the applicants data
      this.emit('searchCompleted', applicants);
      
      return applicants;
    } catch (error) {
      console.error(`Failed to get applicants for job ${jobId}:`, error);
      throw new Error(`Applicant retrieval failed: ${error.message}`);
    }
  }
  /**
   * Get detailed profile data for an applicant
   * @param {string} profileUrl - LinkedIn profile URL or ID
   * @returns {Object} - Comprehensive profile data
   */
  async getProfileData(profileUrl) {
    if (!this.isLoggedIn) {
      throw new Error('You must be logged in to view profiles');
    }
    
    try {
      await this._enforceRateLimit();
      
      // Normalize the URL
      const fullProfileUrl = profileUrl.includes('linkedin.com') ? 
        profileUrl : `https://www.linkedin.com/in/${profileUrl}/`;
      
      // Navigate to profile
      await this.page.goto(fullProfileUrl, {
        waitUntil: 'networkidle'
      });
      
      // Wait for profile content to load
      await this.page.waitForSelector('.pv-top-card');
      
      // Extract basic profile info
      const basicInfo = await this._extractBasicProfileInfo();
      
      // Scroll down to load all sections
      await this._scrollProfilePage();
      
      // Extract experience
      const experience = await this._extractExperienceData();
      
      // Extract education
      const education = await this._extractEducationData();
      
      // Extract skills
      const skills = await this._extractSkillsData();
      
      // Extract certifications
      const certifications = await this._extractCertificationsData();
      
      // Extract additional info (languages, volunteering, etc.)
      const additionalInfo = await this._extractAdditionalProfileData();
      
      // Compile comprehensive profile data
      const profileData = {
        ...basicInfo,
        experience,
        education,
        skills,
        certifications,
        ...additionalInfo,
        profileUrl: fullProfileUrl
      };
  
      // Emit the profileExtracted event with the profile data
      this.emit('profileExtracted', profileData);
      
      return profileData;
    } catch (error) {
      console.error(`Failed to get profile data for ${profileUrl}:`, error);
      throw new Error(`Profile data extraction failed: ${error.message}`);
    }
  }
  
  /**
   * Extract basic profile information
   */
  async _extractBasicProfileInfo() {
    try {
      return await this.page.evaluate(() => {
        // Get full name
        const nameElement = document.querySelector('.pv-top-card .text-heading-xlarge');
        const name = nameElement ? nameElement.textContent.trim() : null;
        
        // Get headline
        const headlineElement = document.querySelector('.pv-top-card .text-body-medium');
        const headline = headlineElement ? headlineElement.textContent.trim() : null;
        
        // Get location
        const locationElement = document.querySelector('.pv-top-card .text-body-small[href="#"]');
        const location = locationElement ? locationElement.textContent.trim() : null;
        
        // Get about/summary text
        const aboutSection = document.getElementById('about');
        let about = null;
        if (aboutSection) {
          const aboutTextElement = aboutSection.nextElementSibling?.querySelector('.display-flex .pv-shared-text-with-see-more');
          about = aboutTextElement ? aboutTextElement.textContent.trim() : null;
        }
        
        // Get contact info
        const contactInfoButton = document.querySelector('a[href="#contact-info"], a[data-control-name="contact_see_more"]');
        let email = null, phone = null, website = null;
        
        // Get profile image
        const imgElement = document.querySelector('.pv-top-card .pv-top-card-profile-picture__image');
        const profileImage = imgElement ? imgElement.src : null;
        
        return {
          name,
          headline,
          location,
          about,
          contact: {
            email,
            phone,
            website
          },
          profileImage
        };
      });
    } catch (error) {
      console.error('Error extracting basic profile info:', error);
      return {
        name: null,
        headline: null,
        location: null,
        about: null,
        contact: {},
        profileImage: null
      };
    }
  }
  
  /**
   * Scroll through the profile to load all content
   */
  async _scrollProfilePage() {
    try {
      // Scroll slowly through the page to load lazy content
      await this.page.evaluate(async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        const maxScrolls = 15; // Limit the number of scrolls
        let scrollCount = 0;
        let lastScrollPos = 0;
        
        while (scrollCount < maxScrolls) {
          window.scrollBy(0, 500);
          await delay(1000); // Wait for content to load
          
          // Check if we've reached the bottom
          const currentScrollPos = window.scrollY;
          if (currentScrollPos === lastScrollPos) {
            break;
          }
          
          lastScrollPos = currentScrollPos;
          scrollCount++;
        }
        
        // Scroll back to top
        window.scrollTo(0, 0);
      });
      
      await this._addHumanDelay();
    } catch (error) {
      console.error('Error scrolling profile page:', error);
    }
  }
  
  /**
   * Extract work experience data
   */
  async _extractExperienceData() {
    try {
      return await this.page.evaluate(() => {
        // First try to find the experience section
        const experienceSection = document.getElementById('experience');
        if (!experienceSection) return [];
        
        // Look for experience list items
        const experienceListItems = Array.from(
          experienceSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
        );
        
        return experienceListItems.map(item => {
          // Get company logo
          const logoElement = item.querySelector('img.ivm-view-attr__img--centered');
          const logo = logoElement ? logoElement.src : null;
          
          // Get job title
          const titleElement = item.querySelector('.display-flex .t-bold span');
          const title = titleElement ? titleElement.textContent.trim() : null;
          
          // Get company name
          const companyElement = item.querySelector('.t-normal.t-black--light span');
          const company = companyElement ? companyElement.textContent.trim() : null;
          
          // Get dates
          const dateRangeElement = item.querySelector('.display-flex .t-normal.t-black--light span');
          const dateRange = dateRangeElement ? dateRangeElement.textContent.trim() : null;
          
          // Get location
          const locationElement = item.querySelectorAll('.display-flex .t-normal.t-black--light span')[1];
          const location = locationElement ? locationElement.textContent.trim() : null;
          
          // Get description
          const descriptionElement = item.querySelector('.pv-shared-text-with-see-more span.visually-hidden');
          const description = descriptionElement ? descriptionElement.textContent.trim() : null;
          
          return {
            title,
            company,
            logo,
            dateRange,
            location,
            description
          };
        });
      });
    } catch (error) {
      console.error('Error extracting experience data:', error);
      return [];
    }
  }
  
  /**
   * Extract education data
   */
  async _extractEducationData() {
    try {
      return await this.page.evaluate(() => {
        // Find the education section
        const educationSection = document.getElementById('education');
        if (!educationSection) return [];
        
        // Look for education list items
        const educationListItems = Array.from(
          educationSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
        );
        
        return educationListItems.map(item => {
          // Get school logo
          const logoElement = item.querySelector('img.ivm-view-attr__img--centered');
          const logo = logoElement ? logoElement.src : null;
          
          // Get school name
          const schoolElement = item.querySelector('.display-flex .t-bold span');
          const school = schoolElement ? schoolElement.textContent.trim() : null;
          
          // Get degree
          const degreeElement = item.querySelector('.t-normal.t-black--light span');
          const degree = degreeElement ? degreeElement.textContent.trim() : null;
          
          // Get field of study
          const fieldElements = item.querySelectorAll('.t-normal.t-black--light span');
          const fieldOfStudy = fieldElements && fieldElements.length > 1 ? fieldElements[1].textContent.trim() : null;
          
          // Get dates
          const dateElement = item.querySelector('span.t-normal.t-black--light:not(.education__item)')?.nextElementSibling;
          const dates = dateElement ? dateElement.textContent.trim() : null;
          
          // Get description/activities
          const descriptionElement = item.querySelector('.pv-shared-text-with-see-more span.visually-hidden');
          const description = descriptionElement ? descriptionElement.textContent.trim() : null;
          
          return {
            school,
            degree,
            fieldOfStudy,
            logo,
            dates,
            description
          };
        });
      });
    } catch (error) {
      console.error('Error extracting education data:', error);
      return [];
    }
  }
  
  /**
   * Extract skills data
   */
  async _extractSkillsData() {
    try {
      return await this.page.evaluate(() => {
        // Find skills section
        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return [];
        
        // Look for the "Show more skills" button and click it if exists
        const showMoreButton = skillsSection.nextElementSibling?.querySelector('.artdeco-card__actions button');
        if (showMoreButton) {
          try {
            showMoreButton.click();
            // Small delay to let the skills load
            setTimeout(() => {}, 500);
          } catch (e) {
            // Ignore errors if button click fails
          }
        }
        
        // Get all skill items
        const skillItems = Array.from(
          skillsSection.nextElementSibling?.querySelectorAll('.pvs-list__item--line-separated') || []
        );
        
        return skillItems.map(item => {
          // Get skill name
          const nameElement = item.querySelector('.display-flex .t-bold span');
          const name = nameElement ? nameElement.textContent.trim() : null;
          
          // Get endorsements count or description
          const detailElement = item.querySelector('.t-normal.t-black--light span');
          const detail = detailElement ? detailElement.textContent.trim() : null;
          
          return {
            name,
            detail
          };
        });
      });
    } catch (error) {
      console.error('Error extracting skills data:', error);
      return [];
    }
  }
  
  /**
   * Extract certifications data
   */
  async _extractCertificationsData() {
    try {
      return await this.page.evaluate(() => {
        // Find certifications section
        const certificationsSection = document.getElementById('licenses_and_certifications');
        if (!certificationsSection) return [];
        
        // Get all certification items
        const certItems = Array.from(
          certificationsSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
        );
        
        return certItems.map(item => {
          // Get certification name
          const nameElement = item.querySelector('.display-flex .t-bold span');
          const name = nameElement ? nameElement.textContent.trim() : null;
          
          // Get issuing organization
          const issuerElement = item.querySelector('.t-normal.t-black--light span');
          const issuer = issuerElement ? issuerElement.textContent.trim() : null;
          
          // Get issue date and expiration
          const dateElements = item.querySelectorAll('.t-normal.t-black--light span');
          let issueDate = null;
          let expirationDate = null;
          
          if (dateElements.length > 1) {
            const dateText = dateElements[1].textContent.trim();
            const dateParts = dateText.split('·').map(part => part.trim());
            
            if (dateParts.length > 0) {
              const issuePart = dateParts[0];
              if (issuePart.includes('Issued')) {
                issueDate = issuePart.replace('Issued', '').trim();
              }
              
              if (dateParts.length > 1) {
                const expirationPart = dateParts[1];
                if (expirationPart.includes('Expires')) {
                  expirationDate = expirationPart.replace('Expires', '').trim();
                }
              }
            }
          }
          
          // Get credential ID
          const credentialElement = item.querySelector('.pv-certifications__credential-id');
          const credentialId = credentialElement ? 
            credentialElement.textContent.replace('Credential ID', '').trim() : null;
          
          return {
            name,
            issuer,
            issueDate,
            expirationDate,
            credentialId
          };
        });
      });
    } catch (error) {
      console.error('Error extracting certifications data:', error);
      return [];
    }
  }
  
  /**
   * Extract additional profile data (languages, volunteering, etc.)
   */
  async _extractAdditionalProfileData() {
    try {
      return await this.page.evaluate(() => {
        // Get languages
        const languagesSection = document.getElementById('languages');
        let languages = [];
        
        if (languagesSection) {
          const languageItems = Array.from(
            languagesSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
          );
          
          languages = languageItems.map(item => {
            const nameElement = item.querySelector('.display-flex .t-bold span');
            const name = nameElement ? nameElement.textContent.trim() : null;
            
            const proficiencyElement = item.querySelector('.t-normal.t-black--light span');
            const proficiency = proficiencyElement ? proficiencyElement.textContent.trim() : null;
            
            return { name, proficiency };
          });
        }
        
        // Get volunteering experience
        const volunteeringSection = document.getElementById('volunteering_experience');
        let volunteering = [];
        
        if (volunteeringSection) {
          const volunteeringItems = Array.from(
            volunteeringSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
          );
          
          volunteering = volunteeringItems.map(item => {
            const roleElement = item.querySelector('.display-flex .t-bold span');
            const role = roleElement ? roleElement.textContent.trim() : null;
            
            const organizationElement = item.querySelector('.t-normal.t-black--light span');
            const organization = organizationElement ? organizationElement.textContent.trim() : null;
            
            const dateElement = item.querySelectorAll('.t-normal.t-black--light span')[1];
            const dates = dateElement ? dateElement.textContent.trim() : null;
            
            return { role, organization, dates };
          });
        }
        
        // Get recommendations
        const recommendationsSection = document.getElementById('recommendations');
        let recommendations = [];
        
        if (recommendationsSection) {
          const recommendationItems = Array.from(
            recommendationsSection.nextElementSibling?.querySelectorAll('li.artdeco-list__item') || []
          );
          
          recommendations = recommendationItems.map(item => {
            const nameElement = item.querySelector('.display-flex .t-bold span');
            const name = nameElement ? nameElement.textContent.trim() : null;
            
            const relationshipElement = item.querySelector('.t-normal.t-black--light span');
            const relationship = relationshipElement ? relationshipElement.textContent.trim() : null;
            
            const textElement = item.querySelector('.pv-shared-text-with-see-more span.visually-hidden');
            const text = textElement ? textElement.textContent.trim() : null;
            
            return { name, relationship, text };
          });
        }
        
        return {
          languages,
          volunteering,
          recommendations
        };
      });
    } catch (error) {
      console.error('Error extracting additional profile data:', error);
      return {
        languages: [],
        volunteering: [],
        recommendations: []
      };
    }
  }
  
  /**
   * Try to download CV if available on profile
   * @param {string} profileUrl - LinkedIn profile URL or ID
   * @param {string} preferredFileName - Optional preferred file name
   * @returns {Object} - Status and file path if successful
   */
  async downloadCV(profileUrl, preferredFileName = null) {
    if (!this.isLoggedIn) {
      throw new Error('You must be logged in to download CVs');
    }
    
    try {
      await this._enforceRateLimit();
      
      // Normalize the URL
      const fullProfileUrl = profileUrl.includes('linkedin.com') ? 
        profileUrl : `https://www.linkedin.com/in/${profileUrl}/`;
      
      // Navigate to profile detail page
      await this.page.goto(fullProfileUrl, {
        waitUntil: 'networkidle'
      });
      
      // Look for the resume/CV button or link
      const resumeButton = await this.page.$('button:has-text("Resume"), a:has-text("Resume"), a:has-text("CV")');
      
      if (!resumeButton) {
        return {
          success: false,
          message: 'No CV/resume found on profile',
          filePath: null
        };
      }
      
      // Set up download listener
      const downloadPromise = this.page.waitForEvent('download');
      
      // Click the CV/resume button
      await resumeButton.click();
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = preferredFileName || 
        `${profileUrl.split('/').pop().replace(/[^a-zA-Z0-9]/g, '_')}_CV_${timestamp}.pdf`;
      
      const downloadPath = path.join(this.options.downloadPath, fileName);
      
      // Save the file
      await download.saveAs(downloadPath);
      
      return {
        success: true,
        message: 'CV downloaded successfully',
        filePath: downloadPath
      };
    } catch (error) {
      console.error(`Failed to download CV for ${profileUrl}:`, error);
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
   * Save profile data to JSON file
   * @param {Object} profileData - The profile data to save
   * @param {string} fileName - Optional file name
   * @returns {string} - Path to saved file
   */
  async saveProfileToJson(profileData, fileName = null) {
    try {
      const timestamp = Date.now();
      const profileId = profileData.profileUrl?.split('/in/')[1]?.replace(/\/$/, '') || 'unknown';
      const actualFileName = fileName || `${profileId}_${timestamp}.json`;
      const filePath = path.join(this.options.downloadPath, actualFileName);
      
      fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2), 'utf8');
      
      return filePath;
    } catch (error) {
      console.error('Failed to save profile data to JSON:', error);
      throw new Error(`Failed to save profile data: ${error.message}`);
    }
  }

  /**
   * Logout from LinkedIn
   */
  async logout() {
    if (!this.isLoggedIn) {
      return true; // Already logged out
    }
    
    try {
      await this._enforceRateLimit();
      
      // Navigate to LinkedIn home
      await this.page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'networkidle'
      });
      
      // Click on profile menu
      await this.page.click('.global-nav__me');
      await this._addHumanDelay();
      
      // Click on sign out button
      await this.page.click('a[href*="logout"]');
      
      // Wait for logout to complete
      await this.page.waitForNavigation({ waitUntil: 'networkidle' });
      
      this.isLoggedIn = false;
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error(`LinkedIn logout failed: ${error.message}`);
    }
  }

  /**
   * Close browser and clean up resources
   */
  async close() {
    try {
      if (this.isLoggedIn) {
        try {
          await this.logout();
        } catch (logoutError) {
          console.warn('Error during logout:', logoutError);
          // Continue with closing even if logout fails
        }
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        this.context = null;
      }
      
      return true;
    } catch (error) {
      console.error('Error closing browser:', error);
      throw new Error(`Failed to close browser: ${error.message}`);
    }
  }
}

module.exports = LinkedInAutomation;