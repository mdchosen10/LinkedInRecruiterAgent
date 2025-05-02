/**
 * Script to ensure React app is set up correctly
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UI_DIR = path.join(__dirname, 'modules/ui');
const APP_JS_PATH = path.join(UI_DIR, 'src/App.js');
const BUILD_DIR = path.join(UI_DIR, 'build');

console.log('Setting up React application...');

// Check if modules/ui/node_modules exists
if (!fs.existsSync(path.join(UI_DIR, 'node_modules'))) {
  console.log('Installing React dependencies...');
  try {
    execSync('npm install', { cwd: UI_DIR, stdio: 'inherit' });
    console.log('React dependencies installed successfully');
  } catch (error) {
    console.error('Failed to install React dependencies:', error.message);
    process.exit(1);
  }
}

// Check if App.js exists
if (!fs.existsSync(APP_JS_PATH)) {
  console.error('Error: App.js not found in modules/ui/src/');
  console.error('Please make sure your React application is set up correctly');
  process.exit(1);
}

// Try to build the React app
console.log('Building React application...');
try {
  execSync('npm run build', { cwd: UI_DIR, stdio: 'inherit' });
  console.log('React application built successfully');
} catch (error) {
  console.error('Failed to build React application:', error.message);
  process.exit(1);
}

// Verify the build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('Error: Build directory not found after build process');
  process.exit(1);
}

console.log('React setup complete! You can now run the application with "npm start"');