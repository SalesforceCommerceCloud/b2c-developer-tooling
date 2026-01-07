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

# Run tests (includes linting)
pnpm run test

# Dev mode for CLI (uses source files directly)
pnpm --filter @salesforce/b2c-cli run dev
# or using convenience script
./cli

# Run tests for specific package
pnpm --filter @salesforce/b2c-cli run test
pnpm --filter @salesforce/b2c-tooling-sdk run test

# Format code with prettier
pnpm run -r format

# Lint only (without tests)
pnpm run -r lint
```

## Setup/Packaging

- use `pnpm` over `npm` for package management
- the `pnpm run test` commands also run the linter after tests
- use `pnpm run -r format` (or individually in packages) to format code with prettier
- use `exports` field in package.json files to define public API surface for packages; use `development` field for nodejs --conditions for development ergonomics (packages/b2c-cli/bin/dev.js will use this condition)

## Documentation

See [documentation skill](./.claude/skills/documentation/SKILL.md) for details on updating user guides, CLI reference, and API docs.

## Logging

- when logging use the logger instance from `@salesforce/b2c-tooling-sdk/logger` package
- CLI commands have access to this logger via `this.log` method from oclif Command class
- CLI commands can write directly to stdout/stderr if their primary purpose is to output or stream data

## Table Output

Use `createTable` from `@salesforce/b2c-tooling-sdk/cli` for tabular output. See [CLI command development skill](./.claude/skills/cli-command-development/SKILL.md) for patterns.

## Claude Code Skills

**User-facing skills** (for CLI users): `./plugins/b2c-cli/skills/` - update when modifying CLI commands.

**Developer skills** (for contributors): `./.claude/skills/` - covers CLI development, SDK modules, testing, and documentation.

## Testing

See [testing skill](./.claude/skills/testing/SKILL.md) for patterns on writing tests with Mocha, Chai, and MSW.

Quick commands:
```bash
pnpm run test                                    # Run all tests
pnpm --filter @salesforce/b2c-tooling-sdk run test  # Test specific package
pnpm mocha "test/clients/webdav.test.ts"         # Single file (no coverage)
```
