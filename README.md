# IssueSync

A Node.js library and CLI tool for listing and synchronizing GitHub issues between repositories. Perfect for repository migrations, issue management dashboards, and automation workflows.

## Features

- 📋 **List and filter** GitHub issues with advanced options
- 🔄 **Sync issues** between repositories with metadata preservation
- 🏷️ **Smart duplicate detection** and automatic label creation
- 🛠️ **Dual interface**: Use as CLI tool or integrate as a library
- 🔧 **Extensible**: Easy to integrate into web apps, CI/CD, or VS Code extensions

## Quick Start

### Installation

```bash
# CLI tool
npm install -g issuesync

# Library
npm install issuesync
```

### Setup

Get a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` scope:

```bash
# Set environment variable
export GITHUB_TOKEN=your_token_here

# Or create .env file
echo "GITHUB_TOKEN=your_token_here" > .env
```

## Usage

### CLI Commands

**List issues:**
```bash
issuesync list --owner microsoft --repo vscode --state open --labels bug,enhancement
```

**Sync issues:**
```bash
issuesync sync --source-owner facebook --source-repo react --target-owner myorg --target-repo react-fork
```

### Library Usage

```javascript
const issueSync = require('issuesync');

// Initialize (token optional if env var set)
issueSync.init({ token: 'your_token' });

// List issues
const issues = await issueSync.listIssues({
  owner: 'microsoft',
  repo: 'vscode',
  state: 'open',
  labels: 'bug,enhancement'
});

// Sync issues
const result = await issueSync.syncIssues({
  sourceOwner: 'sourceOwner',
  sourceRepo: 'sourceRepo',
  targetOwner: 'targetOwner',
  targetRepo: 'targetRepo',
  syncComments: true
});

console.log(`Created: ${result.created.length}, Skipped: ${result.skipped.length}`);
```

## Integration Examples

### 🌐 Web Dashboard
```javascript
app.get('/issues', async (req, res) => {
  const issues = await issueSync.listIssues({ owner: 'myorg', repo: 'project' });
  res.json(issues);
});
```

### 🔄 CI/CD Automation
```javascript
// Sync issues after deployment
await issueSync.syncIssues({
  sourceOwner: 'internal', sourceRepo: 'app',
  targetOwner: 'client', targetRepo: 'app',
  labels: 'client-visible'
});
```

### 🧩 VS Code Extension
```javascript
const issues = await issueSync.listIssues({ owner, repo });
const selected = await vscode.window.showQuickPick(
  issues.map(i => ({ label: i.title, description: `#${i.number}` }))
);
```

**More examples:** [`./examples/`](./examples/) | **Integration guide:** [`./docs/integration-guide.md`](./docs/integration-guide.md)

## API Reference

### `init(options)`
Initialize with GitHub token.
- `options.token` - GitHub token (optional if `GITHUB_TOKEN` env var set)

### `listIssues(options)`
List repository issues.
- `owner`, `repo` - Repository details (required)
- `state` - `'open'`, `'closed'`, `'all'` (default: `'open'`)
- `labels` - Comma-separated labels filter
- `verbose` - Show detailed info

### `syncIssues(options)`
Sync issues between repositories.
- `sourceOwner`, `sourceRepo` - Source repository (required)
- `targetOwner`, `targetRepo` - Target repository (required)
- `state`, `labels` - Filter options
- `syncComments` - Include comments (default: `true`)

Returns: `{ created: [], skipped: [], total: number }`

## Requirements & Limitations

**Requirements:**
- Node.js v14+
- GitHub Personal Access Token with `repo` scope

**Limitations:**
- Rate limits may require multiple runs for large repos
- Duplicate detection uses issue title matching
- Original authors not preserved (issues created by token owner)

## Contributing

Contributions welcome! Please submit a Pull Request.
