const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

class CandidateEvaluationEngine {
  constructor(config) {
    this.anthropic = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-3-5-sonnet-20240620';

    this.criteriaWeights = config.criteriaWeights || {
      technicalSkills: 0.3,
      relevantExperience: 0.3,
      education: 0.15,
      cultureFit: 0.1,
      achievements: 0.15,
    };

    this.thresholds = {
      interview: config.thresholds?.interview || 8.0,
      video: config.thresholds?.video || 6.0,
    };

    this.promptTemplates = {
      evaluation: fs.readFileSync(path.join(__dirname, 'prompts/evaluation-prompt.yaml'), 'utf8'),
      technical: fs.readFileSync(path.join(__dirname, 'prompts/technical-prompt.yaml'), 'utf8'),
      experience: fs.readFileSync(path.join(__dirname, 'prompts/experience-prompt.yaml'), 'utf8'),
    };
  }

  _generateEvaluationPrompt(candidate, job) {
    return this.promptTemplates.evaluation
      .replace('{{JOB_TITLE}}', job.title)
      .replace('{{JOB_DESCRIPTION}}', job.description)
      .replace('{{REQUIRED_SKILLS}}', job.requiredSkills.join(', '))
      .replace('{{PREFERRED_SKILLS}}', job.preferredSkills.join(', '))
      .replace('{{EDUCATION_REQUIREMENTS}}', job.educationRequirements)
      .replace('{{EXPERIENCE_REQUIREMENTS}}', job.experienceRequirements)
      .replace('{{RESUME_TEXT}}', candidate.resumeText)
      .replace('{{LINKEDIN_PROFILE}}', JSON.stringify(candidate.linkedInProfile, null, 2))
      .replace('{{CRITERIA_WEIGHTS}}', JSON.stringify(this.criteriaWeights, null, 2));
  }

  prepareCandidate(resumeData, linkedInData) {
    let resumeText = typeof resumeData === 'string'
      ? resumeData
      : resumeData.text || resumeData.sections?.map(sec => `## ${sec.title}\n${sec.content}`).join('\n\n') || '';

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
        endDate: exp.endDate,
      })),
      education: (linkedInData.education || []).map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      skills: linkedInData.skills || [],
      certifications: linkedInData.certifications || [],
      recommendations: linkedInData.recommendations || [],
    };

    return { resumeText, linkedInProfile };
  }

  async evaluateCandidate(candidate, job) {
    let prompt = this._generateEvaluationPrompt(candidate, job);
    let cvResults = null;

    // Optionally enhance with CV analysis
    if (candidate.cvPath) {
      try {
        const cvAnalyzer = require('./cv-analyzer-complete');
        cvResults = await cvAnalyzer.analyzeCV({
          cvPath: candidate.cvPath,
          jobRequirements: {
            skills: job.requiredSkills.concat(job.preferredSkills),
            certifications: job.certifications || [],
            languages: job.languages || [],
          },
        });

        prompt += `\n\n## CV Analysis Results
- Skill match score: ${cvResults.score * 10}/10
- Matched skills: ${cvResults.matched.skills.join(', ')}
- Unmatched skills: ${cvResults.unmatched.skills.join(', ')}
- Matched certifications: ${cvResults.matched.certifications.join(', ')}
- Matched languages: ${cvResults.matched.languages.join(', ')}
`;
      } catch (err) {
        console.error('CV Analyzer failed:', err.message);
      }
    }

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        system: `You are an expert recruiter and technical evaluator. Evaluate the candidate based on the job description.
                 Return valid JSON with individual scores, explanations, strengths, weaknesses, and a category recommendation.`,
      });

      const raw = message.content[0].text;
      const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

      if (!json.overallScore) {
        json.overallScore = parseFloat(
          Object.entries(this.criteriaWeights).reduce((sum, [k, w]) =>
            sum + (json.scores[k] || 0) * w, 0
          ).toFixed(2)
        );
      }

      if (cvResults) {
        const cvScore = cvResults.score * 10;
        json.overallScore = parseFloat(((json.overallScore * 0.7) + (cvScore * 0.3)).toFixed(2));
        json.cvAnalysis = {
          score: cvResults.score,
          matchedSkills: cvResults.matched.skills,
          unmatchedSkills: cvResults.unmatched.skills,
          matchedCertifications: cvResults.matched.certifications,
          matchedLanguages: cvResults.matched.languages,
        };
      }

      if (!json.category) {
        json.category = json.overallScore >= this.thresholds.interview
          ? 'interview directly'
          : json.overallScore >= this.thresholds.video
            ? 'request video'
            : 'reject';
      }

      return json;
    } catch (err) {
      console.error('Evaluation failed:', err.message);
      throw new Error(`Evaluation error: ${err.message}`);
    }
  }

  async evaluateTechnicalSkills(candidate, job, specificTechs = []) {
    const prompt = this.promptTemplates.technical
      .replace('{{JOB_TITLE}}', job.title)
      .replace('{{REQUIRED_SKILLS}}', job.requiredSkills.join(', '))
      .replace('{{RESUME_TEXT}}', candidate.resumeText)
      .replace('{{LINKEDIN_SKILLS}}', JSON.stringify(candidate.linkedInProfile.skills))
      .replace('{{SPECIFIC_TECHNOLOGIES}}', specificTechs.join(', '));

    return this._callLLM(prompt, `You are a technical evaluator. Provide scores and evidence in JSON.`);
  }

  async evaluateExperience(candidate, job) {
    const prompt = this.promptTemplates.experience
      .replace('{{JOB_TITLE}}', job.title)
      .replace('{{EXPERIENCE_REQUIREMENTS}}', job.experienceRequirements)
      .replace('{{LINKEDIN_EXPERIENCE}}', JSON.stringify(candidate.linkedInProfile.experience))
      .replace('{{RESUME_TEXT}}', candidate.resumeText);

    return this._callLLM(prompt, `You are an expert in evaluating professional experience. Output JSON.`);
  }

  async generateFollowUpQuestions(evaluation, job) {
    const prompt = `
    Based on this evaluation and job:
    Evaluation: ${JSON.stringify(evaluation, null, 2)}
    Job Title: ${job.title}

    Generate 5 follow-up interview questions as JSON:
    - question
    - rationale
    - goodAnswerCriteria
    `;

    return this._callLLM(prompt, `You are an expert recruiter. Return JSON format.`);
  }

  async _callLLM(prompt, systemInstruction) {
    try {
      const msg = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        system: systemInstruction,
      });

      const raw = msg.content[0].text;
      return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    } catch (err) {
      console.error('LLM call failed:', err.message);
      throw new Error(`LLM Error: ${err.message}`);
    }
  }

  updateCriteriaWeights(newWeights) {
    this.criteriaWeights = { ...this.criteriaWeights, ...newWeights };
    const total = Object.values(this.criteriaWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.01) {
      for (const key in this.criteriaWeights) {
        this.criteriaWeights[key] /= total;
      }
    }
  }

  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  rankCandidates(candidates) {
    const ranked = [...candidates].sort((a, b) => b.overallScore - a.overallScore);
    return ranked.map((c, i) => ({
      ...c,
      rank: i + 1,
      percentile: Math.round(((ranked.length - i) / ranked.length) * 100),
      comparisonNotes: i === 0
        ? 'Top candidate in this batch'
        : `${(c.overallScore / ranked[0].overallScore * 100).toFixed(1)}% of top score`,
    }));
  }
}

module.exports = CandidateEvaluationEngine;
