# IssueSync

IssueSync is a versatile Node.js library for listing and synchronizing issues between GitHub repositories. It can be used as a standalone CLI tool or integrated into any Node.js project, including web applications, editor extensions, automation systems, or other custom tools.

## Installation

### As a CLI tool

```bash
# Install globally
npm install -g issuesync

# Or clone the repository
git clone https://github.com/yourusername/issuesync.git
cd issuesync
npm install
```

### As a library in your project

```bash
npm install --save issuesync
```

## Configuration

### For CLI use

Create a `.env` file in the root directory:

```
GITHUB_TOKEN=your_token_here
```

### For library use

You can either:
1. Set the `GITHUB_TOKEN` environment variable in your application
2. Pass the token directly when initializing the library

To get a GitHub token:

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with `repo` scope
3. Copy the token to your `.env` file or use it in your code

## Usage

### Listing Issues

To list issues from a repository:

```bash
node index.js list --owner <owner> --repo <repository>
```

#### Options for listing issues

```
--owner, -o       Repository owner [required]
--repo, -r        Repository name [required]
--state, -s       Issue state: open, closed, or all [default: "open"]
--labels, -l      Filter by labels (comma-separated)
--verbose, -v     Show more details
```

Example with filters:

```bash
node index.js list --owner microsoft --repo vscode --state all --labels bug,enhancement --verbose
```

### Synchronizing Issues

To synchronize issues between repositories:

```bash
node index.js sync --source-owner <owner> --source-repo <repository> --target-owner <owner> --target-repo <repository>
```

#### Options for synchronizing issues

```
--source-owner    Source repository owner [required]
--source-repo     Source repository name [required]
--target-owner    Target repository owner [required]
--target-repo     Target repository name [required]
--state, -s       Issues state to sync: open, closed, or all [default: "open"]
--labels, -l      Filter issues by labels (comma-separated)
--sync-comments   Sync issue comments [default: true]
```

Example with filters:

```bash
node index.js sync --source-owner facebook --source-repo react --target-owner myorg --target-repo react-fork --state open --labels bug
```

## Library Usage

You can use IssueSync as a library in various Node.js projects:

```javascript
const issueSync = require('issuesync');

// Initialize with a GitHub token (optional if environment variable is defined)
issueSync.init({ token: 'your_github_token' });

// List issues from a repository
async function getRepoIssues() {
  const issues = await issueSync.listIssues({
    owner: 'microsoft',
    repo: 'vscode',
    state: 'open',
    labels: 'bug,enhancement'
  });
  
  return issues;
}

// Synchronize issues between repositories
async function migrateIssues() {
  const result = await issueSync.syncIssues({
    sourceOwner: 'sourceOwner',
    sourceRepo: 'sourceRepo',
    targetOwner: 'targetOwner',
    targetRepo: 'targetRepo',
    state: 'open',
    labels: 'bug',
    syncComments: true
  });
  
  console.log(`Created ${result.created.length} issues`);
  console.log(`Skipped ${result.skipped.length} issues`);
}
```

## Integration Scenarios

IssueSync can be integrated in different contexts:

### 🌐 Web Applications
Create user interfaces to manage and synchronize GitHub issues.
[See example](./examples/web-app-integration.js)

### 🔄 CI/CD Automation
Automatically synchronize issues during deployments.
[See example](./examples/ci-cd-integration.js)

### 🧰 Custom CLI Tools
Create your own CLI tools adapted to your workflows.
[See example](./examples/custom-cli.js)

### 🧩 Editor Extensions
Integrate IssueSync features into VS Code or other editors.
[See example](./examples/vscode-copilot-tasks-extension.js)

For more information on integration, see our [Integration Guide](./docs/integration-guide.md).

### API Reference

#### `init(options)`

Initialize the GitHub client with your credentials.

- `options.token`: GitHub API token (optional if GITHUB_TOKEN env var is set)

#### `listIssues(options)`

List issues from a GitHub repository.

- `options.owner`: Repository owner (required)
- `options.repo`: Repository name (required)
- `options.state`: Issue state ('open', 'closed', 'all') (default: 'open')
- `options.labels`: Comma-separated list of labels (default: '')
- `options.verbose`: Show more details (default: false)

