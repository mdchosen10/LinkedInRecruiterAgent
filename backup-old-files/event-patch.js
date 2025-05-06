// Global event handler patch
// This script adds global event handlers to ensure button clicks are captured
// even if React's event system has issues

(function() {
  console.log('Installing enhanced global event handler patch...');

  // Helper function to check if an element contains text
  function containsText(element, text) {
    if (!element) return false;
    
    // Check element's own text
    if (element.innerText && element.innerText.toLowerCase().includes(text)) {
      return true;
    }
    
    // Check text in children
    for (let i = 0; i < element.children.length; i++) {
      if (containsText(element.children[i], text)) {
        return true;
      }
    }
    
    return false;
  }

  // Add global click handler with capture
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    console.log('Global click on:', target.tagName, 
      target.id ? '#' + target.id : '',
      Array.from(target.classList || []).join('.'),
      target.innerText ? '"' + target.innerText.substring(0, 20) + '"' : '');
    
    // Check if this is the logout link/button by traversing up to find it
    let currentElement = target;
    let maxDepth = 4; // Don't traverse too far up
    
    // Check if this element or any parent up to 4 levels contains "logout" text
    while (currentElement && maxDepth > 0) {
      if (containsText(currentElement, 'logout')) {
        console.log('Logout element found via text search:', currentElement.tagName);
        
        // Execute direct logout
        if (window.api && window.api.clearCredentials) {
          console.log('Executing direct logout via API');
          window.api.clearCredentials()
            .then(function(result) {
              console.log('Direct logout successful:', result);
              setTimeout(function() {
                window.location.href = '#/login';
                window.location.reload();
              }, 100);
            })
            .catch(function(error) {
              console.error('Direct logout failed:', error);
              window.location.href = '#/login';
              window.location.reload();
            });
          
          // Prevent default action and stop propagation
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
      
      // Move up to parent
      currentElement = currentElement.parentElement;
      maxDepth--;
    }
    
    // Check for LinkedIn Extraction link
    if (target.innerText && target.innerText.includes('LinkedIn Extraction') ||
        (target.parentElement && target.parentElement.innerText && 
         target.parentElement.innerText.includes('LinkedIn Extraction'))) {
      
      console.log('LinkedIn Extraction navigation detected');
      // Let this one proceed normally
    }
    
    // Special handling for text matching "LinkedIn Browser" or "Start Extraction"
    if (target.innerText) {
      const text = target.innerText.toLowerCase();
      
      if (text.includes('linkedin browser') || text.includes('start linkedin')) {
        console.log('LinkedIn Browser button detected via text');
        
        // Call LinkedIn browser start
        if (window.api && window.api.startLinkedInBrowser) {
          console.log('Starting LinkedIn browser via direct API call');
          event.preventDefault();
          event.stopPropagation();
          
          window.api.startLinkedInBrowser()
            .then(function(result) {
              console.log('LinkedIn browser started successfully:', result);
            })
            .catch(function(error) {
              console.error('LinkedIn browser start failed:', error);
            });
          
          return false;
        }
      }
      
      if (text.includes('start extraction')) {
        console.log('Extraction button detected via text');
        
        // Get job URLs from any text inputs
        const inputs = document.querySelectorAll('input');
        const jobUrls = [];
        
        inputs.forEach(function(input) {
          if (input.value && 
              (input.value.includes('linkedin.com') || 
               input.value.includes('jobs'))) {
            jobUrls.push(input.value);
          }
        });
        
        console.log('Found job URLs:', jobUrls);
        
        if (jobUrls.length > 0 && window.api && window.api.startLinkedInBrowser) {
          console.log('Starting extraction with URLs:', jobUrls);
          event.preventDefault();
          event.stopPropagation();
          
          // Parse job ID if possible
          let jobId = null;
          let applicantViewId = null;
          
          const jobIdMatch = jobUrls[0].match(/\/hiring\/jobs\/(\d+)/);
          if (jobIdMatch) jobId = jobIdMatch[1];
          
          const viewIdMatch = jobUrls[0].match(/\/applicants\/(\d+)/);
          if (viewIdMatch) applicantViewId = viewIdMatch[1];
          
          const options = {
            jobUrls: jobUrls
          };
          
          if (jobId) options.jobId = jobId;
          if (applicantViewId) options.applicantViewId = applicantViewId;
          
          window.api.startLinkedInBrowser(options)
            .then(function(result) {
              console.log('Extraction started successfully:', result);
            })
            .catch(function(error) {
              console.error('Extraction start failed:', error);
            });
          
          return false;
        }
      }
    }
  }, true); // true for capture phase
  
  // After a small delay, directly attach handlers to all buttons
  setTimeout(function() {
    console.log('Attaching direct click handlers to all buttons...');
    
    // Find all buttons
    const buttons = document.querySelectorAll('button');
    console.log('Found', buttons.length, 'buttons');
    
    // Attach handlers to each button
    buttons.forEach(function(button, index) {
      // Add a data attribute for identification
      button.setAttribute('data-button-index', index);
      
      // Add direct click handler
      button.addEventListener('click', function(e) {
        console.log('Direct button click detected on:', button.innerText || 'button ' + index);
        
        // Let the global handler take care of special cases
      }, true);
      
      console.log('Button', index, ':', 
        button.innerText || 'No text',
        'classes:', Array.from(button.classList || []).join(' '));
    });
    
    // Find all elements with logout text
    const allElements = document.querySelectorAll('*');
    const logoutElements = Array.from(allElements).filter(function(el) {
      return el.innerText && el.innerText.toLowerCase().includes('logout');
    });
    
    console.log('Found', logoutElements.length, 'elements containing "logout" text');
    
    // Add direct handlers to logout elements
    logoutElements.forEach(function(element, index) {
      element.addEventListener('click', function(e) {
        console.log('Direct click on logout element', index);
        
        // Perform direct logout
        if (window.api && window.api.clearCredentials) {
          console.log('Performing direct logout via API from element handler');
          e.preventDefault();
          e.stopPropagation();
          
          window.api.clearCredentials()
            .then(function(result) {
              console.log('Direct logout result:', result);
              window.location.href = '#/login';
              window.location.reload();
            })
            .catch(function(error) {
              console.error('Direct logout error:', error);
              window.location.href = '#/login';
              window.location.reload();
            });
          
          return false;
        }
      }, true);
    });
  }, 1000);
  
  console.log('Enhanced global event handler patch installed');
})();

