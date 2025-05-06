/**
 * Injection script to add the navigation fix to the Electron app
 * This script should be added to the main Electron process
 */

const path = require('path');
const fs = require('fs');

// Path to our navigation fix
const navigationFixPath = path.join(__dirname, 'navigation-fix.js');

// Function to inject the navigation fix
function injectNavigationFix(window) {
  console.log('Injecting navigation fix...');

  // Read the navigation fix script
  try {
    const navigationFixScript = fs.readFileSync(navigationFixPath, 'utf-8');
    
    // Inject the script after DOM is ready
    window.webContents.executeJavaScript(`
      (function() {
        // Create a script element
        const script = document.createElement('script');
        script.id = 'navigation-fix-script';
        script.textContent = ${JSON.stringify(navigationFixScript)};
        
        // Add the script to the document
        document.head.appendChild(script);
        
        // Log successful injection
        console.log('[INJECT] Navigation fix script injected successfully');
        
        // Return success
        return true;
      })();
    `)
    .then(result => {
      console.log('Navigation fix injection result:', result);
    })
    .catch(error => {
      console.error('Error injecting navigation fix script:', error);
    });
  } catch (error) {
    console.error('Error reading navigation fix script:', error);
  }
}

// Export the injection function
module.exports = { injectNavigationFix };
