// test/engine.test.js
const CandidateEvaluationEngine = require('../candidate-evaluation-engine');
const fs = require('fs').promises;
const path = require('path');

// Mock Anthropic client responses
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        messages: {
          create: jest.fn().mockImplementation(async ({ messages, system }) => {
            if (messages[0].content.includes('technical')) {
              return {
                content: [
                  {
                    text: `{
                      "technicalSkillsAssessment": [
                        {
                          "skill": "JavaScript",
                          "score": 8,
                          "confidenceLevel": "high",
                          "evidence": "6+ years of experience with JavaScript mentioned in resume",
                          "gaps": "No mention of specific JS frameworks",
                          "interviewQuestions": ["Can you explain your experience with modern JS features?"]
                        },
                        {
                          "skill": "React",
                          "score": 7,
                          "confidenceLevel": "high",
                          "evidence": "Built multiple React applications as mentioned in work experience",
                          "gaps": "No mention of React hooks knowledge",
                          "interviewQuestions": ["Tell me about a complex React component you built"]
                        }
                      ],
                      "overallTechnicalScore": 7.5,
                      "keyTechnicalStrengths": ["JavaScript", "React", "Node.js"],
                      "keyTechnicalWeaknesses": ["Limited AWS experience"],
                      "technicalVerificationNeeded": ["GraphQL knowledge", "AWS experience"]
                    }`
                  }
                ]
              };
            } else if (messages[0].content.includes('experience')) {
              return {
                content: [
                  {
                    text: `{
                      "experienceScores": {
                        "relevanceToPosition": 8,
                        "durationAndProgression": 7,
                        "achievementsAndImpact": 6,
                        "scopeAndScale": 7
                      },
                      "explanations": {
                        "relevanceToPosition": "The candidate has worked in similar roles",
                        "durationAndProgression": "Clear progression over 6 years",
                        "achievementsAndImpact": "Some achievements mentioned but lacking metrics",
                        "scopeAndScale": "Has worked in mid-sized companies"
                      },
                      "overallExperienceScore": 7.0,
                      "keyStrengths": ["Progressive responsibility", "Relevant technical work"],
                      "potentialRedFlags": ["Limited leadership experience"],
                      "interviewFocusAreas": ["Team management experience", "Project scope examples"]
                    }`
                  }
                ]
              };
            } else {
              return {
                content: [
                  {
                    text: `{
                      "scores": {
                        "technicalSkills": 8,
                        "relevantExperience": 7,
                        "education": 8,
                        "cultureFit": 7,
                        "achievements": 6
                      },
                      "explanations": {
                        "technicalSkills": "Strong technical background with required skills",
                        "relevantExperience": "Has worked in similar positions",
                        "education": "Relevant degree in Computer Science",
                        "cultureFit": "Values align with company culture",
                        "achievements": "Some achievements mentioned but limited metrics"
                      },
                      "strengths": [
                        "Strong technical skills",
                        "Relevant education",
                        "Progressive career growth"
                      ],
                      "weaknesses": [
                        "Limited leadership experience",
                        "Few quantifiable achievements"
                      ],
                      "overallScore": 7.4,
                      "category": "request video",
                      "recommendation": "Candidate shows promise but needs further assessment"
                    }`
                  }
                ]
              };
            }
          })
        }
      };
    })
  };
});

// Mock file system
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      readFile: jest.fn().mockImplementation((path, options) => {
        if (path.includes('evaluation.yaml')) {
          return Promise.resolve('Evaluation prompt template {{JOB_TITLE}}');
        } else if (path.includes('technical.yaml')) {
          return Promise.resolve('Technical prompt template {{JOB_TITLE}}');
        } else if (path.includes('experience.yaml')) {
          return Promise.resolve('Experience prompt template {{JOB_TITLE}}');
        }
        return Promise.resolve('');
      }),
      writeFile: jest.fn().mockResolvedValue(undefined)
    }
  };
});

