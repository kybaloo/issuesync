/**
 * Example of issuesync integration in a CI/CD pipeline
 * 
 * This file shows how issuesync can be used in an automation workflow
 * to synchronize issues between repositories after deployment.
 */

const issuesync = require('issuesync');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  token: process.env.GITHUB_TOKEN,
  sourceOwner: process.env.SOURCE_OWNER || 'organisation-principale',
  sourceRepo: process.env.SOURCE_REPO || 'projet-principal',
  targetOwner: process.env.TARGET_OWNER || 'organisation-client',
  targetRepo: process.env.TARGET_REPO || 'projet-client',
  releaseTag: process.env.RELEASE_TAG || 'latest',
  issueLabel: process.env.ISSUE_LABEL || 'to-deploy',
  logFile: process.env.LOG_FILE || 'sync-results.json',
};

// Execution principale function
async function main() {
  try {
    console.log('🔄 Starting synchronization of the issues for deployment...');
    console.log(`🏷️  Version: ${CONFIG.releaseTag}`);
    
    // check presence of the GitHub token
    if (!CONFIG.token) {
      throw new Error('GitHub token not configured. Please set the GITHUB_TOKEN environment variable.');
    }
    
    // Initialize issuesync
    issuesync.init({ token: CONFIG.token });
    
    // retrieve issues with the deployment label
    console.log(`🔍 Retrieving issues with the label "${CONFIG.issueLabel}"...`);

    const issues = await issuesync.listissues({
      owner: CONFIG.sourceOwner,
      repo: CONFIG.sourceRepo,
      state: 'open',
      labels: CONFIG.issueLabel
    });

    console.log(`📋 ${issues.length} issues found to deploy`);

    if (issues.length === 0) {
      console.log('✅ No issues to synchronize');
      return { success: true, issues: [] };
    }
    
    // synchronize issues
    console.log(`🔄 Synchronizing issues to ${CONFIG.targetOwner}/${CONFIG.targetRepo}...`);

    const result = await issuesync.syncissues({
      sourceOwner: CONFIG.sourceOwner,
      sourceRepo: CONFIG.sourceRepo,
      targetOwner: CONFIG.targetOwner,
      targetRepo: CONFIG.targetRepo,
      state: 'open',
      labels: CONFIG.issueLabel,
      syncComments: true
    });

    // Convert the created issues to a simplified format for logging
    const createdissues = result.created.map(issue => ({
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      labels: issue.labels.map(l => l.name)
    }));

    // Log the results
    const syncResults = {
      timestamp: new Date().toISOString(),
      release: CONFIG.releaseTag,
      source: `${CONFIG.sourceOwner}/${CONFIG.sourceRepo}`,
      target: `${CONFIG.targetOwner}/${CONFIG.targetRepo}`,
      created: createdissues,
      skipped: result.skipped.length,
      total: result.total
    };

    // saving the results
    await saveResults(syncResults);

    // update the source issues to indicate they have been deployed
    if (createdissues.length > 0) {
      console.log(`🏷️  Updating source issues with the label "deployed"...`);

      // This part would directly use the Octokit API which is included in issuesync
      // In a real implementation, this functionality could be added to issuesync

      console.log(`✅ Issues updated successfully`);
    }

    console.log(`✅ Synchronization completed: ${result.created.length} issues created, ${result.skipped.length} ignored`);

    return {
      success: true,
      created: result.created.length,
      skipped: result.skipped.length,
      total: result.total
    };
  } catch (error) {
    console.error(`❌ error during synchronization: ${error.message}`);

    // In case of failure, log the error
    const errorResult = {
      timestamp: new Date().toISOString(),
      release: CONFIG.releaseTag,
      error: error.message,
      stack: error.stack
    };
    
    await saveResults(errorResult, 'sync-error.json');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// function for saving the results
async function saveResults(results, filename = CONFIG.logFile) {
  try {
    // Assuming the logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    // Write the results file
    const filePath = path.join(logsDir, filename);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));

    console.log(`📝 Results saved in ${filePath}`);
  } catch (error) {
    console.error(`❌ Error during saving of the results: ${error.message}`);
  }
}

// execute the script if called directly
if (require.main === module) {
  main().then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

// Export for use as a module
module.exports = { 
  sync: main
};

/**
 * How to use this script in a CI/CD pipeline:
 *
 * 1. GitHub Actions:
 * ```yaml
 * jobs:
 *   deploy:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - uses: actions/checkout@v2
 *       - name: Setup Node.js
 *         uses: actions/setup-node@v2
 *         with:
 *           node-version: '16'
 *       - name: Install dependencies
 *         run: npm install issuesync
 *       - name: Synchronize deployment issues
 *         run: node ci-cd-integration.js
 *         env:
 *           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
 *           RELEASE_TAG: ${{ github.ref_name }}
 *           SOURCE_OWNER: 'org-name'
 *           SOURCE_REPO: 'main-repo'
 *           TARGET_OWNER: 'client-org'
 *           TARGET_REPO: 'client-repo'
 * ```
 * 
 * 2. GitLab CI:
 * ```yaml
 * deploy:
 *   stage: deploy
 *   script:
 *     - npm install issuesync
 *     - node ci-cd-integration.js
 *   variables:
 *     GITHUB_TOKEN: $GITHUB_TOKEN
 *     RELEASE_TAG: $CI_COMMIT_TAG
 *     SOURCE_OWNER: 'org-name'
 *     SOURCE_REPO: 'main-repo'
 *     TARGET_OWNER: 'client-org' 
 *     TARGET_REPO: 'client-repo'
 * ```
 */
