---
name: sdk-module-development
description: Adding new modules and exports to the @salesforce/b2c-tooling-sdk package. Use when creating a new SDK module, adding barrel file exports, configuring package.json exports, or building client factory functions.
metadata:
  internal: true
---

# SDK Module Development

This skill covers adding new modules and exports to the `@salesforce/b2c-tooling-sdk` package.

## Package Structure

The SDK is organized into functional layers:

```
packages/b2c-tooling-sdk/src/
├── auth/              # Authentication strategies
├── instance/          # B2CInstance entry point
├── clients/           # HTTP clients (WebDAV, OCAPI, SLAS, ODS, MRT)
├── platform/          # Platform APIs
├── operations/        # High-level business operations
│   ├── code/         # Code deployment
│   ├── jobs/         # Job execution
│   ├── sites/        # Site management
│   └── mrt/          # MRT deployments
├── cli/              # Base command classes for oclif
├── logging/          # Pino-based logging
├── errors/           # Error types
├── config/           # Configuration loading
└── i18n/             # Internationalization
```

## Barrel File Pattern

Each module uses an `index.ts` barrel file that exports the public API:

```typescript
/**
 * Authentication strategies for B2C Commerce APIs.
 *
 * This module provides various authentication mechanisms for B2C Commerce:
 * - OAuth 2.0 client credentials flow
 * - Basic authentication for WebDAV
 * - API key authentication
 *
 * @example
 * ```typescript
 * import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new OAuthStrategy({
 *   clientId: 'my-client',
 *   clientSecret: 'my-secret',
 * });
 * ```
 *
 * @module auth
 */

// Types
export type { AuthStrategy, AuthConfig } from './types.js';

// Strategies
export { BasicAuthStrategy } from './basic.js';
export { OAuthStrategy, decodeJWT } from './oauth.js';

// Resolution helpers
export { resolveAuthStrategy, checkAvailableAuthMethods } from './resolve.js';
```

Key points:
- Module-level JSDoc with `@module` tag for TypeDoc
- Include usage examples in the JSDoc
- Group exports logically (types, classes, functions)
- Only export public API items

## Package.json Exports

The `exports` field in `packages/b2c-tooling-sdk/package.json` uses a development condition pattern:

```json
{
  "exports": {
    "./newmodule": {
      "development": "./src/newmodule/index.ts",
      "import": {
        "types": "./dist/esm/newmodule/index.d.ts",
        "default": "./dist/esm/newmodule/index.js"
      },
      "require": {
        "types": "./dist/cjs/newmodule/index.d.ts",
        "default": "./dist/cjs/newmodule/index.js"
      }
    }
  }
}
```

The `development` condition:
- Points directly to TypeScript source files
- Used when running with `--conditions=development` (via `bin/dev.js`)
- Enables hot-reloading during development without rebuilding

## Client Factory Pattern

HTTP clients follow a consistent factory function pattern:

```typescript
// src/clients/newapi.ts
import createClient, { type Client } from 'openapi-fetch';
import type { AuthStrategy } from '../auth/types.js';
import type { paths, components } from './newapi.generated.js';
import { createAuthMiddleware, createLoggingMiddleware } from './middleware.js';

// Re-export generated types for consumers
export type { paths, components };

// Define client type alias
export type NewApiClient = Client<paths>;

// Factory function (not class)
export function createNewApiClient(
  hostname: string,
  auth: AuthStrategy,
  options?: { apiVersion?: string }
): NewApiClient {
  const { apiVersion = 'v1' } = options ?? {};

  const client = createClient<paths>({
    baseUrl: `https://${hostname}/api/newapi/${apiVersion}`,
  });

  // Middleware order: auth first (runs last), logging last (sees complete request)
  client.use(createAuthMiddleware(auth));
  client.use(createLoggingMiddleware('NEWAPI'));

  return client;
}
```

Then export from the clients barrel:

```typescript
// src/clients/index.ts
export { createNewApiClient } from './newapi.js';
export type { NewApiClient, paths as NewApiPaths, components as NewApiComponents } from './newapi.js';
```

For SCAPI clients with OAuth scope requirements, see [API Client Development](../api-client-development/SKILL.md) for advanced patterns including scope injection and tenant ID handling.

## OpenAPI Type Generation

For APIs with OpenAPI specs, generate TypeScript types:

1. Add the spec file to `packages/b2c-tooling-sdk/specs/`

2. Update the generate script in `package.json`:

```json
{
  "scripts": {
    "generate:types": "openapi-typescript specs/data-api.json -o src/clients/ocapi.generated.ts && openapi-typescript specs/newapi-v1.yaml -o src/clients/newapi.generated.ts"
  }
}
```

3. Run generation:

```bash
pnpm --filter @salesforce/b2c-tooling-sdk run generate:types
```

4. Import the generated types in your client:

```typescript
import type { paths, components } from './newapi.generated.js';
```

## Operations Module Pattern

Operations group related business logic:

```
src/operations/newfeature/
├── index.ts          # Barrel file with module JSDoc
├── list.ts           # List operation
├── create.ts         # Create operation
└── types.ts          # Shared types (if needed)
```

Example operation:

```typescript
// src/operations/newfeature/list.ts
import type { NewApiClient } from '../../clients/newapi.js';

