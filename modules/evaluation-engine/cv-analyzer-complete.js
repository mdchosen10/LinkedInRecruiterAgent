const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const EventEmitter = require('events');

// We'll need to install mammoth.js: 
// npm install mammoth --save
// For Word document parsing
let mammoth;
try {
  mammoth = require('mammoth');
} catch (error) {
  console.warn('Warning: mammoth.js is not installed. DOCX file extraction will not work.');
  console.warn('Run "npm install mammoth --save" to enable DOCX support.');
}

// Create event emitter for progress reporting
const cvAnalyzerEvents = new EventEmitter();

// ------------------------------------------
// Utility: Extract raw text from PDF file
// ------------------------------------------
async function extractTextFromPDF(filePath, progressCallback) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    // Set up options with callback for tracking progress
    const options = {};
    if (progressCallback) {
      options.onProgress = (progress) => {
        progressCallback({
          stage: 'pdf_extraction',
          progress: Math.round(progress.pageIndex / progress.pagesCount * 100),
          pageIndex: progress.pageIndex,
          pagesCount: progress.pagesCount
        });
      };
    }
    
    // Emit start event
    cvAnalyzerEvents.emit('extraction:start', { type: 'pdf', path: filePath });
    
    const pdfData = await pdfParse(dataBuffer, options);
    
    // Emit completion event
    cvAnalyzerEvents.emit('extraction:complete', { 
      type: 'pdf', 
      path: filePath,
      pageCount: pdfData.numpages,
      textLength: pdfData.text.length
    });
    
    return pdfData.text;
  } catch (err) {
    // Emit error event
    cvAnalyzerEvents.emit('extraction:error', { 
      type: 'pdf', 
      path: filePath,
      error: err.message
    });
    
    console.error('Error parsing PDF:', err);
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
}

// ------------------------------------------
// Utility: Extract raw text from DOCX file
// ------------------------------------------
async function extractTextFromDOCX(filePath, progressCallback) {
  try {
    if (!mammoth) {
      throw new Error('mammoth.js is not installed. Run "npm install mammoth --save" to enable DOCX support.');
    }
    
    // Emit start event
    cvAnalyzerEvents.emit('extraction:start', { type: 'docx', path: filePath });
    
    if (progressCallback) {
      progressCallback({
        stage: 'docx_extraction',
        progress: 10,
        status: 'Reading file'
      });
    }
    
    const result = await mammoth.extractRawText({
      path: filePath,
      transformDocument: (document) => {
        // This is where we could add progress tracking for DOCX
        // (mammoth doesn't have built-in progress reporting)
        if (progressCallback) {
          progressCallback({
            stage: 'docx_extraction',
            progress: 50,
            status: 'Processing document'
          });
        }
        return document;
      }
    });
    
    // Emit completion event
    cvAnalyzerEvents.emit('extraction:complete', { 
      type: 'docx', 
      path: filePath,
      textLength: result.value.length
    });
    
    if (progressCallback) {
      progressCallback({
        stage: 'docx_extraction',
        progress: 100,
        status: 'Extraction complete'
      });
    }
    
    return result.value;
  } catch (err) {
    // Emit error event
    cvAnalyzerEvents.emit('extraction:error', { 
      type: 'docx', 
      path: filePath,
      error: err.message
    });
    
    console.error('Error parsing DOCX:', err);
    throw new Error(`DOCX extraction failed: ${err.message}`);
  }
}

// ------------------------------------------
// Utility: Extract text from CV file (PDF/DOCX)
// ------------------------------------------
async function extractTextFromCV(filePath, progressCallback) {
  // Determine file type by extension
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    return extractTextFromPDF(filePath, progressCallback);
  } else if (ext === '.docx') {
    return extractTextFromDOCX(filePath, progressCallback);
  } else {
    const error = `Unsupported file format: ${ext}. Only PDF and DOCX are supported.`;
    cvAnalyzerEvents.emit('extraction:error', { error });
    throw new Error(error);
  }
}

