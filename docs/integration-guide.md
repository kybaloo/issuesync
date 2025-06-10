<!--filepath: d:\Projects\Personal\IssueSync\docs\integration-guide.md -->
# IssueSync Integration Guide

This guide explains how to integrate the IssueSync library into different types of projects. IssueSync is designed to be flexible and can be integrated in numerous contexts:

- Web applications (React, Vue, Angular, etc.)
- Backend services (Express, NestJS, etc.)
- VS Code extensions or other editors
- Custom CLI tools
- CI/CD automation systems
- Project management applications
- Tracking dashboards

## Prerequisites

- Node.js v14+ and npm installed
- An existing Node.js project
- A GitHub token with necessary permissions

## 1. Installation

Install IssueSync in your project:

```bash
npm install --save issuesync
# or with yarn
yarn add issuesync
```

## 2. Initialization

Initialize IssueSync with your GitHub token:

```javascript
const issueSync = require('issuesync');

// Option 1: Token provided directly
issueSync.init({ token: 'your-github-token' });

// Option 2: Token from environment variable
// (make sure process.env.GITHUB_TOKEN is defined)
issueSync.init();
```

## 3. Basic Usage

### List Issues

```javascript
async function getIssues() {
  const issues = await issueSync.listIssues({
    owner: 'owner',
    repo: 'repository',
    state: 'open',
    labels: 'bug,enhancement'
  });
  
  console.log(`${issues.length} issues retrieved`);
  return issues;
}
```

### Synchronize Issues

```javascript
async function syncIssues() {
  const result = await issueSync.syncIssues({
    sourceOwner: 'source-owner',
    sourceRepo: 'source-repo',
    targetOwner: 'target-owner',
    targetRepo: 'target-repo',
    state: 'open',
    syncComments: true
  });
  
  console.log(`${result.created.length} issues created, ${result.skipped.length} skipped`);
  return result;
}
```

## 4. Common Integration Scenarios

### Web Application

```javascript
// Example with Express
const express = require('express');
const issueSync = require('issuesync');
const app = express();

issueSync.init({ token: process.env.GITHUB_TOKEN });

app.get('/api/issues/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state, labels } = req.query;
    
    const issues = await issueSync.listIssues({
      owner,
      repo,
      state: state || 'open',
      labels: labels || ''
    });
    
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const { sourceOwner, sourceRepo, targetOwner, targetRepo, state } = req.body;
    
    const result = await issueSync.syncIssues({
      sourceOwner,
      sourceRepo,
      targetOwner,
      targetRepo,
      state: state || 'open'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
```

### VS Code Extension

```javascript
const vscode = require('vscode');
const issueSync = require('issuesync');

function activate(context) {
  // Get token from configuration
  const config = vscode.workspace.getConfiguration('myExtension');
  const token = config.get('githubToken');
  
  // Initialize IssueSync
  if (token) {
    issueSync.init({ token });
  }
  
  // Command to retrieve issues
  let disposable = vscode.commands.registerCommand('myExtension.getIssues', async () => {
    const owner = await vscode.window.showInputBox({ prompt: 'Repository owner' });
    const repo = await vscode.window.showInputBox({ prompt: 'Repository name' });
    
    if (owner && repo) {
      const issues = await issueSync.listIssues({ owner, repo });
      
      // Display issues in a list
      const selected = await vscode.window.showQuickPick(
        issues.map(issue => ({ label: issue.title, issue }))
      );
      
      if (selected) {
        // Use the selected issue...
      }
    }
  });
  
  context.subscriptions.push(disposable);
}

exports.activate = activate;
```

### Custom CLI Tool

```javascript
const { Command } = require('commander');
const inquirer = require('inquirer');
const issueSync = require('issuesync');
const program = new Command();

// Initialize with environment token
issueSync.init();

program
  .command('issues')
  .description('Retrieve issues from a repository')
  .action(async () => {
    const answers = await inquirer.prompt([
      { name: 'owner', message: 'Repository owner:' },
      { name: 'repo', message: 'Repository name:' },
      { name: 'state', message: 'State (open/closed/all):', default: 'open' }
    ]);
    
    const issues = await issueSync.listIssues(answers);
    
    console.table(
      issues.map(issue => ({
        '#': issue.number,
        'Title': issue.title,        'State': issue.state,
        'Labels': issue.labels.map(l => l.name).join(', ')
      }))
    );
  });

program.parse(process.argv);
```

