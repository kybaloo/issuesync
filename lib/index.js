/**
 * IssueSync - GitHub Issue Synchronization Library
 */
require("dotenv").config();
const issueService = require('./services/issueService');
const syncService = require('./services/syncService');
const { initGithub } = require('./github');

/**
 * Initialize the IssueSync library with GitHub credentials
 * @param {Object} options - Configuration options
 * @param {string} options.token - GitHub API token
 */
function init(options = {}) {
  return initGithub(options);
}

/**
 * Lists issues from a GitHub repository with optional filters
 * @param {Object} options - Options for listing issues
 * @param {string} options.owner - Repository owner
 * @param {string} options.repo - Repository name
 * @param {string} [options.state='open'] - Issue state (open, closed, all)
 * @param {string} [options.labels=''] - Comma-separated labels
 * @param {boolean} [options.verbose=false] - Show detailed information
 * @returns {Promise<Array>} List of issues
 */
async function listIssues(options) {
  return await issueService.getIssues(options);
}

/**
 * Synchronizes issues from source repository to target repository
 * @param {Object} options - Sync options
 * @param {string} options.sourceOwner - Source repository owner
 * @param {string} options.sourceRepo - Source repository name
 * @param {string} options.targetOwner - Target repository owner
 * @param {string} options.targetRepo - Target repository name
 * @param {string} [options.state='open'] - Issues state to sync (open, closed, all)
 * @param {string} [options.labels=''] - Filter issues by labels (comma-separated)
 * @param {boolean} [options.syncComments=true] - Whether to sync comments
 * @returns {Promise<Object>} Sync results with created and skipped issues
 */
async function syncIssues(options) {
  return await syncService.sync(options);
}

// Export the public API
module.exports = {
  init,
  listIssues,
  syncIssues
};
