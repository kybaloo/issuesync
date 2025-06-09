/**
 * Exemple d'intégration avec une extension VS Code
 * 
 * Ce fichier démontre comment IssueSync pourrait être utilisé dans une extension VS Code.
 */

const vscode = require('vscode');
const issueSync = require('issuesync');

/**
 * Fonction d'activation de l'extension
 */
function activate(context) {
  // Initialisation avec le token GitHub (à partir des paramètres de l'extension)
  const config = vscode.workspace.getConfiguration('taskManagerExtension');
  const token = config.get('githubToken');
  
  if (token) {
    issueSync.init({ token });
  }
  
  // Commande pour créer des tâches à partir d'issues GitHub
  const createTasksCommand = vscode.commands.registerCommand('extension.createTasksFromGithub', async () => {
    // Vérifie si le token est configuré
    if (!token) {
      const configureNow = await vscode.window.showErrorMessage(
        'GitHub token non configuré. Veuillez le configurer dans les paramètres.',
        'Configurer maintenant'
      );
      
      if (configureNow) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'taskManagerExtension.githubToken');
      }
      return;
    }
    
    try {
      // Demander à l'utilisateur les informations du dépôt
      const owner = await vscode.window.showInputBox({
        placeHolder: 'Propriétaire du dépôt (ex: microsoft)',
        prompt: 'Entrez le propriétaire du dépôt GitHub'
      });
      
      if (!owner) return;
      
      const repo = await vscode.window.showInputBox({
        placeHolder: 'Nom du dépôt (ex: vscode)',
        prompt: 'Entrez le nom du dépôt GitHub'
      });
      
      if (!repo) return;
      
      // Récupérer les issues
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Récupération des issues de ${owner}/${repo}...`,
        cancellable: false
      }, async () => {
        // Récupérer les issues avec le statut ouvert
        const issues = await issueSync.listIssues({ 
          owner, 
          repo, 
          state: 'open' 
        });
        
        if (issues.length === 0) {
          vscode.window.showInformationMessage(`Aucune issue trouvée dans ${owner}/${repo}`);
          return;
        }
        
        // Afficher les issues dans une liste de sélection
        const selectedIssue = await vscode.window.showQuickPick(
          issues.map(issue => ({
            label: issue.title,
            description: `#${issue.number}`,
            detail: `Labels: ${issue.labels.map(l => l.name).join(', ')}`,
            issue
          })),
          { placeHolder: 'Sélectionnez une issue pour créer une tâche' }
        );
        
        if (!selectedIssue) return;
        
        // Ici, on peut passer l'issue à Copilot pour générer une tâche
        // Par exemple, en créant un fichier de tâche dans .vscode/tasks.json
        
        const taskTitle = selectedIssue.issue.title;
        const taskDescription = selectedIssue.issue.body || '';
        const taskLabels = selectedIssue.issue.labels.map(l => l.name);
        
        // Générer une tâche VS Code
        const task = {
          label: `GitHub #${selectedIssue.issue.number}: ${taskTitle}`,
          type: 'shell',
          command: 'echo "Travail sur tâche #${selectedIssue.issue.number}"',
          problemMatcher: [],
          group: {
            kind: 'build',
            isDefault: true
          },
          presentation: {
            reveal: 'always',
            panel: 'new'
          }
        };
        
        // Afficher la tâche générée ou l'enregistrer
        vscode.window.showInformationMessage(`Tâche créée: ${task.label}`);
        
        // Ici, on peut soit:
        // 1. Appeler la fonction de l'extension Copilot pour générer plus de détails
        // 2. Enregistrer directement dans le fichier tasks.json de l'espace de travail
        // 3. Exécuter la tâche immédiatement
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur: ${error.message}`);
    }
  });
  
  context.subscriptions.push(createTasksCommand);
}

/**
 * Fonction de désactivation de l'extension
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
