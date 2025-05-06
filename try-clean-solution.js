/**
 * Try Clean Solution Script
 * This script helps you test the clean Electron bridge solution
 * without modifying your original index.js file.
 */

// Import required modules
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const originalIndexPath = path.join(__dirname, 'index.js');
const backupIndexPath = path.join(__dirname, 'index.js.backup');
const cleanIndexPath = path.join(__dirname, 'clean-index.js');

// Function to backup the original index.js
function backupOriginalIndex() {
  console.log('Backing up original index.js...');
  fs.copyFileSync(originalIndexPath, backupIndexPath);
  console.log('Backup created at:', backupIndexPath);
}

// Function to replace index.js with clean-index.js
function useCleanIndex() {
  console.log('Using clean-index.js instead of index.js...');
  fs.copyFileSync(cleanIndexPath, originalIndexPath);
  console.log('Replaced index.js with clean-index.js');
}

// Function to restore the original index.js
function restoreOriginalIndex() {
  console.log('Restoring original index.js...');
  fs.copyFileSync(backupIndexPath, originalIndexPath);
  console.log('Original index.js restored');
}

// Function to run the Electron app
function runElectronApp() {
  console.log('Starting Electron app...');
  
  const electronProcess = exec('npx electron .');
  
  electronProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  electronProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  electronProcess.on('close', (code) => {
    console.log(`Electron app exited with code ${code}`);
    
    // Restore original index.js when the app closes
    restoreOriginalIndex();
  });
  
  // Handle script termination
  process.on('SIGINT', () => {
    console.log('Script interrupted, restoring original index.js');
    restoreOriginalIndex();
    process.exit();
  });
}

// Main function to try the clean solution
function tryCleanSolution() {
  // First, check if the backup already exists
  if (fs.existsSync(backupIndexPath)) {
    console.log('Backup already exists, using it...');
  } else {
    // Create a backup of the original index.js
    backupOriginalIndex();
  }
  
  // Replace index.js with clean-index.js
  useCleanIndex();
  
  // Run the Electron app
  runElectronApp();
}

// Run the main function
tryCleanSolution();
