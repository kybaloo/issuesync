require('dotenv').config();
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function listIssues(owner, repo) {
  try {
    const { data: issues } = await octokit.issues.listForRepo({ owner, repo });

    if (!issues.length) {
      console.log("Aucune issue trouvée.");
    } else {
      console.log(`📋 Issues pour ${owner}/${repo} :`);
      issues.forEach(issue => {
        console.log(`#${issue.number} - ${issue.title}`);
      });
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des issues :", err.message);
  }
}

// Exemple : remplace par tes propres dépôts
listIssues("nodejs", "node");
