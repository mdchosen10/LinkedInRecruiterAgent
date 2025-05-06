/**
 * Targeted Button Finder
 * Specifically searches for the LinkedIn Browser and Start Extraction buttons
 * using multiple detection strategies
 */

(function() {
  console.log('[BUTTON-FINDER] Initializing targeted button finder...');
  
  // Store references to found buttons
  const foundButtons = {
    linkedInBrowser: null,
    startExtraction: null
  };
  
  // Function to attach handlers to buttons once found
  function attachHandlers(buttonType, buttonElement) {
    if (!buttonElement) return false;
    
    console.log(`[BUTTON-FINDER] Found ${buttonType} button:`, buttonElement);
    
    // Store reference
    foundButtons[buttonType] = buttonElement;
    
    // Attach multiple event listeners to ensure clicks are captured
    const handlerFunctions = {
      linkedInBrowser: function(e) {
        console.log('[BUTTON-FINDER] LinkedIn Browser button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        // Try multiple approaches to trigger the LinkedIn browser
        if (window.api && window.api.startLinkedInBrowser) {
          console.log('[BUTTON-FINDER] Calling api.startLinkedInBrowser()');
          window.api.startLinkedInBrowser();
        } else if (window.linkedInBrowserCommand) {
          console.log('[BUTTON-FINDER] Calling window.linkedInBrowserCommand()');
          window.linkedInBrowserCommand();
        } else {
          console.log('[BUTTON-FINDER] No method found to start LinkedIn browser');
        }
        
        return false;
      },
      startExtraction: function(e) {
        console.log('[BUTTON-FINDER] Start Extraction button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        // Try multiple approaches to trigger extraction
        if (window.api && window.api.extractApplicants) {
          console.log('[BUTTON-FINDER] Calling api.extractApplicants()');
          window.api.extractApplicants();
        } else if (window.startExtractionCommand) {
          console.log('[BUTTON-FINDER] Calling window.startExtractionCommand()');
          window.startExtractionCommand();
        } else {
          console.log('[BUTTON-FINDER] No method found to start extraction');
        }
        
        return false;
      }
    };
    
    // Add standard event listeners
    ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
      buttonElement.addEventListener(eventType, handlerFunctions[buttonType], true);
    });
    
    // Replace onclick if it exists
    if (buttonElement.onclick) {
      const originalOnClick = buttonElement.onclick;
      buttonElement.onclick = function(e) {
        handlerFunctions[buttonType](e);
        return originalOnClick.call(this, e);
      };
    } else {
      buttonElement.onclick = handlerFunctions[buttonType];
    }
    
    // If it's a React component, try to bypass React's event system
    buttonElement.setAttribute('data-direct-handler', buttonType);
    
    // Visual indicator that we've attached handlers
    buttonElement.style.border = '2px solid green';
    
    return true;
  }
  
  // Advanced button finding strategies
  const buttonStrategies = [
    // Strategy 1: Search by text content (case insensitive)
    function findByTextContent() {
      console.log('[BUTTON-FINDER] Searching for buttons by text content...');
      
      const allElements = document.querySelectorAll('button, a, div[role="button"], span[role="button"], *[class*="button"]');
      
      for (const el of allElements) {
        const text = (el.textContent || '').trim().toLowerCase();
        
        if (text.includes('linkedin') || text.includes('browser')) {
          attachHandlers('linkedInBrowser', el);
        } else if (text.includes('extraction') || text.includes('extract')) {
          attachHandlers('startExtraction', el);
        }
      }
    },
    
    // Strategy 2: Search by class names and IDs
    function findByClassAndId() {
      console.log('[BUTTON-FINDER] Searching for buttons by class and ID...');
      
      // Common class patterns for these buttons
      const linkedInSelectors = [
        'a[href*="linkedin"]',
        'button[class*="linkedin"]',
        '*[id*="linkedin"]',
        '*[class*="browser"]',
        'a[href*="browser"]'
      ];
      
      const extractionSelectors = [
        'button[class*="extract"]',
        '*[id*="extract"]',
        '*[class*="extraction"]',
        'a[href*="extract"]'
      ];
      
      // Try each selector
      linkedInSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          attachHandlers('linkedInBrowser', el);
        });
      });
      
      extractionSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          attachHandlers('startExtraction', el);
        });
      });
    },
    
    // Strategy 3: Search by position in the navigation menu
    function findByMenuPosition() {
      console.log('[BUTTON-FINDER] Searching by menu position...');
      
      // Check the navigation menu - LinkedIn is usually the second item
      const navItems = document.querySelectorAll('nav a, .sidebar a, .menu a, .navigation a');
      
      if (navItems.length >= 2) {
        // Second nav item is often LinkedIn
        attachHandlers('linkedInBrowser', navItems[1]);
      }
      
      // Look for sections that might contain the extraction button
      const sections = document.querySelectorAll('section, div[class*="section"], div[class*="content"]');
      
      sections.forEach(section => {
        const buttons = section.querySelectorAll('button, a, div[role="button"]');
        
        buttons.forEach(button => {
          const text = (button.textContent || '').toLowerCase();
          if (text.includes('start') || text.includes('extract')) {
            attachHandlers('startExtraction', button);
          }
        });
      });
    },
    
    // Strategy 4: Look for icon buttons in specific containers
    function findByIconsAndContainers() {
      console.log('[BUTTON-FINDER] Searching by icons and containers...');
      
      // LinkedIn often has a browser icon
      const iconElements = document.querySelectorAll('i, svg, img, span[class*="icon"]');
      
      iconElements.forEach(icon => {
        const parent = icon.closest('button') || icon.closest('a') || icon.parentElement;
        
        if (!parent) return;
        
        // Check for common icon class names
        const className = icon.className || '';
        
        if (className.includes('browser') || className.includes('linkedin')) {
          attachHandlers('linkedInBrowser', parent);
        } else if (className.includes('extract') || className.includes('start')) {
          attachHandlers('startExtraction', parent);
        }
      });
      
      // Check containers that might hold the extraction button
      const containers = document.querySelectorAll('.card, .panel, .content-section, main');
      
      containers.forEach(container => {
        const buttons = container.queryS