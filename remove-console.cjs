#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Recursively get all TypeScript and JavaScript files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Remove console statements from content
function removeConsoleStatements(content) {
  // Remove single-line console statements
  content = content.replace(/^\s*console\.(log|error|warn|debug|info)\(.*?\);?\s*$/gm, '');

  // Remove multi-line console statements
  content = content.replace(/^\s*console\.(log|error|warn|debug|info)\(\s*[\s\S]*?\);?\s*$/gm, '');

  // Clean up excessive blank lines (more than 2 consecutive)
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  return content;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

let totalFiles = 0;
let totalStatementsRemoved = 0;

console.log('🧹 Cleaning console statements from production code...\n');

files.forEach((file) => {
  const originalContent = fs.readFileSync(file, 'utf8');
  const newContent = removeConsoleStatements(originalContent);

  if (originalContent !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    const removed = (originalContent.match(/console\.(log|error|warn|debug|info)/g) || []).length;
    totalStatementsRemoved += removed;
    totalFiles++;
    console.log(`✓ ${path.relative(srcDir, file)}: removed ${removed} statements`);
  }
});

console.log(`\n✅ Cleaned ${totalFiles} files`);
console.log(`🎉 Removed ${totalStatementsRemoved} console statements`);
console.log('✨ Production code is ready!');
