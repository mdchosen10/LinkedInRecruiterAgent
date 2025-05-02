/**
 * fileConsistencyCheck.js
 * 
 * Script to check file naming consistency and folder structure
 * across the project and update references to renamed files.
 */

const fs = require('fs');
const path = require('path');

// Configuration for file naming conventions
const NAMING_CONVENTIONS = {
  js: 'kebab-case', // e.g., file-name.js
  jsx: 'PascalCase', // e.g., ComponentName.jsx
  ts: 'kebab-case',
  tsx: 'PascalCase',
  css: 'kebab-case',
  json: 'kebab-case',
  md: 'kebab-case',
  html: 'kebab-case',
  yml: 'kebab-case',
  yaml: 'kebab-case'
};

// Expected project folder structure
const EXPECTED_FOLDERS = [
  'config',
  'integration',
  'electron-app',
  'modules/linkedin-automation',
  'modules/evaluation-engine',
  'modules/message-generator',
  'modules/data-storage',
  'modules/ui',
  'data',
  'data/backups'
];

// Module mappings - where each module's core files should be
const MODULE_FILE_MAPPINGS = {
  'modules/linkedin-automation': ['linkedin-automation.js', 'electron-integration.js'],
  'modules/evaluation-engine': ['candidate-evaluation-engine.js'],
  'modules/message-generator': ['message-generator.js', 'message-generator-api.js'],
  'modules/data-storage': ['data-storage.js'],
  'modules/ui': ['index.html']
};

// Required root files
const REQUIRED_ROOT_FILES = [
  'index.js',
  'setup.js',
  'package.json'
];

// Files/folders to exclude
const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.vscode',
  '.idea'
];

// File types to scan
const FILE_EXTENSIONS = Object.keys(NAMING_CONVENTIONS);

// Maps for tracking old and new filenames
const fileRenameMap = new Map();

/**
 * Check if a string follows kebab-case
 */
function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

/**
 * Check if a string follows PascalCase
 */
