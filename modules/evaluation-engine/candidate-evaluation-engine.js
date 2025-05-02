// CandidateEvaluationEngine.js
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

/**
 * CandidateEvaluationEngine
 * 
 * A comprehensive engine for evaluating job candidates based on their LinkedIn profiles
 * and resume data against job requirements.
 */
class CandidateEvaluationEngine {
  /**
   * Constructor for the CandidateEvaluationEngine
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Anthropic API key
   * @param {string} config.model - Model to use (default: 'claude-3-5-sonnet-20240620')
   * @param {Object} config.criteriaWeights - Weights for different evaluation criteria
   * @param {number} config.thresholds.interview - Score threshold for direct interview (default: 8.0)
   * @param {number} config.thresholds.video - Score threshold for video interview (default: 6.0)
   */
  constructor(config) {
    this.anthropic = new Anthropic({
      apiKey: config.apiKey
    });
    
    this.model = config.model || 'claude-3-5-sonnet-20240620';
    
    // Default criteria weights if not provided
    this.criteriaWeights = config.criteriaWeights || {
      technicalSkills: 0.3,
      relevantExperience: 0.3,
      education: 0.15,
      cultureFit: 0.1,
      achievements: 0.15
    };
    
    // Thresholds for categorization
    this.thresholds = {
      interview: config.thresholds?.interview || 8.0,
      video: config.thresholds?.video || 6.0
    };
    
    // Initialize prompt templates
    this.promptTemplates = {
      evaluation: fs.readFileSync(path.join(__dirname, 'prompts/evaluation-prompt.yaml'), 'utf8'),
      technical: fs.readFileSync(path.join(__dirname, 'prompts/technical-prompt.yaml'), 'utf8'),
      experience: fs.readFileSync(path.join(__dirname, 'prompts/experience-prompt.yaml'), 'utf8')
    };
  }
  
  /**
   * Generate the base evaluation prompt for a candidate
   * @param {Object} candidate - Candidate data
   * @param {Object} jobRequirements - Job requirements data
   * @returns {string} - Formatted prompt
   */
  _generateEvaluationPrompt(candidate, jobRequirements) {
    return this.promptTemplates.evaluation
      .replace('{{JOB_TITLE}}', jobRequirements.title)
      .replace('{{JOB_DESCRIPTION}}', jobRequirements.description)
      .replace('{{REQUIRED_SKILLS}}', jobRequirements.requiredSkills.join(', '))
      .replace('{{PREFERRED_SKILLS}}', jobRequirements.preferredSkills.join(', '))
      .replace('{{EDUCATION_REQUIREMENTS}}', jobRequirements.educationRequirements)
      .replace('{{EXPERIENCE_REQUIREMENTS}}', jobRequirements.experienceRequirements)
      .replace('{{RESUME_TEXT}}', candidate.resumeText)
      .replace('{{LINKEDIN_PROFILE}}', JSON.stringify(candidate.linkedInProfile, null, 2))
      .replace('{{CRITERIA_WEIGHTS}}', JSON.stringify(this.criteriaWeights, null, 2));
  }
  
