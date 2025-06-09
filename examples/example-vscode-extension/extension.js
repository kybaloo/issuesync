const vscode = require('vscode');
const issueSync = require('issuesync'); // Notre bibliothèque

let initialized = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Extension "GitHub Task Generator" est activée');

  // Initialiser IssueSync avec le token GitHub si disponible
  initializeIssueSync();

  // Enregistrer la commande pour générer des tâches à partir d'issues GitHub
  let disposable = vscode.commands.registerCommand(
    'github-task-generator.generateTasksFromIssues', 
    generateTasksFromIssues
  );

  context.subscriptions.push(disposable);
}

/**
 * Initialise IssueSync avec le token GitHub depuis les paramètres
 */
function initializeIssueSync() {
  const config = vscode.workspace.getConfiguration('githubTaskGenerator');
  const token = config.get('token');
  
  if (token) {
    try {
      issueSync.init({ token });
      initialized = true;
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur d'initialisation: ${error.message}`);
    }
  }
  
  return false;
}

/**
 * Génère des tâches VS Code à partir d'issues GitHub
 */
async function generateTasksFromIssues() {
  // Vérifier si IssueSync est initialisé
  if (!initialized) {
    const shouldConfigure = await vscode.window.showErrorMessage(
      'GitHub token non configuré. Veuillez le configurer dans les paramètres.',
      'Configurer maintenant'
    );
    
    if (shouldConfigure) {
      vscode.commands.executeCommand(
        'workbench.action.openSettings', 
        'githubTaskGenerator.token'
      );
    }
    return;
  }
  
  try {
    // Récupérer les paramètres de configuration
    const config = vscode.workspace.getConfiguration('githubTaskGenerator');
    const defaultOwner = config.get('defaultOwner');
    const defaultRepo = config.get('defaultRepo');
    
    // Demander les détails du dépôt
    const owner = await vscode.window.showInputBox({
      value: defaultOwner,
      placeHolder: 'Propriétaire du dépôt (ex: microsoft)',
      prompt: 'Entrez le propriétaire du dépôt GitHub'
    });
    
    if (!owner) return;
    
    const repo = await vscode.window.showInputBox({
      value: defaultRepo,
      placeHolder: 'Nom du dépôt (ex: vscode)',
      prompt: 'Entrez le nom du dépôt GitHub'
    });
    
    if (!repo) return;
    
    // Récupérer les issues depuis GitHub
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
          state: 'open' 
        });
      }
    );
    
    if (!issues || issues.length === 0) {
      vscode.window.showInformationMessage(`Aucune issue trouvée dans ${owner}/${repo}`);
      return;
    }
    
    // Permettre à l'utilisateur de sélectionner une issue
    const selection = await vscode.window.showQuickPick(
      issues.map(issue => ({
        label: issue.title,
        description: `#${issue.number}`,
        detail: `Labels: ${issue.labels.map(l => l.name).join(', ')}`,
        issue
      })),
      { placeHolder: 'Sélectionnez une issue pour générer une tâche' }
    );
    
    if (!selection) return;
    
    const issue = selection.issue;
    
    // Générer et ajouter la tâche
    await createTaskFromIssue(issue);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Erreur: ${error.message}`);
  }
}

/**
 * Crée une tâche VS Code à partir d'une issue GitHub
 */
async function createTaskFromIssue(issue) {
  // Vérifier si un espace de travail est ouvert
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('Aucun espace de travail ouvert');
    return;
  }
  
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  
  // Demander le type de tâche à créer
  const taskType = await vscode.window.showQuickPick(
    [
      { label: 'Shell', description: 'Commande shell', value: 'shell' },
      { label: 'npm', description: 'Commande npm', value: 'npm' }
    ],
    { placeHolder: 'Sélectionnez le type de tâche' }
  );
  
  if (!taskType) return;
  
  // Demander la commande pour la tâche
  const command = await vscode.window.showInputBox({
    placeHolder: taskType.value === 'npm' ? 'test' : 'echo "Implémentation de #' + issue.number + '"',
    prompt: `Entrez la commande ${taskType.value} pour cette tâche`
  });
  
  if (!command) return;
  
  // Créer l'objet de tâche
  const task = {
    label: `GitHub #${issue.number}: ${issue.title}`,
    type: taskType.value,
    command: taskType.value === 'npm' ? 'npm' : command,
    args: taskType.value === 'npm' ? ['run', command] : [],
    problemMatcher: [],
    presentation: {
      reveal: 'always',
      panel: 'new',
      showReuseMessage: false
    },
    metadata: {
      source: 'github',
      issue: {
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      }
    }
  };
  
  // Ajouter la tâche au fichier tasks.json
  await addTaskToWorkspace(task, workspaceFolder);
  
  vscode.window.showInformationMessage(
    `Tâche créée pour l'issue #${issue.number}: ${issue.title}`
  );
}

/**
 * Ajoute une tâche au fichier tasks.json de l'espace de travail
 */
async function addTaskToWorkspace(task, workspaceFolder) {
  // Chemin vers le fichier tasks.json
  const tasksFilePath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'tasks.json');
  
  // Lecture du fichier tasks.json s'il existe
  let tasksConfig;
  try {
    const fileContent = await vscode.workspace.fs.readFile(tasksFilePath);
    tasksConfig = JSON.parse(fileContent.toString());
  } catch {
    // Le fichier n'existe pas ou n'est pas valide, créer un nouveau
    tasksConfig = {
      version: '2.0.0',
      tasks: []
    };
    
    // S'assurer que le dossier .vscode existe
    try {
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(workspaceFolder.uri, '.vscode')
      );
    } catch (error) {
      // Le dossier existe probablement déjà
    }
  }
  
  // Ajouter la nouvelle tâche
  tasksConfig.tasks.push(task);
  
  // Écrire le fichier mis à jour
  await vscode.workspace.fs.writeFile(
    tasksFilePath,
    Buffer.from(JSON.stringify(tasksConfig, null, 2))
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