Returns a Promise resolving to an array of issues.

#### `syncIssues(options)`

Synchronize issues between repositories.

- `options.sourceOwner`: Source repository owner (required)
- `options.sourceRepo`: Source repository name (required)
- `options.targetOwner`: Target repository owner (required)
- `options.targetRepo`: Target repository name (required)
- `options.state`: Issues state to sync (default: 'open')
- `options.labels`: Filter by labels (default: '')
- `options.syncComments`: Whether to sync comments (default: true)

Returns a Promise resolving to an object with:
- `created`: Array of created issues
- `skipped`: Array of skipped issues (already exist)
- `total`: Total number of source issues

## Use Case Examples

### 1. Client/Internal Project Synchronization

Automatically synchronize relevant issues between your internal development repository and the client-visible repository.

```javascript
// Automatic synchronization script after deployment
const issueSync = require('issuesync');
issueSync.init({ token: process.env.GITHUB_TOKEN });

async function syncClientRepo() {
  const result = await issueSync.syncIssues({
    sourceOwner: 'your-company',
    sourceRepo: 'internal-project',
    targetOwner: 'your-company',
    targetRepo: 'client-project',
    state: 'open',
    labels: 'client-visible,deployed'
  });
  
  console.log(`${result.created.length} issues synchronized with client repo`);
}

syncClientRepo();
```

### 2. Issue Management Dashboard

Create a custom dashboard to track and manage issues across multiple repositories.

```javascript
// Simplified Express example
const express = require('express');
const issueSync = require('issuesync');
const app = express();

issueSync.init({ token: process.env.GITHUB_TOKEN });

app.get('/dashboard', async (req, res) => {
  const repos = [
    { owner: 'your-org', repo: 'project-1' },
    { owner: 'your-org', repo: 'project-2' }
  ];
  
  const allIssues = [];
  
  for (const repo of repos) {
    const issues = await issueSync.listIssues({
      owner: repo.owner,
      repo: repo.repo,
      state: 'open'
    });
    
    allIssues.push(...issues.map(issue => ({
      ...issue,
      repo: repo.repo
    })));
  }
  
  res.render('dashboard', { issues: allIssues });
});
```

### 3. Integration with Task Management Tools

Use IssueSync to create tasks based on GitHub issues in VS Code or other systems.

```javascript
// Example in a VS Code extension
const vscode = require('vscode');
const issueSync = require('issuesync');

function activate(context) {
  // Command to create tasks from GitHub issues
  let disposable = vscode.commands.registerCommand('extension.createTasksFromIssues', async () => {
    // Configuration
    const config = vscode.workspace.getConfiguration('myExtension');
    const token = config.get('githubToken');
    
    // Initialize IssueSync
    issueSync.init({ token });
    
    try {      // Retrieve and present issues
      const owner = await vscode.window.showInputBox({ prompt: 'Repository owner' });
      const repo = await vscode.window.showInputBox({ prompt: 'Repository name' });
      const issues = await issueSync.listIssues({ owner, repo, state: 'open' });
      
      const selectedIssue = await vscode.window.showQuickPick(
        issues.map(issue => ({
          label: issue.title,
          description: `#${issue.number}`,
          issue
        }))
      );
      
      if (selectedIssue) {
        // Create a task from the selected issue
        await createTask(selectedIssue.issue);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}
```

## Features

- **Multi-functional**: Usable as a library in any Node.js project or as a CLI tool
- **Flexible**: Integrates in different contexts (web, CLI, automation, extensions)
- **Powerful**: Advanced GitHub issue listing and filtering
- **Complete synchronization**: Transfer issues between repositories with metadata preservation
- **Intelligent**: Automatic label creation and duplicate management
- **Simple API**: Clear and well-documented interface
- **Extensible**: Easy to extend for specific needs

## Requirements

- Node.js v14 or higher
- GitHub Personal Access Token with repo scope

## Limitations

- Due to GitHub API rate limits, very large repositories might require multiple runs
- The tool uses issue title matching to determine duplicates
- The original issue authors will not be preserved (issues are created by the token owner)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
