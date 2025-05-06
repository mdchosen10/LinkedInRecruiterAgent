// Enhanced Event Patch for LinkedIn Recruiter Agent
// This script provides a more robust event handling system to ensure buttons work properly
// with React's synthetic event system and Electron's IPC bridge

(function() {
  console.log('Enhanced event patch loading...');
  
  // Make sure window.api is accessible
  if (!window.api) {
    console.error('ERROR: window.api is not available in enhanced-event-patch.js');
    
    // Create a fallback to check periodically
    let apiCheckCount = 0;
    const apiCheckInterval = setInterval(function() {
      apiCheckCount++;
      if (window.api) {
        console.log('window.api became available after', apiCheckCount, 'checks');
        clearInterval(apiCheckInterval);
        installEventPatch();
      } else if (apiCheckCount > 20) {
        console.error('window.api still not available after 20 checks, giving up');
        clearInterval(apiCheckInterval);
      }
    }, 500);
  } else {
    console.log('window.api is available, installing event patch immediately');
    installEventPatch();
  }
  
  // Utility functions
  function findButtonsByText(text) {
    text = text.toLowerCase();
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).filter(btn => {
      return btn.innerText && btn.innerText.toLowerCase().includes(text);
    });
  }
  
  function findElementsByText(text) {
    text = text.toLowerCase();
    const elements = document.querySelectorAll('*');
    return Array.from(elements).filter(el => {
      return el.innerText && el.innerText.toLowerCase().includes(text);
    });
  }
  
  function findButtonsById(id) {
    id = id.toLowerCase();
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).filter(btn => {
      return btn.id && btn.id.toLowerCase().includes(id);
    });
  }
  
  // Function to extract LinkedIn job URLs from input fields
  function extractJobUrls() {
    const inputs = document.querySelectorAll('input');
    const jobUrls = [];
    
    inputs.forEach(input => {
      if (input.value && (
          input.value.includes('linkedin.com') || 
          input.value.includes('jobs'))) {
        jobUrls.push(input.value);
      }
    });
    
    return jobUrls;
  }
  
  // Main event patch installation function
  function installEventPatch() {
    console.log('Installing enhanced event handlers...');
    
    // Create global direct access methods
    window.directLogout = function() {
      console.log('Direct logout method called');
      if (window.api && window.api.clearCredentials) {
        return window.api.clearCredentials()
          .then(result => {
            console.log('Logout successful:', result);
            window.location.href = '#/login';
            window.location.reload();
            return result;
          })
          .catch(err => {
            console.error('Logout failed:', err);
            window.location.href = '#/login';
            window.location.reload();
            throw err;
          });
      } else {
        console.error('Cannot logout: window.api.clearCredentials not available');
        window.location.href = '#/login';
        window.location.reload();
        return Promise.resolve(false);
      }
    };
    
    window.startLinkedInBrowserDirect = function(options) {
      console.log('Direct LinkedIn browser method called with options:', options);
      if (window.api && window.api.startLinkedInBrowser) {
        return window.api.startLinkedInBrowser(options)
          .then(result => {
            console.log('LinkedIn browser started successfully:', result);
            return result;
          })
          .catch(err => {
            console.error('LinkedIn browser start failed:', err);
            throw err;
          });
      } else {
        console.error('Cannot start LinkedIn browser: window.api.startLinkedInBrowser not available');
        return Promise.reject(new Error('API not available'));
      }
    };
    
    // Global event handler
    const globalClickHandler = function(event) {
      const target = event.target;
      console.log('Global click handler caught click on:', 
        target.tagName, 
        target.id ? '#' + target.id : '',
        Array.from(target.classList || []).join('.'),
        target.innerText ? `"${target.innerText.substring(0, 20)}"` : '');
      
      // Helper to check if this is a logout element
      const isLogoutElement = (el) => {
        if (!el) return false;
        if (el.innerText && el.innerText.toLowerCase().includes('logout')) return true;
        if (el.id && el.id.toLowerCase().includes('logout')) return true;
        if (el.getAttribute('data-testid') === 'logout-button') return true;
        return false;
      };
      
      // Helper to check if this is a LinkedIn browser button
      const isLinkedInBrowserButton = (el) => {
        if (!el) return false;
        if (el.innerText && el.innerText.toLowerCase().includes('linkedin browser')) return true;
        if (el.id && el.id.toLowerCase().includes('startlinkedinbrowser')) return true;
        if (el.getAttribute('data-testid') === 'linkedin-browser-button') return true;
        return false;
      };
      
      // Helper to check if this is an extraction button
      const isExtractionButton = (el) => {
        if (!el) return false;
        if (el.innerText && el.innerText.toLowerCase().includes('start extraction')) return true;
        if (el.id && el.id.toLowerCase().includes('startextraction')) return true;
        if (el.getAttribute('data-testid') === 'extraction-button') return true;
        return false;
      };
      
      // Check the clicked element and its ancestors (up to 4 levels)
      let currentElement = target;
      let depth = 0;
      
      while (currentElement && depth < 4) {
        // Check for logout element
        if (isLogoutElement(currentElement)) {
          console.log('Logout element found at depth', depth);
          event.preventDefault();
          event.stopPropagation();
          window.directLogout();
          return false;
        }
        
        // Check for LinkedIn browser button
        if (isLinkedInBrowserButton(currentElement)) {
          console.log('LinkedIn browser button found at depth', depth);
          event.preventDefault();
          event.stopPropagation();
          window.startLinkedInBrowserDirect();
          return false;
        }
        
        // Check for extraction button
        if (isExtractionButton(currentElement)) {
          console.log('Extraction button found at depth', depth);
          event.preventDefault();
          event.stopPropagation();
          
          const jobUrls = extractJobUrls();
          console.log('Found job URLs:', jobUrls);
          
          if (jobUrls.length > 0) {
            // Parse job ID if possible
            let jobId = null;
            let applicantViewId = null;
            
            const jobIdMatch = jobUrls[0].match(/\/hiring\/jobs\/(\d+)/);
            if (jobIdMatch) jobId = jobIdMatch[1];
            
            const viewIdMatch = jobUrls[0].match(/\/applicants\/(\d+)/);
            if (viewIdMatch) applicantViewId = viewIdMatch[1];
            
            const options = { jobUrls };
            if (jobId) options.jobId = jobId;
            if (applicantViewId) options.applicantViewId = applicantViewId;
            
            window.startLinkedInBrowserDirect(options);
          } else {
            console.log('No job URLs found for extraction');
          }
          
          return false;
        }
        
        // Move up to parent
        currentElement = currentElement.parentElement;
        depth++;
      }
    };
    
    // Add global click handler in capture phase
    document.addEventListener('click', globalClickHandler, true);
    
    // Periodically look for and enhance specific buttons
    function enhanceButtons() {
      console.log('Enhancing specific buttons...');
      
      // Find all logout buttons/elements
      const logoutElements = findElementsByText('logout');
      console.log('Found', logoutElements.length, 'logout elements');
      
      logoutElements.forEach((el, i) => {
        