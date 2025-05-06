// navigation-fix.js - Fix for navigation issues in React UI

(function() {
  console.log('[NAVIGATION-FIX] Initializing navigation fix...');
  
  // Store original navigation functions for reference
  const originalNavFunctions = {};
  
  // Function to ensure navigation events reach the main process
  function ensureNavigationWorks() {
    // 1. Intercept all navigation-related API calls
    if (window.api) {
      // Store original functions
      ['startLinkedInBrowser', 'extractApplicants', 'logout'].forEach(funcName => {
        if (window.api[funcName]) {
          originalNavFunctions[funcName] = window.api[funcName];
          
          // Replace with wrapped version that ensures proper event flow
          window.api[funcName] = function(...args) {
            console.log(`[NAVIGATION-FIX] Calling ${funcName} with args:`, args);
            
            // Call original with proper this context and return result
            const result = originalNavFunctions[funcName].apply(window.api, args);
            
            // Force renderer process to acknowledge navigation attempt
            window.dispatchEvent(new CustomEvent('navigation-attempted', {
              detail: { function: funcName, args, result }
            }));
            
            return result;
          };
        }
      });
    }
    
    // 2. Directly handle navigation menu clicks
    function handleNavClick(element, targetFunc) {
      element.addEventListener('click', function(e) {
        console.log(`[NAVIGATION-FIX] Direct navigation click for ${targetFunc}`);
        e.preventDefault();
        e.stopPropagation();
        
        // Call the API function directly when possible
        if (window.api && window.api[targetFunc]) {
          window.api[targetFunc]();
        } else if (window[targetFunc + 'Command']) {
          // Fall back to direct command if available
          window[targetFunc + 'Command']();
        } else {
          console.error(`[NAVIGATION-FIX] No handler found for ${targetFunc}`);
        }
        
        return false;
      }, true); // Use capture to get event before React
    }
    
    // 3. Set up a MutationObserver to catch new navigation elements
    const navObserver = new MutationObserver(function(mutations) {
      // Map of selector to function name
      const navMap = {
        'a[href*="dashboard"]': 'navigateToDashboard',
        'a[href*="linkedin"]': 'startLinkedInBrowser',
        'a[href*="extraction"]': 'extractApplicants',
        'a[href*="candidates"]': 'navigateToCandidates',
        'a[href*="messaging"]': 'navigateToMessaging',
        'a[href*="settings"]': 'navigateToSettings'
      };
      
      // For each known navigation element type
      Object.entries(navMap).forEach(([selector, funcName]) => {
        document.querySelectorAll(selector).forEach(el => {
          // Only attach if not already processed
          if (!el.dataset.navFixed) {
            handleNavClick(el, funcName);
            el.dataset.navFixed = 'true';
          }
        });
      });
    });
    
    // Start observing with appropriate config
    navObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // 4. Fix the regular expression errors by patching any problematic regexes
    try {
      // This addresses the common regex flag error
      const originalRegExp = window.RegExp;
      window.RegExp = function(pattern, flags) {
        if (flags && /[^gimsuyd]/.test(flags)) {
          console.warn('[NAVIGATION-FIX] Fixing invalid RegExp flags:', flags);
          flags = flags.replace(/[^gimsuyd]/g, '');
        }
        return new originalRegExp(pattern, flags);
      };
    } catch (e) {
      console.error('[NAVIGATION-FIX] Error patching RegExp:', e);
    }
    
    console.log('[NAVIGATION-FIX] Navigation fix installed successfully');
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureNavigationWorks);
  } else {
    ensureNavigationWorks();
  }
  
  // Create backup direct navigation functions
  window.navigateToDashboard = function() {
    console.log('[NAVIGATION-FIX] Direct dashboard navigation requested');
    if (window.api && window.api.navigateTo) window.api.navigateTo('dashboard');
    // Force navigation if needed
    location.hash = '#/dashboard';
  };
  
  window.navigateToCandidates = function() {
    console.log('[NAVIGATION-FIX] Direct candidates navigation requested');
    if (window.api && window.api.navigateTo) window.api.navigateTo('candidates');
    // Force navigation if needed
    location.hash = '#/candidates';
  };
  
  window.navigateToMessaging = function() {
    console.log('[NAVIGATION-FIX] Direct messaging navigation requested');
    if (window.api && window.api.navigateTo) window.api.navigateTo('messaging');
    // Force navigation if needed
    location.hash = '#/messaging';
  };
  
  window.navigateToSettings = function() {
    console.log('[NAVIGATION-FIX] Direct settings navigation requested');
    if (window.api && window.api.navigateTo) window.api.navigateTo('settings');
    // Force navigation if needed
    location.hash = '#/settings';
  };
  
  // Backup navigation event system
  window.addEventListener('keydown', function(e) {
    // Alt+1-5 for quick navigation
    if (e.altKey && e.key >= '1' && e.key <= '5') {
      const navFunctions = [
        'navigateToDashboard',
        'startLinkedInBrowser',
        'navigateToCandidates',
        'navigateToMessaging',
        'navigateToSettings'
      ];
      const funcIndex = parseInt(e.key) - 1;
      if (funcIndex >= 0 && funcIndex < navFunctions.length) {
        console.log(`[NAVIGATION-FIX] Alt+${e.key} navigation shortcut`);
        if (window[navFunctions[funcIndex]]) {
          window[navFunctions[funcIndex]]();
        }
      }
    }
  });
  
})();
