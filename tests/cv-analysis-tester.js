/**
 * CV Analysis Tester
 * 
 * A simple tool to test CV analysis functionality.
 * Usage: node tests/cv-analysis-tester.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Import the CV analyzer module
let cvAnalyzer;
try {
  cvAnalyzer = require('../modules/evaluation-engine/cv-analyzer-complete');
  console.log('✅ CV analyzer module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load CV analyzer module:', error.message);
  process.exit(1);
}

// Test job requirements for different roles
const jobRequirements = {
  'software_engineer': {
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
    certifications: ['AWS Certified Developer', 'MongoDB Certified Developer'],
    languages: ['English', 'Spanish']
  },
  'frontend_developer': {
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Redux', 'TypeScript'],
    certifications: [],
    languages: ['English']
  },
  'backend_developer': {
    skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS'],
    certifications: ['AWS Certified Developer'],
    languages: ['English']
  },
  'creative_director': {
    skills: ['Adobe Creative Suite', 'Art Direction', 'Brand Strategy', 'Creative Leadership'],
    certifications: [],
    languages: ['English']
  }
};

// Initialize test data paths
const testDataDir = path.join(__dirname, 'test_data');
const outputDir = path.join(__dirname, 'test_output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('CV Analysis Tester Starting...');
  console.log('==============================');
  
  // Create test PDF from the text file if needed
  const testCVPath = path.join(testDataDir, 'test_cv.txt');
  
  if (!fs.existsSync(testCVPath)) {
    console.error(`❌ Test CV file not found at: ${testCVPath}`);
    process.exit(1);
  }
  
  // Mock the PDF extraction to use our text file for testing
  // This allows testing without requiring actual PDF parsing functionality
  const originalExtractTextFromPDF = cvAnalyzer.extractTextFromPDF;
  cvAnalyzer.extractTextFromPDF = async (filePath) => {
    console.log(`📄 Simulating PDF extraction from: ${filePath}`);
    // Instead of actual PDF parsing, we'll just read our text file
    return fs.readFileSync(testCVPath, 'utf8');
  };
  
  // Test against each job role
  for (const [role, requirements] of Object.entries(jobRequirements)) {
    console.log(`\n🧪 Testing CV against role: ${role}`);
    console.log('Requirements:', JSON.stringify(requirements, null, 2));
    
    try {
      console.log(`📊 Analyzing CV...`);
      const result = await cvAnalyzer.analyzeCV({
        cvPath: testCVPath, // We're mocking the extraction, so any path will work
        jobRequirements: requirements
      });
      
      // Calculate match percentage
      const totalSkills = requirements.skills.length;
      const matchedSkills = result.matched.skills.length;
      const matchPercentage = totalSkills ? Math.round((matchedSkills / totalSkills) * 100) : 0;
      
      console.log(`✅ Analysis complete. Score: ${result.score} (${matchPercentage}% skills match)`);
      console.log(`✓ Matched Skills (${result.matched.skills.length}):`, result.matched.skills.join(', '));
      console.log(`✗ Unmatched Skills (${result.unmatched.skills.length}):`, result.unmatched.skills.join(', '));
      
      if (requirements.certifications.length > 0) {
        console.log(`✓ Matched Certifications:`, result.matched.certifications.join(', '));
      }
      
      if (requirements.languages.length > 0) {
        console.log(`✓ Matched Languages:`, result.matched.languages.join(', '));
      }
      
      // Save result to output directory
      const outputPath = path.join(outputDir, `${role}_analysis.json`);
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`💾 Results saved to: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Analysis failed for role ${role}:`, error);
    }
  }
  
  // Restore original function if testing with real PDFs is needed later
  cvAnalyzer.extractTextFromPDF = originalExtractTextFromPDF;
  
  console.log('\n==============================');
  console.log('Testing complete!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});