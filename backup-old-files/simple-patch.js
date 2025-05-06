// Simple DOM patch for direct logout handling
console.log('Simple patch starting...');

// Add a very basic global click handler
document.addEventListener('click', function(event) {
  console.log('Click detected on:', event.target.tagName);
  
  try {
    // Check if this click is on or contains "Logout" text
    if (event.target.innerText && 
        event.target.innerText.indexOf('Logout') >= 0) {
      
      console.log('Logout text found in clicked element');
      
      // Directly perform logout
      if (window.api && window.api.clearCredentials) {
        console.log('Calling clearCredentials directly');
        window.api.clearCredentials()
          .then(function(res) {
            console.log('Logout successful');
            window.location.href = '#/login';
            window.location.reload();
          })
          .catch(function(err) {
            console.error('Logout error:', err);
            window.location.href = '#/login';
            window.location.reload();
          });
        
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
    
    // Also check parents for logout text
    let parent = event.target.parentElement;
    while (parent) {
      if (parent.innerText && parent.innerText.indexOf('Logout') >= 0) {
        console.log('Logout text found in parent element');
        
        // Directly perform logout
        if (window.api && window.api.clearCredentials) {
          console.log('Calling clearCredentials directly from parent handler');
          window.api.clearCredentials()
            .then(function(res) {
              console.log('Logout successful');
              window.location.href = '#/login';
              window.location.reload();
            })
            .catch(function(err) {
              console.error('Logout error:', err);
              window.location.href = '#/login';
              window.location.reload();
            });
          
          // Prevent default behavior
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
      
      parent = parent.parentElement;
    }
    
  } catch (err) {
    console.error('Error in click handler:', err);
  }
}, true); // Use capture phase

// Also handle the Logout button directly from DOM once it's loaded
setTimeout(function() {
  try {
    // Find element with Logout text using various methods
    var logoutElement = null;
    
    // Method 1: Use innerText (most reliable)
    var allElements = document.getElementsByTagName('*');
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.innerText && el.innerText === 'Logout') {
        logoutElement = el;
        console.log('Found logout element via innerText', el.tagName);
        break;
      }
    }
    
    // Method 2: Find the P user element
    if (!logoutElement) {
      var userElement = document.querySelector('.text-sm.font-medium.text-gray-700');
      if (userElement && userElement.parentElement) {
        // Usually the logout is the next element
        var siblings = userElement.parentElement.children;
        for (var j = 0; j < siblings.length; j++) {
          if (siblings[j].innerText && siblings[j].innerText.indexOf('Logout') >= 0) {
            logoutElement = siblings[j];
            console.log('Found logout element via sibling search', siblings[j].tagName);
            break;
          }
        }
      }
    }
    
    if (logoutElement) {
      console.log('Attaching direct handler to logout element');
      
      // Override click behavior
      logoutElement.onclick = function(e) {
        console.log('Direct logout handler fired');
        e.preventDefault();
        e.stopPropagation();
        
        if (window.api && window.api.clearCredentials) {
          window.api.clearCredentials()
            .then(function() {
              window.location.href = '#/login';
              window.location.reload();
            })
            .catch(function() {
              window.location.href = '#/login';
              window.location.reload();
            });
        } else {
          window.location.href = '#/login';
          window.location.reload();
        }
        
        return false;
      };
      
      // Also try adding as direct event listener
      logoutElement.addEventListener('click', function(e) {
        console.log('Direct addEventListener handler fired');
        e.preventDefault();
        e.stopPropagation();
        
        if (window.api && window.api.clearCredentials) {
          window.api.clearCredentials()
            .then(function() {
              window.location.href = '#/login';
              window.location.reload();
            })
            .catch(function() {
              window.location.href = '#/login';
              window.location.reload();
            });
        } else {
          window.location.href = '#/login';
          window.location.reload();
        }
        
        return false;
      }, true);
      
      console.log('Direct handlers attached to logout element');
    } else {
      console.log('No logout element found yet, will try again later');
      
      // Try again after another second
      setTimeout(arguments.callee, 1000);
    }
  } catch (err) {
    console.error('Error setting up logout handlers:', err);
  }
}, 2000);

console.log('Simple patch installed');
