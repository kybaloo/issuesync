<!--filepath: d:\Projects\Personal\IssueSync\docs\integration-guide.md -->
# Guide d'intégration d'IssueSync

Ce guide explique comment intégrer la bibliothèque IssueSync dans différents types de projets. IssueSync est conçu pour être flexible et peut être intégré dans de nombreux contextes :

- Applications web (React, Vue, Angular, etc.)
- Services backend (Express, NestJS, etc.)
- Extensions VS Code ou autres éditeurs
- Outils CLI personnalisés
- Systèmes d'automatisation CI/CD
- Applications de gestion de projet
- Dashboards de suivi

## Prérequis

- Node.js v14+ et npm installés
- Un projet Node.js existant
- Un token GitHub avec les permissions nécessaires

## 1. Installation

Installez IssueSync dans votre projet :

```bash
npm install --save issuesync
# ou avec yarn
yarn add issuesync
```

## 2. Initialisation

Initialisez IssueSync avec votre token GitHub :

```javascript
const issueSync = require('issuesync');

// Option 1: Token fourni directement
issueSync.init({ token: 'votre-token-github' });

// Option 2: Token depuis une variable d'environnement
// (assurez-vous que process.env.GITHUB_TOKEN est défini)
issueSync.init();
```

## 3. Utilisation de base

### Lister les issues

```javascript
async function getIssues() {
  const issues = await issueSync.listIssues({
    owner: 'propriétaire',
    repo: 'dépôt',
    state: 'open',
    labels: 'bug,enhancement'
  });
  
  console.log(`${issues.length} issues récupérées`);
  return issues;
}
```

### Synchroniser les issues

```javascript
async function syncIssues() {
  const result = await issueSync.syncIssues({
    sourceOwner: 'source-propriétaire',
    sourceRepo: 'source-dépôt',
    targetOwner: 'cible-propriétaire',
    targetRepo: 'cible-dépôt',
    state: 'open',
    syncComments: true
  });
  
  console.log(`${result.created.length} issues créées, ${result.skipped.length} ignorées`);
  return result;
}
```

## 4. Scénarios d'intégration courants

### Application Web

```javascript
// Exemple avec Express
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
  console.log('Serveur démarré sur http://localhost:3000');
});
```

### Extension VS Code

```javascript
const vscode = require('vscode');
const issueSync = require('issuesync');

function activate(context) {
  // Récupérer le token depuis la configuration
  const config = vscode.workspace.getConfiguration('monExtension');
  const token = config.get('githubToken');
  
  // Initialiser IssueSync
  if (token) {
    issueSync.init({ token });
  }
  
  // Commande pour récupérer des issues
  let disposable = vscode.commands.registerCommand('monExtension.getIssues', async () => {
    const owner = await vscode.window.showInputBox({ prompt: 'Propriétaire du dépôt' });
    const repo = await vscode.window.showInputBox({ prompt: 'Nom du dépôt' });
    
    if (owner && repo) {
      const issues = await issueSync.listIssues({ owner, repo });
      
      // Afficher les issues dans une liste
      const selected = await vscode.window.showQuickPick(
        issues.map(issue => ({ label: issue.title, issue }))
      );
      
      if (selected) {
        // Utiliser l'issue sélectionnée...
      }
    }
  });
  
  context.subscriptions.push(disposable);
}

exports.activate = activate;
```

### Outil CLI personnalisé

```javascript
const { Command } = require('commander');
const inquirer = require('inquirer');
const issueSync = require('issuesync');
const program = new Command();

// Initialiser avec le token d'environnement
issueSync.init();

program
  .command('issues')
  .description('Récupérer les issues d\'un dépôt')
  .action(async () => {
    const answers = await inquirer.prompt([
      { name: 'owner', message: 'Propriétaire du dépôt:' },
      { name: 'repo', message: 'Nom du dépôt:' },
      { name: 'state', message: 'État (open/closed/all):', default: 'open' }
    ]);
    
    const issues = await issueSync.listIssues(answers);
    
    console.table(
      issues.map(issue => ({
        '#': issue.number,
        'Titre': issue.title,
        'État': issue.state,
        'Labels': issue.labels.map(l => l.name).join(', ')
      }))
    );
  });

program.parse(process.argv);
```

### Système d'automatisation CI/CD

