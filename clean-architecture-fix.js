/**
 * Clean Architecture Fix for LinkedIn Recruiter Agent
 * 
 * This script implements a best-practices approach to fixing the navigation issues
 * by providing a clean integration between React and Electron.
 */

(function() {
  console.log('[CLEAN-ARCH] Initializing clean architecture fix...');
  
  // Store access to the core API
  const electronAPI = window.api;
  
  // Only proceed if we have the Electron API
  if (!electronAPI) {
    console.error('[CLEAN-ARCH] Electron API not available, cannot fix architecture');
    return;
  }
  
  /**
   * Create a global navigation bridge that both React and Electron can use
   */
  const NavigationBridge = {
    // Map of route names to functions
    routes: {
      'dashboard': () => window.location.hash = '#/',
      'linkedin': () => {
        if (electronAPI.startLinkedInBrowser) {
          return electronAPI.startLinkedInBrowser()
            .then(result => {
              console.log('[CLEAN-ARCH] LinkedIn browser started:', result);
              return result;
            })
            .catch(err => {
              console.error('[CLEAN-ARCH] LinkedIn browser error:', err);
              throw err;
            });
        }
      },
      'extraction': (options) => {
        if (electronAPI.extractApplicants) {
          return electronAPI.extractApplicants(options)
            .then(result => {
              console.log('[CLEAN-ARCH] Extraction started:', result);
              return result;
            })
            .catch(err => {
              console.error('[CLEAN-ARCH] Extraction error:', err);
              throw err;
            });
        }
      },
      'candidates': () => window.location.hash = '#/candidates',
      'messaging': () => window.location.hash = '#/messaging',
      'settings': () => window.location.hash = '#/settings',
      'logout': () => {
        if (electronAPI.clearCredentials) {
          return electronAPI.clearCredentials()
            .then(result => {
              console.log('[CLEAN-ARCH] Logout completed:', result);
              window.location.hash = '#/login';
              window.location.reload();
              return result;
            })
            .catch(err => {
              console.error('[CLEAN-ARCH] Logout error:', err);
              // Still navigate even on error
              window.location.hash = '#/login';
              window.location.reload();
              throw err;
            });
        }
      }
    },
    
    // Navigate to a specific route
    navigate: function(routeName, options) {
      console.log(`[CLEAN-ARCH] Navigating to: ${routeName}`, options);
      
      if (this.routes[routeName]) {
        try {
          return this.routes[routeName](options);
        } catch (err) {
          console.error(`[CLEAN-ARCH] Error navigating to ${routeName}:`, err);
        }
      } else {
        console.warn(`[CLEAN-ARCH] Unknown route: ${routeName}`);
      }
    }
  };
  
  // Expose navigation bridge to window
  window.NavigationBridge = NavigationBridge;
  
  /**
   * Fix the LinkedIn Browser button
   */
  function fixLinkedInBrowserButton() {
    // Find all possible LinkedIn Browser buttons
    const selectors = [
      '#startLinkedInBrowserButton',
      'button:contains("LinkedIn Browser")',
      'button:contains("Open LinkedIn")',
      'a[href*="linkedin-extraction"]',
      'button.linkedin-browser-btn'
    ];
    
    // Use a custom contains selector
    const buttons = [];
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.includes('LinkedIn Browser') || 
          btn.textContent.includes('Open LinkedIn')) {
        buttons.push(btn);
      }
    });
    
    // Also try standard selectors
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => buttons.push(el));
      } catch (e) {
        // Ignore invalid selectors
      }
    });
    
    // If we found LinkedIn Browser buttons
    if (buttons.length > 0) {
      console.log(`[CLEAN-ARCH] Found ${buttons.length} LinkedIn Browser buttons`);
      
      buttons.forEach((button, index) => {
        console.log(`[CLEAN-ARCH] Fixing LinkedIn Browser button ${index}:`, button);
        
        // Replace the onClick handler with our clean architecture approach
        const originalOnClick = button.onclick;
        
        // Create a clean onclick that uses our navigation bridge
        button.onclick = function(e) {
          console.log('[CLEAN-ARCH] LinkedIn Browser button clicked');
          
          // Stop event propagation - critical to prevent React handlers
          e.preventDefault();
          e.stopPropagation();
          
          // Use our navigation bridge
          window.NavigationBridge.navigate('linkedin');
          
          // Don't call the original - it's the problem!
          return false;
        };
        
        // Apply to all relevant event handlers to be sure
        button.addEventListener('click', function(e) {
          console.log('[CLEAN-ARCH] LinkedIn Browser button click event');
          e.preventDefault();
          e.stopPropagation();
          window.NavigationBridge.navigate('linkedin');
          return false;
        }, true); // Use capture phase to get event before React
        
        // Apply visual indication that we fixed this button
        button.style.border = '2px solid #00a0dc';
      });
    }
  }
  
  /**
   * Fix the Start Extraction button
   */
  function fixStartExtractionButton() {
    // Find all possible Start Extraction buttons
    const selectors = [
      '#startExtractionButton',
      'button:contains("Start Extraction")',
      'button:contains("Extract")',
      'button.extraction-btn'
    ];
    
    // Use a custom contains selector
    const buttons = [];
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.includes('Start Extraction') || 
          btn.textContent.includes('Extract')) {
        buttons.push(btn);
      }
    });
    
    // Also try standard selectors
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => buttons.push(el));
      } catch (e) {
        // Ignore invalid selectors
      }
    });
    
    // If we found Extraction buttons
    if (buttons.length > 0) {
      console.log(`[CLEAN-ARCH] Found ${buttons.length} Extraction buttons`);
      
      buttons.forEach((button, index) => {
        console.log(`[CLEAN-ARCH] Fixing Extraction button ${index}:`, button);
        
        // Replace the onClick handler with our clean architecture approach
        const originalOnClick = button.onclick;
        
        // Create a clean onclick that uses our navigation bridge
        button.onclick = function(e) {
          console.log('[CLEAN-ARCH] Extraction button clicked');
          
          // Stop event propagation - critical to prevent React handlers
          e.preventDefault();
          e.stopPropagation();
          
          // Get job URLs if available
          let jobUrls = [];
          try {
            // Look for nearby text fields with URLs
            const container = button.closest('.card, .panel, form, div');
            if (container) {
              const inputs = container.querySelectorAll('input[type="text"], textarea');
              inputs.forEach(input => {
                if (input.value && input.value.includes('linkedin.com')) {
                  jobUrls.push(input.value);
                }
              });
            }
          } catch (err) {
            console.error('[CLEAN-ARCH] Error getting job URLs:', err);
          }
          
          // Use our navigation bridge
          window.NavigationBridge.navigate('extraction', { jobUrls });
          
          // Don't call the original - it's the problem!
          return false;
        };
        
        // Apply to all relevant event handlers to be sure
        button.addEventListener('click', function(e) {
          console.log('[CLEAN-ARCH] Extraction button click event');
          e.preventDefault();
          e.stopPropagation();
          
          // Same logic to find job URLs
          let jobUrls = [];
          try {
            const container = button.closest('.card, .panel, form, div');
            if (container) {
              const inputs = container.querySelectorAll('input[type="text"], textarea');
              inputs.forEach(input => {
                if (input.value && input.value.includes('linkedin.com')) {
                  jobUrls.push(input.value);
                }
              });
            }
          } catch (err) {
            console.error('[CLEAN-ARCH] Error getting job URLs:', err);
          }
          
          window.NavigationBridge.navigate('extraction', { jobUrls });
          return false;
        }, true); // Use capture phase to get event before React
        
        // Apply visual indication that we fixed this button
        button.style.border = '2px solid #00a0dc';
      });
    }
  }
  
  /**
   * Fix the Logout button
   */
  function fixLogoutButton() {
    // Find all possible Logout buttons
    const selectors = [
      '#logoutButton',
      'button:contains("Logout")',
      'button:contains("Sign Out")',
      'a:contains("Logout")'
    ];
    
    // Use a custom contains selector 
    const buttons = [];
    document.querySelectorAll('button, a').forEach(btn => {
      if (btn.textContent.includes('Logout') || 
          btn.textContent.includes('Sign Out')) {
        buttons.push(btn);
      }
    });
    
    // If we found Logout buttons
    if (buttons.length > 0) {
      console.log(`[CLEAN-ARCH] Found ${buttons.length} Logout buttons`);
      
      buttons.forEach((button, index) => {
        console.log(`[CLEAN-ARCH] Fixing Logout button ${index}:`, button);
        
        // Replace the onClick handler with our clean architecture approach
        button.onclick = function(e) {
          console.log('[CLEAN-ARCH] Logout button clicked');
          
          // Stop event propagation - critical to prevent React handlers
          e.preventDefault();
          e.stopPropagation();
          
          // Use our navigation bridge
          window.NavigationBridge.navigate('logout');
          
          // Don't call the original - it's the problem!
          return false;
        };
        
        // Apply to all relevant event handlers to be sure
        button.addEventListener('click', function(e) {
          console.log('[CLEAN-ARCH] Logout button click event');
          e.preventDefault();
          e.stopPropagation();
          window.NavigationBridge.navigate('logout');
          return false;
        }, true); // Use capture phase to get event before React
        
        // Apply visual indication that we fixed this button
        button.style.border = '2px solid #00a0dc';
      });
    }
  }
  
  /**
   * Set up a MutationObserver to watch for new buttons
   */
  function setupButtonObserver() {
    console.log('[CLEAN-ARCH] Setting up button observer');
    
    // Function to check and fix buttons when DOM changes
    const observer = new MutationObserver(function(mutations) {
      let shouldFixButtons = false;
      
      // Check if relevant elements were added
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // Check if this is a button or contains buttons
              if (node.tagName === 'BUTTON' || 
                  node.querySelector('button') ||
                  node.tagName === 'A' ||
                  node.querySelector('a')) {
                shouldFixButtons = true;
              }
            }
          });
        }
      });
      
      // If relevant elements were added, fix buttons
      if (shouldFixButtons) {
        fixLinkedInBrowserButton();
        fixStartExtractionButton();
        fixLogoutButton();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Return the observer in case we want to stop it later
    return observer;
  }
  
  /**
   * Disable any existing patches that might interfere
   */
  function disableConflictingPatches() {
    try {
      // Check for and disable event interceptor
      if (window.eventInterceptor && window.eventInterceptor.disable) {
        console.log('[CLEAN-ARCH] Disabling event interceptor');
        window.eventInterceptor.disable();
      }
      
      // Check for and disable button fixer
      if (window.buttonFixer && window.buttonFixer.disable) {
        console.log('[CLEAN-ARCH] Disabling button fixer');
        window.buttonFixer.disable();
      }
      
      // Check for and remove injected DOM elements
      if (window.domInjector && window.domInjector.removeInjectedElements) {
        console.log('[CLEAN-ARCH] Removing DOM injector elements');
        window.domInjector.removeInjectedElements();
      }
      
      // Remove existing button handlers
      console.log('[CLEAN-ARCH] Removing existing button handlers');
      const buttonIds = ['startLinkedInBrowserButton', 'startExtractionButton', 'logoutButton'];
      buttonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
          // Store original text
          const originalText = button.textContent;
          
          // Remove button from DOM and replace with a new clean one
          const parent = button.parentNode;
          if (parent) {
            const newButton = document.createElement('button');
            newButton.id = button.id;
            newButton.className = button.className;
            newButton.textContent = originalText;
            
            // Replace the old button with the new one
            parent.replaceChild(newButton, button);
          }
        }
      });
    } catch (err) {
      console.error('[CLEAN-ARCH] Error disabling conflicting patches:', err);
    }
  }
  
  /**
   * Create direct command functions that the user can call from console
   */
  function createDirectCommands() {
    // Add direct commands to window for console access
    window.directLinkedInBrowser = function() {
      return NavigationBridge.navigate('linkedin');
    };
    
    window.directStartExtraction = function(jobUrls) {
      return NavigationBridge.navigate('extraction', { jobUrls });
    };
    
    window.directLogout = function() {
      return NavigationBridge.navigate('logout');
    };
    
    console.log('[CLEAN-ARCH] Direct commands added to window object');
  }
  
  /**
   * Initialize the clean architecture fix
   */
  function initialize() {
    console.log('[CLEAN-ARCH] Initializing clean architecture fix');
    
    // Step 1: Create direct commands
    createDirectCommands();
    
    // Step 2: Disable conflicting patches
    disableConflictingPatches();
    
    // Step 3: Fix all current buttons
    fixLinkedInBrowserButton();
    fixStartExtractionButton();
    fixLogoutButton();
    
    // Step 4: Set up observer for future buttons
    const observer = setupButtonObserver();
    
    // Step 5: Let React know about our navigation bridge (when React rehydrates)
    if (window.api) {
      window.api.on('navigation-requested', ({ page }) => {
        console.log(`[CLEAN-ARCH] Navigation requested: ${page}`);
        NavigationBridge.navigate(page);
      });
    }
    
    console.log('[CLEAN-ARCH] Clean architecture fix initialized!');
    
    // Return the API to allow external control
    return {
      disableObserver: () => observer.disconnect(),
      refreshButtons: () => {
        fixLinkedInBrowserButton();
        fixStartExtractionButton();
        fixLogoutButton();
      }
    };
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // Initialize right away
    window.cleanArchitecture = initialize();
  }
})();