// ------------------------------------------
// Utility: Break raw CV text into sections with improved detection
// ------------------------------------------
function identifySections(cvText) {
  // Define industry-specific section patterns for creative roles
  const sectionPatterns = {
    // Core sections found in most CVs
    experience: /(?:work|professional|employment)\s+(?:experience|history)|experience|employment/i,
    education: /education(?:\s+(?:and|&)\s+training)?|qualifications|academic\s+background/i,
    skills: /(?:technical|key|core|professional)?\s*skills(?:\s+(?:and|&)\s+(?:expertise|abilities|competencies))?|competencies|expertise/i,
    certifications: /certifications|certificates|credentials|accreditations/i,
    languages: /languages|language\s+proficiency|foreign\s+languages/i,
    
    // Creative industry specific sections
    portfolio: /portfolio|creative\s+work|projects|works|exhibitions/i,
    designSkills: /design\s+skills|design\s+tools|software\s+proficiency|tools\s+&\s+technologies/i,
    achievements: /achievements|awards|honors|recognitions|accomplishments/i,
    publications: /publications|published\s+works|articles|writing\s+samples/i,
    clientList: /clients|client\s+list|client\s+experience|brands\s+worked\s+with/i
  };
  
  const lines = cvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const sections = {};
  let currentSection = 'summary'; // default section for text at the beginning
  
  // Initialize summary section
  sections[currentSection] = [];
  
  // Helper function to check if a line is a section header
  const isSectionHeader = (line) => {
    // Typical section headers are short and may be all uppercase or title case
    const isShort = line.length < 60;
    const isProminentFormat = line === line.toUpperCase() || /^[A-Z][a-z]/.test(line);
    
    // Check if the line matches any of our section patterns
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line)) {
        return sectionName;
      }
    }
    
    // Additional heuristics for section detection:
    // 1. Line ends with a colon
    // 2. Line is all uppercase and short
    // 3. Line has specific formatting (like a trailing line of dashes)
    if ((isShort && isProminentFormat) || line.endsWith(':') || /^[\s-_=]{3,}$/.test(line)) {
      // This looks like a section header, but doesn't match our patterns
      // Use a generic section name based on the text
      const cleanText = line.replace(/[:_\-=]/g, '').trim().toLowerCase();
      return cleanText || 'unknown_section';
    }
    
    return null;
  };
  
  // Process each line
  for (const line of lines) {
    const sectionName = isSectionHeader(line);
    
    if (sectionName) {
      // This is a new section header
      currentSection = sectionName;
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      // Don't add the header itself to the section content
    } else {
      // This is content for the current section
      sections[currentSection].push(line);
    }
  }
  
  // Clean up: remove empty sections
  for (const section in sections) {
    if (sections[section].length === 0) {
      delete sections[section];
    }
  }
  
  // Normalize section names by grouping similar sections
  const normalizedSections = {};
  
  // Define section name mappings
  const sectionMapping = {
    'experience': ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
    'education': ['education', 'academic background', 'qualifications', 'educational background'],
    'skills': ['skills', 'technical skills', 'professional skills', 'key skills', 'core competencies', 'expertise'],
    'designSkills': ['design skills', 'design tools', 'software proficiency', 'technical proficiency'],
    'certifications': ['certifications', 'certificates', 'credentials', 'accreditations', 'licenses'],
    'languages': ['languages', 'language proficiency', 'foreign languages'],
    'portfolio': ['portfolio', 'creative work', 'projects', 'works', 'exhibitions'],
    'achievements': ['achievements', 'awards', 'honors', 'recognitions', 'accomplishments'],
    'publications': ['publications', 'published works', 'articles', 'writing samples'],
    'clientList': ['clients', 'client list', 'client experience', 'brands worked with']
  };
  
  // Try to map each section to a normalized name
  for (const section in sections) {
    let mapped = false;
    for (const [normalizedName, variations] of Object.entries(sectionMapping)) {
      // Check if the section name or a fuzzy match is in the variations
      if (variations.some(v => section.toLowerCase().includes(v.toLowerCase()))) {
        if (!normalizedSections[normalizedName]) {
          normalizedSections[normalizedName] = [];
        }
        normalizedSections[normalizedName].push(...sections[section]);
        mapped = true;
        break;
      }
    }
    
    // If no mapping was found, keep the original section name
    if (!mapped) {
      normalizedSections[section] = sections[section];
    }
  }
  
  return normalizedSections;
}

// ------------------------------------------
// Extract known skills from a given text block
// ------------------------------------------
function extractSkills(sectionLines, knownSkills, additionalPatterns = []) {
  const extracted = new Set();
  const tokenizer = new natural.WordTokenizer();
  const textBlob = sectionLines.join(' ').toLowerCase();
  
  // Helper function to check if a skill is mentioned in text
  const hasSkill = (skill, text) => {
    const skillLower = skill.toLowerCase();
    
    // Direct match
    if (text.includes(skillLower)) {
      return true;
    }
    
    // Pattern matching for complex skills
    if (additionalPatterns.length > 0) {
      for (const pattern of additionalPatterns) {
        if (pattern.source.toLowerCase().includes(skillLower) && pattern.test(text)) {
          return true;
        }
      }
    }
    
    // For multi-word skills, check individual words in a sequence
    if (skillLower.includes(' ')) {
      const skillWords = skillLower.split(' ');
      let foundCount = 0;
      let lastIndex = -1;
      
      for (const word of skillWords) {
        const index = text.indexOf(word, lastIndex + 1);
        if (index > lastIndex) {
          foundCount++;
          lastIndex = index;
        } else {
          break;
        }
      }
      
      if (foundCount === skillWords.length) {
        return true;
      }
    }
    
    return false;
  };
  
  // Check for each known skill
  knownSkills.forEach(skill => {
    if (hasSkill(skill, textBlob)) {
      extracted.add(skill);
    }
  });
  
  // Additional skill extraction using NLP techniques
  // This could include named entity recognition or custom extractors
  // for industry-specific terminology
  
  // For now, we're keeping it simple with direct matching
  
  return Array.from(extracted);
}

