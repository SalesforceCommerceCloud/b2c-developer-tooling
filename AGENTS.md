# B2C CLI

This is a monorepo project with the following packages:

- `./packages/b2c-cli` - the command line interface built with oclif
- `./packages/b2c-tooling-sdk` - the SDK/library for B2C Commerce operations; supports the CLI and can be used standalone
- `./packages/b2c-dx-mcp` - Model Context Protocol server; also built with oclif
- `./packages/b2c-vs-extension` - VS Code extension (not published to npm; packaged as VSIX and versioned via git tags)
- `./docs` - documentation site (private `@salesforce/b2c-dx-docs` workspace package; not published to npm)

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm --filter @salesforce/b2c-cli run build
pnpm --filter @salesforce/b2c-tooling-sdk run build

# Dev mode for CLI (uses source files directly)
pnpm --filter @salesforce/b2c-cli run dev
# or using convenience script
./cli
```

## Commands for Coding Agents

These commands produce condensed output optimized for AI coding agents:

```bash
# Run tests (minimal output - only failures + summary)
pnpm run test:agent

# Run tests for specific package
pnpm --filter @salesforce/b2c-cli run test:agent
pnpm --filter @salesforce/b2c-tooling-sdk run test:agent

# Lint (errors only, no warnings); Be sure to run lint before committing or writing a changeset
pnpm run lint:agent

# Type-check (single-line errors, no color)
pnpm run typecheck:agent

# Format check (lists only files needing formatting)
pnpm run -r format:check
```

## Verbose Commands (Debugging/CI)

Use these for detailed output during debugging or in CI pipelines:

```bash
# Run tests with full output and coverage
pnpm run test

# Run tests for specific package
pnpm --filter @salesforce/b2c-cli run test
pnpm --filter @salesforce/b2c-tooling-sdk run test

# Format code with prettier
pnpm run -r format

# Lint with full output
pnpm run -r lint
```

## Copyright Header

All TypeScript source files must include this exact copyright header block:

```typescript
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
```

The header is enforced by eslint via `eslint-plugin-header`. The canonical definition is in `eslint.config.mjs` (root) as `copyrightHeader`.

## Setup/Packaging

- use `pnpm` over `npm` for package management
- shared dependencies are managed via [pnpm catalogs](https://pnpm.io/catalogs) — versions are defined once in the `catalog:` section of `pnpm-workspace.yaml` and referenced as `"catalog:"` in each package.json. When adding or updating a dependency that is shared across packages, update the catalog entry rather than individual package.json files.
- the `pnpm run test` commands also run the linter after tests
- use `pnpm run -r format` (or individually in packages) to format code with prettier
- use `exports` field in package.json files to define public API surface for packages; use `development` field for nodejs --conditions for development ergonomics (packages/b2c-cli/bin/dev.js will use this condition)

## Documentation

- Update docs in `./docs/` folder and relevant skills in `./skills/b2c-cli/skills/` when updating or adding CLI commands.
- When adding new SDK modules, update `docs/typedoc.json` entry points to include the new module's barrel file so API docs are generated.

See [documentation skill](./.claude/skills/documentation/SKILL.md) for details on updating user guides, CLI reference, and API docs.

```bash
# Run docs dev server (from project root)
pnpm run docs:dev

# Build docs for production (stable mode — root base path)
pnpm run docs:build

# Build docs in dev mode (/dev/ base path)
IS_DEV_BUILD=true pnpm run docs:build
```

### Docs workspace package

The `./docs` directory is a private workspace package (`@salesforce/b2c-dx-docs`) with a dependency on `@salesforce/b2c-tooling-sdk`. This exists to support doc-only releases and changelog tracking via changesets, not for npm publishing. It has no build script — `pnpm -r run build` skips it.

**Deployed URL structure:** stable/released docs are served at the root URL, dev docs (from `main`) live at `/dev/`.

**Doc-only releases:** to release documentation changes without bumping CLI/SDK/MCP, create a changeset that targets only the docs package:

```md
---
'@salesforce/b2c-dx-docs': patch
---

