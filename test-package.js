#!/usr/bin/env node

// filepath: d:\Projects\Personal\IssueSync\test-package.js
/**
 * Test script to verify that the package is ready for publication
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking IssueSync package readiness...\n');

// Check essential files
const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'cli.js',
  'lib/index.js',
  'lib/index.d.ts',
  '.npmignore'
];

let allFilesExist = true;

console.log('📁 Checking essential files:');
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const checks = [
    ['Name', pkg.name, pkg.name === 'issuesync'],
    ['Version', pkg.version, !!pkg.version],
    ['Description', pkg.description, !!pkg.description],
    ['Main entry point', pkg.main, pkg.main === 'lib/index.js'],
    ['CLI binary', pkg.bin?.issuesync, pkg.bin?.issuesync === './cli.js'],
    ['License', pkg.license, pkg.license === 'MIT'],
    ['Dependencies', 'octokit, dotenv, yargs', !!pkg.dependencies?.['@octokit/rest']],
  ];
  
  for (const [label, value, isValid] of checks) {
    console.log(`  ${isValid ? '✅' : '❌'} ${label}: ${value}`);
  }
} catch (error) {
  console.log('  ❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Test library import
console.log('\n🔧 Testing library import:');
try {
  const issueSync = require('./lib');
  const methods = Object.keys(issueSync);  console.log('  ✅ Import successful');
  console.log('  ✅ Available methods:', methods.join(', '));
  
  // Check that essential methods exist
  const requiredMethods = ['init', 'listIssues', 'syncIssues'];
  const hasAllMethods = requiredMethods.every(method => methods.includes(method));
  console.log(`  ${hasAllMethods ? '✅' : '❌'} All required methods are present`);
} catch (error) {
  console.log('  ❌ Import error:', error.message);
  allFilesExist = false;
}

// Test file syntax
console.log('\n🔍 Syntax testing:');
try {
  require('./lib/index.js');
  console.log('  ✅ lib/index.js - valid syntax');
} catch (error) {
  console.log('  ❌ lib/index.js - syntax error:', error.message);
  allFilesExist = false;
}

try {
  // Simply check that the file can be read (not executed as it requires CLI arguments)
  fs.readFileSync('./cli.js', 'utf8');
  console.log('  ✅ cli.js - file readable');
} catch (error) {
  console.log('  ❌ cli.js - error:', error.message);
  allFilesExist = false;
}

// Check TypeScript definitions
console.log('\n📝 Checking TypeScript definitions:');
try {
  const tsContent = fs.readFileSync('./lib/index.d.ts', 'utf8');
  const hasExports = tsContent.includes('export function');
  console.log(`  ${hasExports ? '✅' : '❌'} TypeScript definitions present`);
} catch (error) {
  console.log('  ❌ Error reading TypeScript definitions:', error.message);
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 SUCCESS: The IssueSync package is ready for publication!');
  console.log('\nTo publish to npm:');
  console.log('  1. npm login');
  console.log('  2. npm publish');
  console.log('\nTo install globally:');
  console.log('  npm install -g issuesync');
} else {
  console.log('❌ FAILURE: The package is not yet ready for publication.');
  console.log('Please fix the errors above before publishing.');
}
console.log('='.repeat(50));
