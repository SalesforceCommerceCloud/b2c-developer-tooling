---
description: API reference for the B2C Tooling SDK with typed WebDAV and OCAPI clients for programmatic B2C Commerce operations.
---

# API Reference

The `@salesforce/b2c-tooling-sdk` package provides a programmatic API for interacting with Salesforce B2C Commerce instances.

## Installation

```bash
npm install @salesforce/b2c-tooling-sdk
```

## Quick Start

### From Configuration (Recommended)

Use `resolveConfig()` to load configuration from project files (dw.json) and create a B2C instance:

```typescript
import { resolveConfig } from '@salesforce/b2c-tooling-sdk/config';

// Load configuration, override secrets from environment
const config = resolveConfig({
  clientId: process.env.SFCC_CLIENT_ID,
  clientSecret: process.env.SFCC_CLIENT_SECRET,
});

// Validate configuration before use
if (!config.hasB2CInstanceConfig()) {
  throw new Error('Missing B2C instance configuration');
}

// Create instance from validated config
const instance = config.createB2CInstance();

// Use typed WebDAV client
await instance.webdav.mkcol('Cartridges/v1');
await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);

// Use typed OCAPI client (openapi-fetch)
const { data, error } = await instance.ocapi.GET('/sites', {
  params: { query: { select: '(**)' } },
});

// Check for configuration warnings
for (const warning of config.warnings) {
  console.warn(warning.message);
}
```

### Direct Construction

For advanced use cases, you can construct a B2CInstance directly:

```typescript
import { B2CInstance } from '@salesforce/b2c-tooling-sdk';

const instance = new B2CInstance(
  { hostname: 'your-sandbox.demandware.net', codeVersion: 'v1' },
  {
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    }
  }
);
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
  const mrtClient = config.createMrtClient({ project: 'my-project' });
}

// Other validation methods
config.hasOAuthConfig();      // OAuth credentials available?
config.hasBasicAuthConfig();  // Basic auth credentials available?
```

### Configuration Warnings

The config system detects potential issues and provides warnings:

```typescript
const config = resolveConfig({
  hostname: 'staging.demandware.net', // Different from dw.json
});

// Check warnings
for (const warning of config.warnings) {
  console.warn(`[${warning.code}] ${warning.message}`);
}
```

### Hostname Protection

When you explicitly override the hostname with a value that differs from dw.json, the system protects against credential leakage by ignoring the dw.json credentials. This prevents accidentally using production credentials against a staging server.

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
// Create directories
await instance.webdav.mkcol('Cartridges/v1');

// Upload files
await instance.webdav.put('Cartridges/v1/app.zip', buffer, 'application/zip');

// Download files
const content = await instance.webdav.get('Cartridges/v1/app.zip');

// List directory
const entries = await instance.webdav.propfind('Cartridges');

// Check existence
const exists = await instance.webdav.exists('Cartridges/v1');

// Delete
await instance.webdav.delete('Cartridges/v1/old-file.zip');
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
