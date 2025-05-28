require("dotenv").config();
const { Octokit } = require("@octokit/rest");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Check for GitHub token
if (!process.env.GITHUB_TOKEN) {
  console.error(
    "Error: GitHub token not found. Please set GITHUB_TOKEN in your .env file."
  );
  process.exit(1);
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/**
 * Lists issues from a GitHub repository with optional filters
 */
async function listIssues(owner, repo, options = {}) {
  try {
    const { state = "open", labels = "" } = options;

    console.log(
      `Fetching ${state} issues from ${owner}/${repo}${
        labels ? ` with labels: ${labels}` : ""
      }...`
    );

    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state,
      labels: labels ? labels.split(",") : [],
      per_page: 100,
    });

    if (!issues.length) {
      console.log("No issues found.");
    } else {
      console.log(`📋 Found ${issues.length} issues for ${owner}/${repo}:`);
      issues.forEach((issue) => {
        const labels = issue.labels.map((label) => `[${label.name}]`).join(" ");
        console.log(`#${issue.number} - ${issue.title} ${labels}`);
        if (options.verbose) {
          console.log(`  State: ${issue.state}`);
          console.log(
            `  Created: ${new Date(issue.created_at).toLocaleDateString()}`
          );
          console.log(`  Comments: ${issue.comments}`);
          console.log(`  URL: ${issue.html_url}`);
          console.log("");
        }
      });
    }
    return issues;
  } catch (err) {
    console.error("Error retrieving issues:", err.message);
    return [];
  }
}

/**
 * Synchronizes issues from source repository to target repository
 */
async function syncIssues(
  sourceOwner,
  sourceRepo,
  targetOwner,
  targetRepo,
  options = {}
) {
  try {
    console.log(
      `Synchronizing issues from ${sourceOwner}/${sourceRepo} to ${targetOwner}/${targetRepo}...`
    );

    // Get source issues
    const sourceIssues = await listIssues(sourceOwner, sourceRepo, {
      state: options.state || "open",
      labels: options.labels || "",
    });

    if (!sourceIssues.length) {
      console.log("No issues to synchronize.");
      return;
    }

    // Get target issues to avoid duplicates
    const { data: targetIssues } = await octokit.issues.listForRepo({
      owner: targetOwner,
      repo: targetRepo,
      state: "all",
      per_page: 100,
    });

    const targetIssuesTitles = targetIssues.map((issue) => issue.title);
    let syncCount = 0;

    // Process each source issue
    for (const issue of sourceIssues) {
      // Skip if issue already exists in target (by title)
      if (targetIssuesTitles.includes(issue.title)) {
        console.log(
          `Skipping issue #${issue.number}: "${issue.title}" (already exists in target repo)`
        );
        continue;
      }

      // Create labels in target repo if they don't exist
      const issueLabels = issue.labels.map((label) => label.name);
      if (issueLabels.length) {
        await ensureLabelsExist(targetOwner, targetRepo, issue.labels);
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

      console.log(
        `✓ Created issue #${newIssue.data.number}: "${newIssue.data.title}"`
      );

      // Sync comments if enabled
      if (options.syncComments) {
        await syncComments(
          sourceOwner,
          sourceRepo,
          issue.number,
          targetOwner,
          targetRepo,
          newIssue.data.number
        );
      }

      syncCount++;
    }

    console.log(
      `\n✅ Synchronized ${syncCount} issues from ${sourceOwner}/${sourceRepo} to ${targetOwner}/${targetRepo}`
    );
  } catch (err) {
    console.error("Error synchronizing issues:", err.message);
  }
}

/**
 * Ensures that all required labels exist in the target repository
 */
async function ensureLabelsExist(owner, repo, sourceLabels) {
  try {
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
        console.log(`Created label: ${sourceLabel.name}`);
      }
    }
  } catch (err) {
    console.error("Error ensuring labels exist:", err.message);
  }
}

/**
 * Synchronizes comments from a source issue to a target issue
 */
async function syncComments(
  sourceOwner,
  sourceRepo,
  sourceIssueNumber,
  targetOwner,
  targetRepo,
  targetIssueNumber
) {
  try {
    // Get comments from source issue
    const { data: comments } = await octokit.issues.listComments({
      owner: sourceOwner,
      repo: sourceRepo,
      issue_number: sourceIssueNumber,
    });

    if (comments.length) {
      console.log(`  Syncing ${comments.length} comments...`);

      // Create each comment in target issue
      for (const comment of comments) {
        await octokit.issues.createComment({
          owner: targetOwner,
          repo: targetRepo,
          issue_number: targetIssueNumber,
          body: `${comment.body}\n\n---\n*Original comment by @${comment.user.login}*`,
        });
      }
    }
  } catch (err) {
    console.error(
      `Error syncing comments for issue #${sourceIssueNumber}:`,
      err.message
    );
  }
}

// Command line interface setup
const argv = yargs(hideBin(process.argv))
  .command("list", "List issues from a GitHub repository", (yargs) => {
    return yargs
      .option("owner", {
        alias: "o",
        describe: "Repository owner",
        type: "string",
        demandOption: true,
      })
      .option("repo", {
        alias: "r",
        describe: "Repository name",
        type: "string",
        demandOption: true,
      })
      .option("state", {
        alias: "s",
        describe: "Issue state (open, closed, all)",
        type: "string",
        default: "open",
      })
      .option("labels", {
        alias: "l",
        describe: "Filter by labels (comma-separated)",
        type: "string",
      })
      .option("verbose", {
        alias: "v",
        describe: "Show more details",
        type: "boolean",
        default: false,
      });
  })
  .command("sync", "Synchronize issues between repositories", (yargs) => {
    return yargs
      .option("source-owner", {
        describe: "Source repository owner",
        type: "string",
        demandOption: true,
      })
      .option("source-repo", {
        describe: "Source repository name",
        type: "string",
        demandOption: true,
      })
      .option("target-owner", {
        describe: "Target repository owner",
        type: "string",
        demandOption: true,
      })
      .option("target-repo", {
        describe: "Target repository name",
        type: "string",
        demandOption: true,
      })
      .option("state", {
        alias: "s",
        describe: "Issues state to sync (open, closed, all)",
        type: "string",
        default: "open",
      })
      .option("labels", {
        alias: "l",
        describe: "Filter issues by labels (comma-separated)",
        type: "string",
      })
      .option("sync-comments", {
        describe: "Sync issue comments",
        type: "boolean",
        default: true,
      });
  })
  .demandCommand(1, "You need to specify a command")
  .help().argv;

// Execute commands based on user input
const command = argv._[0];

if (command === "list") {
  listIssues(argv.owner, argv.repo, {
    state: argv.state,
    labels: argv.labels,
    verbose: argv.verbose,
  });
} else if (command === "sync") {
  syncIssues(
    argv["source-owner"],
    argv["source-repo"],
    argv["target-owner"],
    argv["target-repo"],
    {
      state: argv.state,
      labels: argv.labels,
      syncComments: argv.syncComments,
    }
  );
}
