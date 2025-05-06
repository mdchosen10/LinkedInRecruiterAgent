/**
 * DOM Injector for LinkedIn Recruiter Agent
 * This script injects direct DOM elements for key actions into the UI
 */
(function() {
  console.log('[DOM-INJECTOR] Initializing...');
  
  // Create direct logout function
  if (!window.directLogout) {
    window.directLogout = function() {
      console.log('[DOM-INJECTOR] Direct logout called');
      
      if (window.api && window.api.clearCredentials) {
        console.log('[DOM-INJECTOR] Using API clearCredentials');
        window.api.clearCredentials()
          .then(result => {
            console.log('[DOM-INJECTOR] Logout successful:', result);
            window.location.href = '#/login';
            window.location.reload();
          })
          .catch(err => {
            console.error('[DOM-INJECTOR] Logout error:', err);
            window.location.href = '#/login';
            window.location.reload();
          });
      } else {
        console.warn('[DOM-INJECTOR] API not available, using direct navigation');
        window.location.href = '#/login';
        window.location.reload();
      }
    };
  }
  
  // Function to create a floating button
  function createFloatingButton(text, action, position, color) {
    const button = document.createElement('button');
    button.innerText = text;
    button.id = 'injected-' + text.toLowerCase().replace(/\\s+/g, '-');
    button.style.position = 'fixed';
    button.style.zIndex = '9999';
    button.style.padding = '8px 12px';
    button.style.borderRadius = '4px';
    button.style.fontSize = '14px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    button.style.transition = 'opacity 0.3s ease';
    button.style.opacity = '0.7';
    button.style.backgroundColor = color || '#0077b5';
    button.style.color = 'white';
    button.style.border = 'none';
    
    // Position the button
    if (position === 'top-right') {
      button.style.top = '10px';
      button.style.right = '10px';
    } else if (position === 'top-left') {
      button.style.top = '10px';
      button.style.left = '10px';
    } else if (position === 'bottom-right') {
      button.style.bottom = '10px';
      button.style.right = '10px';
    } else if (position === 'bottom-left') {
      button.style.bottom = '10px';
      button.style.left = '10px';
    }
    
    // Hover effect
    button.addEventListener('mouseover', () => {
      button.style.opacity = '1';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.opacity = '0.7';
    });
    
    // Click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[DOM-INJECTOR] Floating button "${text}" clicked`);
      action();
      return false;
    });
    
    return button;
  }
  
  // Create a container for the injected UI
  function createUIContainer() {
    let container = document.getElementById('dom-injector-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dom-injector-container';
      container.style.position = 'fixed';
      container.style.bottom = '10px';
      container.style.right = '10px';
      container.style.zIndex = '99999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      document.body.appendChild(container);
    }
    return container;
  }
  
  // Function to inject the direct logout button
  function injectLogoutButton() {
    const container = createUIContainer();
    
    const existingButton = document.getElementById('injected-direct-logout');
    if (existingButton) {
      return;
    }
    
    const logoutButton = createFloatingButton('Direct Logout', window.directLogout, null, '#d32f2f');
    logoutButton.id = 'injected-direct-logout';
    container.appendChild(logoutButton);
    
    console.log('[DOM-INJECTOR] Direct logout button injected');
  }
  
  // Function to inject LinkedIn actions
  function injectLinkedInButtons() {
    const container = createUIContainer();
    
    // Check if we're on the LinkedIn extraction page
    const isLinkedInPage = window.location.hash.includes('linkedin-extraction') ||
                           document.title.toLowerCase().includes('linkedin') ||
                           Array.from(document.querySelectorAll('h1, h2')).some(h => 
                             h.innerText && h.innerText.toLowerCase().includes('linkedin')
                           );
    
    if (!isLinkedInPage) {
      return;
    }
    
    // LinkedIn Browser button
    if (!document.getElementById('injected-linkedin-browser')) {
      const browserButton = createFloatingButton('LinkedIn Browser', () => {
        console.log('[DOM-INJECTOR] Direct LinkedIn browser button clicked');
        
        if (window.api && window.api.startLinkedInBrowser) {
          window.api.startLinkedInBrowser()
            .then(result => {
              console.log('[DOM-INJECTOR] LinkedIn browser started:', result);
            })
            .catch(err => {
              console.error('[DOM-INJECTOR] LinkedIn browser error:', err);
            });
        } else {
          console.warn('[DOM-INJECTOR] API not available for LinkedIn browser');
        }
      }, null, '#0077b5');
      
      browserButton.id = 'injected-linkedin-browser';
      container.appendChild(browserButton);
      
      console.log('[DOM-INJECTOR] LinkedIn browser button injected');
    }
    
    // Start Extraction button (only if we can find jobUrls)
    if (!document.getElementById('injected-start-extraction')) {
      const extractionButton = createFloatingButton('Start Extraction', () => {
        console.log('[DOM-INJECTOR] Direct start extraction button clicked');
        
        // Look for job URL inputs
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
          console.log('[DOM-INJECTOR] Found job URLs:', jobUrls);
          
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
            
            console.log('[DOM-INJECTOR] Starting extraction with options:', extractionOptions);
            window.api.startLinkedInBrowser(extractionOptions)
              .then(result => {
                console.log('[DOM-INJECTOR] Extraction started:', result);
              })
              .catch(err => {
                console.error('[DOM-INJECTOR] Extraction error:', err);
              });
          } else {
            console.warn('[DOM-INJECTOR] API not available for extraction');
          }
        } else {
          console.log('[DOM-INJECTOR] No job URLs found for extraction');
        }
      }, null, '#2e7d32');
      
      extractionButton.id = 'injected-start-extraction';
      container.appendChild(extractionButton);
      
      console.log('[DOM-INJECTOR] Start extraction button injected');
    }
  }
  
  // Function to inject hidden buttons that target the real buttons
  function injectHiddenProxyButtons() {
    // Add invisible buttons that will target the real buttons
    const buttonSelectors = [
      { id: 'logoutButton', text: 'Logout' },
      { id: 'startLinkedInBrowserButton', text: 'LinkedIn Browser' },
      { id: 'startExtractionButton', text: 'Start Extraction' }
    ];
    
    buttonSelectors.forEach(selector => {
      // Look for the real button
      const realButton = document.getElementById(selector.id) || 
                         Array.from(document.querySelectorAll('button')).find(btn => 
                           btn.innerText && btn.innerText.toLowerCase().includes(selector.text.toLowerCase())
                         );
      
      if (realButton) {
        console.log(`[DOM-INJECTOR] Found real button: ${selector.id || selector.text}`);
        
        // Add special class for easy identification
        realButton.classList.add('found-button');
        realButton.setAttribute('data-button-type', selector.text.toLowerCase().replace(/\\s+/g, '-'));
        
        // Create invisible proxy that will forward clicks
        const proxyId = `proxy-${selector.id || selector.text.toLowerCase().replace(/\\s+/g, '-')}`;
        
        if (!document.getElementById(proxyId)) {
          const proxyButton = document.createElement('button');
          proxyButton.id = proxyId;
          proxyButton.innerText = `Proxy ${selector.text}`;
          proxyButton.style.position = 'fixed';
          proxyButton.style.top = '-100px'; // Off screen
          proxyButton.style.left = '-100px';
          proxyButton.style.opacity = '0';
          proxyButton.style.pointerEvents = 'none';
          
          document.body.appendChild(proxyButton);
          
          // Add click handler
          proxyButton.addEventListener('click', () => {
            console.log(`[DOM-INJECTOR] Proxy button for ${selector.text} clicked, forwarding to real button`);
            // Simulate click on real button
            realButton.click();
          });
          
          console.log(`[DOM-INJECTOR] Added proxy button for ${selector.text}`);
        }
      }
    });
  }
  
  // Function to add console commands for button operations
  function addConsoleCommands() {
    window.logoutCommand = function() {
      console.log('[DOM-INJECTOR] Logout command executed');
      window.directLogout();
    };
    
    window.linkedInBrowserCommand = function() {
      console.log('[DOM-INJECTOR] LinkedIn browser command executed');
      
      if (window.api && window.api.startLinkedInBrowser) {
        window.api.startLinkedInBrowser()
          .then(result => {
            console.log('[DOM-INJECTOR] LinkedIn browser started:', result);
          })
          .catch(err => {
            console.error('[DOM-INJECTOR] LinkedIn browser error:', err);
          });
      } else {
        console.warn('[DOM-INJECTOR] API not available for LinkedIn browser');
      }
    };
    
    window.startExtractionCommand = function(jobUrls) {
      console.log('[DOM-INJECTOR] Start extraction command executed');
      
      if (!jobUrls || !jobUrls.length) {
        // Look for job URL inputs
        const inputs = document.querySelectorAll('input');
        jobUrls = [];
        
        inputs.forEach(input => {
          if (input.value && (
              input.value.includes('linkedin.com') || 
              input.value.includes('jobs'))) {
            jobUrls.push(input.value);
          }
        });
      }
      
      if (jobUrls.length > 0) {
        console.log('[DOM-INJECTOR] Using job URLs:', jobUrls);
        
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
          
          console.log('[DOM-INJECTOR] Starting extraction with options:', extractionOptions);
          window.api.startLinkedInBrowser(extractionOptions)
            .then(result => {
              console.log('[DOM-INJECTOR] Extraction started:', result);
            })
            .catch(err => {
              console.error('[DOM-INJECTOR] Extraction error:', err);
            });
        } else {
          console.warn('[DOM-INJECTOR] API not available for extraction');
        }
      } else {
        console.log('[DOM-INJECTOR] No job URLs found for extraction');
      }
    };
    
    console.log('[DOM-INJECTOR] Console commands added: logoutCommand(), linkedInBrowserCommand(), startExtractionCommand()');
  }
  
  // Function to inject a floating debug panel
  function injectDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '10px';
    panel.style.left = '10px';
    panel.style.zIndex = '99999';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.fontSize = '12px';
    panel.style.fontFamily = 'monospace';
    panel.style.maxWidth = '300px';
    panel.style.maxHeight = '200px';
    panel.style.overflow = 'auto';
    panel.style.display = 'none'; // Hidden by default
    
    // Add content
    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">Debug Panel</div>
      <div id="debug-api-status"></div>
      <div id="debug-buttons-found"></div>
      <div id="debug-page-info"></div>
      <div style="margin-top: 10px; display: flex; gap: 5px;">
        <button id="debug-logout-btn" style="padding: 3px 5px; font-size: 10px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer;">Logout</button>
        <button id="debug-linkedin-btn" style="padding: 3px 5px; font-size: 10px; background: #0077b5; color: white; border: none; border-radius: 3px; cursor: pointer;">LinkedIn</button>
        <button id="debug-extract-btn" style="padding: 3px 5px; font-size: 10px; background: #2e7d32; color: white; border: none; border-radius: 3px; cursor: pointer;">Extract</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add toggle for debug panel
    const toggleKey = function(e) {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        if (panel.style.display === 'none') {
          panel.style.display = 'block';
          updateDebugPanel();
        } else {
          panel.style.display = 'none';
        }
      }
    };
    
    window.addEventListener('keydown', toggleKey);
    
    // Add button handlers
    document.getElementById('debug-logout-btn').addEventListener('click', window.logoutCommand);
    document.getElementById('debug-linkedin-btn').addEventListener('click', window.linkedInBrowserCommand);
    document.getElementById('debug-extract-btn').addEventListener('click', window.startExtractionCommand);
    
    // Update debug panel
    function updateDebugPanel() {
      if (panel.style.display === 'none') return;
      
      // Update API status
      const apiStatus = document.getElementById('debug-api-status');
      apiStatus.innerHTML = `API: ${window.api ? '<span style="color: #4caf50;">Available</span>' : '<span style="color: #f44336;">Not Available</span>'}`;
      
      if (window.api) {
        apiStatus.innerHTML += `<br>Methods: ${Object.keys(window.api).slice(0, 3).join(', ')}...`;
      }
      
      // Update buttons found
      const buttonsFound = document.getElementById('debug-buttons-found');
      const logoutBtn = document.getElementById('logoutButton');
      const linkedInBtn = document.getElementById('startLinkedInBrowserButton');
      const extractBtn = document.getElementById('startExtractionButton');
      
      buttonsFound.innerHTML = `
        Logout Button: ${logoutBtn ? '<span style="color: #4caf50;">Found</span>' : '<span style="color: #f44336;">Not Found</span>'}<br>
        LinkedIn Button: ${linkedInBtn ? '<span style="color: #4caf50;">Found</span>' : '<span style="color: #f44336;">Not Found</span>'}<br>
        Extract Button: ${extractBtn ? '<span style="color: #4caf50;">Found</span>' : '<span style="color: #f44336;">Not Found</span>'}
      `;
      
      // Update page info
      const pageInfo = document.getElementById('debug-page-info');
      pageInfo.innerHTML = `
        Location: ${window.location.hash || '/'}<br>
        Path: ${window.location.pathname}<br>
        Title: ${document.title}
      `;
    }
    
    // Update every second
    setInterval(updateDebugPanel, 1000);
    
    console.log('[DOM-INJECTOR] Debug panel injected (press Ctrl+Alt+D to toggle)');
  }
  
  // Run initializations
  setTimeout(() => {
    injectLogoutButton();
    injectLinkedInButtons();
    injectHiddenProxyButtons();
    addConsoleCommands();
    injectDebugPanel();
  }, 2000);
  
  // Set up periodic checks and updates
  setInterval(() => {
    injectLogoutButton();
    injectLinkedInButtons();
    injectHiddenProxyButtons();
  }, 5000);
  
  // Also check when navigation occurs
  window.addEventListener('hashchange', () => {
    console.log('[DOM-INJECTOR] Navigation detected, re-checking UI injections');
    setTimeout(() => {
      injectLogoutButton();
      injectLinkedInButtons();
      injectHiddenProxyButtons();
    }, 1000);
  });
  
  console.log('[DOM-INJECTOR] DOM injector initialized successfully');
})();
