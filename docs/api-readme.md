---
description: API reference for the B2C Tooling SDK with typed WebDAV and OCAPI clients for programmatic B2C Commerce operations.
---

# API Reference

The `@salesforce/b2c-tooling-sdk` package provides TypeScript APIs for B2C Commerce development, including instance clients (WebDAV, OCAPI), platform service clients (SCAPI, SLAS, MRT, ODS), high-level operations, and developer utilities.

## Installation

```bash
npm install @salesforce/b2c-tooling-sdk
```

## Package Structure

The SDK is organized into focused submodules that can be imported individually:

```
@salesforce/b2c-tooling-sdk
├── /config          # Configuration resolution (dw.json, env vars)
├── /auth            # Authentication strategies (OAuth, Basic, API Key)
├── /clients         # Low-level API clients (WebDAV, OCAPI, SLAS, ODS, MRT)
├── /logging         # Pino-based logging configuration
│
├── /operations/code # Code deployment, cartridge management
├── /operations/jobs # Job execution, site archive import/export
├── /operations/logs # Log tailing and retrieval
├── /operations/mrt  # Managed Runtime bundle operations
├── /operations/ods  # On-demand sandbox utilities
│
├── /docs            # B2C Script API documentation search
└── /schemas         # OpenAPI schema utilities
```

Import from specific submodules to access their functionality:

```typescript
import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';
import { findAndDeployCartridges } from '@salesforce/b2c-tooling-sdk/operations/code';
import { tailLogs } from '@salesforce/b2c-tooling-sdk/operations/logs';
```

## Quick Start

### B2C Instance Operations

```typescript
import { B2CInstance } from '@salesforce/b2c-tooling-sdk';

const instance = new B2CInstance(
  { hostname: 'your-sandbox.demandware.net', codeVersion: 'v1' },
  { oauth: { clientId: 'your-client-id', clientSecret: 'your-client-secret' } }
);

// Typed WebDAV client
await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);

// Typed OCAPI client (openapi-fetch)
const { data } = await instance.ocapi.GET('/sites');
```

### Job Execution

```typescript
import { executeJob, waitForJob } from '@salesforce/b2c-tooling-sdk/operations/jobs';

const execution = await executeJob(instance, 'MyCustomJob');
const result = await waitForJob(instance, 'MyCustomJob', execution.id!);
```

### Platform Service Clients

```typescript
import { createSlasClient, OAuthStrategy } from '@salesforce/b2c-tooling-sdk';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  scopes: ['SLAS_ORGANIZATION_ADMIN'],
});

const slasClient = createSlasClient({ shortCode: 'kv7kzm78' }, auth);
const { data } = await slasClient.GET('/tenants/{tenantId}/clients', {
  params: { path: { tenantId: 'your-tenant' } },
});
```

### MRT Operations

```typescript
import { pushBundle, ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk';

const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!);
const result = await pushBundle({
  projectSlug: 'my-storefront',
  buildDirectory: './build',
  target: 'staging',
}, auth);
```

## Configuration Resolution

The `resolveConfig()` function provides a robust configuration system with multi-source loading and validation.

### Multi-Source Loading

Configuration is loaded from multiple sources with the following priority (highest to lowest):

1. **Explicit overrides** - Values passed to `resolveConfig()`
2. **dw.json** - Project configuration file (searched upward from cwd)
3. **~/.mobify** - Home directory file for MRT API key

```typescript
import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';

// Override specific values, rest loaded from dw.json
const config = resolveConfig({
  hostname: process.env.SFCC_SERVER,      // Override hostname
  clientId: process.env.SFCC_CLIENT_ID,   // Override from env
  clientSecret: process.env.SFCC_CLIENT_SECRET,
});
```

### Validation Helpers

The resolved config provides methods to check what configuration is available:

```typescript
const config = resolveConfig();

// Check for B2C instance configuration
if (config.hasB2CInstanceConfig()) {
  const instance = config.createB2CInstance();
}

// Check for MRT configuration
if (config.hasMrtConfig()) {
  const mrtAuth = config.createMrtAuth();
}

// Other validation methods
config.hasOAuthConfig();      // OAuth credentials available?
config.hasBasicAuthConfig();  // Basic auth credentials available?
```

## Authentication

B2CInstance supports multiple authentication methods:

### OAuth (Client Credentials)

Used for OCAPI and can be used for WebDAV:

```typescript
const config = resolveConfig({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  scopes: ['SALESFORCE_COMMERCE_API:...:dwsid'],
});

const instance = config.createB2CInstance();
```

### Basic Auth

Used for WebDAV operations (Business Manager credentials):

```typescript
const config = resolveConfig({
  username: 'admin',
  password: 'your-access-key',
  clientId: 'your-client-id',      // Still needed for OCAPI
  clientSecret: 'your-client-secret',
});

const instance = config.createB2CInstance();
```

When both are configured, WebDAV uses Basic auth and OCAPI uses OAuth.

## Typed Clients

### WebDAV Client

```typescript
// Upload files
await instance.webdav.put('Cartridges/v1/app.zip', buffer, 'application/zip');

// List directory contents
const entries = await instance.webdav.propfind('Cartridges');

// Download files
const content = await instance.webdav.get('Cartridges/v1/app.zip');

// Also supports: mkcol, exists, delete, unzip, request
```

### OCAPI Client

The OCAPI client uses [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) with full TypeScript support:

```typescript
// List sites
const { data, error } = await instance.ocapi.GET('/sites', {
  params: { query: { select: '(**)' } },
});

// Get a specific site
const { data, error } = await instance.ocapi.GET('/sites/{site_id}', {
  params: { path: { site_id: 'RefArch' } },
});

// Activate a code version
const { data, error } = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
  params: { path: { code_version_id: 'v1' } },
  body: { active: true },
});
```

## Logging

Configure logging for debugging HTTP requests:

```typescript
import { configureLogger } from '@salesforce/b2c-tooling-sdk/logging';

// Enable debug logging (shows HTTP request summaries)
configureLogger({ level: 'debug' });

// Enable trace logging (shows full request/response with headers and bodies)
configureLogger({ level: 'trace' });
```
