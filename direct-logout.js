/**
 * Direct Logout Script for LinkedIn Recruiter Agent
 * This script adds a reliable global logout function that bypasses React
 */
(function() {
  console.log('Installing direct logout functionality...');
  
  // Create robust logout function
  window.directLogout = function() {
    console.log('Direct logout function called!');
    
    // First try using API
    if (window.api && window.api.clearCredentials) {
      console.log('Using window.api.clearCredentials()...');
      window.api.clearCredentials()
        .then(result => {
          console.log('Logout API call succeeded:', result);
          
          // Add small delay before navigation
          setTimeout(() => {
            window.location.href = '#/login';
            window.location.reload();
          }, 100);
        })
        .catch(err => {
          console.error('Logout API call failed:', err);
          
          // Navigate anyway
          window.location.href = '#/login';
          window.location.reload();
        });
    } else {
      console.warn('API not available, using direct navigation');
      window.location.href = '#/login';
      window.location.reload();
    }
  };
  
  // Override the logout button click after React has initialized
  setTimeout(() => {
    try {
      // Find the logout button
      const logoutButton = document.getElementById('logoutButton');
      if (logoutButton) {
        console.log('Found logout button, attaching direct handler');
        
        // Attach event listener in the capture phase to catch events before React
        logoutButton.addEventListener('click', function(e) {
          console.log('Logout button clicked - direct handler');
          e.preventDefault();
          e.stopPropagation();
          
          // Call our direct logout function
          window.directLogout();
          
          return false;
        }, true);
      } else {
        console.warn('Could not find logout button by ID');
        
        // Try finding by text content
        const allElements = document.querySelectorAll('*');
        const logoutElements = Array.from(allElements).filter(el => 
          el.innerText && el.innerText.toLowerCase().includes('logout'));
        
        console.log('Found', logoutElements.length, 'elements containing "logout" text');
        
        // Add click handlers to all of them
        logoutElements.forEach((el, i) => {
          console.log('Adding handler to logout element', i);
          el.addEventListener('click', function(e) {
            console.log('Logout text element clicked - direct handler');
            window.directLogout();
          }, true);
        });
      }
    } catch (err) {
      console.error('Error setting up direct logout:', err);
    }
  }, 2000);
  
  // Also look for and fix the LinkedIn extraction buttons
  setTimeout(() => {
    try {
      const linkedInBrowserButton = document.getElementById('startLinkedInBrowserButton');
      const startExtractionButton = document.getElementById('startExtractionButton');
      
      // Fix LinkedIn browser button
      if (linkedInBrowserButton) {
        console.log('Found LinkedIn browser button, attaching direct handler');
        
        linkedInBrowserButton.addEventListener('click', function(e) {
          console.log('LinkedIn browser button clicked - direct handler');
          
          // Only do our own handling if needed
          if (!window.api || !window.api.startLinkedInBrowser) {
            console.warn('API not available for LinkedIn browser, direct handler taking over');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
      }
      
      // Fix extraction button
      if (startExtractionButton) {
        console.log('Found extraction button, attaching direct handler');
        
        startExtractionButton.addEventListener('click', function(e) {
          console.log('Extraction button clicked - direct handler');
          
          // Only do our own handling if needed
          if (!window.api || !window.api.startLinkedInBrowser) {
            console.warn('API not available for extraction, direct handler taking over');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
      }
    } catch (err) {
      console.error('Error setting up LinkedIn button fixes:', err);
    }
  }, 3000);
  
  console.log('Direct logout functionality installed');
})();
