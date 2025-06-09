/**
 * Exemple d'intégration avec une extension VS Code utilisant Copilot pour les tâches
 * 
 * Ce fichier montre comment IssueSync peut être intégré dans une extension
 * qui utilise Copilot pour générer des tâches à partir d'issues GitHub.
 */

const vscode = require('vscode');
const issueSync = require('issuesync'); // Notre bibliothèque
// Hypothétique API de l'extension Copilot pour les tâches
const copilotTaskAPI = require('copilot-tasks-api');

/**
 * Fonction d'activation de l'extension
 */
function activate(context) {
  console.log('Extension "VS Code Copilot Tasks avec IssueSync" est activée');

  // Configuration de l'extension
  const config = vscode.workspace.getConfiguration('copilotTaskExtension');
  const token = config.get('githubToken');
  
  if (token) {
    issueSync.init({ token });
  }
  
  // Commande pour générer des tâches avec Copilot à partir d'issues GitHub
  const generateTaskCommand = vscode.commands.registerCommand('extension.generateTasksFromGithubIssues', async () => {
    try {
      // 1. Récupérer les issues GitHub avec IssueSync
      const repoDetails = await promptForRepositoryDetails();
      if (!repoDetails) return;
      
      const { owner, repo, state } = repoDetails;
      
      // Afficher un indicateur de progression pendant la récupération des issues
      const issues = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Récupération des issues de ${owner}/${repo}...`,
          cancellable: false
        },
        async () => {
          return await issueSync.listIssues({ 
            owner, 
            repo, 
            state: state || 'open'
          });
        }
      );
      
      if (!issues || issues.length === 0) {
        vscode.window.showInformationMessage(`Aucune issue trouvée dans ${owner}/${repo}`);
        return;
      }
      
      // 2. Permettre à l'utilisateur de sélectionner les issues à utiliser
      const selectedIssues = await promptForIssueSelection(issues);
      if (!selectedIssues || selectedIssues.length === 0) return;
      
      // 3. Pour chaque issue sélectionnée, générer une tâche avec Copilot
      for (const issue of selectedIssues) {
        // Formater l'issue pour Copilot
        const issueData = {
          title: issue.title,
          description: issue.body || '',
          number: issue.number,
          labels: issue.labels.map(label => label.name),
          url: issue.html_url,
          state: issue.state
        };
        
        // Utiliser l'API Copilot pour générer une tâche
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Génération d'une tâche pour l'issue #${issue.number}...`,
            cancellable: false
          },
          async () => {
            try {
              // Appel hypothétique à l'API Copilot
              const generatedTask = await copilotTaskAPI.generateTaskFromIssue(issueData);
              
              // Ajouter la tâche au fichier tasks.json
              await addTaskToWorkspace(generatedTask, issue);
              
              vscode.window.showInformationMessage(
                `Tâche créée pour l'issue #${issue.number}: ${issue.title}`
              );
            } catch (error) {
              vscode.window.showErrorMessage(
                `Erreur lors de la génération de la tâche pour l'issue #${issue.number}: ${error.message}`
              );
            }
          }
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur: ${error.message}`);
    }
  });
  
  context.subscriptions.push(generateTaskCommand);
}

/**
 * Demande à l'utilisateur de fournir les détails du dépôt GitHub
 */
async function promptForRepositoryDetails() {
  // Demander le propriétaire du dépôt
  const owner = await vscode.window.showInputBox({
    placeHolder: 'Propriétaire du dépôt (ex: microsoft)',
    prompt: 'Entrez le propriétaire du dépôt GitHub'
  });
  
  if (!owner) return null;
  
  // Demander le nom du dépôt
  const repo = await vscode.window.showInputBox({
    placeHolder: 'Nom du dépôt (ex: vscode)',
    prompt: 'Entrez le nom du dépôt GitHub'
  });
  
  if (!repo) return null;
  
  // Demander l'état des issues à récupérer
  const state = await vscode.window.showQuickPick(
    [
      { label: 'Ouvertes', description: 'Issues ouvertes', value: 'open' },
      { label: 'Fermées', description: 'Issues fermées', value: 'closed' },
      { label: 'Toutes', description: 'Toutes les issues', value: 'all' }
    ],
    { placeHolder: 'Sélectionnez l\'état des issues à récupérer' }
  );
  
  if (!state) return null;
  
  return { owner, repo, state: state.value };
}

/**
 * Permet à l'utilisateur de sélectionner les issues à utiliser
 */
async function promptForIssueSelection(issues) {
  const issueItems = issues.map(issue => ({
    label: issue.title,
    description: `#${issue.number}`,
    detail: `Labels: ${issue.labels.map(l => l.name).join(', ')}`,
    issue
  }));
  
  return await vscode.window.showQuickPick(
    issueItems,
    { 
      placeHolder: 'Sélectionnez des issues pour générer des tâches', 
      canPickMany: true 
    }
  ).then(selections => selections?.map(selection => selection.issue) || []);
}

/**
 * Ajoute une tâche générée au fichier tasks.json de l'espace de travail
 */
async function addTaskToWorkspace(generatedTask, issue) {
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
  
  // Formater la tâche générée par Copilot
  const task = {
    ...generatedTask,
    label: `GitHub #${issue.number}: ${generatedTask.label || issue.title}`,
    problemMatcher: generatedTask.problemMatcher || [],
    presentation: generatedTask.presentation || {
      reveal: 'always',
      panel: 'shared',
      showReuseMessage: false
    },
    // Ajouter des métadonnées pour lier la tâche à l'issue
    metadata: {
      githubIssue: {
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      }
    }
  };
  
  // Ajouter la nouvelle tâche
  tasksConfig.tasks.push(task);
  
  // Écrire le fichier mis à jour
  await vscode.workspace.fs.writeFile(
    tasksJsonPath,
    Buffer.from(JSON.stringify(tasksConfig, null, 2))
  );
}

/**
 * Fonction de désactivation de l'extension
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
