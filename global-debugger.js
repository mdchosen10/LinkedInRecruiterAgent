/**
 * Global Debugger for LinkedIn Recruiter Agent
 * This script adds diagnostic capabilities that help identify API and event issues
 */
(function() {
  console.log('Global debugger initializing...');
  
  // Track API calls
  let apiCallCounter = 0;
  let apiCallLog = [];
  
  // Add API monitoring if possible
  function monitorAPI() {
    if (!window.api) {
      console.error('API MONITOR: window.api not available');
      return;
    }
    
    console.log('API MONITOR: API object available with methods:', Object.keys(window.api).join(', '));
    
    // Create proxies for all API methods
    Object.keys(window.api).forEach(methodName => {
      const originalMethod = window.api[methodName];
      
      if (typeof originalMethod === 'function') {
        window.api[methodName] = async function(...args) {
          const callId = ++apiCallCounter;
          const callTime = new Date().toISOString();
          
          console.log(`API CALL #${callId}: ${methodName}() at ${callTime}`);
          
          try {
            const result = await originalMethod.apply(this, args);
            console.log(`API RESULT #${callId}: ${methodName}() succeeded`, result);
            
            // Store in log
            apiCallLog.push({
              id: callId,
              method: methodName,
              time: callTime,
              args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg),
              result: result,
              success: true
            });
            
            return result;
          } catch (err) {
            console.error(`API ERROR #${callId}: ${methodName}() failed`, err);
            
            // Store error in log
            apiCallLog.push({
              id: callId,
              method: methodName,
              time: callTime,
              args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg),
              error: err.message || String(err),
              success: false
            });
            
            throw err;
          }
        };
      }
    });
  }
  
  // Function to track button clicks
  function trackButtonClicks() {
    // Set up a global click tracker
    document.addEventListener('click', (e) => {
      // Get the clicked element and its ancestors
      let target = e.target;
      let elementPath = [];
      let buttonFound = false;
      
      // Build path up to 4 levels
      for (let i = 0; i < 4 && target; i++) {
        const tagName = target.tagName;
        const id = target.id ? `#${target.id}` : '';
        const classes = Array.from(target.classList || []).map(c => `.${c}`).join('');
        const text = target.innerText ? `"${target.innerText.substring(0, 20)}${target.innerText.length > 20 ? '...' : ''}"` : '';
        
        elementPath.push(`${tagName}${id}${classes} ${text}`);
        
        if (tagName === 'BUTTON') {
          buttonFound = true;
        }
        
        target = target.parentElement;
      }
      
      // Log every button click
      if (buttonFound) {
        console.log('BUTTON CLICK DETECTED:', elementPath[0]);
        console.log('Click path:', elementPath.join(' > '));
      }
    }, true);
    
    // Add custom attributes to known buttons to help track them
    setTimeout(() => {
      try {
        const buttonSelectors = [
          '#logoutButton',
          '#startLinkedInBrowserButton',
          '#startExtractionButton',
          'button:contains("Logout")',
          'button:contains("LinkedIn Browser")',
          'button:contains("Start Extraction")'
        ];
        
        // Helper to find elements containing text
        const containsText = (el, text) => {
          return el.innerText && el.innerText.toLowerCase().includes(text.toLowerCase());
        };
        
        // Find buttons by text
        const allButtons = document.querySelectorAll('button');
        let logoutButtons = [];
        let linkedInButtons = [];
        let extractionButtons = [];
        
        // Find buttons by content
        Array.from(allButtons).forEach(button => {
          if (containsText(button, 'Logout')) {
            logoutButtons.push(button);
          } else if (containsText(button, 'LinkedIn Browser')) {
            linkedInButtons.push(button);
          } else if (containsText(button, 'Start Extraction') || containsText(button, 'Extract')) {
            extractionButtons.push(button);
          }
        });
        
        // Mark buttons with custom attributes
        logoutButtons.forEach((btn, i) => {
          btn.setAttribute('data-debug-button', 'logout-' + i);
          console.log('Found logout button:', btn.outerHTML);
        });
        
        linkedInButtons.forEach((btn, i) => {
          btn.setAttribute('data-debug-button', 'linkedin-browser-' + i);
          console.log('Found LinkedIn browser button:', btn.outerHTML);
        });
        
        extractionButtons.forEach((btn, i) => {
          btn.setAttribute('data-debug-button', 'start-extraction-' + i);
          console.log('Found extraction button:', btn.outerHTML);
        });
        
        console.log('Debug button tracking set up for', 
          logoutButtons.length, 'logout buttons,',
          linkedInButtons.length, 'LinkedIn browser buttons,',
          extractionButtons.length, 'extraction buttons'
        );
      } catch (err) {
        console.error('Error setting up button debugging:', err);
      }
    }, 3000);
  }
  
  // Add fallback direct logout helper
  function addDirectLogout() {
    window.debugLogout = function() {
      console.log('DEBUG: Direct logout called');
      
      try {
        if (window.api && window.api.clearCredentials) {
          console.log('DEBUG: Using clearCredentials API method');
          window.api.clearCredentials()
            .then(result => {
              console.log('DEBUG: Direct logout result:', result);
              window.location.href = '#/login';
              window.location.reload();
            })
            .catch(err => {
              console.error('DEBUG: Error during direct logout:', err);
              window.location.href = '#/login';
              window.location.reload();
            });
        } else {
          console.log('DEBUG: API not available, doing direct navigation');
          window.location.href = '#/login';
          window.location.reload();
        }
      } catch (err) {
        console.error('DEBUG: Uncaught exception in direct logout:', err);
        window.location.href = '#/login';
        window.location.reload();
      }
    };
    
    // Add debug functions to access API log
    window.debugAPI = {
      getCalls: () => apiCallLog,
      clearLog: () => { apiCallLog = []; console.log('API call log cleared'); },
      getCallCount: () => apiCallCounter
    };
    
    console.log('Debug utilities added to window.debugLogout and window.debugAPI');
  }
  
  // Add button fixes when React is fully loaded
  function applyButtonFixes() {
    setTimeout(() => {
      try {
        // Target specific buttons by ID and ensure click handlers work
        const logoutButton = document.getElementById('logoutButton');
        const startLinkedInBrowserButton = document.getElementById('startLinkedInBrowserButton');
        const startExtractionButton = document.getElementById('startExtractionButton');
        
        // Helper to add robust click handler
        const addRobustHandler = (button, name, handler) => {
          if (!button) {
            console.log(`${name} button not found yet, will try again later`);
            return false;
          }
          
          console.log(`Adding robust handler to ${name} button`);
          
          // Add direct click handler outside of React
          button.addEventListener('click', (e) => {
            console.log(`Direct ${name} button click detected!`);
            // Let the original handler run
          }, true);
          
          return true;
        };
        
        // Try to attach handlers to each button
        const foundLogout = addRobustHandler(logoutButton, 'Logout', () => {
          window.debugLogout();
        });
        
        const foundLinkedIn = addRobustHandler(startLinkedInBrowserButton, 'LinkedIn Browser');
        const foundExtraction = addRobustHandler(startExtractionButton, 'Start Extraction');
        
        console.log('Button fixing attempted with results:', {
          foundLogout,
          foundLinkedIn,
          foundExtraction
        });
        
        // If not all buttons found, try again later
        if (!foundLogout || !foundLinkedIn || !foundExtraction) {
          console.log('Not all buttons found, will try again');
          setTimeout(applyButtonFixes, 2000);
        }
      } catch (err) {
        console.error('Error in button fixes:', err);
      }
    }, 2000);
  }
  
  // Initialize everything
  try {
    monitorAPI();
    trackButtonClicks();
    addDirectLogout();
    applyButtonFixes();
    
    console.log('Global debugger initialized successfully');
  } catch (err) {
    console.error('Error initializing global debugger:', err);
  }
})();
