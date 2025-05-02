/**
 * LinkedIn Automation Module - Usage Examples
 * 
 * This file demonstrates how to use the LinkedInAutomation class
 * both directly and within an Electron application.
 */

/**
 * Example 1: Direct usage of the module in a Node.js script
 */
const LinkedInAutomation = require('./linkedin-automation');
const fs = require('fs');
const path = require('path');

// Basic usage example
async function basicExample() {
  const automation = new LinkedInAutomation({
    headless: false, // Set to true for production use
    downloadPath: path.join(__dirname, 'downloads'),
    userDataDir: path.join(__dirname, 'user_data'),
  });
  
  try {
    // Initialize the browser
    await automation.init();
    
    // Login to LinkedIn
    const email = process.env.LINKEDIN_EMAIL; // Use environment variables for credentials
    const password = process.env.LINKEDIN_PASSWORD;
    await automation.login(email, password);
    
    // Navigate to a job and get applicants
    const jobId = '3634275222'; // Example job ID
    const applicants = await automation.getApplicants(jobId);
    
    console.log(`Found ${applicants.length} applicants`);
    
    // Process the first 3 applicants (or fewer if less than 3 exist)
    const applicantsToProcess = applicants.slice(0, 3);
    const processedProfiles = [];
    
    for (const applicant of applicantsToProcess) {
      console.log(`Processing applicant: ${applicant.name}`);
      
      // Get detailed profile data
      const profileData = await automation.getProfileData(applicant.profileUrl);
      
      // Try to download CV if available
      const cvDownload = await automation.downloadCV(applicant.profileUrl);
      
      // Add CV info to profile data
      profileData.cv = {
        available: cvDownload.success,
        filePath: cvDownload.filePath
      };
      
      // Save profile to JSON
      const jsonPath = await automation.saveProfileToJson(profileData);
      console.log(`Saved profile data to: ${jsonPath}`);
      
      // Add to processed profiles
      processedProfiles.push({
        ...profileData,
        jsonPath
      });
    }
    
    // Save all processed profiles to a single JSON file
    const timestamp = Date.now();
    const allProfilesPath = path.join(automation.options.downloadPath, `all_profiles_${timestamp}.json`);
    fs.writeFileSync(allProfilesPath, JSON.stringify(processedProfiles, null, 2), 'utf8');
    
    console.log(`Saved all profiles to: ${allProfilesPath}`);
    
    // Logout and close browser
    await automation.logout();
    await automation.close();
    
  } catch (error) {
    console.error('Error in LinkedIn automation:', error);
    
    // Ensure browser is closed
    try {
      await automation.close();
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }
}

/**
 * Example 2: Advanced usage with error handling and rate limiting controls
 */
async function advancedExample() {
  const automation = new LinkedInAutomation({
    headless: false,
    downloadPath: path.join(__dirname, 'downloads'),
    userDataDir: path.join(__dirname, 'user_data'),
    rateLimit: {
      requestsPerHour: 20, // More conservative limit
      cooldownPeriod: 30000, // 30 seconds between actions
    },
    retryOptions: {
      maxRetries: 5,
      retryDelay: 10000, // 10 seconds initial delay
    }
  });
  
  try {
    // Initialize the browser
    await automation.init();
    
    // Check for stored credentials
    let credentials;
    try {
      credentials = await automation.getCredentials('your.email@example.com');
      console.log('Found stored credentials');
    } catch (error) {
      // No stored credentials, use new ones
      credentials = {
        email: process.env.LINKEDIN_EMAIL,
        password: process.env.LINKEDIN_PASSWORD
      };
      
      // Store these credentials for future use
      if (credentials.email && credentials.password) {
        await automation.storeCredentials(credentials.email, credentials.password);
        console.log('Credentials stored securely');
      }
    }
    
    // Login with stored or new credentials
    if (credentials.email && credentials.password) {
      await automation.login(credentials.email, credentials.password);
    } else {
      throw new Error('No LinkedIn credentials available');
    }
    
    // Process multiple jobs
    const jobIds = ['3634275222', '3643890123', '3654780911']; // Example job IDs
    
    for (const jobId of jobIds) {
      console.log(`Processing job ID: ${jobId}`);
      
      try {
        // Get applicants for this job
        const applicants = await automation.getApplicants(jobId);
        console.log(`Found ${applicants.length} applicants for job ${jobId}`);
        
        // Save applicants list for this job
        const jobDir = path.join(automation.options.downloadPath, `job_${jobId}`);
        if (!fs.existsSync(jobDir)) {
          fs.mkdirSync(jobDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(jobDir, 'applicants.json'),
          JSON.stringify(applicants, null, 2),
          'utf8'
        );
        
        // Process up to 5 applicants per job
        const applicantsToProcess = applicants.slice(0, 5);
        
        for (const applicant of applicantsToProcess) {
          try {
            console.log(`Processing applicant: ${applicant.name}`);
            
            // Get detailed profile data
            const profileData = await automation.getProfileData(applicant.profileUrl);
            
            // Try to download CV if available
            const cvDownload = await automation.downloadCV(
              applicant.profileUrl,
              `${applicant.name.replace(/\s+/g, '_')}_CV.pdf`
            );
            
            // Add CV info to profile data
            profileData.cv = {
              available: cvDownload.success,
              filePath: cvDownload.filePath
            };
            
            // Save individual profile
            const profileFileName = `${applicant.name.replace(/\s+/g, '_')}.json`;
            fs.writeFileSync(
              path.join(jobDir, profileFileName),
              JSON.stringify(profileData, null, 2),
              'utf8'
            );
            
          } catch (applicantError) {
            console.error(`Error processing applicant ${applicant.name}:`, applicantError);
            // Continue with next applicant
          }
        }
        
      } catch (jobError) {
        console.error(`Error processing job ${jobId}:`, jobError);
        // Continue with next job
      }
    }
    
    // Logout and close browser
    await automation.logout();
    await automation.close();
    
  } catch (error) {
    console.error('Error in LinkedIn automation:', error);
    
    // Ensure browser is closed
    try {
      if (automation) {
        await automation.close();
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }
}

/**
 * Example 3: Usage in an Electron application with React frontend
 * 
 * Note: This example shows the frontend React code that would interact with
 * the exposed 'linkedinAutomation' API from the preload script.
 */
/* 
// React component example (would be in a separate .jsx file)
import React, { useState, useEffect } from 'react';

const LinkedInAutomationPanel = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [jobId, setJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberCredentials, setRememberCredentials] = useState(false);
  
  // Initialize automation on component mount
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await window.linkedinAutomation.initialize();
        if (result.success) {
          setIsInitialized(true);
        } else {
          setError(result.error || 'Failed to initialize LinkedIn automation');
        }
      } catch (err) {
        setError(err.message || 'Unknown error initializing LinkedIn automation');
      } finally {
        setIsLoading(false);
      }
    }
    
    initialize();
    
    // Cleanup on component unmount
    return () => {
      window.linkedinAutomation.close().catch(err => {
        console.error('Error closing automation:', err);
      });
    };
  }, []);
  
  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.linkedinAutomation.login(email, password, rememberCredentials);
      if (result.success) {
        setIsLoggedIn(true);
        // Clear password from state for security
        setPassword('');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Unknown error during login');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      await window.linkedinAutomation.logout();
      setIsLoggedIn(false);
    } catch (err) {
      setError(err.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get applicants for a job
  const getApplicants = async () => {
    if (!jobId) {
      setError('Job ID is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.linkedinAutomation.getApplicants(jobId);
      if (result.success) {
        setApplicants(result.applicants);
      } else {
        setError(result.error || 'Failed to retrieve applicants');
      }
    } catch (err) {
      setError(err.message || 'Unknown error retrieving applicants');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get profile data for selected applicant
  const getProfileData = async (profileUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.linkedinAutomation.getProfileData(profileUrl);
      if (result.success) {
        setProfileData(result.profileData);
      } else {
        setError(result.error || 'Failed to retrieve profile data');
      }
    } catch (err) {
      setError(err.message || 'Unknown error retrieving profile data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Download CV for selected applicant
  const downloadCV = async (profileUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.linkedinAutomation.downloadCV(profileUrl);
      if (result.success) {
        alert(`CV downloaded successfully to: ${result.filePath}`);
      } else {
        setError(result.message || 'Failed to download CV');
      }
    } catch (err) {
      setError(err.message || 'Unknown error downloading CV');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export all profiles to JSON
  const exportProfiles = async () => {
    if (applicants.length === 0) {
      setError('No applicants to export');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.linkedinAutomation.exportProfiles(applicants);
      if (result.success) {
        alert(`Profiles exported successfully to: ${result.filePath}`);
      } else {
        setError(result.message || 'Failed to export profiles');
      }
    } catch (err) {
      setError(err.message || 'Unknown error exporting profiles');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="linkedin-automation-panel">
      <h1>LinkedIn Automation</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {!isInitialized ? (
        <div className="initialization-section">
          <p>Initializing LinkedIn automation...</p>
          {isLoading && <div className="loader"></div>}
        </div>
      ) : !isLoggedIn ? (
        <div className="login-section">
          <h2>Login to LinkedIn</h2>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="remember"
              checked={rememberCredentials}
              onChange={(e) => setRememberCredentials(e.target.checked)}
            />
            <label htmlFor="remember">Remember credentials</label>
          </div>
          <button 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      ) : (
        <div className="main-section">
          <div className="header">
            <h2>LinkedIn Job Applicants</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>
          
          <div className="job-search">
            <div className="form-group">
              <label htmlFor="jobId">Job ID:</label>
              <input
                type="text"
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>
            <button 
              onClick={getApplicants}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Get Applicants'}
            </button>
          </div>
          
          {applicants.length > 0 && (
            <div className="applicants-section">
              <div className="applicants-header">
                <h3>Applicants ({applicants.length})</h3>
                <button onClick={exportProfiles}>Export All</button>
              </div>
              
              <div className="applicants-container">
                <div className="applicants-list">
                  {applicants.map((applicant, index) => (
                    <div 
                      key={index} 
                      className={`applicant-item ${selectedApplicant === applicant ? 'selected' : ''}`}
                      onClick={() => setSelectedApplicant(applicant)}
                    >
                      <h4>{applicant.name}</h4>
                      <p className="headline">{applicant.headline}</p>
                      <p className="location">{applicant.location}</p>
                    </div>
                  ))}
                </div>
                
                <div className="applicant-details">
                  {selectedApplicant ? (
                    <div className="profile-actions">
                      <h3>{selectedApplicant.name}</h3>
                      <div className="buttons">
                        <button 
                          onClick={() => getProfileData(selectedApplicant.profileUrl)}
                          disabled={isLoading}
                        >
                          View Profile
                        </button>
                        <button 
                          onClick={() => downloadCV(selectedApplicant.profileUrl)}
                          disabled={isLoading}
                        >
                          Download CV
                        </button>
                      </div>
                      
                      {profileData && (
                        <div className="profile-data">
                          <div className="profile-header">
                            {profileData.profileImage && (
                              <img 
                                src={profileData.profileImage} 
                                alt={profileData.name} 
                                className="profile-image"
                              />
                            )}
                            <div className="profile-info">
                              <h3>{profileData.name}</h3>
                              <p className="headline">{profileData.headline}</p>
                              <p className="location">{profileData.location}</p>
                            </div>
                          </div>
                          
                          {profileData.about && (
                            <div className="profile-section">
                              <h4>About</h4>
                              <p>{profileData.about}</p>
                            </div>
                          )}
                          
                          {profileData.experience && profileData.experience.length > 0 && (
                            <div className="profile-section">
                              <h4>Experience</h4>
                              <ul className="experience-list">
                                {profileData.experience.map((exp, i) => (
                                  <li key={i} className="experience-item">
                                    <h5>{exp.title}</h5>
                                    <p className="company">{exp.company}</p>
                                    <p className="date-range">{exp.dateRange}</p>
                                    {exp.description && (
                                      <p className="description">{exp.description}</p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {profileData.education && profileData.education.length > 0 && (
                            <div className="profile-section">
                              <h4>Education</h4>
                              <ul className="education-list">
                                {profileData.education.map((edu, i) => (
                                  <li key={i} className="education-item">
                                    <h5>{edu.school}</h5>
                                    <p className="degree">{edu.degree}</p>
                                    <p className="field">{edu.fieldOfStudy}</p>
                                    <p className="dates">{edu.dates}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {profileData.skills && profileData.skills.length > 0 && (
                            <div className="profile-section">
                              <h4>Skills</h4>
                              <div className="skills-list">
                                {profileData.skills.map((skill, i) => (
                                  <span key={i} className="skill-item">
                                    {skill.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-selection">
                      <p>Select an applicant to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkedInAutomationPanel;