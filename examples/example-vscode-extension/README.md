<!--filepath: d:\Projects\Personal\issuesync\examples\example-vscode-extension\README.md -->
# GitHub Task Generator

This VS Code extension allows automatic generation of tasks from GitHub issues. It uses the `issuesync` library to communicate with the GitHub API and retrieve issues.

## Features

- Connect to GitHub via personal access token
- Retrieve open issues from a GitHub repository
- Interactive issue selection from a list
- Automatic creation of VS Code tasks based on issues
- Link tasks with corresponding GitHub issues

## Extension Configuration

1. Install the extension
2. Open VS Code settings (Ctrl+,)
3. Search for "GitHub Task Generator"
4. Configure the following options:
   - `githubTaskGenerator.token`: Your GitHub personal access token
   - `githubTaskGenerator.defaultOwner`: Default repository owner (optional)
   - `githubTaskGenerator.defaultRepo`: Default repository name (optional)

## Usage

1. Open a VS Code workspace
2. Execute the command `Generate tasks from GitHub issues` from the command palette (Ctrl+Shift+P)
3. Enter the owner and repository name (if not set by default)
4. Select an issue from the list that appears
5. Choose the task type (shell, npm)
6. Enter the command to execute
7. A task will be created in the `.vscode/tasks.json` file of your workspace

## How it Works

The extension uses the `issuesync` library to communicate with the GitHub API. The main steps are:

1. Initialize with GitHub token
2. Retrieve open issues from the specified repository
3. Display issues in an interactive list
4. Create a VS Code task based on the selected issue
5. Add the task to the `.vscode/tasks.json` file

## Development

### Project Structure

```
example-vscode-extension/
  ├── package.json      # Extension configuration
  ├── extension.js      # Main extension code  └── README.md         # Documentation
```

### Debug the Extension

1. Open the folder in VS Code
2. Press F5 to launch a new VS Code window with the extension
3. Execute the command `Generate tasks from GitHub issues`

### Using issuesync

This extension shows how to integrate the `issuesync` library into a VS Code extension:

```javascript
// Import the library
const issuesync = require('issuesync');

// Initialize with GitHub token
issuesync.init({ token: 'your-github-token' });

// Retrieve issues
const issues = await issuesync.listissues({ 
  owner: 'repository-owner', 
  repo: 'repository-name',
  state: 'open' 
});

// Use the retrieved issues
console.log(`${issues.length} issues retrieved`);
```

## License

This extension is distributed under the MIT license. See the LICENSE file for more information.
