#!/usr/bin/env -S deno run --allow-run --allow-env

/**
 * Rewrites commit authors in the current branch to match git config user
 * Usage: deno run --allow-run --allow-env scripts/rewrite-author.ts [base-branch] [author]
 *
 * Arguments:
 *   base-branch  Base branch to rebase from (default: auto-detect origin/main, origin/master, or main)
 *   author       Author in format "Name <email>" (default: from git config)
 */

async function exec(
  cmd: string[],
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; code: number }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
    env: env ? { ...Deno.env.toObject(), ...env } : undefined,
  });

  const { stdout, stderr, code } = await command.output();
  return {
    stdout: new TextDecoder().decode(stdout).trim(),
    stderr: new TextDecoder().decode(stderr).trim(),
    code,
  };
}

async function main() {
  const [baseBranchArg, authorArg] = Deno.args;

  // Get current branch
  const currentBranch = await exec([
    "git",
    "rev-parse",
    "--abbrev-ref",
    "HEAD",
  ]);
  if (currentBranch.code !== 0) {
    console.error(
      "Error: Not in a git repository or unable to determine current branch",
    );
    Deno.exit(1);
  }

  const branch = currentBranch.stdout;
  console.log(`Current branch: ${branch}`);

  // Determine author
  let author: string;
  if (authorArg) {
    author = authorArg;
    console.log(`New author: ${author} (from argument)`);
  } else {
    // Get git user config
    const userName = await exec(["git", "config", "user.name"]);
    const userEmail = await exec(["git", "config", "user.email"]);

    if (userName.code !== 0 || userEmail.code !== 0) {
      console.error("Error: Unable to get git user configuration");
      console.error("Run: git config user.name 'Your Name'");
      console.error("Run: git config user.email 'your.email@example.com'");
      Deno.exit(1);
    }

    author = `${userName.stdout} <${userEmail.stdout}>`;
    console.log(`New author: ${author} (from git config)`);
  }

  // Determine base branch
  let baseBranch: string;
  if (baseBranchArg) {
    baseBranch = baseBranchArg;
    const checkBranch = await exec([
      "git",
      "rev-parse",
      "--verify",
      baseBranch,
    ]);
    if (checkBranch.code !== 0) {
      console.error(`Error: Branch '${baseBranch}' does not exist`);
      Deno.exit(1);
    }
    console.log(`Base branch: ${baseBranch} (from argument)`);
  } else {
    // Get base branch (try origin/main, origin/master, or main)
    baseBranch = "origin/main";
    const checkMain = await exec([
      "git",
      "rev-parse",
      "--verify",
      "origin/main",
    ]);
    if (checkMain.code !== 0) {
      const checkMaster = await exec([
        "git",
        "rev-parse",
        "--verify",
        "origin/master",
      ]);
      if (checkMaster.code !== 0) {
        const checkLocalMain = await exec([
          "git",
          "rev-parse",
          "--verify",
          "main",
        ]);
        if (checkLocalMain.code !== 0) {
          console.error(
            "Error: Unable to find base branch (tried origin/main, origin/master, main)",
          );
          Deno.exit(1);
        }
        baseBranch = "main";
      } else {
        baseBranch = "origin/master";
      }
    }
    console.log(`Base branch: ${baseBranch} (auto-detected)`);
  }

  // Check if there are commits to rewrite
  const commits = await exec([
    "git",
    "log",
    `${baseBranch}..HEAD`,
    "--oneline",
  ]);
  if (!commits.stdout) {
    console.log("No commits to rewrite (branch is up to date with base)");
    Deno.exit(0);
  }

  console.log(`\nCommits to rewrite:`);
  console.log(commits.stdout);

  // Confirm action
  console.log("\nThis will rewrite commit history. Continue? (y/N)");
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const answer = new TextDecoder().decode(buf.subarray(0, n ?? 0)).trim()
    .toLowerCase();

  if (answer !== "y" && answer !== "yes") {
    console.log("Aborted");
    Deno.exit(0);
  }

  // Rewrite commits
  const command = [
    "git",
    "rebase",
    "-i",
    baseBranch,
    "--exec",
    `git commit --amend --author="${author}" --no-edit`,
  ];
  console.log(`\nRewriting commits with \`${command.join(" ")}\`...`);
  // Set GIT_SEQUENCE_EDITOR to ':' (no-op) to skip interactive editor
  const rebase = await exec(command, { GIT_SEQUENCE_EDITOR: ":" });

  if (rebase.code !== 0) {
    console.error("Error during rebase:");
    console.error(rebase.stderr);
    Deno.exit(1);
  }

  console.log("✓ Successfully rewrote commit authors");
  console.log("\nTo push changes, run:");
  console.log(`  git push origin ${branch} --force`);
}

main();
