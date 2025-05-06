/**
 * LinkedIn Recruiter Agent - Test Runner
 * 
 * This script runs all the tests for the LinkedIn Recruiter Agent.
 * Usage: node tests/run-tests.js
 */

const path = require('path');
const fs = require('fs');
const colors = require('colors/safe');

// Ensure we have colors
colors.enable();

/**
 * Run a test file and report results
 * @param {string} testFile - Path to test file
 */
async function runTest(testFile) {
  const relativePath = path.relative(process.cwd(), testFile);
  console.log(colors.cyan(`\n==== Running test: ${relativePath} ====`));
  
  try {
    // Import and run the test
    const test = require(testFile);
    
    if (typeof test === 'function') {
      await test();
    } else if (typeof test.default === 'function') {
      await test.default();
    } else if (typeof test.run === 'function') {
      await test.run();
    } else {
      console.log(colors.yellow(`Warning: ${relativePath} doesn't export a runnable function.`));
    }
    
    console.log(colors.green(`✅ ${relativePath} completed successfully`));
    return true;
  } catch (error) {
    console.error(colors.red(`❌ ${relativePath} failed:`));
    console.error(colors.red(error.stack || error.message || error));
    return false;
  }
}

/**
 * Run a specific test or all tests in a directory
 * @param {string} testPath - Path to test file or directory
 * @returns {Promise<boolean>} - Whether all tests passed
 */
async function runTests(testPath) {
  try {
    const fullPath = path.resolve(process.cwd(), testPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(colors.red(`Error: Path ${fullPath} doesn't exist.`));
      return false;
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      // Run a single test file
      return await runTest(fullPath);
    } else if (stats.isDirectory()) {
      // Run all test files in the directory
      console.log(colors.cyan(`Running all tests in ${fullPath}...`));
      
      const files = fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.js') && file.includes('test'));
      
      if (files.length === 0) {
        console.log(colors.yellow(`No test files found in ${fullPath}`));
        return true;
      }
      
      let allPassed = true;
      let passedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const passed = await runTest(filePath);
        
        if (passed) {
          passedCount++;
        } else {
          allPassed = false;
        }
      }
      
      const resultColor = allPassed ? colors.green : colors.red;
      console.log(resultColor(`\nTest results: ${passedCount}/${files.length} tests passed.`));
      
      return allPassed;
    } else {
      console.error(colors.red(`Error: ${fullPath} is neither a file nor a directory.`));
      return false;
    }
  } catch (error) {
    console.error(colors.red('Test runner error:'), error);
    return false;
  }
}

// Main function to run tests
async function main() {
  console.log(colors.bold(colors.cyan('\n=== LinkedIn Recruiter Agent Test Runner ===')));
  
  const args = process.argv.slice(2);
  let testPath = path.join(__dirname); // Default to tests directory
  
  if (args.length > 0) {
    testPath = args[0];
  }
  
  const allPassed = await runTests(testPath);
  
  if (allPassed) {
    console.log(colors.bold(colors.green('\nAll tests passed!')));
    process.exit(0);
  } else {
    console.log(colors.bold(colors.red('\nSome tests failed!')));
    process.exit(1);
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main().catch(error => {
    console.error(colors.red('Unhandled error in test runner:'), error);
    process.exit(1);
  });
}