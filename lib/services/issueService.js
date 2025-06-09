
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
async function getIssues(options = {}) {
  try {
    const { octokit } = require('../github');
    const { owner, repo, state = "open", labels = "", verbose = false } = options;

    const requestParams = {
      owner,
      repo,
      state,
      labels: labels ? labels.split(",") : [],
      per_page: 100,
    };

    const { data: issues } = await octokit.issues.listForRepo(requestParams);
    
    return issues;
  } catch (err) {
    throw new Error(`Error retrieving issues: ${err.message}`);
  }
}

/**
 * Ensures that all required labels exist in the target repository
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array} sourceLabels - Labels to ensure
 */
async function ensureLabelsExist(owner, repo, sourceLabels) {
  try {
    const { octokit } = require('../github');
    // Get existing labels in target repo
    const { data: existingLabels } = await octokit.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });

    const existingLabelNames = existingLabels.map((label) => label.name);

    // Create any missing labels
    for (const sourceLabel of sourceLabels) {
      if (!existingLabelNames.includes(sourceLabel.name)) {
        await octokit.issues.createLabel({
          owner,
          repo,
          name: sourceLabel.name,
          color: sourceLabel.color || "CCCCCC",
          description: sourceLabel.description || "",
        });
      }
    }
    return true;
  } catch (err) {
    throw new Error(`Error ensuring labels exist: ${err.message}`);
  }
}

module.exports = {
  getIssues,
  ensureLabelsExist
};