function isPascalCase(str) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str) {
  // Replace camelCase or PascalCase with kebab
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  // First convert to kebab if it isn't already
  if (!isKebabCase(str)) {
    str = toKebabCase(str);
  }
  
  // Then convert kebab to PascalCase
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * Check if a filename follows the convention for its extension
 */
function checkNamingConvention(filename) {
  const ext = path.extname(filename).slice(1);
  const basename = path.basename(filename, `.${ext}`);
  
  if (!NAMING_CONVENTIONS[ext]) {
    return true; // No convention for this extension
  }
  
  const convention = NAMING_CONVENTIONS[ext];
  
  switch (convention) {
    case 'kebab-case':
      return isKebabCase(basename);
    case 'PascalCase':
      return isPascalCase(basename);
    default:
      return true;
  }
}

/**
 * Generate a properly named filename based on convention
 */
function generateProperFilename(filename) {
  const ext = path.extname(filename).slice(1);
  const basename = path.basename(filename, `.${ext}`);
  
  if (!NAMING_CONVENTIONS[ext]) {
    return filename; // No convention for this extension
  }
  
  const convention = NAMING_CONVENTIONS[ext];
  let newBasename;
  
  switch (convention) {
    case 'kebab-case':
      newBasename = toKebabCase(basename);
      break;
    case 'PascalCase':
      newBasename = toPascalCase(basename);
      break;
    default:
      newBasename = basename;
  }
  
  return `${newBasename}.${ext}`;
}

/**
 * Check file references in code and update them
 */
function updateFileReferences(filePath, content) {
  let updatedContent = content;
  
  // Check for require statements and imports
  for (const [oldPath, newPath] of fileRenameMap.entries()) {
    // Only update the filename part, not the whole path
    const oldFilename = path.basename(oldPath);
    const newFilename = path.basename(newPath);
    
    if (oldFilename === newFilename) continue;
    
    // Match require statements: require('path/oldFilename')
    const requireRegex = new RegExp(`require\\(['"](.*?${oldFilename.replace('.', '\\.')})['"](\\))`, 'g');
    updatedContent = updatedContent.replace(requireRegex, (match, p1, p2) => {
      const dirName = path.dirname(p1);
      const newRequirePath = path.join(dirName, newFilename).replace(/\\/g, '/');
      return `require('${newRequirePath}')${p2}`;
    });
    
    // Match import statements: import X from 'path/oldFilename'
    const importRegex = new RegExp(`import\\s+(?:.+?)\\s+from\\s+['"](.*?${oldFilename.replace('.', '\\.')})['"](.*?)`, 'g');
    updatedContent = updatedContent.replace(importRegex, (match, p1, p2) => {
      const dirName = path.dirname(p1);
      const newImportPath = path.join(dirName, newFilename).replace(/\\/g, '/');
      return `import ${p2} from '${newImportPath}'${p2}`;
    });
    
    // Match JavaScript includes: inside .js() or .jsx() or similar functions
    const includeRegex = new RegExp(`(\\.(?:js|jsx|ts|tsx))\\(['"](.*?${oldFilename.replace('.', '\\.')})['"](\\))`, 'g');
    updatedContent = updatedContent.replace(includeRegex, (match, p1, p2, p3) => {
      const dirName = path.dirname(p2);
      const newIncludePath = path.join(dirName, newFilename).replace(/\\/g, '/');
      return `${p1}('${newIncludePath}')${p3}`;
    });
  }
  
  return updatedContent;
}

/**
 * Scan directory recursively for files
 */
function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip excluded paths
    if (EXCLUDED_PATHS.some(excluded => fullPath.includes(excluded))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else {
      const ext = path.extname(entry.name).slice(1);
      
      // Only check files with target extensions
      if (FILE_EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  
  return fileList;
}

/**
 * Check folder structure against expected structure
 */
function checkFolderStructure(rootDir) {
  console.log('Checking folder structure...');
  
  const missingFolders = [];
  const existingFolders = [];
  
  for (const folderPath of EXPECTED_FOLDERS) {
    const fullPath = path.join(rootDir, folderPath);
    
    if (!fs.existsSync(fullPath)) {
      missingFolders.push(folderPath);
    } else {
      existingFolders.push(folderPath);
    }
  }
  
  if (missingFolders.length > 0) {
    console.log(`Missing folders (${missingFolders.length}):`);
    missingFolders.forEach(folder => {
      console.log(`  - ${folder}`);
    });
  } else {
    console.log('All expected folders exist.');
  }
  
  return {
    missingFolders,
    existingFolders
  };
}

/**
 * Check if required files exist in root directory
 */
function checkRequiredRootFiles(rootDir) {
  console.log('Checking required root files...');
  
  const missingFiles = [];
  const existingFiles = [];
  
  for (const filename of REQUIRED_ROOT_FILES) {
    const filePath = path.join(rootDir, filename);
    
    if (!fs.existsSync(filePath)) {
      missingFiles.push(filename);
    } else {
      existingFiles.push(filename);
    }
  }
  
  if (missingFiles.length > 0) {
    console.log(`Missing root files (${missingFiles.length}):`);
    missingFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('All required root files exist.');
  }
  
  return {
    missingFiles,
    existingFiles
  };
}

/**
 * Check if core module files are in correct location
 */
function checkModuleFilesLocation(rootDir) {
  console.log('Checking module files location...');
  
  const misplacedFiles = [];
  const correctFiles = [];
  
  // Scan all files in modules directory
  const modulesDir = path.join(rootDir, 'modules');
  if (!fs.existsSync(modulesDir)) {
    console.log('Modules directory does not exist. Skipping module file check.');
    return {
      misplacedFiles,
      correctFiles
    };
  }
  
  // Check each module folder
  for (const moduleFolder in MODULE_FILE_MAPPINGS) {
    const expectedFiles = MODULE_FILE_MAPPINGS[moduleFolder];
    const modulePath = path.join(rootDir, moduleFolder);
    
    if (!fs.existsSync(modulePath)) {
      continue; // Skip if module folder doesn't exist
    }
    
    // Scan all files in this module folder
    const files = fs.readdirSync(modulePath);
    
    // Check if expected core files exist in this folder
    for (const expectedFile of expectedFiles) {
      const fullPath = path.join(modulePath, expectedFile);
      
      if (!fs.existsSync(fullPath)) {
        misplacedFiles.push({
          module: moduleFolder,
          file: expectedFile,
          expected: fullPath
        });
      } else {
        correctFiles.push({
          module: moduleFolder,
          file: expectedFile
        });
      }
    }
  }
  
  if (misplacedFiles.length > 0) {
    console.log(`Misplaced or missing module files (${misplacedFiles.length}):`);
    misplacedFiles.forEach(file => {
      console.log(`  - ${file.file} should be in ${file.module}`);
    });
  } else {
    console.log('All core module files are in the correct location.');
  }
  
  return {
    misplacedFiles,
    correctFiles
  };
}

/**
 * Create missing folders
 */
function createMissingFolders(rootDir, missingFolders) {
  console.log('Creating missing folders...');
  
  for (const folder of missingFolders) {
    const fullPath = path.join(rootDir, folder);
    
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`  - Created: ${folder}`);
    } catch (error) {
      console.error(`  - Error creating ${folder}:`, error);
    }
  }
}

/**
 * Main function to check and fix project structure
 */
async function main() {
  console.log('Starting project structure and file naming check...');
  
  const rootDir = process.cwd(); // Current working directory
  
  // Check folder structure
  const { missingFolders } = checkFolderStructure(rootDir);
  
  // Check required root files
  const { missingFiles } = checkRequiredRootFiles(rootDir);
  
  // Check module files location
  const { misplacedFiles } = checkModuleFilesLocation(rootDir);
  
  // Scan for files to check naming conventions
  console.log('\nScanning project for files to check naming conventions...');
  const files = scanDirectory(rootDir);
  
  console.log(`Found ${files.length} files to check.`);
  
  const filesToRename = [];
  
  // First pass: identify files to rename
  for (const filePath of files) {
    const filename = path.basename(filePath);
    
    if (!checkNamingConvention(filename)) {
      const properFilename = generateProperFilename(filename);
      const newPath = path.join(path.dirname(filePath), properFilename);
      
      filesToRename.push({
        oldPath: filePath,
        newPath: newPath,
        oldName: filename,
        newName: properFilename
      });
      
      fileRenameMap.set(filePath, newPath);
    }
  }
  
  // Report files to rename
  if (filesToRename.length === 0) {
    console.log('All files follow naming conventions. No renaming needed.');
  } else {
    console.log(`Found ${filesToRename.length} files that need renaming:`);
    filesToRename.forEach(file => {
      console.log(`  - ${file.oldName} → ${file.newName}`);
    });
  }
  
  // For safety, ask for confirmation before making changes
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Determine what actions need to be taken
  const needsFolderCreation = missingFolders.length > 0;
  const needsFileRenaming = filesToRename.length > 0;
  const hasStructureIssues = needsFolderCreation || missingFiles.length > 0 || misplacedFiles.length > 0;
  
  if (!needsFolderCreation && !needsFileRenaming) {
    console.log('\nNo issues to fix. Project structure and file naming look good!');
    readline.close();
    return;
  }
  
  await new Promise(resolve => {
    let question = '';
    
    if (needsFolderCreation && needsFileRenaming) {
      question = 'Create missing folders and rename files? (y/n): ';
    } else if (needsFolderCreation) {
      question = 'Create missing folders? (y/n): ';
    } else {
      question = 'Proceed with renaming files and updating references? (y/n): ';
    }
    
    readline.question(question, answer => {
      if (answer.toLowerCase() === 'y') {
        // Create missing folders if needed
        if (needsFolderCreation) {
          createMissingFolders(rootDir, missingFolders);
        }
        
        // Update references and rename files if needed
        if (needsFileRenaming) {
          // Update references in all files
          console.log('Updating file references...');
          
          for (const filePath of files) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const updatedContent = updateFileReferences(filePath, content);
              
              if (content !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent);
                console.log(`  - Updated references in ${filePath}`);
              }
            } catch (error) {
              console.error(`  - Error updating references in ${filePath}:`, error);
            }
          }
          
          // Rename files
          console.log('Renaming files...');
          for (const file of filesToRename) {
            try {
              if (fs.existsSync(file.newPath)) {
                console.warn(`  - Cannot rename ${file.oldPath}: ${file.newPath} already exists`);
                continue;
              }
              
              fs.renameSync(file.oldPath, file.newPath);
              console.log(`  - Renamed ${file.oldName} to ${file.newName}`);
            } catch (error) {
              console.error(`  - Error renaming ${file.oldPath}:`, error);
            }
          }
        }
        
        if (hasStructureIssues) {
          console.log('\nPlease check the remaining structure issues manually:');
          
          if (missingFiles.length > 0) {
            console.log('Required root files to create:');
            missingFiles.forEach(file => console.log(`  - ${file}`));
          }
          
          if (misplacedFiles.length > 0) {
            console.log('Module files that need to be moved:');
            misplacedFiles.forEach(file => {
              console.log(`  - ${file.file} should be in ${file.module}`);
            });
          }
        }
        
        console.log('\nProject structure and file naming check completed.');
      } else {
        console.log('Operation cancelled.');
      }
      
      readline.close();
      resolve();
    });
  });
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});