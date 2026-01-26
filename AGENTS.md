# B2C CLI

This is a monorepo project with the following packages:
- `./packages/b2c-cli` - the command line interface built with oclif
- `./packages/b2c-tooling-sdk` - the SDK/library for B2C Commerce operations; supports the CLI and can be used standalone
- `./packages/b2c-dx-mcp` - Model Context Protocol server; also built with oclif

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

# Lint (errors only, no warnings)
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
- the `pnpm run test` commands also run the linter after tests
- use `pnpm run -r format` (or individually in packages) to format code with prettier
- use `exports` field in package.json files to define public API surface for packages; use `development` field for nodejs --conditions for development ergonomics (packages/b2c-cli/bin/dev.js will use this condition)

## Documentation

- Update docs in `./docs/` folder and relevant skills in `./plugins/b2c-cli/skills/` when updating or adding CLI commands.

See [documentation skill](./.claude/skills/documentation/SKILL.md) for details on updating user guides, CLI reference, and API docs.

```bash
# Run docs dev server (from project root)
pnpm run docs:dev

# Build docs for production
pnpm run docs:build
```

## Logging

- when logging use the logger instance from `@salesforce/b2c-tooling-sdk/logger` package
- CLI commands have access to this logger via `this.log` method from oclif Command class
- CLI commands can write directly to stdout/stderr if their primary purpose is to output or stream data

## CLI Command Development

See [CLI command development skill](./.claude/skills/cli-command-development/SKILL.md) for patterns.

## Claude Code Skills

**User-facing skills** (for CLI users): `./plugins/b2c-cli/skills/` - update when modifying CLI commands.

**Developer skills** (for contributors): `./.claude/skills/` - covers:
- [CLI command development](./.claude/skills/cli-command-development/SKILL.md) - oclif commands, flags, table output
- [SDK module development](./.claude/skills/sdk-module-development/SKILL.md) - modules, exports, barrel files
- [API client development](./.claude/skills/api-client-development/SKILL.md) - OpenAPI clients, OAuth scopes, SCAPI patterns
- [Testing](./.claude/skills/testing/SKILL.md) - Mocha, Chai, MSW patterns
- [Documentation](./.claude/skills/documentation/SKILL.md) - user guides, CLI reference, API docs

## Testing

See [testing skill](./.claude/skills/testing/SKILL.md) for patterns on writing tests with Mocha, Chai, and MSW.

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management. When making changes that affect users, create a changeset:

Changeset guidelines:
- Create a changeset for any user-facing changes (features, bug fixes); typically in new pull requests; 
- a pull request can have multiple changesets
- Select the appropriate semver bump: `patch` (bug fixes) or `minor` (new features)
- This is a pre-1.0 preview release, so there are no `major` breaking change bumps yet
- Good changesets explain:
  - WHAT the change is
  - WHY the change was made
  - HOW a consumer should update their code
- Good changesets are brief and user-focused (not contributor); they are generally 1 line or a short paragraph for detailed changes; The content of the changeset is used in CHANGELOG and release notes.

create a changeset file directly in `.changeset/` with a unique filename (e.g., `descriptive-change-name.md`):

```md
---
'@salesforce/b2c-cli': patch
'@salesforce/b2c-tooling-sdk': patch
---

Description of the change explaining WHAT, WHY, and HOW to update
```

- Include only the packages that were modified
