# Candidate Evaluation Engine

An AI-powered candidate evaluation tool that uses natural language processing to analyze resumes and LinkedIn profiles against job requirements. This engine provides detailed scoring, explanations, and candidate categorization to streamline your recruiting process.

## Features

- **Comprehensive Evaluation**: Analyzes candidates based on technical skills, experience, education, achievements, and culture fit
- **Detailed Scoring**: Provides scores on a 0-10 scale with in-depth explanations
- **Candidate Categorization**: Automatically sorts candidates into "interview directly," "request video," or "reject" categories
- **Customizable Criteria**: Adjust evaluation weights based on your priorities
- **Technical Deep-Dive**: Perform specialized technical skill assessments
- **Experience Analysis**: Evaluate the relevance and impact of previous roles
- **Interview Preparation**: Generate targeted follow-up questions based on evaluation results
- **Candidate Comparison**: Rank multiple candidates for more informed decisions

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/candidate-evaluation-engine.git
cd candidate-evaluation-engine

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Then edit .env to add your Anthropic API key
```

## Configuration

The engine can be configured with custom evaluation criteria weights and categorization thresholds:

```javascript
const evaluationEngine = new CandidateEvaluationEngine({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20240620', // Optional, this is the default
  criteriaWeights: {
    technicalSkills: 0.3,
    relevantExperience: 0.3,
    education: 0.15,
    cultureFit: 0.1,
    achievements: 0.15
  },
  thresholds: {
    interview: 8.0, // Min score for "interview directly" recommendation
    video: 6.0      // Min score for "request video" (below = reject)
  }
});
```

## Basic Usage

```javascript
// Prepare candidate data
const candidate = evaluationEngine.prepareCandidate(resumeText, linkedInProfileData);

// Define job requirements
const jobRequirements = {
  title: "Senior Full Stack Developer",
  description: "Detailed job description...",
  requiredSkills: ["JavaScript", "React", "Node.js", "SQL"],
  preferredSkills: ["AWS", "Docker", "GraphQL"],
  educationRequirements: "Bachelor's degree or equivalent experience",
  experienceRequirements: "5+ years of software development experience"
};

// Evaluate candidate
const evaluation = await evaluationEngine.evaluateCandidate(candidate, jobRequirements);

// Process results
console.log(`Overall Score: ${evaluation.overallScore}/10`);
console.log(`Recommendation: ${evaluation.category}`);
console.log(`Key Strengths: ${evaluation.strengths.join(', ')}`);
```

## Advanced Features

### Technical Skills Evaluation

```javascript
const technicalEvaluation = await evaluationEngine.evaluateTechnicalSkills(
  candidate,
  jobRequirements,
  ["React", "Node.js", "TypeScript"] // Focus technologies
);
```

### Experience Analysis

```javascript
const experienceEvaluation = await evaluationEngine.evaluateExperience(
  candidate,
  jobRequirements
);
```

### Generate Interview Questions

```javascript
const followUpQuestions = await evaluationEngine.generateFollowUpQuestions(
  evaluation,
  jobRequirements
);
```

### Rank Multiple Candidates

```javascript
const rankedCandidates = evaluationEngine.rankCandidates([
  candidateEvaluation1,
  candidateEvaluation2,
  candidateEvaluation3
]);
```

## Customizing Evaluation Criteria

You can update evaluation criteria weights dynamically:

```javascript
// Adjust weights for a technical role
evaluationEngine.updateCriteriaWeights({
  technicalSkills: 0.4,
  education: 0.1
});

// Adjust weights for a leadership role
evaluationEngine.updateCriteriaWeights({
  relevantExperience: 0.4,
  cultureFit: 0.2,
  technicalSkills: 0.2
});
```

## API Reference

### CandidateEvaluationEngine

#### Constructor

```javascript
constructor({
  apiKey,               // Anthropic API key (required)
  model,                // Model to use (default: 'claude-3-5-sonnet-20240620')
  criteriaWeights,      // Weights for evaluation criteria (optional)
  thresholds            // Score thresholds for categorization (optional)
})
```

#### Methods

- `prepareCandidate(resumeData, linkedInData)`: Formats candidate data for evaluation
- `evaluateCandidate(candidate, jobRequirements)`: Performs comprehensive evaluation
- `evaluateTechnicalSkills(candidate, jobRequirements, specificTechnologies)`: Evaluates technical proficiency
- `evaluateExperience(candidate, jobRequirements)`: Analyzes work history and impact
- `generateFollowUpQuestions(evaluation, jobRequirements)`: Creates targeted interview questions
- `rankCandidates(candidateEvaluations)`: Ranks and compares multiple candidates
- `updateCriteriaWeights(newWeights)`: Updates evaluation criteria weights
- `updateThresholds(newThresholds)`: Updates categorization thresholds

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch
```

## License

MIT License