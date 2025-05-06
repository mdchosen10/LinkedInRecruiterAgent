/**
 * Navigation Debug Script
 * This script adds navigation debugging features to help troubleshoot
 * navigation issues in the LinkedIn Recruiter Agent application
 */

(function() {
  console.log('[NAVIGATION-DEBUG] Initializing navigation debugging utilities...');
  
  // Create a debugging panel
  function createDebugPanel() {
    // Check if panel already exists
    if (document.getElementById('nav-debug-panel')) {
      return;
    }
    
    // Create panel element
    const panel = document.createElement('div');
    panel.id = 'nav-debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: #33ff33;
      font-family: monospace;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    `;
    
    // Add panel header
    const header = document.createElement('div');
    header.textContent = '📊 Navigation Debug';
    header.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #33ff33;
      padding-bottom: 5px;
    `;
    panel.appendChild(header);
    
    // Add status section
    const statusSection = document.createElement('div');
    statusSection.innerHTML = `<div>API Bridge Status: <span id="nav-debug-api-status">Checking...</span></div>`;
    statusSection.innerHTML += `<div>Current Route: <span id="nav-debug-route">Unknown</span></div>`;
    statusSection.innerHTML += `<div>Navigation Fix: <span id="nav-debug-nav-fix">Checking...</span></div>`;
    panel.appendChild(statusSection);
    
    // Add action buttons
    const actionsSection = document.createElement('div');
    actionsSection.style.marginTop = '10px';
    
    // Create buttons for all navigation actions
    const actions = [
      { name: 'Dashboard', func: 'navigateToDashboard' },
      { name: 'LinkedIn Browser', func: 'startLinkedInBrowser' },
      { name: 'Extraction', func: 'extractApplicants' },
      { name: 'Candidates', func: 'navigateToCandidates' },
      { name: 'Messaging', func: 'navigateToMessaging' },
      { name: 'Settings', func: 'navigateToSettings' },
      { name: 'Logout', func: 'directLogout' }
    ];
    
    actions.forEach(action => {
      const button = document.createElement('button');
      button.textContent = action.name;
      button.style.cssText = `
        margin-right: 5px;
        margin-bottom: 5px;
        padding: 3px 5px;
        background: #222;
        color: #33ff33;
        border: 1px solid #33ff33;
        border-radius: 3px;
        font-family: monospace;
        cursor: pointer;
      `;
      button.onclick = function() {
        logToDebug(`🔘 Button clicked: ${action.name}`);
        if (window[action.func]) {
          logToDebug(`📩 Calling function: ${action.func}`);
          window[action.func]();
        } else {
          logToDebug(`⚠️ Function not found: ${action.func}`);
        }
      };
      actionsSection.appendChild(button);
    });
    
    panel.appendChild(actionsSection);
    
    // Add log section
    const logSection = document.createElement('div');
    logSection.id = 'nav-debug-log';
    logSection.style.cssText = `
      margin-top: 10px;
      border-top: 1px solid #33ff33;
      padding-top: 5px;
      max-height: 150px;
      overflow-y: auto;
    `;
    panel.appendChild(logSection);
    
    // Add to document
    document.body.appendChild(panel);
    
    // Add toggle debug panel keyboard shortcut (Alt+D)
    document.addEventListener('keydown', function(e) {
      if (e.altKey && e.key === 'd') {
        toggleDebugPanel();
      }
    });
    
    console.log('[NAVIGATION-DEBUG] Debug panel created');
    return panel;
  }
  
  // Toggle debug panel visibility
  function toggleDebugPanel() {
    const panel = document.getElementById('nav-debug-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      console.log(`[NAVIGATION-DEBUG] Debug panel ${panel.style.display === 'none' ? 'hidden' : 'shown'}`);
    } else {
      createDebugPanel().style.display = 'block';
    }
  }
  
  // Log to debug panel
  function logToDebug(message) {
    console.log(`[NAVIGATION-DEBUG] ${message}`);
    const logSection = document.getElementById('nav-debug-log');
    if (logSection) {
      const logEntry = document.createElement('div');
      logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
      logSection.appendChild(logEntry);
      logSection.scrollTop = logSection.scrollHeight;
    }
  }
  
  // Update status
  function updateStatus() {
    // Update API status
    const apiStatus = document.getElementById('nav-debug-api-status');
    if (apiStatus) {
      apiStatus.textContent = window.api ? '✅ Available' : '❌ Missing';
      apiStatus.style.color = window.api ? '#33ff33' : '#ff3333';
    }
    
    // Update current route
    const routeStatus = document.getElementById('nav-debug-route');
    if (routeStatus) {
      routeStatus.textContent = location.hash || '/';
    }
    
    // Update navigation fix status
    const navFixStatus = document.getElementById('nav-debug-nav-fix');
    if (navFixStatus) {
      const navFixPresent = window.navigateToDashboard !== undefined;
      navFixStatus.textContent = navFixPresent ? '✅ Installed' : '❌ Missing';
      navFixStatus.style.color = navFixPresent ? '#33ff33' : '#ff3333';
    }
  }
  
  // Initialize debug tools
  function initNavigationDebug() {
    // Create initial debug panel
    createDebugPanel();
    
    // Update status initially and every 2 seconds
    updateStatus();
    setInterval(updateStatus, 2000);
    
    // Expose debug functions globally
    window.toggleNavigationDebug = toggleDebugPanel;
    window.logNavigationEvent = logToDebug;
    
    // Monitor hash changes
    window.addEventListener('hashchange', function() {
      logToDebug(`🔄 Route changed to: ${location.hash}`);
      updateStatus();
    });
    
    // Monitor navigation events
    window.addEventListener('navigation-attempted', function(e) {
      logToDebug(`🚀 Navigation attempted: ${e.detail?.function || 'unknown'}`);
    });
    
    // Log when the navigation fix is working
    if (window.navigateToDashboard) {
      logToDebug('✅ Navigation fix is properly installed');
    } else {
      logToDebug('⚠️ Navigation fix appears to be missing');
    }
    
    console.log('[NAVIGATION-DEBUG] Navigation debugging initialized');
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationDebug);
  } else {
    initNavigationDebug();
  }
  
  // Expose toggle function right away
  window.toggleNavigationDebug = toggleDebugPanel;
})();
