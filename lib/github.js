const { Octokit } = require("@octokit/rest");

// Use environment variables if available, otherwise allow config via params
let octokit;

/**
 * Initializes the GitHub client
 * @param {Object} options - GitHub client options
 * @param {string} options.token - GitHub API token
 * @returns {Object} Initialized Octokit instance
 */
function initGithub(options = {}) {
  const token = options.token || process.env.GITHUB_TOKEN;
  
  if (!token) {
    throw new Error("GitHub token not found. Please provide a token or set GITHUB_TOKEN in your .env file.");
  }
  
  octokit = new Octokit({ auth: token });
  return octokit;
}

// Export functions and objects
module.exports = {
  initGithub,
  get octokit() {
    if (!octokit) {
      initGithub();
    }
    return octokit;
  }
};
