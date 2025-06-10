/**
 * Example of integration with a VS Code extension
 * 
 * This file demonstrates how issuesync could be used in a VS Code extension.
 */

const vscode = require('vscode');
const issuesync = require('issuesync');

/**
 * Extension activation function
 */
function activate(context) {
  // Initialize with GitHub token (from extension settings)
  const config = vscode.workspace.getConfiguration('taskManagerExtension');
  const token = config.get('githubToken');
  
  if (token) {
    issuesync.init({ token });
  }
  
  // Command to create tasks from GitHub issues
  const createTasksCommand = vscode.commands.registerCommand('extension.createTasksFromGithub', async () => {
    // Verify if the token is configured
    if (!token) {
      const configureNow = await vscode.window.showErrorMessage(
        'GitHub token not configured. Please configure it in the settings.',
        'Configure Now'
      );
      
      if (configureNow) {
        vscode.commands.executeCommand('workbench.action.openSettings', 'taskManagerExtension.githubToken');
      }
      return;
    }
    
    try {
      // ask the user for the repository information
      const owner = await vscode.window.showInputBox({
        placeHolder: 'Owner of the repository (ex: microsoft)',
        prompt: 'Enter the owner of the GitHub repository'
      });
      
      if (!owner) return;
      
      const repo = await vscode.window.showInputBox({
        placeHolder: 'Name of the repository (ex: vscode)',
        prompt: 'Enter the name of the GitHub repository'
      });
      
      if (!repo) return;
      
      // retrieve issues
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Retrieving issues from ${owner}/${repo}...`,
        cancellable: false
      }, async () => {
        // retrieve issues with the status open
        const issues = await issuesync.listissues({ 
          owner, 
          repo, 
          state: 'open' 
        });
        
        if (issues.length === 0) {
          vscode.window.showInformationMessage(`No issues found in ${owner}/${repo}`);
          return;
        }

        // display the issues in a selection list
        const selectedIssue = await vscode.window.showQuickPick(
          issues.map(issue => ({
            label: issue.title,
            description: `#${issue.number}`,
            detail: `Labels: ${issue.labels.map(l => l.name).join(', ')}`,
            issue
          })),
          { placeHolder: 'Select an issue to create a task for' }
        );
        
        if (!selectedIssue) return;

        // Here, we can pass the issue to Copilot to generate a task
        // For example, by creating a task file in .vscode/tasks.json

        const taskTitle = selectedIssue.issue.title;
        const taskDescription = selectedIssue.issue.body || '';
        const taskLabels = selectedIssue.issue.labels.map(l => l.name);
        
        // generate une task VS Code
        const task = {
          label: `GitHub #${selectedIssue.issue.number}: ${taskTitle}`,
          type: 'shell',
          command: 'echo "Working on task #${selectedIssue.issue.number}"',
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

        // display the generated task or save it
        vscode.window.showInformationMessage(`Task created: ${task.label}`);

        // Here, we can either:
        // 1. Call the Copilot extension function to generate more details
        // 2. Save it directly to the tasks.json file in the workspace
        // 3. Execute the task immediately
      });
    } catch (error) {
      vscode.window.showErrorMessage(`error: ${error.message}`);
    }
  });
  
  context.subscriptions.push(createTasksCommand);
}

/**
 * Extension Disable Function
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