// ------------------------------------------
// Match candidate's skills against job requirements
// ------------------------------------------
function matchSkills(candidateSkills, jobSkills) {
  const matched = [];
  const unmatched = [];
  
  // Normalize skills for better matching
  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());
  
  // Check each job skill
  jobSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    let isMatched = false;
    
    // Direct match
    if (normalizedCandidateSkills.includes(skillLower)) {
      isMatched = true;
    } else {
      // Check for fuzzy matches (e.g., "Javascript" vs "JavaScript")
      for (const candidateSkill of normalizedCandidateSkills) {
        // Calculate similarity using Levenshtein distance
        const distance = natural.LevenshteinDistance(candidateSkill, skillLower);
        const maxLength = Math.max(candidateSkill.length, skillLower.length);
        const similarity = 1 - (distance / maxLength);
        
        // Consider it a match if similarity is high enough
        if (similarity > 0.8) {
          isMatched = true;
          break;
        }
        
        // Check if one skill contains the other
        if (candidateSkill.includes(skillLower) || skillLower.includes(candidateSkill)) {
          isMatched = true;
          break;
        }
      }
    }
    
    if (isMatched) {
      matched.push(skill);
    } else {
      unmatched.push(skill);
    }
  });
  
  return { matched, unmatched };
}

// ------------------------------------------
// Extract certifications from a section
// ------------------------------------------
function extractCertifications(sectionLines, knownCerts) {
  const certs = new Set();
  const textBlob = sectionLines.join(' ').toLowerCase();
  
  // Check for known certifications
  knownCerts.forEach(cert => {
    const certLower = cert.toLowerCase();
    if (textBlob.includes(certLower)) {
      certs.add(cert);
    }
  });
  
  // Look for certification patterns
  const certPatterns = [
    /certified\s+[\w\s]+/gi,
    /certification\s+in\s+[\w\s]+/gi,
    /[\w\s]+\s+certification/gi,
    /[\w\s]+\s+certificate/gi
  ];
  
  certPatterns.forEach(pattern => {
    const matches = textBlob.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Check if this match is similar to any known cert
        for (const knownCert of knownCerts) {
          const similarity = 1 - (natural.LevenshteinDistance(match, knownCert.toLowerCase()) / 
            Math.max(match.length, knownCert.length));
          
          if (similarity > 0.7) {
            certs.add(knownCert);
            break;
          }
        }
      });
    }
  });
  
  return Array.from(certs);
}

// ------------------------------------------
// Extract languages from a section
// ------------------------------------------
function extractLanguages(sectionLines, languageList) {
  const found = new Set();
  const textBlob = sectionLines.join(' ').toLowerCase();
  
  // Check for known languages
  languageList.forEach(lang => {
    const langLower = lang.toLowerCase();
    if (textBlob.includes(langLower)) {
      found.add(lang);
    }
  });
  
  // Look for language proficiency patterns
  const langPatterns = [
    /(?:fluent|native|bilingual|proficient|basic|intermediate|advanced)\s+(?:in\s+)?([a-z]+)/gi,
    /([a-z]+)(?:\s+language)?(?:\s*:)?\s*(?:fluent|native|bilingual|proficient|basic|intermediate|advanced)/gi
  ];
  
  langPatterns.forEach(pattern => {
    const matches = textBlob.matchAll(pattern);
    if (matches) {
      for (const match of matches) {
        const langCandidate = match[1].trim();
        
        // Check if this candidate is in our language list
        for (const knownLang of languageList) {
          const similarity = 1 - (natural.LevenshteinDistance(langCandidate, knownLang.toLowerCase()) / 
            Math.max(langCandidate.length, knownLang.length));
          
          if (similarity > 0.8) {
            found.add(knownLang);
            break;
          }
        }
      }
    }
  });
  
  return Array.from(found);
}

