# IssueSync

IssueSync is a simple Node.js tool for listing and synchronizing issues between GitHub repositories.

## Configuration

1. Clone this repository
2. Create a `.env` file:

```
GITHUB_TOKEN=your_token_here
```

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

### Synchronizing Issues

To synchronize issues between repositories:

```bash
node index.js sync --source-owner <owner> --source-repo <repository> --target-owner <owner> --target-repo <repository>
```

## Features

- List issues from GitHub repositories
- Synchronize issues between repositories
- Maintain issue metadata (labels, comments)
- Support for filtering by issue state and labels

## Requirements

- Node.js v14 or higher
- GitHub Personal Access Token with repo scope

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
