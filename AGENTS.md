# B2C CLI

This is a monorepo project with the following packages:
- `./packages/b2c-cli` - the command line interface built with oclif
- `./packages/b2c-tooling-sdk` - the SDK/library for B2C Commerce operations; supports the CLI and can be used standalone

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

- prefer verbose jsdoc comments for all public methods and classes
- TypeDoc and vitepress will generate documentation from these comments in the `./docs/api` folder
- module level jsdocs will be used for organization; for example packages/b2c-tooling-sdk/src/auth/index.ts barrel file has the module level docs for the `auth` module
- see the typedoc.json file for configuration options including the entry points for documentation generation
- update the docs/ markdown files (non-generated) for user guides and CLI reference when updating major CLI functionalty or adding new commands

## Logging

- when logging use the logger instance from `@salesforce/b2c-tooling-sdk/logger` package
- CLI commands have access to this logger via `this.log` method from oclif Command class
- CLI commands can write directly to stdout/stderr if their primary purpose is to output or stream data

## Table Output

When rendering tabular data in CLI commands, use the shared `TableRenderer` utility from `@salesforce/b2c-tooling-sdk/cli`:

```typescript
import { createTable, type ColumnDef } from '@salesforce/b2c-tooling-sdk/cli';

// Define columns with header and getter function
const COLUMNS: Record<string, ColumnDef<MyDataType>> = {
  id: { header: 'ID', get: (item) => item.id },
  name: { header: 'Name', get: (item) => item.name },
  status: { header: 'Status', get: (item) => item.status },
};

// Render the table
createTable(COLUMNS).render(data, ['id', 'name', 'status']);
```

Features:
- Dynamic column widths based on content
- Supports `extended` flag on columns for optional fields
- Use `TableRenderer` class directly for column validation helpers (e.g., `--columns` flag support)
