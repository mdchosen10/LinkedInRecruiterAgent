/**
 * Button Fixer for LinkedIn Recruiter Agent
 * This script uses MutationObserver to continuously monitor the DOM for new buttons
 * and adds event handlers to them as they appear.
 */
(function() {
  console.log('Button fixer initializing...');
  
  // Track buttons we've already processed
  const processedButtons = new Set();
  
  // Create a direct logout function that will be used by button handlers
  window.directLogout = function() {
    console.log('[BUTTON-FIXER] Direct logout function called');
    
    try {
      if (window.api && window.api.clearCredentials) {
        console.log('[BUTTON-FIXER] Using window.api.clearCredentials()');
        window.api.clearCredentials()
          .then(result => {
            console.log('[BUTTON-FIXER] Logout successful:', result);
            setTimeout(() => {
              window.location.href = '#/login';
              window.location.reload();
            }, 100);
          })
          .catch(err => {
            console.error('[BUTTON-FIXER] Logout failed:', err);
            window.location.href = '#/login';
            window.location.reload();
          });
      } else {
        console.warn('[BUTTON-FIXER] API not available, using direct navigation');
        window.location.href = '#/login';
        window.location.reload();
      }
    } catch (err) {
      console.error('[BUTTON-FIXER] Error during logout:', err);
      window.location.href = '#/login';
      window.location.reload();
    }
  };
  
  // Function to start LinkedIn browser
  window.startLinkedInBrowser = function(options = {}) {
    console.log('[BUTTON-FIXER] Direct startLinkedInBrowser called with:', options);
    
    try {
      if (window.api && window.api.startLinkedInBrowser) {
        console.log('[BUTTON-FIXER] Using window.api.startLinkedInBrowser');
        return window.api.startLinkedInBrowser(options)
          .then(result => {
            console.log('[BUTTON-FIXER] LinkedIn browser started:', result);
            return result;
          })
          .catch(err => {
            console.error('[BUTTON-FIXER] LinkedIn browser start failed:', err);
            throw err;
          });
      } else {
        console.warn('[BUTTON-FIXER] API not available for LinkedIn browser');
        return Promise.reject(new Error('API not available'));
      }
    } catch (err) {
      console.error('[BUTTON-FIXER] Error starting LinkedIn browser:', err);
      return Promise.reject(err);
    }
  };
  
  // Function to start extraction
  window.startExtraction = function(jobUrls) {
    console.log('[BUTTON-FIXER] Direct startExtraction called with job URLs:', jobUrls);
    
    if (!jobUrls || !jobUrls.length) {
      console.error('[BUTTON-FIXER] No job URLs provided for extraction');
      return Promise.reject(new Error('No job URLs provided'));
    }
    
    try {
      if (window.api && window.api.startLinkedInBrowser) {
        // Parse job URL for ID and applicant view ID if available
        const jobId = jobUrls[0].match(/\\/hiring\\/jobs\\/(\\d+)/) ? 
          jobUrls[0].match(/\\/hiring\\/jobs\\/(\\d+)/)[1] : null;
        
        const applicantViewId = jobUrls[0].match(/\\/applicants\\/(\\d+)/) ?
          jobUrls[0].match(/\\/applicants\\/(\\d+)/)[1] : null;
        
        const extractionOptions = { 
          jobUrls,
          jobId,
          applicantViewId
        };
        
        console.log('[BUTTON-FIXER] Starting extraction with options:', extractionOptions);
        return window.api.startLinkedInBrowser(extractionOptions)
          .then(result => {
            console.log('[BUTTON-FIXER] Extraction started:', result);
            return result;
          })
          .catch(err => {
            console.error('[BUTTON-FIXER] Extraction failed:', err);
            throw err;
          });
      } else {
        console.warn('[BUTTON-FIXER] API not available for extraction');
        return Promise.reject(new Error('API not available'));
      }
    } catch (err) {
      console.error('[BUTTON-FIXER] Error during extraction:', err);
      return Promise.reject(err);
    }
  };
  
  // Function to process a button
  function processButton(button) {
    // Generate a unique ID for tracking
    const buttonId = button.id || 
                     button.getAttribute('data-button-id') || 
                     `btn-${Math.random().toString(36).substr(2, 9)}`;
    
    // Skip if already processed
    if (processedButtons.has(buttonId)) {
      return;
    }
    
    // Mark as processed
    processedButtons.add(buttonId);
    button.setAttribute('data-button-id', buttonId);
    
    // Extract text content
    const buttonText = button.innerText?.toLowerCase() || '';
    const buttonClasses = Array.from(button.classList || []).join(' ');
    const isButtonElement = button.tagName === 'BUTTON';
    
    console.log(`[BUTTON-FIXER] Processing button: ${buttonId} - "${buttonText}" - ${button.tagName} - Classes: ${buttonClasses}`);
    
    // Identify button type
    let buttonType = 'unknown';
    if (button.id === 'logoutButton' || buttonText.includes('logout')) {
      buttonType = 'logout';
    } else if (button.id === 'startLinkedInBrowserButton' || buttonText.includes('linkedin browser') || buttonText.includes('open linkedin')) {
      buttonType = 'linkedinBrowser';
    } else if (button.id === 'startExtractionButton' || buttonText.includes('start extraction') || buttonText.includes('extract')) {
      buttonType = 'extraction';
    }
    
    console.log(`[BUTTON-FIXER] Identified as: ${buttonType} button`);
    
    // Apply the appropriate handler based on button type
    if (buttonType === 'logout') {
      console.log(`[BUTTON-FIXER] Adding logout handler to button: ${buttonId}`);
      // Use both capture and bubbling phase handlers for best coverage
      button.addEventListener('click', function(e) {
        console.log('[BUTTON-FIXER] Logout button clicked (capture)');
        e.stopPropagation();
        window.directLogout();
        return false;
      }, true); // Capture phase
      
      button.addEventListener('click', function(e) {
        console.log('[BUTTON-FIXER] Logout button clicked (bubble)');
        e.stopPropagation();
        window.directLogout();
        return false;
      }); // Bubbling phase
      
      // Directly attach onclick handler
      button.onclick = function(e) {
        console.log('[BUTTON-FIXER] Logout button clicked (onclick)');
        e.preventDefault();
        window.directLogout();
        return false;
      };
    } 
    else if (buttonType === 'linkedinBrowser') {
      console.log(`[BUTTON-FIXER] Adding LinkedIn browser handler to button: ${buttonId}`);
      button.addEventListener('click', function(e) {
        console.log('[BUTTON-FIXER] LinkedIn browser button clicked');
        if (!window.api || !window.api.startLinkedInBrowser) {
          // Only intercept if API not available
          e.stopPropagation();
          window.startLinkedInBrowser();
          return false;
        }
      }, true);
    } 
    else if (buttonType === 'extraction') {
      console.log(`[BUTTON-FIXER] Adding extraction handler to button: ${buttonId}`);
      button.addEventListener('click', function(e) {
        console.log('[BUTTON-FIXER] Extraction button clicked');
        if (!window.api || !window.api.startLinkedInBrowser) {
          // Only intercept if API not available
          e.stopPropagation();
          
          // Find job URLs inputs
          const inputs = document.querySelectorAll('input');
          const jobUrls = [];
          
          inputs.forEach(input => {
            if (input.value && (
                input.value.includes('linkedin.com') || 
                input.value.includes('jobs'))) {
              jobUrls.push(input.value);
            }
          });
          
          if (jobUrls.length > 0) {
            window.startExtraction(jobUrls);
          } else {
            console.log('[BUTTON-FIXER] No job URLs found for extraction');
          }
          
          return false;
        }
      }, true);
    }
  }
  
  // Function to scan the DOM for buttons
  function scanForButtons() {
    console.log('[BUTTON-FIXER] Scanning for buttons...');
    
    // Find all buttons
    const buttonElements = document.querySelectorAll('button');
    console.log(`[BUTTON-FIXER] Found ${buttonElements.length} button elements`);
    
    // Process each button
    buttonElements.forEach(button => {
      processButton(button);
    });
    
    // Look for elements containing button-like text
    const buttonTexts = ['logout', 'linkedin browser', 'start extraction'];
    buttonTexts.forEach(text => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.innerText && el.innerText.toLowerCase().includes(text)
      );
      
      console.log(`[BUTTON-FIXER] Found ${elements.length} elements containing "${text}"`);
      
      elements.forEach(element => {
        // Check if this element is or contains a button
        const buttons = element.querySelectorAll('button');
        if (buttons.length > 0) {
          buttons.forEach(button => processButton(button));
        } else if (element.tagName === 'BUTTON') {
          processButton(element);
        } else {
          // Add click handler to non-button elements with button-like text
          const elementId = `el-${Math.random().toString(36).substr(2, 9)}`;
          if (processedButtons.has(elementId)) {
            return;
          }
          
          processedButtons.add(elementId);
          element.setAttribute('data-element-id', elementId);
          
          console.log(`[BUTTON-FIXER] Adding click handler to non-button element: ${elementId} - ${element.tagName} - "${element.innerText?.substring(0, 20)}"`);
          
          // Apply handlers based on the text content
          if (text === 'logout') {
            element.addEventListener('click', function(e) {
              console.log('[BUTTON-FIXER] Logout text element clicked');
              e.stopPropagation();
              window.directLogout();
              return false;
            }, true);
          } else if (text === 'linkedin browser') {
            element.addEventListener('click', function(e) {
              console.log('[BUTTON-FIXER] LinkedIn browser text element clicked');
              if (!window.api || !window.api.startLinkedInBrowser) {
                e.stopPropagation();
                window.startLinkedInBrowser();
                return false;
              }
            }, true);
          } else if (text === 'start extraction') {
            element.addEventListener('click', function(e) {
              console.log('[BUTTON-FIXER] Extraction text element clicked');
              if (!window.api || !window.api.startLinkedInBrowser) {
                e.stopPropagation();
                
                // Find job URLs inputs
                const inputs = document.querySelectorAll('input');
                const jobUrls = [];
                
                inputs.forEach(input => {
                  if (input.value && (
                      input.value.includes('linkedin.com') || 
                      input.value.includes('jobs'))) {
                    jobUrls.push(input.value);
                  }
                });
                
                if (jobUrls.length > 0) {
                  window.startExtraction(jobUrls);
                } else {
                  console.log('[BUTTON-FIXER] No job URLs found for extraction');
                }
                
                return false;
              }
            }, true);
          }
        }
      });
    });
    
    console.log('[BUTTON-FIXER] Button scanning complete');
  }
  
  // Initial scan for buttons
  setTimeout(scanForButtons, 1000);
  setTimeout(scanForButtons, 3000);
  setTimeout(scanForButtons, 5000);
  
  // Set up a MutationObserver to watch for new buttons being added to the DOM
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    // Check if any of the mutations involve adding nodes
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        // Check if any added node is a button or contains buttons
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            if (node.tagName === 'BUTTON' || node.querySelector('button')) {
              shouldScan = true;
            }
          }
        });
      }
    });
    
    // Scan for buttons if needed
    if (shouldScan) {
      console.log('[BUTTON-FIXER] DOM changes detected, scanning for new buttons');
      scanForButtons();
    }
  });
  
  // Start observing
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Setup interval to periodically scan for buttons (backup for MutationObserver)
  setInterval(scanForButtons, 10000);
  
  // Also scan when navigation occurs
  window.addEventListener('hashchange', () => {
    console.log('[BUTTON-FIXER] Navigation detected, scanning for buttons');
    setTimeout(scanForButtons, 1000);
  });
  
  console.log('[BUTTON-FIXER] Button fixer initialized successfully');
})();
