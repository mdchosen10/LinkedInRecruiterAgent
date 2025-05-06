/**
 * Clean Electron Bridge for LinkedIn Recruiter Agent
 * 
 * This script provides a clean, unified solution for bridging React and Electron
 * without the need for multiple overlapping patches.
 */

(function() {
  console.log('[ELECTRON-BRIDGE] Initializing clean bridge...');
  
  // Store a reference to the Electron API
  const electronAPI = window.api;
  
  // Only proceed if the API is available
  if (!electronAPI) {
    console.error('[ELECTRON-BRIDGE] Error: Electron API not available');
    return;
  }
  
  /**
   * Create a unified bridge between React and Electron
   */
  const ElectronBridge = {
    // Direct API access
    api: electronAPI,
    
    // Debug information
    debug: {
      initialized: true,
      timestamp: Date.now(),
      log: function(message) {
        console.log(`[ELECTRON-BRIDGE] ${message}`);
      },
      error: function(message) {
        console.error(`[ELECTRON-BRIDGE] Error: ${message}`);
      }
    },
    
    // Direct action methods that handle both UI and IPC communication
    actions: {
      // LinkedIn Browser action
      openLinkedInBrowser: async function(options) {
        this.debug.log('Opening LinkedIn Browser');
        
        if (!electronAPI || !electronAPI.startLinkedInBrowser) {
          this.debug.error('startLinkedInBrowser not available in API');
          return { success: false, error: 'API method not available' };
        }
        
        try {
          // Set UI state if possible (for any React component that might be watching)
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('linkedin-browser-starting'));
          }
          
          // Call the API directly
          const result = await electronAPI.startLinkedInBrowser(options || {});
          
          this.debug.log(`LinkedIn Browser result: ${JSON.stringify(result)}`);
          
          // Notify UI of result
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('linkedin-browser-started', { 
              detail: result
            }));
          }
          
          return result;
        } catch (error) {
          this.debug.error(`LinkedIn Browser error: ${error.message}`);
          
          // Notify UI of error
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('linkedin-browser-error', { 
              detail: { error: error.message } 
            }));
          }
          
          return { success: false, error: error.message };
        }
      },
      
      // Start Extraction action
      startExtraction: async function(jobUrls) {
        this.debug.log(`Starting extraction with job URLs: ${JSON.stringify(jobUrls)}`);
        
        if (!electronAPI || !electronAPI.extractApplicants) {
          this.debug.error('extractApplicants not available in API');
          return { success: false, error: 'API method not available' };
        }
        
        try {
          // Format job URLs as needed
          let options = jobUrls;
          
          if (Array.isArray(jobUrls)) {
            // Extract job ID from URL if possible
            const jobIdMatch = jobUrls[0]?.match(/\/hiring\/jobs\/(\d+)/);
            const jobId = jobIdMatch ? jobIdMatch[1] : null;
            
            // Extract applicant view ID if present
            const applicantViewMatch = jobUrls[0]?.match(/\/applicants\/(\d+)/);
            const applicantViewId = applicantViewMatch ? applicantViewMatch[1] : null;
            
            options = {
              jobUrls,
              jobId,
              applicantViewId
            };
          }
          
          // Set UI state if possible
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('extraction-starting', {
              detail: { jobUrls }
            }));
          }
          
          // Call the API
          const result = await electronAPI.extractApplicants(options);
          
          this.debug.log(`Extraction result: ${JSON.stringify(result)}`);
          
          // Notify UI of result
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('extraction-started', { 
              detail: result
            }));
          }
          
          return result;
        } catch (error) {
          this.debug.error(`Extraction error: ${error.message}`);
          
          // Notify UI of error
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('extraction-error', { 
              detail: { error: error.message } 
            }));
          }
          
          return { success: false, error: error.message };
        }
      },
      
      // Logout action
      logout: async function() {
        this.debug.log('Logging out');
        
        if (!electronAPI || !electronAPI.clearCredentials) {
          this.debug.error('clearCredentials not available in API');
          return { success: false, error: 'API method not available' };
        }
        
        try {
          // Set UI state if possible
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('logout-starting'));
          }
          
          // Call the API
          const result = await electronAPI.clearCredentials();
          
          this.debug.log(`Logout result: ${JSON.stringify(result)}`);
          
          // React router navigation and page reload
          window.location.href = '#/login';
          
          // Allow navigation to complete before reload
          setTimeout(() => {
            window.location.reload();
          }, 100);
          
          return result;
        } catch (error) {
          this.debug.error(`Logout error: ${error.message}`);
          
          // Even on error, try to navigate to login
          window.location.href = '#/login';
          setTimeout(() => window.location.reload(), 100);
          
          return { success: false, error: error.message };
        }
      }
    }
  };
  
  // Add direct references to make calling easier
  ElectronBridge.openLinkedInBrowser = ElectronBridge.actions.openLinkedInBrowser.bind(ElectronBridge);
  ElectronBridge.startExtraction = ElectronBridge.actions.startExtraction.bind(ElectronBridge);
  ElectronBridge.logout = ElectronBridge.actions.logout.bind(ElectronBridge);
  ElectronBridge.log = ElectronBridge.debug.log.bind(ElectronBridge);
  
  // Expose to window for direct access
  window.ElectronBridge = ElectronBridge;
  
  // Add direct method shortcuts for convenience
  window.openLinkedInBrowser = ElectronBridge.openLinkedInBrowser;
  window.startExtraction = ElectronBridge.startExtraction;
  window.logout = ElectronBridge.logout;
  
  /**
   * Fix problematic buttons by attaching direct handlers
   */
  function fixButtons() {
    ElectronBridge.log('Searching for buttons to fix...');
    
    // Fix LinkedIn Browser button
    const linkedInButtons = document.querySelectorAll('#startLinkedInBrowserButton');
    if (linkedInButtons.length > 0) {
      ElectronBridge.log(`Found ${linkedInButtons.length} LinkedIn Browser buttons`);
      
      linkedInButtons.forEach(button => {
        // Replace click handler with our direct method
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          ElectronBridge.openLinkedInBrowser();
          return false;
        }, true); // Use capturing phase to get event before React
        
        // Add visual indicator that we've fixed this button
        button.dataset.bridged = 'true';
      });
    }
    
    // Fix Start Extraction button
    const extractionButtons = document.querySelectorAll('#startExtractionButton');
    if (extractionButtons.length > 0) {
      ElectronBridge.log(`Found ${extractionButtons.length} Extraction buttons`);
      
      extractionButtons.forEach(button => {
        // Replace click handler with our direct method
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Find job URLs from nearby inputs
          const container = button.closest('.card, .panel, form, div');
          let jobUrls = [];
          
          if (container) {
            const inputs = container.querySelectorAll('input[type="text"], textarea');
            inputs.forEach(input => {
              if (input.value && input.value.includes('linkedin.com')) {
                jobUrls.push(input.value);
              }
            });
          }
          
          // Try to find job URLs with a simpler approach
          try {
            // Check if we can find the job URLs from React components using window.__STATE__
            if (window.__STATE__ && window.__STATE__.jobUrls) {
              jobUrls = window.__STATE__.jobUrls;
              ElectronBridge.log(`Found job URLs in global state: ${jobUrls.join(', ')}`);
            }
            
            // Fall back to looking for input elements with LinkedIn URLs
            if (jobUrls.length === 0) {
              const allInputs = document.querySelectorAll('input[type="text"], textarea');
              allInputs.forEach(input => {
                if (input.value && input.value.includes('linkedin.com')) {
                  jobUrls.push(input.value);
                }
              });
              
              if (jobUrls.length > 0) {
                ElectronBridge.log(`Found job URLs in input fields: ${jobUrls.join(', ')}`);
              }
            }
          } catch (err) {
            ElectronBridge.log(`Error finding job URLs: ${err.message}`);
          }
          
          if (jobUrls.length === 0) {
            ElectronBridge.log('No job URLs found. Unable to start extraction.');
            alert('Please add at least one LinkedIn job URL before starting extraction.');
            return;
          }
          
          // Start extraction with found job URLs
          ElectronBridge.startExtraction(jobUrls);
          return false;
        }, true); // Use capturing phase to get event before React
        
        // Add visual indicator that we've fixed this button
        button.dataset.bridged = 'true';
      });
    }
    
    // Fix Logout button using standard selectors
    const logoutButtonsById = document.querySelectorAll('#logoutButton');
    
    // Also find buttons containing "Logout" text
    const allButtons = document.querySelectorAll('button, a');
    const logoutButtonsByText = Array.from(allButtons).filter(el => 
      el.textContent && el.textContent.toLowerCase().includes('logout')
    );
    
    // Combine both sets of logout buttons
    const logoutButtons = [...logoutButtonsById, ...logoutButtonsByText];
    
    if (logoutButtons.length > 0) {
      ElectronBridge.log(`Found ${logoutButtons.length} Logout buttons`);
      
      logoutButtons.forEach(button => {
        // Replace click handler with our direct method
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          ElectronBridge.logout();
          return false;
        }, true); // Use capturing phase to get event before React
        
        // Add visual indicator that we've fixed this button
        button.dataset.bridged = 'true';
      });
    }
  }
  
  /**
   * Set up a MutationObserver to watch for new buttons
   */
  function setupButtonObserver() {
    ElectronBridge.log('Setting up MutationObserver for buttons');
    
    const observer = new MutationObserver(function(mutations) {
      let buttonAdded = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            
            if (node.nodeType === 1) { // Element node
              // Check the node itself
              if (node.id === 'startLinkedInBrowserButton' || 
                  node.id === 'startExtractionButton' ||
                  node.id === 'logoutButton') {
                buttonAdded = true;
                break;
              }
              
              // Check node text content
              if (node.textContent && 
                  (node.textContent.includes('Logout') || 
                   node.textContent.includes('LinkedIn Browser') ||
                   node.textContent.includes('Start Extraction'))) {
                buttonAdded = true;
                break;
              }
              
              // Check for buttons inside using safe methods
              try {
                if (node.querySelector && 
                    (node.querySelector('#startLinkedInBrowserButton') ||
                     node.querySelector('#startExtractionButton') ||
                     node.querySelector('#logoutButton'))) {
                  buttonAdded = true;
                  break;
                }
              } catch (err) {
                // Ignore errors in querySelector
              }
            }
          }
        }
      });
      
      if (buttonAdded) {
        ElectronBridge.log('New buttons detected, fixing them');
        setTimeout(fixButtons, 100); // Short delay to ensure DOM is stable
      }
    });
    
    // Start observing document with all possible Sub-trees
    try {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      ElectronBridge.log('MutationObserver started successfully');
    } catch (err) {
      ElectronBridge.log(`Error starting MutationObserver: ${err.message}`);
    }
    
    return observer;
  }
  
  /**
   * Initialize the bridge
   */
  function initialize() {
    ElectronBridge.log('Initializing...');
    
    // Set up the global bridge
    if (!window.ElectronBridge) {
      window.ElectronBridge = ElectronBridge;
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        fixButtons();
        setupButtonObserver();
      });
    } else {
      // DOM is already ready
      fixButtons();
      setupButtonObserver();
    }
    
    // Add event listener for React route changes
    window.addEventListener('hashchange', () => {
      ElectronBridge.log(`Route changed to: ${window.location.hash}`);
      
      // Fix buttons after route change
      setTimeout(fixButtons, 500);
    });
    
    ElectronBridge.log('Initialization complete');
  }
  
  // Start the bridge
  initialize();
  
  // Return the bridge for direct access
  return ElectronBridge;
})();
