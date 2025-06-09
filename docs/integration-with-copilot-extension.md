<!--filepath: d:\Projects\Personal\IssueSync\docs\integration-with-copilot-extension.md -->
# Intégration d'IssueSync dans une extension VS Code utilisant Copilot

Ce guide explique comment intégrer la bibliothèque IssueSync dans une extension VS Code qui utilise Copilot pour générer des tâches. L'objectif est de permettre aux utilisateurs de créer des tâches à partir d'issues GitHub en utilisant à la fois IssueSync pour récupérer les données des issues et Copilot pour les transformer en tâches intelligentes.

## Prérequis

- Une extension VS Code existante qui génère des tâches avec Copilot
- Node.js et npm installés

## Étapes d'intégration

### 1. Installer IssueSync

Ajoutez IssueSync comme dépendance à votre extension VS Code :

```bash
npm install --save issuesync
```

### 2. Configurer l'authentification GitHub

Ajoutez une configuration pour stocker le token GitHub :

```javascript
// Dans le fichier package.json de votre extension
{
  "contributes": {
    "configuration": {
      "title": "Votre Extension",
      "properties": {
        "votreExtension.githubToken": {
          "type": "string",
          "default": "",
          "description": "Token GitHub pour accéder aux issues (scope: repo)"
        }
      }
    }
  }
}
```

### 3. Initialiser IssueSync

Ajoutez le code suivant dans votre extension pour initialiser IssueSync :

```javascript
const issueSync = require('issuesync');

// Dans votre fonction d'activation
function activate(context) {
  // Récupérer le token GitHub depuis les paramètres
  const config = vscode.workspace.getConfiguration('votreExtension');
  const githubToken = config.get('githubToken');
  
  // Initialiser IssueSync si le token est disponible
  if (githubToken) {
    issueSync.init({ token: githubToken });
  }
  
  // ... le reste de votre code d'activation
}
```

### 4. Ajouter une commande pour récupérer les issues

```javascript
// Enregistrer une commande pour récupérer les issues
const fetchIssuesCommand = vscode.commands.registerCommand('votreExtension.fetchIssues', async () => {
  try {
    // Vérifier si le token est configuré
    const config = vscode.workspace.getConfiguration('votreExtension');
    const githubToken = config.get('githubToken');
    
    if (!githubToken) {
      vscode.window.showErrorMessage('Token GitHub non configuré');
      return;
    }
    
    // Demander les détails du dépôt
    const owner = await vscode.window.showInputBox({ prompt: 'Propriétaire du dépôt GitHub' });
    if (!owner) return;
    
    const repo = await vscode.window.showInputBox({ prompt: 'Nom du dépôt GitHub' });
    if (!repo) return;
    
    // Récupérer les issues avec IssueSync
    const issues = await issueSync.listIssues({
      owner,
      repo,
      state: 'open'
    });
    
    if (issues.length === 0) {
      vscode.window.showInformationMessage('Aucune issue trouvée');
      return;
    }
    
    // Permettre à l'utilisateur de sélectionner des issues
    const selectedIssue = await vscode.window.showQuickPick(
      issues.map(issue => ({
        label: issue.title,
        description: `#${issue.number}`,
        issue: issue
      })),
      { placeHolder: 'Sélectionnez une issue' }
    );
    
    if (!selectedIssue) return;
    
    // Générer une tâche avec Copilot
    await generateTaskWithCopilot(selectedIssue.issue);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Erreur: ${error.message}`);
  }
});

context.subscriptions.push(fetchIssuesCommand);
```

### 5. Intégrer avec l'API Copilot

Voici comment vous pourriez intégrer les issues récupérées avec l'API Copilot pour générer des tâches :

```javascript
/**
 * Génère une tâche à partir d'une issue GitHub en utilisant Copilot
 * @param {Object} issue - Issue GitHub récupérée via IssueSync
 */
async function generateTaskWithCopilot(issue) {
  // Formatez l'issue pour Copilot
  const issueData = {
    title: issue.title,
    body: issue.body,
    labels: issue.labels.map(label => label.name),
    number: issue.number,
    url: issue.html_url
  };
  
  // Supposons que votre extension expose déjà une API pour générer des tâches avec Copilot
  const taskDescription = `
    Titre: ${issueData.title}
    Description: ${issueData.body || 'Aucune description'}
    Labels: ${issueData.labels.join(', ')}
    URL: ${issueData.url}
  `;
  
  // Appel à votre API existante qui utilise Copilot
  // Ceci est un exemple - remplacez-le par votre propre API
  const generatedTask = await votreCopilotAPI.generateTaskFromDescription(taskDescription);
  
  // Créer le fichier tasks.json avec la tâche générée
  await createTaskFile(generatedTask, issue);
  
  vscode.window.showInformationMessage(`Tâche créée pour l'issue #${issue.number}`);
}
```

### 6. Créer le fichier tasks.json

```javascript
/**
 * Crée ou met à jour le fichier tasks.json avec la nouvelle tâche
 * @param {Object} generatedTask - Tâche générée par Copilot
 * @param {Object} issue - Issue GitHub d'origine
 */
async function createTaskFile(generatedTask, issue) {
  // Vérifier si un espace de travail est ouvert
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    throw new Error('Aucun espace de travail ouvert');
  }
  
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const tasksJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'tasks.json');
  
  // Lire le fichier tasks.json existant ou créer un modèle
  let tasksConfig;
  try {
    const content = await vscode.workspace.fs.readFile(tasksJsonPath);
    tasksConfig = JSON.parse(content.toString());
  } catch {
    // Le fichier n'existe pas, créer un modèle
    tasksConfig = {
      version: '2.0.0',
      tasks: []
    };
    
    // S'assurer que le dossier .vscode existe
    await vscode.workspace.fs.createDirectory(
      vscode.Uri.joinPath(workspaceFolder.uri, '.vscode')
    );
  }
  
  // Ajouter la nouvelle tâche avec des métadonnées de l'issue
  const task = {
    ...generatedTask,
    metadata: {
      githubIssue: {
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      }
    }
  };
  
  tasksConfig.tasks.push(task);
  
  // Écrire le fichier mis à jour
  await vscode.workspace.fs.writeFile(
    tasksJsonPath,
    Buffer.from(JSON.stringify(tasksConfig, null, 2))
  );
}
```

## Exemple complet

Pour un exemple complet d'intégration, consultez [le code source d'exemple](../examples/vscode-copilot-tasks-extension.js) fourni avec IssueSync.

## Avantages de cette intégration

1. **Données réelles** : Utilise des issues GitHub réelles comme base pour les tâches
2. **Métadonnées préservées** : Conserve les liens vers les issues d'origine
3. **Interaction transparente** : L'utilisateur n'a pas besoin de quitter VS Code
4. **Génération intelligente** : Copilot peut analyser le contenu des issues pour créer des tâches adaptées
5. **Solution complète** : Combine les forces d'IssueSync et de Copilot en une seule expérience

## Conseils d'implémentation

- Gérez correctement les erreurs d'authentification et d'API
- Ajoutez une option pour rafraîchir les issues sans redémarrer l'extension
- Permettez aux utilisateurs de synchroniser plusieurs issues en une seule opération
- Ajoutez une option pour mettre à jour les tâches lorsque les issues sont mises à jour sur GitHub
- Considérez l'utilisation des fonctionnalités de filtrage d'IssueSync pour cibler certaines issues
