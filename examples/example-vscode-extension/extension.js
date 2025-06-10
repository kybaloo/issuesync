const vscode = require('vscode');
const issuesync = require('issuesync'); // Our library

let initialized = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Extension "GitHub Task Generator" is activated');

  // Initialize issuesync with GitHub token if available
  initializeissuesync();

  // Register command to generate tasks from GitHub issues
  let disposable = vscode.commands.registerCommand(
    'github-task-generator.generateTasksFromissues', 
    generateTasksFromissues
  );

  context.subscriptions.push(disposable);
}

/**
 * Initialise issuesync with le token GitHub from the settings
 */
function initializeissuesync() {
  const config = vscode.workspace.getConfiguration('githubTaskGenerator');
  const token = config.get('token');
  
  if (token) {
    try {
      issuesync.init({ token });
      initialized = true;
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Initialization error: ${error.message}`);
    }
  }
  
  return false;
}

/**
 * Generate VS Code tasks from GitHub issues
 */
async function generateTasksFromissues() {
  // Check if issuesync is initialized
  if (!initialized) {
    const shouldConfigure = await vscode.window.showErrorMessage(
      'GitHub token not configured. Please configure it in the settings.',
      'Configure now'
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
    // Retrieve configuration settings
    const config = vscode.workspace.getConfiguration('githubTaskGenerator');
    const defaultOwner = config.get('defaultOwner');
    const defaultRepo = config.get('defaultRepo');

    // Ask for details of the repository
    const owner = await vscode.window.showInputBox({
      value: defaultOwner,
      placeHolder: 'owner of the repository (ex: microsoft)',
      prompt: 'Enter the owner of the GitHub repository'
    });
    
    if (!owner) return;
    
    const repo = await vscode.window.showInputBox({
      value: defaultRepo,
      placeHolder: 'Name of the repository (ex: vscode)',
      prompt: 'Enter the name of the GitHub repository'
    });
    
    if (!repo) return;
    
    // retrieveth issues from GitHub
    const issues = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Retrieval of issues from ${owner}/${repo}...`,
        cancellable: false
      },
      async () => {
        return await issuesync.listissues({ 
          owner, 
          repo,
          state: 'open' 
        });
      }
    );
    
    if (!issues || issues.length === 0) {
      vscode.window.showInformationMessage(`No issues found in ${owner}/${repo}`);
      return;
    }

    // allow the user to select an issue
    const selection = await vscode.window.showQuickPick(
      issues.map(issue => ({
        label: issue.title,
        description: `#${issue.number}`,
        detail: `Labels: ${issue.labels.map(l => l.name).join(', ')}`,
        issue
      })),
      { placeHolder: 'Select an issue to generate a task' }
    );
    
    if (!selection) return;
    
    const issue = selection.issue;

    // generate and add the task
    await createTaskFromIssue(issue);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  }
}

/**
 * Create a VS Code task from a GitHub issue
 */
async function createTaskFromIssue(issue) {
  // Check if a workspace is open
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace open');
    return;
  }
  
  const workspaceFolder = vscode.workspace.workspaceFolders[0];

  // ask the type of task to create
  const taskType = await vscode.window.showQuickPick(
    [
      { label: 'Shell', description: 'command shell', value: 'shell' },
      { label: 'npm', description: 'command npm', value: 'npm' }
    ],
    { placeHolder: 'Select the type of task' }
  );
  
  if (!taskType) return;

  // ask for command for the task
  const command = await vscode.window.showInputBox({
    placeHolder: taskType.value === 'npm' ? 'test' : 'echo "Implementing #' + issue.number + '"',
    prompt: `Enter the command ${taskType.value} for this task`
  });
  
  if (!command) return;

  // create the task object
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

  // add the task to the tasks.json file
  await addTaskToWorkspace(task, workspaceFolder);
  
  vscode.window.showInformationMessage(
    `Task created for the issue #${issue.number}: ${issue.title}`
  );
}

/**
 * Add a task to the tasks.json file of the workspace
 */
async function addTaskToWorkspace(task, workspaceFolder) {
  // Path to the tasks.json file
  const tasksFilePath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'tasks.json');

  // Read the file tasks.json if exist
  let tasksConfig;
  try {
    const fileContent = await vscode.workspace.fs.readFile(tasksFilePath);
    tasksConfig = JSON.parse(fileContent.toString());
  } catch {
    // The file does not exist or is not valid, create a new one
    tasksConfig = {
      version: '2.0.0',
      tasks: []
    };

    // Ensure the .vscode directory exists
    try {
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(workspaceFolder.uri, '.vscode')
      );
    } catch (error) {
      // The directory probably already exists
    }
  }
  
  // add the new task
  tasksConfig.tasks.push(task);

  // Write the updated file
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
