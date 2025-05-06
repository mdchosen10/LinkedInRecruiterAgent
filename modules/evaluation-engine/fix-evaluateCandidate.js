#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'candidate-evaluation-engine.js');

// Read the file
let fileContent = fs.readFileSync(filePath, 'utf8');

// Find the evaluateCandidate method - the regex matches the method signature up to the closing brace of the method
const methodRegex = /\/\*\*\s+\*\s+Evaluate a candidate against job requirements[\s\S]*?async evaluateCandidate\(candidate, jobRequirements\)[\s\S]*?\n  \}/;

// Replace with the enhanced version
const enhancedMethod = `/**
   * Evaluate a candidate against job requirements
   * @param {Object} candidate - Structured candidate data
   * @param {Object} jobRequirements - Job requirements data
   * @returns {Promise<Object>} - Evaluation results
   */
  async evaluateCandidate(candidate, jobRequirements) {
    // Generate the evaluation prompt
    const prompt = this._generateEvaluationPrompt(candidate, jobRequirements);
    
    try {
      // Check if we have a CV path in the candidate data
      let cvAnalysisResults = null;
      if (candidate.cvPath && candidate.cvPath.trim() !== '') {
        try {
          // Lazy-load the CV analyzer
          const cvAnalyzer = require('./cv-analyzer-complete');
          
          // Extract structured data from the CV
          cvAnalysisResults = await cvAnalyzer.analyzeCV({
            cvPath: candidate.cvPath,
            jobRequirements: {
              skills: jobRequirements.requiredSkills.concat(jobRequirements.preferredSkills),
              certifications: jobRequirements.certifications || [],
              languages: jobRequirements.languages || []
            }
          });
          
          console.log('CV analysis results:', cvAnalysisResults);
        } catch (cvError) {
          console.error('Error analyzing CV:', cvError);
          // Continue with evaluation even if CV analysis fails
        }
      }
      
      // Enhance prompt with CV analysis results if available
      let enhancedPrompt = prompt;
      if (cvAnalysisResults) {
        enhancedPrompt += \`\\n\\n## CV Analysis Results
- Skill match score: \${cvAnalysisResults.score * 10}/10
- Matched skills: \${cvAnalysisResults.matched.skills.join(', ')}
- Unmatched skills: \${cvAnalysisResults.unmatched.skills.join(', ')}
- Matched certifications: \${cvAnalysisResults.matched.certifications.join(', ')}
- Matched languages: \${cvAnalysisResults.matched.languages.join(', ')}
\`;
      }
      
      // Call the Anthropic API for evaluation
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [
          { role: 'user', content: cvAnalysisResults ? enhancedPrompt : prompt }
        ],
        system: \`You are an expert recruiter and technical evaluator. Your task is to carefully evaluate the candidate against the provided job requirements.
                 Provide scores for each criterion on a scale of 0-10 with detailed justifications.
                 Your evaluation must be objective, thorough, and based strictly on the candidate's qualifications in relation to the job requirements.
                 Return your response in valid JSON format with scores, explanations, strengths, weaknesses, and a recommendation category.\`
      });
      
      // Parse the JSON response
      const resultText = message.content[0].text;
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const jsonString = resultText.substring(jsonStart, jsonEnd);
      
      const result = JSON.parse(jsonString);
      
      // Calculate overall score if not provided
      if (!result.overallScore) {
        let weightedScore = 0;
        for (const [criterion, weight] of Object.entries(this.criteriaWeights)) {
          if (result.scores[criterion]) {
            weightedScore += result.scores[criterion] * weight;
          }
        }
        result.overallScore = parseFloat(weightedScore.toFixed(2));
      }
      
      // If CV analysis is available, factor it into the scoring
      if (cvAnalysisResults) {
        const cvScore = cvAnalysisResults.score * 10; // Convert 0-1 to 0-10 scale
        // Blend the scores (70% AI evaluation, 30% CV analysis)
        result.overallScore = (result.overallScore * 0.7) + (cvScore * 0.3);
        result.overallScore = parseFloat(result.overallScore.toFixed(2));
        
        // Add CV analysis to the result
        result.cvAnalysis = {
          score: cvAnalysisResults.score,
          matchedSkills: cvAnalysisResults.matched.skills,
          unmatchedSkills: cvAnalysisResults.unmatched.skills,
          matchedCertifications: cvAnalysisResults.matched.certifications,
          matchedLanguages: cvAnalysisResults.matched.languages
        };
      }
      
      // Categorize candidate if not provided
      if (!result.category) {
        if (result.overallScore >= this.thresholds.interview) {
          result.category = 'interview directly';
        } else if (result.overallScore >= this.thresholds.video) {
          result.category = 'request video';
        } else {
          result.category = 'reject';
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error evaluating candidate:', error);
      throw new Error(\`Failed to evaluate candidate: \${error.message}\`);
    }
  }`;

// Replace the method in the file content
fileContent = fileContent.replace(methodRegex, enhancedMethod);

// Write the updated content back to the file
fs.writeFileSync(filePath, fileContent, 'utf8');

console.log('Successfully updated evaluateCandidate method');