```javascript
// Script d'automatisation pour synchroniser les issues après un déploiement
const issueSync = require('issuesync');

async function syncAfterDeploy() {
  try {
    console.log('Synchronisation des issues après déploiement...');
    
    // Initialiser avec le token CI/CD
    issueSync.init({ token: process.env.GH_TOKEN });
    
    // Synchroniser les issues pertinentes
    const result = await issueSync.syncIssues({
      sourceOwner: 'org-principale',
      sourceRepo: 'repo-principal',
      targetOwner: 'org-client',
      targetRepo: 'repo-client',
      state: 'open',
      labels: 'deployed', // Synchroniser uniquement les issues avec ce label
      syncComments: true
    });
    
    console.log(`Synchronisation terminée: ${result.created.length} issues créées`);
    return result;
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
syncAfterDeploy();
```

## 5. Intégration avec des systèmes de tâches

IssueSync peut être utilisé pour alimenter divers systèmes de gestion de tâches, comme dans cet exemple avec une extension VS Code utilisant Copilot pour générer des tâches intelligentes :

```javascript
async function generateTasksFromIssues(issues) {
  const tasks = [];
  
  for (const issue of issues) {
    // Formater l'issue pour le système de tâches
    const issueData = {
      id: issue.number,
      title: issue.title,
      description: issue.body || '',
      labels: issue.labels.map(label => label.name),
      url: issue.html_url,
      assignees: issue.assignees?.map(a => a.login) || []
    };
    
    // Vous pouvez utiliser ces données avec divers systèmes :
    
    // Exemple 1: Générer une tâche avec GitHub Copilot
    // const generatedTask = await copilotAPI.generateTaskFromDescription(issueData);
    
    // Exemple 2: Créer une tâche dans un système de gestion de projet
    // const projectTask = await projectManagementAPI.createTask(issueData);
    
    // Exemple 3: Créer une tâche locale dans VS Code
    // await createVSCodeTask(issueData);
    
    // Exemple 4: Générer un élément todo dans un fichier markdown
    // await addToMarkdownTodoList(issueData);
    
    tasks.push({
      source: issue,
      // task: generatedTask // ou projectTask, etc.
    });
  }
  
  return tasks;
}
```

## 6. Bonnes pratiques

1. **Gestion du token** : Ne stockez jamais le token GitHub en dur dans votre code. Utilisez des variables d'environnement, des secrets sécurisés ou des configurations utilisateur.

2. **Gestion d'erreurs** : 
   ```javascript
   try {
     const issues = await issueSync.listIssues({ owner, repo });
   } catch (error) {
     // Gestion des différents types d'erreurs
     if (error.message.includes('Bad credentials')) {
       // Problème d'authentification
     } else if (error.message.includes('Not Found')) {
       // Dépôt non trouvé
     } else {
       // Autre erreur
     }
   }
   ```

3. **Mise en cache** : Pour les applications à fort trafic, mettez en cache les résultats :
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 60 }); // Expire après 60 secondes

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

4. **Utilisation optimisée** : Utilisez les filtres pour minimiser les données récupérées :
   ```javascript
   // Récupérer uniquement ce dont vous avez besoin
   const bugIssues = await issueSync.listIssues({
     owner,
     repo,
     state: 'open',
     labels: 'bug,critical'
   });
   ```

## 7. Exemples complets

Pour des exemples complets d'intégration, consultez les fichiers suivants :

- [Extension VS Code avec Copilot](../examples/vscode-copilot-tasks-extension.js)
- [Application Web Express](../examples/web-app-integration.js) (exemple hypothétique)
- [Outil CLI personnalisé](../examples/custom-cli.js) (exemple hypothétique)

## 8. Atouts d'IssueSync pour l'intégration

1. **API simple** : Interface claire et intuitive
2. **Flexibilité** : Utilisable dans divers contextes
3. **Options de filtrage** : Permet de cibler exactement les issues nécessaires
4. **Synchronisation bidirectionnelle** : Copier les issues entre dépôts
5. **Préservation des métadonnées** : Conservation des labels, commentaires, etc.

## 9. Conclusion

IssueSync offre une API polyvalente pour travailler avec les issues GitHub dans n'importe quel projet Node.js. Que vous construisiez une application web, une extension, un outil CLI ou un système d'automatisation, sa conception flexible s'adapte à vos besoins.
