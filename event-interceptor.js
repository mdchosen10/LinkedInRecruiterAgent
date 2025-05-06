/**
 * Event Interceptor for LinkedIn Recruiter Agent
 * This script intercepts events at the document level before React can handle them
 */
(function() {
  console.log('[EVENT-INTERCEPTOR] Initializing...');
  
  // Create direct action handlers
  if (!window.directLogout) {
    window.directLogout = function() {
      console.log('[EVENT-INTERCEPTOR] Direct logout called');
      
      if (window.api && window.api.clearCredentials) {
        window.api.clearCredentials()
          .then(res => {
            console.log('[EVENT-INTERCEPTOR] Logout successful');
            window.location.href = '#/login';
            window.location.reload();
          })
          .catch(err => {
            console.error('[EVENT-INTERCEPTOR] Logout error:', err);
            window.location.href = '#/login';
            window.location.reload();
          });
      } else {
        console.warn('[EVENT-INTERCEPTOR] API not available, using direct navigation');
        window.location.href = '#/login';
        window.location.reload();
      }
    };
  }
  
  // Install a global click interceptor
  document.addEventListener('click', function(e) {
    // Don't process every click - only those that might be relevant
    const target = e.target;
    const isButton = target.tagName === 'BUTTON';
    const isLogoutElement = findMatchingElement(e.target, el => {
      return (el.id === 'logoutButton' || 
              (el.innerText && el.innerText.toLowerCase().includes('logout')));
    });
    
    // Handle logout element clicks
    if (isLogoutElement) {
      console.log('[EVENT-INTERCEPTOR] Logout element clicked:', 
        isLogoutElement.tagName, 
        isLogoutElement.id || '', 
        isLogoutElement.innerText || '');
      
      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      // Call our direct logout function
      window.directLogout();
      
      return false;
    }
    
    // Also check for LinkedIn extraction buttons
    const isLinkedInButton = findMatchingElement(e.target, el => {
      return (el.id === 'startLinkedInBrowserButton' || 
              (el.innerText && el.innerText.toLowerCase().includes('linkedin browser')));
    });
    
    if (isLinkedInButton) {
      console.log('[EVENT-INTERCEPTOR] LinkedIn Browser button clicked');
      
      // Only interfere if the API might not be available
      if (!window.api || !window.api.startLinkedInBrowser) {
        e.preventDefault();
        e.stopPropagation();
        
        console.warn('[EVENT-INTERCEPTOR] API not available for LinkedIn browser');
        return false;
      }
    }
    
    // Check for extraction buttons
    const isExtractionButton = findMatchingElement(e.target, el => {
      return (el.id === 'startExtractionButton' || 
              (el.innerText && el.innerText.toLowerCase().includes('start extraction')));
    });
    
    if (isExtractionButton) {
      console.log('[EVENT-INTERCEPTOR] Extraction button clicked');
      
      // Only interfere if the API might not be available
      if (!window.api || !window.api.startLinkedInBrowser) {
        e.preventDefault();
        e.stopPropagation();
        
        console.warn('[EVENT-INTERCEPTOR] API not available for extraction');
        return false;
      }
    }
  }, true); // Use capture phase to get events before React
  
  // Helper function to find a matching element by walking up the DOM tree
  function findMatchingElement(startElement, matchFn) {
    let current = startElement;
    const maxDepth = 5; // Don't go up more than 5 levels
    let depth = 0;
    
    while (current && depth < maxDepth) {
      if (matchFn(current)) {
        return current;
      }
      current = current.parentElement;
      depth++;
    }
    
    return null;
  }
  
  // Globally expose element finder for debugging
  window.findElementByText = function(text) {
    text = text.toLowerCase();
    const elements = Array.from(document.querySelectorAll('*')).filter(el => {
      return el.innerText && el.innerText.toLowerCase().includes(text);
    });
    
    console.log(`[EVENT-INTERCEPTOR] Found ${elements.length} elements containing "${text}"`);
    elements.forEach((el, i) => {
      console.log(`[EVENT-INTERCEPTOR] Element ${i}:`, 
        el.tagName, 
        el.id || '', 
        Array.from(el.classList || []).join(' '),
        el.innerText ? el.innerText.substring(0, 30) : '');
    });
    
    return elements;
  };
  
  // Create global monkeyPatched click handler for all buttons
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'click' && this.tagName === 'BUTTON') {
      console.log('[EVENT-INTERCEPTOR] Intercepted addEventListener for button:', 
        this.tagName, 
        this.id || '', 
        this.innerText || '');
      
      // Check if this is a button we care about
      const buttonText = this.innerText?.toLowerCase() || '';
      if (buttonText.includes('logout')) {
        console.log('[EVENT-INTERCEPTOR] Patching logout button listener');
        
        // Create a new listener that will call our direct logout
        const patchedListener = function(event) {
          console.log('[EVENT-INTERCEPTOR] Patched listener called for logout button');
          window.directLogout();
          event.preventDefault();
          event.stopPropagation();
          return false;
        };
        
        // Call original with our patched listener
        return originalAddEventListener.call(this, type, patchedListener, options);
      }
    }
    
    // Default: call original method
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  console.log('[EVENT-INTERCEPTOR] Initialized successfully');
})();
