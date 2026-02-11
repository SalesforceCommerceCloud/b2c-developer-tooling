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

### Account Manager User Management

```typescript
import {
  getUserByLogin,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUser,
  grantRole,
  revokeRole,
} from '@salesforce/b2c-tooling-sdk/operations/users';
import {createAccountManagerUsersClient} from '@salesforce/b2c-tooling-sdk/clients';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const client = createAccountManagerUsersClient({}, auth);

// List users with pagination
const users = await listUsers(client, {size: 25, page: 0});

// Get user by email
const user = await getUserByLogin(client, 'user@example.com');

// Create a new user
const newUser = await createUser(client, {
  user: {
    mail: 'newuser@example.com',
    firstName: 'John',
    lastName: 'Doe',
    organizations: ['org-id'],
    primaryOrganization: 'org-id',
  },
});

// Update a user
await updateUser(client, {
  userId: user.id!,
  changes: {firstName: 'Jane'},
});

// Grant a role to a user
await grantRole(client, {
  userId: user.id!,
  role: 'bm-admin',
  scope: 'tenant1,tenant2', // Optional tenant filter
});

// Reset user to INITIAL state
await resetUser(client, user.id!);
```

### Account Manager Role Management

```typescript
import {getRole, listRoles} from '@salesforce/b2c-tooling-sdk/operations/roles';
import {createAccountManagerRolesClient} from '@salesforce/b2c-tooling-sdk/clients';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const client = createAccountManagerRolesClient({}, auth);

// Get role details by ID
const role = await getRole(client, 'bm-admin');

// List all roles with pagination
const roles = await listRoles(client, {size: 25, page: 0});

// List roles filtered by target type
const userRoles = await listRoles(client, {
  size: 25,
  page: 0,
  roleTargetType: 'User',
});
```

### Account Manager Organization Management

```typescript
import {getOrg, getOrgByName, listOrgs, getOrgAuditLogs} from '@salesforce/b2c-tooling-sdk/operations/orgs';
import {createAccountManagerOrgsClient} from '@salesforce/b2c-tooling-sdk/clients';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const client = createAccountManagerOrgsClient({}, auth);

// Get organization by ID
const org = await getOrg(client, 'org-123');

// Get organization by name
const orgByName = await getOrgByName(client, 'My Organization');

// List organizations with pagination
const orgs = await listOrgs(client, {size: 25, page: 0});

// List all organizations (uses max page size of 5000)
const allOrgs = await listOrgs(client, {all: true});

// Get audit logs for an organization
const auditLogs = await getOrgAuditLogs(client, 'org-123');
```

### Account Manager API Client Management

Manage Account Manager API clients (OAuth client credentials used for API access) via the unified Account Manager client:

```typescript
import {
  createAccountManagerClient,
  type APIClientCreate,
  type APIClientUpdate,
} from '@salesforce/b2c-tooling-sdk/clients';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const client = createAccountManagerClient({}, auth);

// List API clients with pagination
const apiClients = await client.listApiClients({size: 25, page: 0});

// Get a single API client by ID (optional expand: organizations, roles)
const apiClient = await client.getApiClient('api-client-id', ['organizations', 'roles']);

// Create a new API client
const newClient = await client.createApiClient({
  name: 'My API Client',
  password: 'initial-password',
  organizations: ['org-id'],
  roles: ['ECOM_ADMIN'],
  active: true,
});

// Update an API client (e.g. disable, change name, roles, or organizations)
await client.updateApiClient('api-client-id', {
  name: 'Updated Name',
  active: false,
});

// Change API client password (requires old password)
await client.changeApiClientPassword('api-client-id', 'old-password', 'new-password');

// Delete an API client (must be disabled for at least 7 days first)
await client.deleteApiClient('api-client-id');
```

For direct access to the API Clients API only, use `createAccountManagerApiClientsClient` from `@salesforce/b2c-tooling-sdk/clients`.

## Module Exports

The SDK provides subpath exports for tree-shaking and organization:

| Export                                         | Description                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `@salesforce/b2c-tooling-sdk`                  | Main entry point with all exports                                              |
| `@salesforce/b2c-tooling-sdk/config`           | Configuration resolution (resolveConfig)                                       |
| `@salesforce/b2c-tooling-sdk/auth`             | Authentication strategies (OAuth, Basic, API Key)                              |
| `@salesforce/b2c-tooling-sdk/instance`         | B2CInstance class                                                              |
| `@salesforce/b2c-tooling-sdk/clients`          | Low-level API clients (WebDAV, OCAPI, SLAS, ODS, MRT, Account Manager clients) |
| `@salesforce/b2c-tooling-sdk/operations/code`  | Code deployment operations                                                     |
| `@salesforce/b2c-tooling-sdk/operations/jobs`  | Job execution and site import/export                                           |
| `@salesforce/b2c-tooling-sdk/operations/sites` | Site management                                                                |
| `@salesforce/b2c-tooling-sdk/operations/users` | Account Manager user management                                                |
| `@salesforce/b2c-tooling-sdk/operations/roles` | Account Manager role management                                                |
| `@salesforce/b2c-tooling-sdk/operations/orgs`  | Account Manager organization management                                        |
| `@salesforce/b2c-tooling-sdk/discovery`        | Workspace type detection (PWA Kit, SFRA, etc.)                                 |
| `@salesforce/b2c-tooling-sdk/cli`              | CLI utilities (BaseCommand, table rendering)                                   |
| `@salesforce/b2c-tooling-sdk/logging`          | Structured logging utilities                                                   |

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