### CI/CD Automation System

```javascript
// Automation script to synchronize issues after deployment
const issueSync = require('issuesync');

async function syncAfterDeploy() {
  try {
    console.log('Synchronizing issues after deployment...');
    
    // Initialize with CI/CD token
    issueSync.init({ token: process.env.GH_TOKEN });
    
    // Synchronize relevant issues
    const result = await issueSync.syncIssues({
      sourceOwner: 'main-org',
      sourceRepo: 'main-repo',
      targetOwner: 'client-org',
      targetRepo: 'client-repo',
      state: 'open',
      labels: 'deployed', // Synchronize only issues with this label
      syncComments: true
    });
    
    console.log(`Synchronization completed: ${result.created.length} issues created`);
    return result;
  } catch (error) {
    console.error('Synchronization error:', error);
    process.exit(1);
  }
}

// Execute the script
syncAfterDeploy();
```

## 5. Integration with Task Systems

IssueSync can be used to feed various task management systems, as in this example with a VS Code extension using Copilot to generate intelligent tasks:

```javascript
async function generateTasksFromIssues(issues) {
  const tasks = [];
  
  for (const issue of issues) {
    // Format the issue for the task system
    const issueData = {
      id: issue.number,
      title: issue.title,
      description: issue.body || '',
      labels: issue.labels.map(label => label.name),
      url: issue.html_url,
      assignees: issue.assignees?.map(a => a.login) || []
    };
    
    // You can use this data with various systems:
    
    // Example 1: Generate a task with GitHub Copilot
    // const generatedTask = await copilotAPI.generateTaskFromDescription(issueData);
    
    // Example 2: Create a task in a project management system
    // const projectTask = await projectManagementAPI.createTask(issueData);
    
    // Example 3: Create a local task in VS Code
    // await createVSCodeTask(issueData);
    
    // Example 4: Generate a todo item in a markdown file
    // await addToMarkdownTodoList(issueData);
    
    tasks.push({
      source: issue,
      // task: generatedTask // or projectTask, etc.
    });
  }
  
  return tasks;
}
```

## 6. Best Practices

1. **Token Management**: Never hardcode the GitHub token in your code. Use environment variables, secure secrets, or user configurations.

2. **Error Handling**: 
   ```javascript
   try {
     const issues = await issueSync.listIssues({ owner, repo });
   } catch (error) {
     // Handle different types of errors
     if (error.message.includes('Bad credentials')) {
       // Authentication problem     } else if (error.message.includes('Not Found')) {
       // Repository not found
     } else {
       // Other error
     }
   }
   ```

3. **Caching**: For high-traffic applications, cache results:
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 60 }); // Expires after 60 seconds

   async function getCachedIssues(owner, repo) {
     const cacheKey = `issues:${owner}:${repo}`;
     
     let issues = cache.get(cacheKey);
     if (!issues) {
       issues = await issueSync.listIssues({ owner, repo });
       cache.set(cacheKey, issues);
     }
     
     return issues;
   }
   ```

4. **Optimized Usage**: Use filters to minimize retrieved data:
   ```javascript
   // Retrieve only what you need
   const bugIssues = await issueSync.listIssues({
     owner,
     repo,
     state: 'open',
     labels: 'bug,critical'
   });
   ```

## 7. Complete Examples

For complete integration examples, see the following files:

- [VS Code Extension with Copilot](../examples/vscode-copilot-tasks-extension.js)
- [Express Web Application](../examples/web-app-integration.js)
- [Custom CLI Tool](../examples/custom-cli.js)

## 8. IssueSync Integration Benefits

1. **Simple API**: Clear and intuitive interface
2. **Flexibility**: Usable in various contexts
3. **Filtering Options**: Allows targeting exactly the needed issues
4. **Bidirectional Synchronization**: Copy issues between repositories
5. **Metadata Preservation**: Retention of labels, comments, etc.

## 9. Conclusion

IssueSync offers a versatile API for working with GitHub issues in any Node.js project. Whether you're building a web application, extension, CLI tool, or automation system, its flexible design adapts to your needs.
