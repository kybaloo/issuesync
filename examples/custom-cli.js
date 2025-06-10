#!/usr/bin/env node
// filepath: d:\Projects\Personal\issuesync\examples\custom-cli.js
/**
 * Example of issuesync integration in a custom CLI tool
 * 
 * This file shows how issuesync can be used to create a custom CLI tool
 * for managing GitHub issues.
 */

const { Command } = require('commandr');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const issuesync = require('issuesync'); // Notre bibliothèque
require('dotenv').config();

// Initialize CLI program
const program = new Command();
program
  .name('issue-manager')
  .description('A GitHub issue manager based on issuesync')
  .version('1.0.0');

// Check and initialize GitHub token
function initializeGitHub() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error(chalk.red('⚠️  GitHub token not found. Please set GITHUB_TOKEN in a .env file or environment variable.'));
    console.error(chalk.dim('You can create a personal access token on GitHub with the "repo" scope.'));
    process.exit(1);
  }
  
  try {
    issuesync.init({ token });
    return true;
  } catch (error) {
    console.error(chalk.red(`⚠️  error of initialization: ${error.message}`));
    return false;
  }
}

// command for listing issues
program
  .command('list')
  .description('List issues from a GitHub repository')
  .option('-o, --owner <owner>', 'owner of the repository')
  .option('-r, --repo <name>', 'Name of the repository')
  .option('-s, --state <state>', 'State of the issues (open, closed, all)', 'open')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('-v, --verbose', 'Display more details')
  .action(async (options) => {
    if (!initializeGitHub()) return;

    // If the required options are not provided, ask them
    if (!options.owner || !options.repo) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'owner of the repository:',
          when: !options.owner
        },
        {
          type: 'input',
          name: 'repo',
          message: 'Repository name:',
          when: !options.repo
        }
      ]);
      
      options.owner = options.owner || answers.owner;
      options.repo = options.repo || answers.repo;
    }
    
    const spinner = ora('retrieval of the issues...').start();
    
    try {
      const issues = await issuesync.listissues({
        owner: options.owner,
        repo: options.repo,
        state: options.state,
        labels: options.labels
      });
      
      spinner.succeed(`${issues.length} issues found for ${options.owner}/${options.repo}`);
      
      if (issues.length === 0) {
        console.log(chalk.yellow('No issues found with the specified criteria.'));
        return;
      }
      
      console.log('\n');
      
      // display the issues
      issues.forEach((issue) => {
        const labelStr = issue.labels
          .map(l => chalk.hex(`#${l.color}`).bold(`[${l.name}]`))
          .join(' ');
        
        console.log(
          chalk.bold.blue(`#${issue.number}`),
          chalk.bold(issue.title),
          issue.state === 'open' 
            ? chalk.green('◉ open') 
            : chalk.red('◉ closed')
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
            console.log(chalk.dim(` Description: ${truncated}`));
          }
        }
        
        console.log('\n');
      });
    } catch (error) {
      spinner.fail('error during retrieval of the issues');
      console.error(chalk.red(`error: ${error.message}`));
    }
  });

