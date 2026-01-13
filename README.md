# B2C CLI, MCP and Tooling SDK

[![CI](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/actions/workflows/ci.yml/badge.svg)](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/actions/workflows/ci.yml)

> [!NOTE]
> This project is currently in **Developer Preview**. Not all features are implemented, and the API may change in future releases. Please provide feedback via GitHub issues and Unofficial Slack.

Salesforce Commerce Cloud B2C Command Line Tools.


> [!TIP]
> **Just looking for the B2C CLI or MCP install instructions?** Visit the documentation site at [https://salesforcecommercecloud.github.io/b2c-developer-tooling/](https://salesforcecommercecloud.github.io/b2c-developer-tooling/) for the latest install guide and CLI reference.

## Packages

This is a pnpm monorepo with the following packages:

| Package | Description |
|---------|-------------|
| [`b2c-cli`](./packages/b2c-cli/README.md) | Command line interface built with oclif |
| [`b2c-tooling-sdk`](./packages/b2c-tooling-sdk/README.md) | SDK/library for B2C Commerce operations; supports the CLI and can be used standalone |
| [`b2c-dx-mcp`](./packages/b2c-dx-mcp/README.md) | MCP server for B2C Commerce developer experience tools |

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

### Testing

Tests use [Mocha](https://mochajs.org/) + [Chai](https://www.chaijs.com/) with [c8](https://github.com/bcoe/c8) for coverage. HTTP mocking uses [MSW](https://mswjs.io/).

```bash
# Run all tests with coverage (also runs linter after tests)
pnpm test

# Run tests for a specific package
pnpm --filter @salesforce/b2c-tooling-sdk run test

# Run tests without coverage (faster)
pnpm --filter @salesforce/b2c-tooling-sdk run test:unit

# Watch mode for TDD
pnpm --filter @salesforce/b2c-tooling-sdk run test:watch

# Run a specific test file
cd packages/b2c-tooling-sdk
pnpm mocha "test/clients/webdav.test.ts"

# Run tests matching a pattern
pnpm mocha --grep "uploads a file" "test/**/*.test.ts"
```

#### Coverage

Coverage reports are generated in each package's `coverage/` directory:
- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI integration

The SDK package has a 5% coverage threshold that will fail the build if not met.

### Linting

```bash
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

See the [documentation site](https://salesforcecommercecloud.github.io/b2c-developer-tooling/) for the generated API reference.

- `auth` - Authentication strategies (OAuth, API Key, Basic)
- `instance` - B2C instance configuration
- `platform` - MRT and ODS clients
- `operations/code` - Cartridge code operations
- `operations/jobs` - Job execution
- `operations/sites` - Site management
- `i18n` - Internationalization utilities
- `logging` - Structured logging

When adding new public APIs, ensure they have comprehensive JSDoc comments as these will appear in the generated documentation.

## Preview Releases

This project is not yet published to npm. Preview releases are available as tgz files on [GitHub Releases](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling/releases).

### Installing a Preview Release

1. Download the `salesforce-b2c-cli-<version>.tgz` file from the release
2. Install with npm:

```bash
# Install globally
npm install -g ./salesforce-b2c-cli-0.0.1-preview.1.tgz

# Or install locally in a project
npm install ./salesforce-b2c-cli-0.0.1-preview.1.tgz
```

The SDK is bundled in the CLI package, so only one file is needed.

### Creating a Preview Release

Preview releases are created automatically when a tag matching `v*-preview*` is pushed:

```bash
git tag v0.0.1-preview.1
git push origin v0.0.1-preview.1
```

The [preview-release workflow](.github/workflows/preview-release.yml) will:
1. Update package versions from the tag
2. Build and test all packages
3. Create a bundled tarball using `pnpm deploy`
4. Create a GitHub release with the tarball attached

## Package Exports

The `@salesforce/b2c-tooling-sdk` package uses the `exports` field in package.json to define its public API surface. Each module is available as a subpath export:

```typescript
import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
import { B2CInstance } from '@salesforce/b2c-tooling-sdk/instance';
import { getLogger } from '@salesforce/b2c-tooling-sdk/logging';
```

The `development` condition in exports enables direct TypeScript source resolution when using `--conditions=development`, which is how `bin/dev.js` works for local development.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started, submit pull requests, and our code of conduct.

## Security

For security concerns, please review our [Security Policy](./SECURITY.md). Report any security issues to [security@salesforce.com](mailto:security@salesforce.com).

## License

This project is licensed under the Apache License 2.0. See [LICENSE.txt](./LICENSE.txt) for full details.

## Disclaimer

This project is currently in **Developer Preview** and is provided "as-is" without warranty of any kind. It is not yet generally available (GA) and should not be used in production environments. Features, APIs, and functionality may change without notice in future releases.
