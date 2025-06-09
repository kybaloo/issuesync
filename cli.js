#!/usr/bin/env node

// filepath: d:\Projects\Personal\IssueSync\cli.js
require("dotenv").config();
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const issueSync = require("./lib");

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

// Initialize the GitHub client
issueSync.init();

// Execute commands based on user input
const command = argv._[0];

if (command === "list") {
  (async () => {
    try {
      const issues = await issueSync.listIssues({
        owner: argv.owner,
        repo: argv.repo,
        state: argv.state,
        labels: argv.labels,
        verbose: argv.verbose,
      });

      if (!issues.length) {
        console.log("No issues found.");
      } else {
        console.log(`📋 Found ${issues.length} issues for ${argv.owner}/${argv.repo}:`);
        issues.forEach((issue) => {
          const labels = issue.labels.map((label) => `[${label.name}]`).join(" ");
          console.log(`#${issue.number} - ${issue.title} ${labels}`);
          if (argv.verbose) {
            console.log(`  State: ${issue.state}`);
            console.log(`  Created: ${new Date(issue.created_at).toLocaleDateString()}`);
            console.log(`  Comments: ${issue.comments}`);
            console.log(`  URL: ${issue.html_url}`);
            console.log("");
          }
        });
      }
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })();
} else if (command === "sync") {
  (async () => {
    try {
      console.log(
        `Synchronizing issues from ${argv["source-owner"]}/${argv["source-repo"]} to ${argv["target-owner"]}/${argv["target-repo"]}...`
      );
      
      const result = await issueSync.syncIssues({
        sourceOwner: argv["source-owner"],
        sourceRepo: argv["source-repo"],
        targetOwner: argv["target-owner"],
        targetRepo: argv["target-repo"],
        state: argv.state,
        labels: argv.labels,
        syncComments: argv["sync-comments"],
      });

      if (result.created.length === 0) {
        console.log("No new issues to synchronize.");
      } else {
        result.created.forEach((issue) => {
          console.log(`✓ Created issue #${issue.number}: "${issue.title}"`);
        });
      }
      
      if (result.skipped.length > 0) {
        console.log(`\nSkipped ${result.skipped.length} issues (already exist in target repo)`);
      }
      
      console.log(
        `\n✅ Synchronized ${result.created.length} issues from ${argv["source-owner"]}/${argv["source-repo"]} to ${argv["target-owner"]}/${argv["target-repo"]}`
      );
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  })();
}