describe('CandidateEvaluationEngine', () => {
  let engine;
  let sampleCandidate;
  let sampleJobRequirements;

  beforeEach(() => {
    // Initialize the engine with test configuration
    engine = new CandidateEvaluationEngine({
      apiKey: 'test-api-key',
      criteriaWeights: {
        technicalSkills: 0.3,
        relevantExperience: 0.3,
        education: 0.2,
        cultureFit: 0.1,
        achievements: 0.1
      },
      thresholds: {
        interview: 8.0,
        video: 6.0
      }
    });

    // Sample job requirements for testing
    sampleJobRequirements = {
      title: "Senior Developer",
      description: "We need a senior developer",
      requiredSkills: ["JavaScript", "React", "Node.js"],
      preferredSkills: ["AWS", "Docker"],
      educationRequirements: "Bachelor's degree",
      experienceRequirements: "5+ years of experience"
    };

    // Sample candidate data for testing
    sampleCandidate = {
      resumeText: "Sample resume with 6 years of experience in JavaScript and React",
      linkedInProfile: {
        name: "Test Candidate",
        headline: "Senior Developer",
        about: "Experienced developer",
        experience: [
          {
            title: "Senior Developer",
            company: "Test Company",
            duration: "3 years",
            description: "Led development of web applications"
          }
        ],
        education: [
          {
            school: "Test University",
            degree: "Bachelor's",
            field: "Computer Science"
          }
        ],
        skills: ["JavaScript", "React", "Node.js"]
      }
    };
  });

  test('should initialize with correct configuration', () => {
    expect(engine.model).toBe('claude-3-5-sonnet-20240620');
    expect(engine.criteriaWeights.technicalSkills).toBe(0.3);
    expect(engine.thresholds.interview).toBe(8.0);
  });

  test('should prepare candidate data correctly', () => {
    // Test with string resume
    const stringResume = "This is a simple resume";
    const preparedCandidate1 = engine.prepareCandidate(stringResume, sampleCandidate.linkedInProfile);
    expect(preparedCandidate1.resumeText).toBe(stringResume);
    expect(preparedCandidate1.linkedInProfile.name).toBe("Test Candidate");

    // Test with object resume with text property
    const objectResume = { text: "This is a resume in object format" };
    const preparedCandidate2 = engine.prepareCandidate(objectResume, sampleCandidate.linkedInProfile);
    expect(preparedCandidate2.resumeText).toBe(objectResume.text);

    // Test with sectioned resume
    const sectionedResume = {
      sections: [
        { title: "Experience", content: "Senior Developer at Test Company" },
        { title: "Education", content: "Bachelor's in Computer Science" }
      ]
    };
    const preparedCandidate3 = engine.prepareCandidate(sectionedResume, sampleCandidate.linkedInProfile);
    expect(preparedCandidate3.resumeText).toContain("## Experience");
    expect(preparedCandidate3.resumeText).toContain("## Education");
  });

  test('should generate evaluation prompt correctly', () => {
    const prompt = engine._generateEvaluationPrompt(sampleCandidate, sampleJobRequirements);
    expect(prompt).toContain('Senior Developer');
    expect(prompt).toContain('JavaScript');
  });

  test('should update criteria weights correctly', () => {
    engine.updateCriteriaWeights({
      technicalSkills: 0.5,
      education: 0.1
    });
    expect(engine.criteriaWeights.technicalSkills).toBe(0.5);
    expect(engine.criteriaWeights.education).toBe(0.1);
    expect(engine.criteriaWeights.relevantExperience).toBe(0.3);
  });

  test('should normalize weights when they don\'t sum to 1', () => {
    engine.updateCriteriaWeights({
      technicalSkills: 2,
      relevantExperience: 2,
      education: 1,
      cultureFit: 0.5,
      achievements: 0.5
    });
    
    const sum = Object.values(engine.criteriaWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });

  test('should evaluate candidate and return results', async () => {
    const result = await engine.evaluateCandidate(sampleCandidate, sampleJobRequirements);
    
    expect(result.scores.technicalSkills).toBe(8);
    expect(result.scores.relevantExperience).toBe(7);
    expect(result.overallScore).toBe(7.4);
    expect(result.category).toBe('request video');
    expect(result.strengths).toContain('Strong technical skills');
    expect(result.weaknesses).toContain('Limited leadership experience');
  });

  test('should evaluate technical skills', async () => {
    const result = await engine.evaluateTechnicalSkills(
      sampleCandidate, 
      sampleJobRequirements,
      ["JavaScript", "React"]
    );
    
    expect(result.overallTechnicalScore).toBe(7.5);
    expect(result.technicalSkillsAssessment[0].skill).toBe('JavaScript');
    expect(result.technicalSkillsAssessment[0].score).toBe(8);
    expect(result.keyTechnicalStrengths).toContain('JavaScript');
  });

  test('should evaluate experience', async () => {
    const result = await engine.evaluateExperience(sampleCandidate, sampleJobRequirements);
    
    expect(result.overallExperienceScore).toBe(7.0);
    expect(result.experienceScores.relevanceToPosition).toBe(8);
    expect(result.keyStrengths).toContain('Progressive responsibility');
  });

  test('should rank candidates correctly', () => {
    const candidateEvaluations = [
      {
        name: "Candidate A",
        overallScore: 8.5,
        strengths: ["Technical skills", "Leadership"]
      },
      {
        name: "Candidate B",
        overallScore: 7.2,
        strengths: ["Education", "Culture fit"]
      },
      {
        name: "Candidate C",
        overallScore: 9.0,
        strengths: ["Experience", "Technical skills"]
      }
    ];
    
    const ranked = engine.rankCandidates(candidateEvaluations);
    
    expect(ranked[0].name).toBe("Candidate C");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].name).toBe("Candidate A");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].name).toBe("Candidate B");
    expect(ranked[2].rank).toBe(3);
    
    // Check percentile calculation
    expect(ranked[0].percentile).toBe(100);
    expect(ranked[2].percentile).toBe(33);
    
    // Check comparison notes
    expect(ranked[0].comparisonNotes).toBe('Top candidate in this batch');
    expect(ranked[1].comparisonNotes).toContain('94.4% of top candidate\'s score');
  });

  test('should update thresholds correctly', () => {
    engine.updateThresholds({
      interview: 7.5,
      video: 5.0
    });
    
    expect(engine.thresholds.interview).toBe(7.5);
    expect(engine.thresholds.video).toBe(5.0);
  });

  test('should handle errors gracefully', async () => {
    // Mock an API failure
    const mockAnthropicClient = engine.anthropic;
    mockAnthropicClient.messages.create.mockImplementationOnce(() => {
      throw new Error('API error');
    });
    
    await expect(engine.evaluateCandidate(sampleCandidate, sampleJobRequirements))
      .rejects
      .toThrow('Failed to evaluate candidate: API error');
  });
});