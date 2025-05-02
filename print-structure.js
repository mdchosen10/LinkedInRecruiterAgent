const fs = require('fs');
const path = require('path');

// Configuration
const maxDepth = 4; // Maximum folder depth to display
const excludeDirs = ['node_modules', '.git', 'build', 'dist']; // Directories to exclude
const outputFile = 'project-structure.txt';

let output = 'Project Structure:\n';

function printStructure(dir, prefix = '', isLast = true, depth = 0) {
  if (depth > maxDepth) {
    output += `${prefix}... (max depth reached)\n`;
    return;
  }

  try {
    const items = fs.readdirSync(dir).filter(item => !excludeDirs.includes(item));
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLastItem = i === items.length - 1;
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      // Prepare the prefix for the current item
      const itemPrefix = prefix + (isLast ? '└── ' : '├── ');
      // Prepare the prefix for children of the current item
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      
      if (stats.isDirectory()) {
        output += `${itemPrefix}${item}/\n`;
        printStructure(fullPath, childPrefix, isLastItem, depth + 1);
      } else {
        output += `${itemPrefix}${item}\n`;
      }
    }
  } catch (error) {
    output += `${prefix}Error reading directory: ${error.message}\n`;
  }
}

// Start from the current directory
printStructure(process.cwd(), '', true);

// Write to file
fs.writeFileSync(outputFile, output);
console.log(`Project structure saved to ${outputFile}`);