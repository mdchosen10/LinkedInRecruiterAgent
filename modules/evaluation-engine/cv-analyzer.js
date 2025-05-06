const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const EventEmitter = require('events');

// We'll need to install mammoth.js: 
// npm install mammoth --save
// TODO: Install mammoth.js to support DOCX extraction
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