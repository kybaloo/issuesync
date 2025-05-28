# IssueSync

IssueSync is a powerful Node.js CLI tool for listing and synchronizing issues between GitHub repositories. It allows you to transfer issues from one repository to another while preserving metadata like labels and comments.

## Configuration

1. Clone this repository
2. Create a `.env` file in the root directory:

```
GITHUB_TOKEN=your_token_here
```

To get a GitHub token:

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with `repo` scope
3. Copy the token to your `.env` file

## Installation

Install the dependencies:

```bash
npm install
```

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

## Features

- List issues from GitHub repositories with detailed output
- Filter issues by state (open/closed/all) and labels
- Synchronize issues between repositories
- Automatically create matching labels in target repository
- Maintain issue metadata (labels, comments)
- Track synchronized issues with source reference
- Skip existing issues in target repository (by title matching)
- Command-line help with detailed options

## Requirements

- Node.js v14 or higher
- GitHub Personal Access Token with repo scope

## Limitations

- Due to GitHub API rate limits, very large repositories might require multiple runs
- The tool uses issue title matching to determine duplicates
- The original issue authors will not be preserved (issues are created by the token owner)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
