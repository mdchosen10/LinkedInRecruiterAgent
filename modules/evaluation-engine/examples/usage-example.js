// Initialize the evaluation engine
const evaluationEngine = new CandidateEvaluationEngine({
    apiKey: process.env.ANTHROPIC_API_KEY,
    criteriaWeights: {
      technicalSkills: 0.35,
      relevantExperience: 0.30,
      education: 0.15,
      cultureFit: 0.10,
      achievements: 0.10
    }
  });
  
  // Evaluate a candidate
  const evaluation = await evaluationEngine.evaluateCandidate(candidate, jobRequirements);
  
  // Check the result
  console.log(`Candidate score: ${evaluation.overallScore}/10`);
  console.log(`Recommendation: ${evaluation.category}`);
  console.log(`Strengths: ${evaluation.strengths.join(', ')}`);