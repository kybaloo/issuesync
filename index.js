require("dotenv").config();
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function listIssues(owner, repo) {
  try {
    const { data: issues } = await octokit.issues.listForRepo({ owner, repo });

    if (!issues.length) {
      console.log("No issues found.");
    } else {
        console.log(`📋 Issues for ${owner}/${repo}:`);
        issues.forEach((issue) => {
            console.log(`#${issue.number} - ${issue.title}`);
        });
    }
  } catch (err) {
    console.error("Error retrieving issues:", err.message);
  }
}

// Example: replace with your own repositories
listIssues("nodejs", "node");
