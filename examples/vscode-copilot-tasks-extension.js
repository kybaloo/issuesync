/**
 * Example of integration with a VS Code extension using Copilot for tasks
 * 
 * This file shows how issuesync can be integrated into an extension
 * that uses Copilot to generate tasks from GitHub issues.
 */

const vscode = require('vscode');
const issuesync = require('issuesync'); // Our library
// Hypothetical Copilot task extension API
const copilotTaskAPI = require('copilot-tasks-api');

/**
 * Extension activation function
 */
function activate(context) {
  console.log('Extension is activated');

  // Configuration of the extension
  const config = vscode.workspace.getConfiguration('copilotTaskExtension');
  const token = config.get('githubToken');
  
  if (token) {
    issuesync.init({ token });
  }
  
  // Command to generate tasks with Copilot from GitHub issues
  const generateTaskCommand = vscode.commands.registerCommand('extension.generateTasksFromGithubissues', async () => {
    try {
      // 1. retrieve les issues GitHub with issuesync
      const repoDetails = await promptForRepositoryDetails();
      if (!repoDetails) return;
      
      const { owner, repo, state } = repoDetails;
      
      // display a progress indicator during the retrieval of the issues
      const issues = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Retrieving issues from ${owner}/${repo}...`,
          cancellable: false
        },
        async () => {
          return await issuesync.listissues({ 
            owner, 
            repo, 
            state: state || 'open'
          });
        }
      );
      
      if (!issues || issues.length === 0) {
        vscode.window.showInformationMessage(`No issues found in ${owner}/${repo}`);
        return;
      }

      // 2. allow the user to select the issues to use
      const selectedIssues = await promptForIssueSelection(issues);
      if (!selectedIssues || selectedIssues.length === 0) return;

      // 3. for each selected issue, generate a task with Copilot
      for (const issue of selectedIssues) {
        // Format the issue for Copilot
        const issueData = {
          title: issue.title,
          description: issue.body || '',
          number: issue.number,
          labels: issue.labels.map(label => label.name),
          url: issue.html_url,
          state: issue.state
        };

        // Use the Copilot API to generate a task
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Generating task for issue #${issue.number}...`,
            cancellable: false
          },
          async () => {
            try {
              // Hypothetical call to the Copilot API
              const generatedTask = await copilotTaskAPI.generateTaskFromIssue(issueData);

              // Add the task to the tasks.json file
              await addTaskToWorkspace(generatedTask, issue);
              
              vscode.window.showInformationMessage(
                `Task created for issue #${issue.number}: ${issue.title}`
              );
            } catch (error) {
              vscode.window.showErrorMessage(
                `Error during generation of the task for issue #${issue.number}: ${error.message}`
              );
            }
          }
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`error: ${error.message}`);
    }
  });
  
  context.subscriptions.push(generateTaskCommand);
}

/**
 * Prompt the user for the details of the GitHub repository
 */
async function promptForRepositoryDetails() {
  // Ask for the owner of the repository
  const owner = await vscode.window.showInputBox({
    placeHolder: 'Owner of the repository (ex: microsoft)',
    prompt: 'Enter the owner of the GitHub repository'
  });
  
  if (!owner) return null;

  // ask the name of the repository
  const repo = await vscode.window.showInputBox({
    placeHolder: 'Name of the repository (ex: vscode)',
    prompt: 'Enter the name of the GitHub repository'
  });
  
  if (!repo) return null;

  // ask the state of the issues to retrieve
  const state = await vscode.window.showQuickPick(
    [
      { label: 'Opened', description: 'Opened Issues', value: 'open' },
      { label: 'Closed', description: 'Closed Issues', value: 'closed' },
      { label: 'All', description: 'All Issues', value: 'all' }
    ],
    { placeHolder: 'Select the state of the issues to retrieve' }
  );
  
  if (!state) return null;
  
  return { owner, repo, state: state.value };
}

/**
 * Allow the user to select the issues to use
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
      placeHolder: 'Select the issues to generate tasks for', 
      canPickMany: true 
    }
  ).then(selections => selections?.map(selection => selection.issue) || []);
}

/**
 * Add a generated task to the tasks.json file of the workspace
 */
async function addTaskToWorkspace(generatedTask, issue) {
  // Check if a workspace is open
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    throw new Error('No workspace open');
  }
  
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const tasksJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'tasks.json');

  // Read the existing tasks.json file or create a template
  let tasksConfig;
  try {
    const content = await vscode.workspace.fs.readFile(tasksJsonPath);
    tasksConfig = JSON.parse(content.toString());
  } catch {
    // The file does not exist, create a template
    tasksConfig = {
      version: '2.0.0',
      tasks: []
    };

    // Ensure that the .vscode folder exists
    await vscode.workspace.fs.createDirectory(
      vscode.Uri.joinPath(workspaceFolder.uri, '.vscode')
    );
  }

  // Format task generated by Copilot
  const task = {
    ...generatedTask,
    label: `GitHub #${issue.number}: ${generatedTask.label || issue.title}`,
    problemMatcher: generatedTask.problemMatcher || [],
    presentation: generatedTask.presentation || {
      reveal: 'always',
      panel: 'shared',
      showReuseMessage: false
    },

    // Add metadata to link the task to the issue
    metadata: {
      githubIssue: {
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      }
    }
  };

  // Add the new task
  tasksConfig.tasks.push(task);

  // Write the updated file
  await vscode.workspace.fs.writeFile(
    tasksJsonPath,
    Buffer.from(JSON.stringify(tasksConfig, null, 2))
  );
}

/**
 * Extension Disable Function
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
