# IssueSync

IssueSync est une bibliothèque Node.js polyvalente pour lister et synchroniser les issues entre dépôts GitHub. Elle peut être utilisée comme un outil CLI autonome ou intégrée dans n'importe quel projet Node.js, y compris des applications web, extensions d'éditeur, systèmes d'automatisation ou autres outils personnalisés.

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

## Utilisation comme bibliothèque

Vous pouvez utiliser IssueSync comme bibliothèque dans divers projets Node.js :

```javascript
const issueSync = require('issuesync');

// Initialisation avec un token GitHub (optionnel si variable d'env définie)
issueSync.init({ token: 'votre_token_github' });

// Lister les issues d'un dépôt
async function getRepoIssues() {
  const issues = await issueSync.listIssues({
    owner: 'microsoft',
    repo: 'vscode',
    state: 'open',
    labels: 'bug,enhancement'
  });
  
  return issues;
}

// Synchroniser les issues entre dépôts
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
  
  console.log(`Créé ${result.created.length} issues`);
  console.log(`Ignoré ${result.skipped.length} issues`);
}
```

## Scénarios d'intégration

IssueSync peut être intégré dans différents contextes :

### 🌐 Applications Web
Créez des interfaces utilisateur pour gérer et synchroniser des issues GitHub.
[Voir l'exemple](./examples/web-app-integration.js)

### 🔄 Automatisation CI/CD
Synchronisez automatiquement les issues lors des déploiements.
[Voir l'exemple](./examples/ci-cd-integration.js)

### 🧰 Outils CLI personnalisés
Créez vos propres outils CLI adaptés à vos workflows.
[Voir l'exemple](./examples/custom-cli.js)

### 🧩 Extensions d'éditeur
Intégrez les fonctionnalités d'IssueSync dans VS Code ou d'autres éditeurs.
[Voir l'exemple](./examples/vscode-copilot-tasks-extension.js)

Pour plus d'informations sur l'intégration, consultez notre [Guide d'intégration](./docs/integration-guide.md).

### Référence API

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

## Exemples de cas d'utilisation

### 1. Synchronisation de projets client/interne

Synchronisez automatiquement les issues pertinentes entre votre dépôt de développement interne et le dépôt visible par le client.

```javascript
// Script de synchronisation automatique après déploiement
const issueSync = require('issuesync');
issueSync.init({ token: process.env.GITHUB_TOKEN });

async function syncClientRepo() {
  const result = await issueSync.syncIssues({
    sourceOwner: 'votre-entreprise',
    sourceRepo: 'projet-interne',
    targetOwner: 'votre-entreprise',
    targetRepo: 'projet-client',
    state: 'open',
    labels: 'client-visible,deployed'
  });
  
  console.log(`${result.created.length} issues synchronisées avec le repo client`);
}

syncClientRepo();
```

### 2. Dashboard de gestion d'issues

Créez un dashboard personnalisé pour suivre et gérer les issues à travers plusieurs dépôts.

```javascript
// Exemple Express simplifié
const express = require('express');
const issueSync = require('issuesync');
const app = express();

issueSync.init({ token: process.env.GITHUB_TOKEN });

app.get('/dashboard', async (req, res) => {
  const repos = [
    { owner: 'votre-org', repo: 'projet-1' },
    { owner: 'votre-org', repo: 'projet-2' }
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

### 3. Intégration avec les outils de gestion de tâches

Utilisez IssueSync pour créer des tâches basées sur des issues GitHub dans VS Code ou d'autres systèmes.

```javascript
// Exemple dans une extension VS Code
const vscode = require('vscode');
const issueSync = require('issuesync');

function activate(context) {
  // Commande pour créer des tâches à partir des issues GitHub
  let disposable = vscode.commands.registerCommand('extension.createTasksFromIssues', async () => {
    // Configuration
    const config = vscode.workspace.getConfiguration('myExtension');
    const token = config.get('githubToken');
    
    // Initialiser IssueSync
    issueSync.init({ token });
    
    try {
      // Récupérer et présenter les issues
      const owner = await vscode.window.showInputBox({ prompt: 'Propriétaire du dépôt' });
      const repo = await vscode.window.showInputBox({ prompt: 'Nom du dépôt' });
      const issues = await issueSync.listIssues({ owner, repo, state: 'open' });
      
      const selectedIssue = await vscode.window.showQuickPick(
        issues.map(issue => ({
          label: issue.title,
          description: `#${issue.number}`,
          issue
        }))
      );
      
      if (selectedIssue) {
        // Créer une tâche à partir de l'issue sélectionnée
        await createTask(selectedIssue.issue);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}
```

## Fonctionnalités

- **Multi-fonctionnel** : Utilisable comme bibliothèque dans tout projet Node.js ou comme outil CLI
- **Flexible** : S'intègre dans différents contextes (web, CLI, automatisation, extensions)
- **Puissant** : Listing et filtrage avancés des issues GitHub
- **Synchronisation complète** : Transfert des issues entre dépôts avec conservation des métadonnées
- **Intelligent** : Création automatique des étiquettes et gestion des duplications
- **API simple** : Interface claire et bien documentée
- **Extensible** : Facile à étendre pour des besoins spécifiques

## Requirements

- Node.js v14 or higher
- GitHub Personal Access Token with repo scope

## Limitations

- Due to GitHub API rate limits, very large repositories might require multiple runs
- The tool uses issue title matching to determine duplicates
- The original issue authors will not be preserved (issues are created by the token owner)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
