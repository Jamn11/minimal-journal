#!/usr/bin/env node

/**
 * Lines of Code Counter Utility
 * Counts lines of code in the minimal-journal repository
 * Excludes generated files, dependencies, and build artifacts
 */

const fs = require('fs');
const path = require('path');

// File extensions to count as source code
const sourceExtensions = [
  '.ts', '.js', '.tsx', '.jsx',  // TypeScript/JavaScript
  '.html', '.htm',               // HTML
  '.css', '.scss', '.sass',      // Stylesheets
  '.json',                       // Configuration files
  '.md',                         // Documentation
  '.yml', '.yaml'                // Configuration
];

// Directories to exclude from counting
const excludedDirs = [
  'node_modules',
  'dist',
  'release',
  'test-results',
  'playwright-report',
  '.git',
  'coverage',
  'build',
  'out'
];

// Files to exclude
const excludedFiles = [
  'package-lock.json',
  '.DS_Store'
];

class LineCounter {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      totalBlankLines: 0,
      totalCommentLines: 0,
      totalCodeLines: 0,
      fileTypes: {}
    };
  }

  isSourceFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return sourceExtensions.includes(ext);
  }

  shouldExcludeDir(dirName) {
    return excludedDirs.includes(dirName);
  }

  shouldExcludeFile(fileName) {
    return excludedFiles.includes(fileName);
  }

  countLinesInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let blankLines = 0;
      let commentLines = 0;
      let codeLines = 0;

      const ext = path.extname(filePath).toLowerCase();
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === '') {
          blankLines++;
        } else if (this.isCommentLine(trimmed, ext)) {
          commentLines++;
        } else {
          codeLines++;
        }
      }

      return {
        totalLines: lines.length,
        blankLines,
        commentLines,
        codeLines
      };
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      return { totalLines: 0, blankLines: 0, commentLines: 0, codeLines: 0 };
    }
  }

  isCommentLine(line, ext) {
    // Simple comment detection
    if (['.js', '.ts', '.tsx', '.jsx', '.css', '.scss'].includes(ext)) {
      return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
    }
    if (['.html', '.htm'].includes(ext)) {
      return line.startsWith('<!--');
    }
    if (['.md'].includes(ext)) {
      return false; // Markdown doesn't have traditional comments
    }
    return false;
  }

  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!this.shouldExcludeDir(item)) {
          this.scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (this.isSourceFile(fullPath) && !this.shouldExcludeFile(item)) {
          this.processFile(fullPath);
        }
      }
    }
  }

  processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const lineData = this.countLinesInFile(filePath);
    
    this.stats.totalFiles++;
    this.stats.totalLines += lineData.totalLines;
    this.stats.totalBlankLines += lineData.blankLines;
    this.stats.totalCommentLines += lineData.commentLines;
    this.stats.totalCodeLines += lineData.codeLines;
    
    // Track by file type
    if (!this.stats.fileTypes[ext]) {
      this.stats.fileTypes[ext] = {
        files: 0,
        lines: 0,
        codeLines: 0
      };
    }
    
    this.stats.fileTypes[ext].files++;
    this.stats.fileTypes[ext].lines += lineData.totalLines;
    this.stats.fileTypes[ext].codeLines += lineData.codeLines;
  }

  printResults() {
    console.log('📊 Lines of Code Report for Minimal Journal');
    console.log('=' .repeat(50));
    console.log();
    
    console.log('📋 Summary:');
    console.log(`   Total Files: ${this.stats.totalFiles.toLocaleString()}`);
    console.log(`   Total Lines: ${this.stats.totalLines.toLocaleString()}`);
    console.log(`   Code Lines:  ${this.stats.totalCodeLines.toLocaleString()}`);
    console.log(`   Blank Lines: ${this.stats.totalBlankLines.toLocaleString()}`);
    console.log(`   Comment Lines: ${this.stats.totalCommentLines.toLocaleString()}`);
    console.log();
    
    console.log('📁 Breakdown by File Type:');
    const sortedTypes = Object.entries(this.stats.fileTypes)
      .sort((a, b) => b[1].codeLines - a[1].codeLines);
      
    for (const [ext, data] of sortedTypes) {
      const percentage = ((data.codeLines / this.stats.totalCodeLines) * 100).toFixed(1);
      console.log(`   ${ext.padEnd(8)} ${data.files.toString().padEnd(3)} files  ${data.codeLines.toString().padEnd(6)} code lines (${percentage}%)`);
    }
    
    console.log();
    console.log('🎯 Efficiency Metrics:');
    const codeRatio = ((this.stats.totalCodeLines / this.stats.totalLines) * 100).toFixed(1);
    const avgLinesPerFile = (this.stats.totalLines / this.stats.totalFiles).toFixed(1);
    console.log(`   Code Density: ${codeRatio}%`);
    console.log(`   Avg Lines per File: ${avgLinesPerFile}`);
  }

  run() {
    const repoRoot = process.cwd();
    console.log(`🔍 Scanning repository: ${repoRoot}`);
    console.log();
    
    this.scanDirectory(repoRoot);
    this.printResults();
  }
}

// Run the counter
const counter = new LineCounter();
counter.run();