  /**
   * Sanitize and structure candidate data for evaluation
   * @param {Object} resumeData - Raw resume data
   * @param {Object} linkedInData - Raw LinkedIn profile data
   * @returns {Object} - Structured candidate data
   */
  prepareCandidate(resumeData, linkedInData) {
    let resumeText = '';
    
    // Handle different resume formats
    if (typeof resumeData === 'string') {
      resumeText = resumeData;
    } else if (resumeData.text) {
      resumeText = resumeData.text;
    } else if (resumeData.sections) {
      // Structured resume data
      const sections = [];
      for (const section of resumeData.sections) {
        sections.push(`## ${section.title}`);
        sections.push(section.content);
      }
      resumeText = sections.join('\n\n');
    }
    
    // Clean and structure LinkedIn data
    const linkedInProfile = {
      name: linkedInData.name || 'N/A',
      headline: linkedInData.headline || 'N/A',
      about: linkedInData.about || 'N/A',
      experience: (linkedInData.experience || []).map(exp => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        description: exp.description || '',
        startDate: exp.startDate,
        endDate: exp.endDate
      })),
      education: (linkedInData.education || []).map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate
      })),
      skills: linkedInData.skills || [],
      certifications: linkedInData.certifications || [],
      recommendations: linkedInData.recommendations || []
    };
    
    return {
      resumeText,
      linkedInProfile
    };
  }
  
  /**
   * Evaluate a candidate against job requirements
   * @param {Object} candidate - Structured candidate data
   * @param {Object} jobRequirements - Job requirements data
   * @returns {Promise<Object>} - Evaluation results
   */
  async evaluateCandidate(candidate, jobRequirements) {
    // Generate the evaluation prompt
    const prompt = this._generateEvaluationPrompt(candidate, jobRequirements);
    
    try {
      // Call the Anthropic API for evaluation
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: `You are an expert recruiter and technical evaluator. Your task is to carefully evaluate the candidate against the provided job requirements.
                 Provide scores for each criterion on a scale of 0-10 with detailed justifications.
                 Your evaluation must be objective, thorough, and based strictly on the candidate's qualifications in relation to the job requirements.
                 Return your response in valid JSON format with scores, explanations, strengths, weaknesses, and a recommendation category.`
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
      throw new Error(`Failed to evaluate candidate: ${error.message}`);
    }
  }
  
  /**
   * Perform a deep technical evaluation of a candidate
   * @param {Object} candidate - Structured candidate data
   * @param {Object} jobRequirements - Job requirements data
   * @param {Array<string>} specificTechnologies - List of technologies to focus on
   * @returns {Promise<Object>} - Detailed technical evaluation
   */
  async evaluateTechnicalSkills(candidate, jobRequirements, specificTechnologies = []) {
    const prompt = this.promptTemplates.technical
      .replace('{{JOB_TITLE}}', jobRequirements.title)
      .replace('{{REQUIRED_SKILLS}}', jobRequirements.requiredSkills.join(', '))
      .replace('{{RESUME_TEXT}}', candidate.resumeText)
      .replace('{{LINKEDIN_SKILLS}}', JSON.stringify(candidate.linkedInProfile.skills))
      .replace('{{SPECIFIC_TECHNOLOGIES}}', specificTechnologies.join(', '));
    
    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: `You are an expert technical evaluator. Assess the candidate's technical skills in relation to the job requirements.
                 For each required and relevant skill, provide a score from 0-10, an explanation, and evidence from the candidate's resume or profile.
                 Return your response in valid JSON format.`
      });
      
      const resultText = message.content[0].text;
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const jsonString = resultText.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error evaluating technical skills:', error);
      throw new Error(`Failed to evaluate technical skills: ${error.message}`);
    }
  }
  
  /**
   * Evaluate a candidate's experience relevance
   * @param {Object} candidate - Structured candidate data
   * @param {Object} jobRequirements - Job requirements data
   * @returns {Promise<Object>} - Experience evaluation
   */
  async evaluateExperience(candidate, jobRequirements) {
    const prompt = this.promptTemplates.experience
      .replace('{{JOB_TITLE}}', jobRequirements.title)
      .replace('{{EXPERIENCE_REQUIREMENTS}}', jobRequirements.experienceRequirements)
      .replace('{{LINKEDIN_EXPERIENCE}}', JSON.stringify(candidate.linkedInProfile.experience))
      .replace('{{RESUME_TEXT}}', candidate.resumeText);
    
    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: `You are an expert in evaluating professional experience. Analyze the candidate's experience in relation to the job requirements.
                 Focus on role relevance, industry knowledge, accomplishments, and career progression.
                 Return your response in valid JSON format with scores and explanations.`
      });
      
      const resultText = message.content[0].text;
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const jsonString = resultText.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error evaluating experience:', error);
      throw new Error(`Failed to evaluate experience: ${error.message}`);
    }
  }
  
  /**
   * Update the criteria weights for evaluation
   * @param {Object} newWeights - New weights to set
   */
  updateCriteriaWeights(newWeights) {
    this.criteriaWeights = { ...this.criteriaWeights, ...newWeights };
    
    // Normalize weights to ensure they sum to 1
    const totalWeight = Object.values(this.criteriaWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      for (const criterion in this.criteriaWeights) {
        this.criteriaWeights[criterion] /= totalWeight;
      }
    }
  }
  
  /**
   * Update categorization thresholds
   * @param {Object} newThresholds - New thresholds to set
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
  
  /**
   * Get a list of recommended follow-up questions for a candidate
   * @param {Object} evaluation - Candidate evaluation result
   * @param {Object} jobRequirements - Job requirements
   * @returns {Promise<Array<string>>} - List of recommended questions
   */
  async generateFollowUpQuestions(evaluation, jobRequirements) {
    const prompt = `
    Based on the following candidate evaluation and job requirements, generate a list of 5 targeted follow-up questions for the interview stage.
    
    Job Title: ${jobRequirements.title}
    
    Evaluation Summary:
    ${JSON.stringify(evaluation, null, 2)}
    
    Focus your questions on:
    1. Areas where the candidate scored lower and needs further assessment
    2. Verifying claims from their resume that seem critical for the role
    3. Probing deeper into their strongest qualifications
    4. Assessing their fit for the team and company culture
    5. Determining their interest and motivation for this specific role
    
    For each question, provide:
    - The actual question
    - What you're trying to assess with this question
    - What a good answer might include
    `;
    
    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [
          { role: 'user', content: prompt }
        ],
        system: `You are an expert recruiter creating targeted interview questions. Generate insightful, specific questions based on the candidate evaluation.
                Return your response in valid JSON format with a questions array containing objects with the fields: question, rationale, and goodAnswerCriteria.`
      });
      
      const resultText = message.content[0].text;
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const jsonString = resultText.substring(jsonStart, jsonEnd);
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }
  
  /**
   * Compare multiple candidates and rank them
   * @param {Array<Object>} candidateEvaluations - Array of candidate evaluation results
   * @returns {Array<Object>} - Ranked list of candidates with comparison notes
   */
  rankCandidates(candidateEvaluations) {
    // Sort candidates by overall score in descending order
    const rankedCandidates = [...candidateEvaluations].sort((a, b) => b.overallScore - a.overallScore);
    
    // Add ranking and percentile information
    return rankedCandidates.map((candidate, index) => {
      const percentile = ((rankedCandidates.length - index) / rankedCandidates.length) * 100;
      
      return {
        ...candidate,
        rank: index + 1,
        percentile: Math.round(percentile),
        comparisonNotes: index === 0 
          ? 'Top candidate in this batch' 
          : `${(candidate.overallScore / rankedCandidates[0].overallScore * 100).toFixed(1)}% of top candidate's score`
      };
    });
  }
}

module.exports = CandidateEvaluationEngine;