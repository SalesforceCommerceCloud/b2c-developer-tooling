# Salesforce Commerce Cloud B2C Tooling SDK

> [!NOTE]
> This project is currently in **Developer Preview**. Not all features are implemented, and the API may change in future releases.

A TypeScript SDK for programmatic access to Salesforce Commerce Cloud B2C APIs including OCAPI, WebDAV, SLAS, ODS, and MRT.

[![Version](https://img.shields.io/npm/v/@salesforce/b2c-tooling-sdk.svg)](https://npmjs.org/package/@salesforce/b2c-tooling-sdk)

## Installation

```bash
npm install @salesforce/b2c-tooling-sdk
```

## Quick Start

### From Configuration (Recommended)

Use `resolveConfig()` to load configuration from project files (dw.json) and create a B2C instance:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';

// Load configuration, override secrets from environment
const config = resolveConfig({
  clientId: process.env.SFCC_CLIENT_ID,
  clientSecret: process.env.SFCC_CLIENT_SECRET,
});

// Create instance from validated config
const instance = config.createB2CInstance();

// Use typed WebDAV client
await instance.webdav.mkcol('Cartridges/v1');
await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);

// Use typed OCAPI client (openapi-fetch)
const {data, error} = await instance.ocapi.GET('/sites', {
  params: {query: {select: '(**)'}},
});
```

### Direct Construction

For advanced use cases, you can construct a B2CInstance directly:

```typescript
import {B2CInstance} from '@salesforce/b2c-tooling-sdk';

const instance = new B2CInstance(
  {hostname: 'your-sandbox.demandware.net', codeVersion: 'v1'},
  {
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
    },
  },
);
```

## Features

### WebDAV Operations

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
const {data, error} = await instance.ocapi.GET('/sites', {
  params: {query: {select: '(**)'}},
});

// Activate a code version
const {data, error} = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
  params: {path: {code_version_id: 'v1'}},
  body: {active: true},
});
```

### Code Deployment

```typescript
import {findAndDeployCartridges, activateCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';

// Deploy cartridges
await findAndDeployCartridges(instance, './cartridges', {reload: true});

// Activate code version
await activateCodeVersion(instance, 'v1');
```

### Job Execution

```typescript
import {executeJob, waitForJob, siteArchiveImport} from '@salesforce/b2c-tooling-sdk/operations/jobs';

// Run a job and wait for completion
const execution = await executeJob(instance, 'my-job-id');
const result = await waitForJob(instance, 'my-job-id', execution.id);

// Import a site archive
await siteArchiveImport(instance, './site-data.zip');
```

## Module Exports

The SDK provides subpath exports for tree-shaking and organization:

| Export                                         | Description                                           |
| ---------------------------------------------- | ----------------------------------------------------- |
| `@salesforce/b2c-tooling-sdk`                  | Main entry point with all exports                     |
| `@salesforce/b2c-tooling-sdk/config`           | Configuration resolution (resolveConfig)              |
| `@salesforce/b2c-tooling-sdk/auth`             | Authentication strategies (OAuth, Basic, API Key)     |
| `@salesforce/b2c-tooling-sdk/instance`         | B2CInstance class                                     |
| `@salesforce/b2c-tooling-sdk/clients`          | Low-level API clients (WebDAV, OCAPI, SLAS, ODS, MRT) |
| `@salesforce/b2c-tooling-sdk/operations/code`  | Code deployment operations                            |
| `@salesforce/b2c-tooling-sdk/operations/jobs`  | Job execution and site import/export                  |
| `@salesforce/b2c-tooling-sdk/operations/sites` | Site management                                       |
| `@salesforce/b2c-tooling-sdk/discovery`        | Workspace type detection (PWA Kit, SFRA, etc.)        |
| `@salesforce/b2c-tooling-sdk/cli`              | CLI utilities (BaseCommand, table rendering)          |
| `@salesforce/b2c-tooling-sdk/logging`          | Structured logging utilities                          |

## Logging

Configure logging for debugging HTTP requests:

```typescript
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

// Enable debug logging (shows HTTP request summaries)
configureLogger({level: 'debug'});

// Enable trace logging (shows full request/response with headers and bodies)
configureLogger({level: 'trace'});
```

## Documentation

Full documentation is available at: https://salesforcecommercecloud.github.io/b2c-developer-tooling/

## Requirements

- Node.js >= 22.16.0

## License

This project is licensed under the Apache License 2.0. See [LICENSE.txt](../../LICENSE.txt) for full details.

## Disclaimer

This project is currently in **Developer Preview** and is provided "as-is" without warranty of any kind. It is not yet generally available (GA) and should not be used in production environments. Features, APIs, and functionality may change without notice in future releases.
