
/**
 * Synchronizes comments from a source issue to a target issue
 * @param {Object} options - Comment sync options
 * @param {string} options.sourceOwner - Source repository owner
 * @param {string} options.sourceRepo - Source repository name
 * @param {number} options.sourceIssueNumber - Source issue number
 * @param {string} options.targetOwner - Target repository owner
 * @param {string} options.targetRepo - Target repository name
 * @param {number} options.targetIssueNumber - Target issue number
 * @returns {Promise<Array>} Synchronized comments
 */
async function syncComments(options) {
  try {
    const { octokit } = require('../github');
    const { 
      sourceOwner, 
      sourceRepo, 
      sourceIssueNumber, 
      targetOwner, 
      targetRepo, 
      targetIssueNumber 
    } = options;

    // Get comments from source issue
    const { data: comments } = await octokit.issues.listComments({
      owner: sourceOwner,
      repo: sourceRepo,
      issue_number: sourceIssueNumber,
    });

    const createdComments = [];

    // Create each comment in target issue
    for (const comment of comments) {
      const result = await octokit.issues.createComment({
        owner: targetOwner,
        repo: targetRepo,
        issue_number: targetIssueNumber,
        body: `${comment.body}\n\n---\n*Original comment by @${comment.user.login}*`,
      });
      createdComments.push(result.data);
    }

    return createdComments;
  } catch (err) {
    throw new Error(`Error syncing comments for issue #${options.sourceIssueNumber}: ${err.message}`);
  }
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
async function sync(options = {}) {
  try {
    const { octokit } = require('../github');
    const issueService = require('./issueService');
    
    const { 
      sourceOwner, 
      sourceRepo, 
      targetOwner, 
      targetRepo,
      state = "open",
      labels = "",
      syncComments = true
    } = options;

    // Get source issues
    const sourceIssues = await issueService.getIssues({
      owner: sourceOwner,
      repo: sourceRepo,
      state,
      labels,
    });

    if (!sourceIssues.length) {
      return { created: [], skipped: [], total: 0 };
    }

    // Get target issues to avoid duplicates
    const { data: targetIssues } = await octokit.issues.listForRepo({
      owner: targetOwner,
      repo: targetRepo,
      state: "all",
      per_page: 100,
    });

    const targetIssuesTitles = targetIssues.map((issue) => issue.title);
    const syncedIssues = [];
    const skippedIssues = [];

    // Process each source issue
    for (const issue of sourceIssues) {
      // Skip if issue already exists in target (by title)
      if (targetIssuesTitles.includes(issue.title)) {
        skippedIssues.push(issue);
        continue;
      }

      // Create labels in target repo if they don't exist
      const issueLabels = issue.labels.map((label) => label.name);
      if (issueLabels.length) {
        await issueService.ensureLabelsExist(targetOwner, targetRepo, issue.labels);
      }

      // Create new issue in target repo
      const newIssue = await octokit.issues.create({
        owner: targetOwner,
        repo: targetRepo,
        title: issue.title,
        body: `${
          issue.body || ""
        }\n\n---\n*Synchronized from ${sourceOwner}/${sourceRepo}#${
          issue.number
        }*`,
        labels: issueLabels,
      });

      // Sync comments if enabled
      if (syncComments) {
        await syncComments({
          sourceOwner,
          sourceRepo,
          sourceIssueNumber: issue.number,
          targetOwner,
          targetRepo,
          targetIssueNumber: newIssue.data.number
        });
      }

      syncedIssues.push(newIssue.data);
    }

    return { 
      created: syncedIssues, 
      skipped: skippedIssues, 
      total: sourceIssues.length 
    };
  } catch (err) {
    throw new Error(`Error synchronizing issues: ${err.message}`);
  }
}

module.exports = {
  sync,
  syncComments
};
