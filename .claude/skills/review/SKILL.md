---
name: review
description: Review a branch, diff, or pull request in this repository before merge. Use when asked to review changes or a PR, self-review work before opening or marking a PR ready, or check a change for correctness, backward compatibility, security, tests, docs, and changesets.
metadata:
  internal: true
---

# Review

This skill covers reviewing changes to this monorepo, whether that is your own work before a PR or someone else's PR.

## Scope

- Review the net change against the base branch (`git diff main...HEAD`, or `gh pr diff <number>`), not individual commits.
- Read the surrounding code, callers, and tests, not only the changed lines. Many defects come from what the diff fails to update.
- Lint, prettier, typecheck, and the copyright header are enforced by CI. Do not report anything those tools would catch. If you have not run them, say so.

## Signal Over Noise

A short list of findings that matter is more useful than a long list of observations. Report something only if a maintainer would want it changed before merge, or would want to know about it before release. Leave out style preferences, naming opinions that are not misleading, and hypothetical problems with no realistic path to happen.

## Verify Before Reporting

For each serious finding:

- Trace the path that triggers it: the caller, the inputs, and the resulting behavior.
- Check whether the behavior is intentional. Look at code comments, tests that assert it, docs, and the PR description.
- If you cannot confirm it, lower its severity or present it as a question.
- Code elsewhere in the repo doing the same thing does not make a bug acceptable. Mention when the same problem exists elsewhere.

## Severity

- **Blocker**: wrong behavior, data loss, security exposure, an unmarked breaking change, or a broken release or CI.
- **Should fix**: a real defect or gap with limited impact, such as a missing test for changed behavior, a missing changeset or docs update, or an inconsistency across surfaces.
- **Consider**: a worthwhile improvement that does not need to block merge.

## What to Check

**Correctness and errors**

- Failures must not be reported as success or as empty results. A refused request should not become "no items found" with exit code 0.
- API errors should destructure `response` and use `getApiErrorMessage(error, response)`.
- Flags that duplicate configuration (site ID, realm, MRT project, ...) must fall back to configuration via `flagOrConfig`. See the [CLI command development skill](../cli-command-development/SKILL.md#flags-that-duplicate-config-identifiers).

**Backward compatibility**

- Compare against [Backward Compatibility in AGENTS.md](../../../AGENTS.md#backward-compatibility): renamed or removed commands, flags, short flags, column keys, `--json` fields, MCP tools or inputs, MCP server flags, and SDK exports.
- A breaking change needs a `major` changeset that explains how to migrate, or a non-breaking alias or deprecation path.

**Security and safety**

- No tokens, secrets, or credentials in logs, error messages, `--json` output, or MCP tool results.
- HTTP clients use `createHttpClient` / `getApiFetch` so that the auth strategy's transport options apply.
- File paths taken from archives, servers, or user input cannot escape their target directory.
- Destructive commands follow the [destructive command rules](../cli-command-development/SKILL.md#destructive-commands): safe-mode check, `--force`, and a confirmation prompt.

**Consistency across surfaces**

- When SDK behavior changes, check the CLI commands, MCP tools, and VS Code extension features that use it, so that they behave the same way and present the same guidance.

**Tests**

- Changed behavior has tests that would fail without the change, following the [testing skill](../testing/SKILL.md).
- Command tests do not leak output to the console.

**Release and docs**

- There is a changeset for user-facing changes, with the right packages and bump (see "Changesets" in `AGENTS.md`).
- Docs in `docs/`, user-facing skills in `skills/`, and the tooling documentation index are updated when commands, flags, tools, or output change.
- Platform dependencies (a required platform release, a feature toggle, or an API that is not generally available) are stated in the PR. Unfinished multi-step work is not exposed on `main`.

**Public repository hygiene**

- No internal hostnames, URLs, repository names, chat channels, internal tool names, customer or instance names, or people's names in code, comments, docs, changesets, or the PR description. GUS work-item IDs are allowed.

## Reporting

- Start with a verdict: ready to merge, merge after fixes, or needs rework.
- List findings by severity. Give each one a `file:line`, what is wrong, the consequence, and a suggested fix.
- State what you did not check or could not run.
- When posting comments on a PR, keep each comment to the defect and the fix in a sentence or two.