// command for synchronize les issues
program
  .command('sync')
  .description('Synchronize issues between two GitHub repositories')
  .option('--source-owner <owner>', 'Owner of the source repository')
  .option('--source-repo <name>', 'Name of the source repository')
  .option('--target-owner <owner>', 'Owner of the target repository')
  .option('--target-repo <name>', 'Name of the target repository')
  .option('-s, --state <state>', 'State of the issues to synchronize (open, closed, all)', 'open')
  .option('-l, --labels <labels>', 'Filter by labels (comma-separated)')
  .option('--no-comments', 'Do not synchronize comments')
  .action(async (options) => {
    if (!initializeGitHub()) return;

    // If the required options are not provided, ask them
    const requiredOptions = [
      { name: 'sourceOwner', prompt: 'Owner of the source repository:', option: options.sourceOwner },
      { name: 'sourceRepo', prompt: 'Name of the source repository:', option: options.sourceRepo },
      { name: 'targetOwner', prompt: 'Owner of the target repository:', option: options.targetOwner },
      { name: 'targetRepo', prompt: 'Name of the target repository:', option: options.targetRepo }
    ];
    
    const missingOptions = requiredOptions.filter(o => !o.option);
    
    if (missingOptions.length > 0) {
      const questions = missingOptions.map(o => ({
        type: 'input',
        name: o.name,
        message: o.prompt
      }));
      
      const answers = await inquirer.prompt(questions);

      // Assign responses to options
      for (const [key, value] of Object.entries(answers)) {
        options[key] = value;
      }
    }

    // display a warning and confirmation for the synchronization
    console.log(chalk.yellow.bold('\n⚠️  WARNING'));
    console.log(chalk.yellow(
      `You are about to synchronize issues from ${options.sourceOwner}/${options.sourceRepo} ` +
      `to ${options.targetOwner}/${options.targetRepo}.`
    ));
    console.log(chalk.yellow('This operation cannot be undone.\n'));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue?',
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.blue('Synchronization cancelled.'));
      return;
    }

    const spinner = ora('Synchronizing issues...').start();
    
    try {
      const result = await issuesync.syncissues({
        sourceOwner: options.sourceOwner,
        sourceRepo: options.sourceRepo,
        targetOwner: options.targetOwner,
        targetRepo: options.targetRepo,
        state: options.state,
        labels: options.labels,
        syncComments: options.comments
      });

      spinner.succeed('Synchronization completed');

      console.log(chalk.green(`✓ ${result.created.length} issues created`));
      console.log(chalk.blue(`ℹ ${result.skipped.length} issues skipped (already exists)`));
      console.log(chalk.gray(`  Total source issues: ${result.total}`));

      // display the created issues
      if (result.created.length > 0) {
        console.log('\nIssues created:');
        result.created.forEach(issue => {
          console.log(`  ${chalk.blue(`#${issue.number}`)} ${issue.title}`);
        });
      }
    } catch (error) {
      spinner.fail('error during synchronization of the issues');
      console.error(chalk.red(`error: ${error.message}`));
    }
  });

// command for display the statistics
program
  .command('stats')
  .description('Display statistics on issues of a repository')
  .option('-o, --owner <owner>', 'Owner of the repository')
  .option('-r, --repo <name>', 'Name of the repository')
  .action(async (options) => {
    if (!initializeGitHub()) return;

    // If the required options are not provided, ask them
    if (!options.owner || !options.repo) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'owner of the repository:',
          when: !options.owner
        },
        {
          type: 'input',
          name: 'repo',
          message: 'Name of the repository:',
          when: !options.repo
        }
      ]);
      
      options.owner = options.owner || answers.owner;
      options.repo = options.repo || answers.repo;
    }

    const spinner = ora('Retrieving statistics...').start();

    try {
      // retrieve open and closed issues
      const [openissues, closedissues] = await Promise.all([
        issuesync.listissues({
          owner: options.owner,
          repo: options.repo,
          state: 'open'
        }),
        issuesync.listissues({
          owner: options.owner,
          repo: options.repo,
          state: 'closed'
        })
      ]);
      
      spinner.succeed('Statistiques récupérées');

      // Calculate the statistics
      const allissues = [...openissues, ...closedissues];
      const totalissues = allissues.length;
      const openRatio = totalissues > 0 ? (openissues.length / totalissues) * 100 : 0;

      // Count the labels
      const labelCounts = {};
      allissues.forEach(issue => {
        issue.labels.forEach(label => {
          if (!labelCounts[label.name]) {
            labelCounts[label.name] = { count: 0, color: label.color };
          }
          labelCounts[label.name].count++;
        });
      });
      
      console.log('\n');
      console.log(chalk.bold(`📊 Statistics for ${options.owner}/${options.repo}`));
      console.log('\n');

      console.log(`Total issues: ${chalk.bold(totalissues)}`);
      console.log(`Open issues: ${chalk.bold.green(openissues.length)} (${openRatio.toFixed(1)}%)`);
      console.log(`Closed issues: ${chalk.bold.red(closedissues.length)} (${(100 - openRatio).toFixed(1)}%)`);
      
      if (Object.keys(labelCounts).length > 0) {
        console.log('\nMost used labels:');

        // Sort labels by count
        const sortedLabels = Object.entries(labelCounts)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 10); // Top 10
        
        sortedLabels.forEach(([name, info]) => {
          const percent = (info.count / totalissues * 100).toFixed(1);
          console.log(`  ${chalk.hex(`#${info.color}`).bold(`[${name}]`)} ${info.count} (${percent}%)`);
        });
      }
    } catch (error) {
      spinner.fail('Error during retrieval of the statistics');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Analyze the arguments
program.parse(process.argv);

// If no command is provided, display the help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

/**
 * Note: This example requires the following dependencies:
 * - commandr
 * - inquirer
 * - chalk
 * - ora
 * - dotenv
 */