// ------------------------------------------
// Calculate score based on matched elements
// ------------------------------------------
function calculateScore({
  matchedSkills,
  totalJobSkills,
  matchedCerts,
  totalCerts,
  matchedLangs,
  totalLangs
}) {
  // Weight each category
  const weights = {
    skills: 0.7,      // Skills are most important
    certs: 0.2,       // Certifications are moderately important
    langs: 0.1        // Languages are least important
  };
  
  // Calculate category scores
  const skillScore = totalJobSkills.length > 0 ? matchedSkills.length / totalJobSkills.length : 0;
  const certScore = totalCerts.length > 0 ? matchedCerts.length / totalCerts.length : 1; // If no certs required, score is 1
  const langScore = totalLangs.length > 0 ? matchedLangs.length / totalLangs.length : 1; // If no langs required, score is 1
  
  // Compute weighted average
  const totalScore = (skillScore * weights.skills) + 
                     (certScore * weights.certs) + 
                     (langScore * weights.langs);
  
  return parseFloat(totalScore.toFixed(2));
}

// ------------------------------------------
// Main handler function
// ------------------------------------------
async function analyzeCV({
  cvPath,
  jobRequirements, // { skills: [], certifications: [], languages: [] }
  progressCallback
}) {
  try {
    // Start analysis and report progress
    if (progressCallback) {
      progressCallback({
        stage: 'starting',
        progress: 0,
        message: 'Starting CV analysis'
      });
    }
    
    // Extract text from CV file
    const text = await extractTextFromCV(cvPath, progressCallback);
    
    if (progressCallback) {
      progressCallback({
        stage: 'extraction_complete',
        progress: 25,
        message: 'Text extraction complete',
        textLength: text.length
      });
    }
    
    // Identify sections in the CV
    const sections = identifySections(text);
    
    if (progressCallback) {
      progressCallback({
        stage: 'sections_identified',
        progress: 50,
        message: 'CV sections identified',
        sectionCount: Object.keys(sections).length
      });
    }
    
    // Extract relevant data from each section
    const skillsSection = sections['skills'] || [];
    const techSkillsSection = sections['designSkills'] || [];
    const certsSection = sections['certifications'] || [];
    const langSection = sections['languages'] || [];
    
    // Combine all sections that might contain skills
    const allSkillSections = [
      ...skillsSection,
      ...techSkillsSection,
      ...(sections['summary'] || []),
      ...(sections['experience'] || [])
    ];
    
    // Extract skills
    const candidateSkills = extractSkills(allSkillSections, jobRequirements.skills);
    
    if (progressCallback) {
      progressCallback({
        stage: 'skills_extracted',
        progress: 75,
        message: 'Skills extracted',
        skillCount: candidateSkills.length
      });
    }
    
    // Extract other requirements
    const candidateCerts = extractCertifications(certsSection, jobRequirements.certifications);
    const candidateLangs = extractLanguages(langSection, jobRequirements.languages);
    
    // Match against job requirements
    const { matched: matchedSkills, unmatched: unmatchedSkills } = 
      matchSkills(candidateSkills, jobRequirements.skills);
    
    const { matched: matchedCerts, unmatched: unmatchedCerts } = 
      matchSkills(candidateCerts, jobRequirements.certifications);
    
    const { matched: matchedLangs, unmatched: unmatchedLangs } = 
      matchSkills(candidateLangs, jobRequirements.languages);
    
    // Calculate score
    const score = calculateScore({
      matchedSkills,
      totalJobSkills: jobRequirements.skills,
      matchedCerts,
      totalCerts: jobRequirements.certifications,
      matchedLangs, 
      totalLangs: jobRequirements.languages
    });
    
    if (progressCallback) {
      progressCallback({
        stage: 'analysis_complete',
        progress: 100,
        message: 'CV analysis complete',
        score
      });
    }
    
    // Return analysis result
    return {
      score,
      matched: {
        skills: matchedSkills,
        certifications: matchedCerts,
        languages: matchedLangs
      },
      unmatched: {
        skills: unmatchedSkills,
        certifications: unmatchedCerts,
        languages: unmatchedLangs
      },
      extracted: {
        skills: candidateSkills,
        certifications: candidateCerts,
        languages: candidateLangs
      },
      sections: Object.keys(sections)
    };
  } catch (error) {
    console.error('CV analysis failed:', error);
    throw new Error(`Failed to analyze CV: ${error.message}`);
  }
}

// ------------------------------------------
// Module Export
// ------------------------------------------
module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromCV,
  identifySections,
  extractSkills,
  matchSkills,
  extractCertifications,
  extractLanguages,
  calculateScore,
  analyzeCV,
  events: cvAnalyzerEvents
};