const fs = require('fs');
const path = require('path');

// Read the original file
const originalFilePath = path.join(__dirname, 'candidate-evaluation-engine.js');
const originalContent = fs.readFileSync(originalFilePath, 'utf8');

// Read the enhanced evaluateCandidate method
const enhancedMethodPath = path.join(__dirname, 'enhanced-evaluateCandidate.js');
const enhancedMethod = fs.readFileSync(enhancedMethodPath, 'utf8');

// Find the original evaluateCandidate method
const methodRegex = /async evaluateCandidate\(candidate, jobRequirements\) {[\s\S]*?}/;
const match = originalContent.match(methodRegex);

if (!match) {
  console.error('Could not find evaluateCandidate method in the original file!');
  process.exit(1);
}

// Replace the original method with the enhanced one
const updatedContent = originalContent.replace(methodRegex, enhancedMethod);

// Write the updated content back to the file
fs.writeFileSync(originalFilePath, updatedContent, 'utf8');

console.log('Successfully updated candidate-evaluation-engine.js with enhanced evaluateCandidate method.');

// Clean up the temporary file
fs.unlinkSync(enhancedMethodPath);
console.log('Cleaned up temporary files.');
