import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // Use HashRouter instead of BrowserRouter for Electron
import './assets/styles/index.css';
import App from './App';
import { AuthProvider } from './contexts/auth-context';
import { DataProvider } from './contexts/data-context';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  
  // Check if root element exists
  let rootElement = document.getElementById('root');
  
  // Create it if it doesn't exist
  if (!rootElement) {
    console.log('Root element not found, creating one');
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  try {
    console.log('Initializing React app');
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <HashRouter> {/* Change to HashRouter for better Electron compatibility */}
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </HashRouter>
    );
    console.log('React render completed');
  } catch (error) {
    console.error('React initialization error:', error);
    
    // Display error message in DOM
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1 style="color: #e53e3e;">React Error</h1>
        <p>${error.message}</p>
        <pre style="background: #f7fafc; padding: 15px; border-radius: 5px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
});