Improved authentication guide with step-by-step examples
```

This produces a `docs@<version>` tag and triggers a docs rebuild on merge of the version PR.

**Automatic cascade:** because the docs package depends on the SDK, when the SDK version is bumped by a changeset, `updateInternalDependencies: "patch"` auto-bumps the docs version too — triggering a docs rebuild (correct since API docs are generated from the SDK).

## Logging

- when logging use the logger instance from `@salesforce/b2c-tooling-sdk/logger` package
- CLI commands have access to this logger via `this.log` method from oclif Command class
- CLI commands can write directly to stdout/stderr if their primary purpose is to output or stream data

## MCP Development

For MCP tools, resources, and workflow skills, see the
[MCP development skill](./.agents/skills/mcp-development/SKILL.md).

## CLI Command Development

See [CLI command development skill](./.claude/skills/cli-command-development/SKILL.md) for patterns.

## Claude Code Skills

**User-facing skills** (for CLI users): `./skills/b2c-cli/skills/` - update when modifying CLI commands.

**Developer skills** (for contributors): `./.claude/skills/` - covers:

- [CLI command development](./.claude/skills/cli-command-development/SKILL.md) - oclif commands, flags, table output
- [SDK module development](./.claude/skills/sdk-module-development/SKILL.md) - modules, exports, barrel files
- [API client development](./.claude/skills/api-client-development/SKILL.md) - OpenAPI clients, OAuth scopes, SCAPI patterns
- [Testing](./.claude/skills/testing/SKILL.md) - Mocha, Chai, MSW patterns
- [Documentation](./.claude/skills/documentation/SKILL.md) - user guides, CLI reference, API docs
- [Review](./.claude/skills/review/SKILL.md) - reviewing a branch or pull request before merge

## Pull Requests

- GUS work-item prefixes in PR titles must include `@`, for example `@W-24337127: Support OpenShell sandboxes`.
- Fill in `.github/PULL_REQUEST_TEMPLATE.md`. Describe the net change against the base branch, not the commit history.
- State platform dependencies. If the change needs a particular B2C Commerce platform release, a feature toggle enabled on the instance, or an API that is not generally available yet, say which one and what users see without it. Validate against the platform release that is currently deployed, not only an upcoming one.
- Keep `main` releasable. Every merge to `main` ships in the next release, which is usually within days (see [Releases](./CONTRIBUTING.md#releases)). Do not land part of a multi-step change (a backend migration, or a feature spanning several commands) in a state users should not get. Develop it on an integration branch and merge it as a whole, or keep the unfinished part behind an opt-in flag or configuration until it is complete.
- This repository is public. PR titles and descriptions, commit messages, code comments, changesets, docs, and skills must not contain internal hostnames, URLs, repository names, chat channels, internal tool names, customer or instance names, or people's names. GUS work-item IDs are the only internal identifiers allowed. Use placeholders such as `my-sandbox` or `example.com`.

## Definition of Done

Before reporting a change as complete:

1. Run `pnpm run lint:agent`. It catches prettier formatting, import ordering, class member ordering (`perfectionist/sort-classes`), and other issues that fail CI.
2. Run `pnpm run typecheck:agent` and `test:agent` for each changed package (or from the root).
3. Add or update tests for behavior changes (see [Testing](#testing)).
4. When commands, flags, MCP tools, or output change, update docs, user-facing skills, and the tooling documentation index (below).
5. Add a changeset for user-facing changes (see [Changesets](#changesets)).
6. Review the diff (see the [review skill](./.claude/skills/review/SKILL.md)).

If a check cannot run (missing credentials, no instance available, an environment problem), report which check and why instead of calling the work done. Do not describe a targeted test run as a full-suite pass.

### Tooling documentation index

When you add/remove/rename a CLI command or change the MRT docs (`docs/cli/`) or user-facing skills (`skills/b2c-cli/`), regenerate the checked-in tooling documentation index (`packages/b2c-tooling-sdk/data/tooling/index.json`) and commit the result:

```bash
# Regenerate the index (run after doc/command changes)
pnpm --filter @salesforce/b2c-tooling-sdk run generate:tooling-index

# Verify it is up to date (this is what CI runs)
pnpm --filter @salesforce/b2c-tooling-sdk run check:tooling-index
```

A stale index fails CI's "Verify tooling documentation index" step first, which then **skips** the "Build packages" step — surfacing as a cascade of unrelated `import/no-unresolved` errors across packages. If you see that pattern, regenerate the index rather than chasing the import errors.

## Testing

See [testing skill](./.claude/skills/testing/SKILL.md) for patterns on writing tests with Mocha, Chai, and MSW.

**Stdout in tests**: Command tests must not leak output to the console. `stubCommandConfigAndLogger()` silences `command.log`, `command.logToStderr`, and `ux.stdout` automatically. For other cases, use `runSilent()` from `test/helpers/test-setup.ts`.

## Backward Compatibility

Users depend on released CLI commands, MCP tools, and SDK exports in scripts, CI pipelines, and agent configurations. Each of these is a breaking change:

- Removing or renaming a command, argument, flag, or short flag (`char`), or changing a flag's meaning or default.
- Renaming or removing table column keys (used by `--columns`) or `--json` fields, or changing their type or shape.
- Removing or renaming an MCP tool, a tool input, or an MCP server flag, or making an optional input required.
- Removing an SDK export or `exports` entry, or changing the signature of an exported function, class, or type.

Prefer a non-breaking path:

- Keep the old name working as an alias (`aliases`, `charAliases`, or `deprecateAliases` on flags and commands).
- Keep a removed flag as a hidden, deprecated option that warns and does nothing, instead of failing to parse. This matters most for MCP server flags, because a startup failure disables every tool for that user.
- Add new `--json` fields instead of renaming existing ones.
- Do not take a short flag away from an existing flag, and do not reuse a short flag with a different meaning in sibling commands.

When a break is unavoidable, use a `major` changeset for the affected package and say how to migrate. MCP resource and skill URIs (`skill://...`) are not part of this contract, so renaming them is not breaking.

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management with **independent per-package versioning**. Each package versions independently based on its own changesets.

