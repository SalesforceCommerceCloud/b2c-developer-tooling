# B2C CLI and Tooling SDK

[![CI](https://github.com/SalesforceCommerceCloud/b2c-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/SalesforceCommerceCloud/b2c-cli/actions/workflows/ci.yml)

> [!NOTE]
> This project is currently in **Developer Preview** and will be open sourced in the future.

Salesforce Commerce Cloud B2C Command Line Tools.

## Features

- Separate CLI and SDK packages
- Structured logging with redaction
- Localization support (i18next)
- Supply chain security via pnpm

## Packages

This is a pnpm monorepo with the following packages:

| Package | Description |
|---------|-------------|
| [`@salesforce/b2c-cli`](./packages/b2c-cli/README.md) | Command line interface built with oclif |
| [`@salesforce/b2c-tooling-sdk`](./packages/b2c-tooling-sdk/README.md) | SDK/library for B2C Commerce operations; supports the CLI and can be used standalone |

## Development

### Prerequisites

- Node.js >= 22.16.0
- pnpm 10.17.1+

### Setup

```bash
pnpm install
```

### Running the CLI in Development Mode

```bash
pnpm start
# or directly:
pnpm --filter @salesforce/b2c-cli run dev
# or using convenience script:
./cli
```

The dev mode uses Node.js `--conditions=development` to resolve TypeScript source files directly from `@salesforce/b2c-tooling-sdk` without needing to build first.

### Building

```bash
# Build all packages
pnpm -r run build

# Build individual packages
pnpm --filter @salesforce/b2c-cli run build
pnpm --filter @salesforce/b2c-tooling-sdk run build
```

### Testing and Linting

```bash
# Run all tests (also runs linter after tests)
pnpm test

# Run linter only
pnpm --filter @salesforce/b2c-cli run lint
pnpm --filter @salesforce/b2c-tooling-sdk run lint
```

### Code Formatting

This project uses Prettier for code formatting.

```bash
# Format all packages
pnpm -r run format

# Check formatting without modifying files
pnpm -r run format:check
```

## Documentation

Documentation is built using [TypeDoc](https://typedoc.org/) for API reference generation and [VitePress](https://vitepress.dev/) for the documentation site.

### Structure

- `docs/` - VitePress documentation source
  - `guide/` - User guide and getting started
  - `cli/` - CLI command reference
  - `api/` - Generated API documentation (do not edit manually)
- `typedoc.json` - TypeDoc configuration with entry points for SDK modules

### Development Server

```bash
pnpm run docs:dev
```

This runs `typedoc` to generate API docs, then starts VitePress in development mode with hot reload.

### Building Documentation

```bash
pnpm run docs:build
```

### Previewing Built Documentation

```bash
pnpm run docs:preview
```

### API Documentation

API documentation is auto-generated from JSDoc comments in the `@salesforce/b2c-tooling-sdk` package. The entry points are defined in `typedoc.json`:

See the [documentation site](https://verbose-adventure-1eqmr1r.pages.github.io/) for the generated API reference.

- `auth` - Authentication strategies (OAuth, API Key, Basic)
- `instance` - B2C instance configuration
- `platform` - MRT and ODS clients
- `operations/code` - Cartridge code operations
- `operations/jobs` - Job execution
- `operations/sites` - Site management
- `i18n` - Internationalization utilities
- `logging` - Structured logging

When adding new public APIs, ensure they have comprehensive JSDoc comments as these will appear in the generated documentation.

## Package Exports

The `@salesforce/b2c-tooling-sdk` package uses the `exports` field in package.json to define its public API surface. Each module is available as a subpath export:

```typescript
import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
import { B2CInstance } from '@salesforce/b2c-tooling-sdk/instance';
import { getLogger } from '@salesforce/b2c-tooling-sdk/logging';
```

The `development` condition in exports enables direct TypeScript source resolution when using `--conditions=development`, which is how `bin/dev.js` works for local development.