export interface ListOptions {
  filter?: string;
  limit?: number;
}

export interface ListResult {
  items: Item[];
  total: number;
}

/**
 * Lists items from the new feature API.
 *
 * @param client - The NewApi client instance
 * @param options - List options
 * @returns List result with items and total count
 *
 * @example
 * ```typescript
 * const result = await listItems(client, { limit: 10 });
 * console.log(result.items);
 * ```
 */
export async function listItems(
  client: NewApiClient,
  options?: ListOptions
): Promise<ListResult> {
  const { data, error } = await client.GET('/items', {
    params: {
      query: {
        filter: options?.filter,
        limit: options?.limit,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to list items: ${error.message}`);
  }

  return {
    items: data.items,
    total: data.total,
  };
}
```

Barrel file:

```typescript
// src/operations/newfeature/index.ts
/**
 * Operations for the new feature.
 *
 * @example
 * ```typescript
 * import { listItems, createItem } from '@salesforce/b2c-tooling-sdk/operations/newfeature';
 * ```
 *
 * @module operations/newfeature
 */

export { listItems, type ListOptions, type ListResult } from './list.js';
export { createItem, type CreateOptions } from './create.js';
```

## Adding a New Module - Step by Step

### 1. Create the module directory

```bash
mkdir -p packages/b2c-tooling-sdk/src/newmodule
```

### 2. Create the implementation file(s)

```typescript
// src/newmodule/feature.ts
export interface FeatureConfig {
  setting: string;
}

export class Feature {
  constructor(private config: FeatureConfig) {}

  doSomething(): string {
    return this.config.setting;
  }
}
```

### 3. Create the barrel file with module JSDoc

```typescript
// src/newmodule/index.ts
/**
 * New module for feature X.
 *
 * @example
 * ```typescript
 * import { Feature } from '@salesforce/b2c-tooling-sdk/newmodule';
 * const f = new Feature({ setting: 'value' });
 * ```
 *
 * @module newmodule
 */

export { Feature, type FeatureConfig } from './feature.js';
```

### 4. Add to package.json exports

```json
{
  "exports": {
    "./newmodule": {
      "development": "./src/newmodule/index.ts",
      "import": {
        "types": "./dist/esm/newmodule/index.d.ts",
        "default": "./dist/esm/newmodule/index.js"
      },
      "require": {
        "types": "./dist/cjs/newmodule/index.d.ts",
        "default": "./dist/cjs/newmodule/index.js"
      }
    }
  }
}
```

### 5. Optionally export from main index

If the module should be accessible from the main package export:

```typescript
// src/index.ts
export { Feature } from './newmodule/index.js';
export type { FeatureConfig } from './newmodule/index.js';
```

### 6. Add to TypeDoc entry points

Add the new module's barrel file to `docs/typedoc.json` so API documentation is generated:

```json
{
  "entryPoints": [
    "...",
    "../packages/b2c-tooling-sdk/src/newmodule/index.ts"
  ]
}
```

### 7. Build and test

```bash
pnpm --filter @salesforce/b2c-tooling-sdk run build
pnpm --filter @salesforce/b2c-tooling-sdk run test
```

## Build System

The SDK builds to both ESM and CommonJS:

```json
{
  "scripts": {
    "build": "pnpm run generate:types && pnpm run build:esm && pnpm run build:cjs",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:cjs": "tsc -p tsconfig.cjs.json && echo '{\"type\":\"commonjs\"}' > dist/cjs/package.json"
  }
}
```

TypeScript configs:
- `tsconfig.json` - Base config with strict settings
- `tsconfig.esm.json` - ESM build to `dist/esm/`
- `tsconfig.cjs.json` - CJS build to `dist/cjs/`

## Import Patterns

For consumers of the SDK:

```typescript
// Main export
import { B2CInstance } from '@salesforce/b2c-tooling-sdk';

// Sub-module exports
import { OAuthStrategy } from '@salesforce/b2c-tooling-sdk/auth';
import { WebDavClient } from '@salesforce/b2c-tooling-sdk/clients';
import { findAndDeployCartridges } from '@salesforce/b2c-tooling-sdk/operations/code';
import { createLogger } from '@salesforce/b2c-tooling-sdk/logging';
import { CartridgeCommand } from '@salesforce/b2c-tooling-sdk/cli';
```

In tests, always use package imports (not relative paths):

```typescript
// Good - uses package exports
import { WebDavClient } from '@salesforce/b2c-tooling-sdk/clients';

// Avoid - relative paths
import { WebDavClient } from '../../src/clients/webdav.js';
```

## Refreshing Bundled Platform Data (Docs, Schemas, Job Steps)

The SDK ships several corpora derived from the B2C Commerce platform under
`packages/b2c-tooling-sdk/data/`:

| Directory | Contents | Consumed by |
| --- | --- | --- |
| `data/script-api/` | Script API reference markdown + `index.json` | `docs search` / `docs read`, MCP `docs_*` |
| `data/content-schemas/` | Page Designer / content metadefinition JSON schemas | `content validate` |
| `data/xsd/` | Import/export XSD schemas + `index.json` | `docs schema *`, XML validation |
| `data/job-steps/` | Standard job-step markdown + dataset + `index.json` | `docs search` / `docs read` |

All of these originate from the **same documentation archive** (`demandware-mock.zip`)
that `b2c docs download` fetches from an instance — the inner `DWAPP-<version>-API-doc.zip`
contains `sfdocs/script-api/`, `content/`, `xsd/`, and `jobstepapi/`. Note that the
user-facing `docs download` command only extracts the Script API markdown; it does **not**
update the bundled data files.

### Refresh all data at once

Run the maintainer script against a current instance (uses your default instance/auth
via the CLI, so no extra setup):

```bash
pnpm --filter @salesforce/b2c-tooling-sdk run refresh:docs-data

# Target a non-default instance, or keep the temp workdir for inspection:
B2C_INSTANCE=my-sandbox KEEP_WORKDIR=1 pnpm --filter @salesforce/b2c-tooling-sdk run refresh:docs-data
```

`scripts/refresh-docs-data.ts` downloads the archive via `b2c docs download`, repopulates
every `data/` directory above from the inner API-doc zip, then regenerates the derived
datasets and search indexes (`build:job-steps-dataset`, `generate:job-steps-docs`,
`generate:docs-index`). It prints the detected platform version (e.g. `DWAPP 26.7`).

### After refreshing

- **Review the diff** under `packages/b2c-tooling-sdk/data/`. Index files change their
  `generatedAt` timestamp every run; look for substantive schema/doc changes.
- The refresh **overwrites files wholesale** — there are no hand-maintained local patches
  to preserve today. If a platform schema change alters validation behavior (e.g. a
  `content-schemas/*.json` rule), update the affected tests to match the new platform rule.
- Run `pnpm --filter @salesforce/b2c-tooling-sdk run test:agent` and add a changeset when
  the refresh changes user-facing behavior (bump the platform version, note the change).

The individual generation scripts can still be run standalone (see each script's header
comment), but `refresh:docs-data` is the one-step path that keeps every corpus in sync
with a single platform release.

## New Module Checklist

1. Create module directory under `src/`
2. Implement feature in separate files
3. Create `index.ts` barrel with module-level JSDoc
4. Add export to `package.json` with development condition
5. Optionally add to main `src/index.ts` exports
6. Add entry point to `docs/typedoc.json` for API doc generation
7. Write tests in `test/` mirroring the src structure
8. Run `pnpm run build` to verify compilation
9. Run `pnpm run test` to verify tests pass
