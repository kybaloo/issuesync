#!/usr/bin/env node

// filepath: d:\Projects\Personal\IssueSync\test-package.js
/**
 * Script de test pour vérifier que le package est prêt pour la publication
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la préparation du package IssueSync...\n');

// Vérifier les fichiers essentiels
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

console.log('📁 Vérification des fichiers essentiels:');
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Vérifier le package.json
console.log('\n📦 Vérification du package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const checks = [
    ['Nom', pkg.name, pkg.name === 'issuesync'],
    ['Version', pkg.version, !!pkg.version],
    ['Description', pkg.description, !!pkg.description],
    ['Point d\'entrée principal', pkg.main, pkg.main === 'lib/index.js'],
    ['Binaire CLI', pkg.bin?.issuesync, pkg.bin?.issuesync === './cli.js'],
    ['Licence', pkg.license, pkg.license === 'MIT'],
    ['Dépendances', 'octokit, dotenv, yargs', !!pkg.dependencies?.['@octokit/rest']],
  ];
  
  for (const [label, value, isValid] of checks) {
    console.log(`  ${isValid ? '✅' : '❌'} ${label}: ${value}`);
  }
} catch (error) {
  console.log('  ❌ Erreur lors de la lecture du package.json:', error.message);
  allFilesExist = false;
}

// Tester l'import de la bibliothèque
console.log('\n🔧 Test d\'import de la bibliothèque:');
try {
  const issueSync = require('./lib');
  const methods = Object.keys(issueSync);
  console.log('  ✅ Import réussi');
  console.log('  ✅ Méthodes disponibles:', methods.join(', '));
  
  // Vérifier que les méthodes essentielles existent
  const requiredMethods = ['init', 'listIssues', 'syncIssues'];
  const hasAllMethods = requiredMethods.every(method => methods.includes(method));
  console.log(`  ${hasAllMethods ? '✅' : '❌'} Toutes les méthodes requises sont présentes`);
} catch (error) {
  console.log('  ❌ Erreur lors de l\'import:', error.message);
  allFilesExist = false;
}

// Tester la syntaxe des fichiers
console.log('\n🔍 Test de syntaxe:');
try {
  require('./lib/index.js');
  console.log('  ✅ lib/index.js - syntaxe valide');
} catch (error) {
  console.log('  ❌ lib/index.js - erreur de syntaxe:', error.message);
  allFilesExist = false;
}

try {
  // Simplement vérifier que le fichier peut être lu (pas exécuté car il nécessite les arguments CLI)
  fs.readFileSync('./cli.js', 'utf8');
  console.log('  ✅ cli.js - fichier lisible');
} catch (error) {
  console.log('  ❌ cli.js - erreur:', error.message);
  allFilesExist = false;
}

// Vérifier les définitions TypeScript
console.log('\n📝 Vérification des définitions TypeScript:');
try {
  const tsContent = fs.readFileSync('./lib/index.d.ts', 'utf8');
  const hasExports = tsContent.includes('export function');
  console.log(`  ${hasExports ? '✅' : '❌'} Définitions TypeScript présentes`);
} catch (error) {
  console.log('  ❌ Erreur lors de la lecture des définitions TypeScript:', error.message);
}

// Résumé final
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 SUCCÈS: Le package IssueSync est prêt pour la publication!');
  console.log('\nPour publier sur npm:');
  console.log('  1. npm login');
  console.log('  2. npm publish');
  console.log('\nPour installer globalement:');
  console.log('  npm install -g issuesync');
} else {
  console.log('❌ ÉCHEC: Le package n\'est pas encore prêt pour la publication.');
  console.log('Veuillez corriger les erreurs ci-dessus avant de publier.');
}
console.log('='.repeat(50));
