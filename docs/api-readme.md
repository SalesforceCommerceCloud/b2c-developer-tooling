# API Reference

The `@salesforce/b2c-tooling-sdk` package provides a programmatic API for interacting with Salesforce B2C Commerce instances.

## Installation

```bash
npm install @salesforce/b2c-tooling-sdk
```

## Quick Start

### From dw.json (Recommended)

The easiest way to create an instance is from a `dw.json` file:

```typescript
import { B2CInstance } from '@salesforce/b2c-tooling-sdk';

// Load configuration from dw.json, override secrets from environment
const instance = B2CInstance.fromDwJson({
  clientId: process.env.SFCC_CLIENT_ID,
  clientSecret: process.env.SFCC_CLIENT_SECRET,
});

// Use typed WebDAV client
await instance.webdav.mkcol('Cartridges/v1');
await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);

// Use typed OCAPI client (openapi-fetch)
const { data, error } = await instance.ocapi.GET('/sites', {
  params: { query: { select: '(**)' } },
});
```

### Direct Construction

You can also construct an instance directly with configuration:

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

## Authentication

B2CInstance supports multiple authentication methods:

### OAuth (Client Credentials)

Used for OCAPI and can be used for WebDAV:

```typescript
const instance = new B2CInstance(
  { hostname: 'sandbox.demandware.net' },
  {
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      scopes: ['SALESFORCE_COMMERCE_API:...:dwsid'],
    }
  }
);
```

### Basic Auth

Used for WebDAV operations (Business Manager credentials):

```typescript
const instance = new B2CInstance(
  { hostname: 'sandbox.demandware.net' },
  {
    basic: {
      username: 'admin',
      password: 'your-access-key'
    },
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    }
  }
);
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