**How it works:**

- A changeset affecting only the SDK bumps only the SDK version
- Packages that depend on a bumped package get an automatic patch bump (via `updateInternalDependencies: "patch"`) — e.g., if SDK bumps, CLI, MCP, and Docs all auto-get a patch bump
- Only packages with a newer version than what's on npm get published (docs package is private and uses git tags instead)
- A changeset targeting only `@salesforce/b2c-dx-docs` triggers a doc-only release — no npm packages are published, just a `docs@<version>` tag and docs rebuild

Changeset guidelines:

- Create a changeset for any user-facing changes (features, bug fixes); typically in new pull requests
- Use separate changesets for distinct user-facing features or fixes in a pull request. Describe the final change relative to the base branch, not the branch's implementation history; fold follow-up work on an unreleased feature into that feature's changeset.
- Only list directly-changed packages in changeset frontmatter — do not include dependent packages (they get auto-bumped)
- Select the appropriate semver bump: `patch` (bug fixes) or `minor` (new features)
- Use `major` for breaking changes that require consumers to update their code (see [Backward Compatibility](#backward-compatibility))
- Good changesets explain:
  - WHAT the change is
  - WHY the change was made
  - HOW a consumer should update their code
- Good changesets are brief and user-focused (not contributor); they are generally 1 line or two; The content of the changeset is used in CHANGELOG and release notes. You do not need to list internal implementation details or all details of commands; just the high level summary for users.

Valid changeset packages: `@salesforce/b2c-api-schemas`, `@salesforce/b2c-cli`, `@salesforce/b2c-tooling-sdk`, `@salesforce/b2c-dx-mcp`, `@salesforce/mrt-utilities`, `b2c-vs-extension`, `@salesforce/b2c-dx-docs`, `@salesforce/b2c-agent-plugins`, `@salesforce/b2c-tooling-sdk-python`

Create a changeset file directly in `.changeset/` with a unique filename (e.g., `descriptive-change-name.md`):

```md
---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Description of the change explaining WHAT, WHY, and HOW to update
```

- Include only the packages that were directly modified
- For doc-only changes, target `@salesforce/b2c-dx-docs` instead of the CLI/SDK/MCP packages
- For changes to the GitHub Actions (`action.yml`, `actions/`), target `@salesforce/b2c-cli` — Actions are released with each CLI publish at the same version
- For changes to agent skills/plugins in `skills/` (adding or updating skill content, adding a new plugin), target `@salesforce/b2c-agent-plugins`
- For docs corpus refreshes (the bundled content behind `b2c docs search`/`read` and the MCP `docs_*` tools under `packages/b2c-tooling-sdk/data/`, such as Developer Center guides, Salesforce Help, Script API, job steps, and XSDs), list `@salesforce/b2c-cli`, `@salesforce/b2c-dx-mcp`, and `@salesforce/b2c-tooling-sdk` explicitly, even though only SDK files change. This is an exception to the "directly-changed packages" rule: a dependency-only bump shows in the CLI and MCP changelogs as "Updated dependencies", and the release notes page sorts SDK-only entries last, so the refresh would otherwise be hidden from CLI and MCP users. One changeset listing all three appears once in the unified release notes, with a badge for each product. Describe the refresh in terms of `b2c docs` search and the MCP docs tools, not the SDK.
- For changes to the Python SDK port (`python/b2c-tooling-sdk/`), target `@salesforce/b2c-tooling-sdk-python` — this is a private, unpublished `package.json` used only so Changesets can version and changelog that package; the bumped version flows into `pyproject.toml`/`version.py` via `scripts/sync-python-sdk-version.mjs`, but the actual release (tagging, pushing) is a separate manual step (see `python/b2c-tooling-sdk/RELEASE.md`), not automated by this repo's CI
