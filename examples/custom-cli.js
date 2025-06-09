#!/usr/bin/env node
// filepath: d:\Projects\Personal\IssueSync\examples\custom-cli.js
/**
 * Exemple d'intégration d'IssueSync dans un outil CLI personnalisé
 * 
 * Ce fichier montre comment IssueSync peut être utilisé pour créer un outil CLI
 * personnalisé pour gérer les issues GitHub.
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const issueSync = require('issuesync'); // Notre bibliothèque
require('dotenv').config();

// Initialiser le programme CLI
const program = new Command();
program
  .name('issue-manager')
  .description('Un gestionnaire d\'issues GitHub basé sur IssueSync')
  .version('1.0.0');

// Vérifier et initialiser le token GitHub
function initializeGitHub() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error(chalk.red('⚠️  Token GitHub non trouvé. Définissez GITHUB_TOKEN dans un fichier .env'));
    process.exit(1);
  }
  
  try {
    issueSync.init({ token });
    return true;
  } catch (error) {
    console.error(chalk.red(`⚠️  Erreur d'initialisation: ${error.message}`));
    return false;
  }
}

// Commande pour lister les issues
program
  .command('list')
  .description('Lister les issues d\'un dépôt GitHub')
  .option('-o, --owner <propriétaire>', 'Propriétaire du dépôt')
  .option('-r, --repo <nom>', 'Nom du dépôt')
  .option('-s, --state <état>', 'État des issues (open, closed, all)', 'open')
  .option('-l, --labels <étiquettes>', 'Filtrer par étiquettes (séparées par des virgules)')
  .option('-v, --verbose', 'Afficher plus de détails')
  .action(async (options) => {
    if (!initializeGitHub()) return;
    
    // Si les options requises ne sont pas fournies, les demander
    if (!options.owner || !options.repo) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'Propriétaire du dépôt:',
          when: !options.owner
        },
        {
          type: 'input',
          name: 'repo',
          message: 'Nom du dépôt:',
          when: !options.repo
        }
      ]);
      
      options.owner = options.owner || answers.owner;
      options.repo = options.repo || answers.repo;
    }
    
    const spinner = ora('Récupération des issues...').start();
    
    try {
      const issues = await issueSync.listIssues({
        owner: options.owner,
        repo: options.repo,
        state: options.state,
        labels: options.labels
      });
      
      spinner.succeed(`${issues.length} issues trouvées pour ${options.owner}/${options.repo}`);
      
      if (issues.length === 0) {
        console.log(chalk.yellow('Aucune issue trouvée avec les critères spécifiés.'));
        return;
      }
      
      console.log('\n');
      
      // Afficher les issues
      issues.forEach((issue) => {
        const labelStr = issue.labels
          .map(l => chalk.hex(`#${l.color}`).bold(`[${l.name}]`))
          .join(' ');
        
        console.log(
          chalk.bold.blue(`#${issue.number}`),
          chalk.bold(issue.title),
          issue.state === 'open' 
            ? chalk.green('◉ ouvert') 
            : chalk.red('◉ fermé')
        );
        
        if (labelStr) console.log(labelStr);
        
        if (options.verbose) {
          console.log(chalk.dim(`  Créée le: ${new Date(issue.created_at).toLocaleString()}`));
          console.log(chalk.dim(`  Commentaires: ${issue.comments}`));
          console.log(chalk.dim(`  URL: ${issue.html_url}`));
          
          if (issue.body) {
            const truncated = issue.body.length > 100 
              ? issue.body.substring(0, 100) + '...' 
              : issue.body;
            console.log(chalk.dim(`  Description: ${truncated}`));
          }
        }
        
        console.log('\n');
      });
    } catch (error) {
      spinner.fail('Erreur lors de la récupération des issues');
      console.error(chalk.red(`Erreur: ${error.message}`));
    }
  });

// Commande pour synchroniser les issues
program
  .command('sync')
  .description('Synchroniser les issues entre deux dépôts GitHub')
  .option('--source-owner <propriétaire>', 'Propriétaire du dépôt source')
  .option('--source-repo <nom>', 'Nom du dépôt source')
  .option('--target-owner <propriétaire>', 'Propriétaire du dépôt cible')
  .option('--target-repo <nom>', 'Nom du dépôt cible')
  .option('-s, --state <état>', 'État des issues à synchroniser (open, closed, all)', 'open')
  .option('-l, --labels <étiquettes>', 'Filtrer par étiquettes (séparées par des virgules)')
  .option('--no-comments', 'Ne pas synchroniser les commentaires')
  .action(async (options) => {
    if (!initializeGitHub()) return;
    
    // Si les options requises ne sont pas fournies, les demander
    const requiredOptions = [
      { name: 'sourceOwner', prompt: 'Propriétaire du dépôt source:', option: options.sourceOwner },
      { name: 'sourceRepo', prompt: 'Nom du dépôt source:', option: options.sourceRepo },
      { name: 'targetOwner', prompt: 'Propriétaire du dépôt cible:', option: options.targetOwner },
      { name: 'targetRepo', prompt: 'Nom du dépôt cible:', option: options.targetRepo }
    ];
    
    const missingOptions = requiredOptions.filter(o => !o.option);
    
    if (missingOptions.length > 0) {
      const questions = missingOptions.map(o => ({
        type: 'input',
        name: o.name,
        message: o.prompt
      }));
      
      const answers = await inquirer.prompt(questions);
      
      // Assigner les réponses aux options
      for (const [key, value] of Object.entries(answers)) {
        options[key] = value;
      }
    }
    
    // Afficher un avertissement et confirmation pour la synchronisation
    console.log(chalk.yellow.bold('\n⚠️  AVERTISSEMENT'));
    console.log(chalk.yellow(
      `Vous êtes sur le point de synchroniser les issues de ${options.sourceOwner}/${options.sourceRepo} ` +
      `vers ${options.targetOwner}/${options.targetRepo}.`
    ));
    console.log(chalk.yellow('Cette opération ne peut pas être annulée.\n'));
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Voulez-vous continuer?',
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.blue('Synchronisation annulée.'));
      return;
    }
    
    const spinner = ora('Synchronisation des issues...').start();
    
    try {
      const result = await issueSync.syncIssues({
        sourceOwner: options.sourceOwner,
        sourceRepo: options.sourceRepo,
        targetOwner: options.targetOwner,
        targetRepo: options.targetRepo,
        state: options.state,
        labels: options.labels,
        syncComments: options.comments
      });
      
      spinner.succeed('Synchronisation terminée');
      
      console.log(chalk.green(`✓ ${result.created.length} issues créées`));
      console.log(chalk.blue(`ℹ ${result.skipped.length} issues ignorées (déjà existantes)`));
      console.log(chalk.gray(`  Total d'issues source: ${result.total}`));
      
      // Afficher les issues créées
      if (result.created.length > 0) {
        console.log('\nIssues créées:');
        result.created.forEach(issue => {
          console.log(`  ${chalk.blue(`#${issue.number}`)} ${issue.title}`);
        });
      }
    } catch (error) {
      spinner.fail('Erreur lors de la synchronisation des issues');
      console.error(chalk.red(`Erreur: ${error.message}`));
    }
  });

// Commande pour afficher les statistiques
program
  .command('stats')
  .description('Afficher des statistiques sur les issues d\'un dépôt')
  .option('-o, --owner <propriétaire>', 'Propriétaire du dépôt')
  .option('-r, --repo <nom>', 'Nom du dépôt')
  .action(async (options) => {
    if (!initializeGitHub()) return;
    
    // Si les options requises ne sont pas fournies, les demander
    if (!options.owner || !options.repo) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'Propriétaire du dépôt:',
          when: !options.owner
        },
        {
          type: 'input',
          name: 'repo',
          message: 'Nom du dépôt:',
          when: !options.repo
        }
      ]);
      
      options.owner = options.owner || answers.owner;
      options.repo = options.repo || answers.repo;
    }
    
    const spinner = ora('Récupération des statistiques...').start();
    
    try {
      // Récupérer les issues ouvertes et fermées
      const [openIssues, closedIssues] = await Promise.all([
        issueSync.listIssues({
          owner: options.owner,
          repo: options.repo,
          state: 'open'
        }),
        issueSync.listIssues({
          owner: options.owner,
          repo: options.repo,
          state: 'closed'
        })
      ]);
      
      spinner.succeed('Statistiques récupérées');
      
      // Calculer des statistiques
      const allIssues = [...openIssues, ...closedIssues];
      const totalIssues = allIssues.length;
      const openRatio = totalIssues > 0 ? (openIssues.length / totalIssues) * 100 : 0;
      
      // Compter les labels
      const labelCounts = {};
      allIssues.forEach(issue => {
        issue.labels.forEach(label => {
          if (!labelCounts[label.name]) {
            labelCounts[label.name] = { count: 0, color: label.color };
          }
          labelCounts[label.name].count++;
        });
      });
      
      console.log('\n');
      console.log(chalk.bold(`📊 Statistiques pour ${options.owner}/${options.repo}`));
      console.log('\n');
      
      console.log(`Issues totales: ${chalk.bold(totalIssues)}`);
      console.log(`Issues ouvertes: ${chalk.bold.green(openIssues.length)} (${openRatio.toFixed(1)}%)`);
      console.log(`Issues fermées: ${chalk.bold.red(closedIssues.length)} (${(100 - openRatio).toFixed(1)}%)`);
      
      if (Object.keys(labelCounts).length > 0) {
        console.log('\nÉtiquettes les plus utilisées:');
        
        // Trier les labels par nombre d'occurrences
        const sortedLabels = Object.entries(labelCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10); // Top 10
        
        sortedLabels.forEach(([name, info]) => {
          const percent = (info.count / totalIssues * 100).toFixed(1);
          console.log(`  ${chalk.hex(`#${info.color}`).bold(`[${name}]`)} ${info.count} (${percent}%)`);
        });
      }
    } catch (error) {
      spinner.fail('Erreur lors de la récupération des statistiques');
      console.error(chalk.red(`Erreur: ${error.message}`));
    }
  });

// Analyser les arguments
program.parse(process.argv);

// Si aucune commande n'est fournie, afficher l'aide
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

/**
 * Note: Cet exemple nécessite les dépendances suivantes:
 * - commander
 * - inquirer
 * - chalk
 * - ora
 * - dotenv
 */
