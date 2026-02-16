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
├── /operations/cip  # Curated CIP analytics reports and SQL helpers
├── /operations/jobs # Job execution, site archive import/export
├── /operations/logs # Log tailing and retrieval
├── /operations/mrt  # Managed Runtime bundle operations
├── /operations/ods  # On-demand sandbox utilities
│
├── /scaffold        # Scaffold discovery, generation, and validation
├── /docs            # B2C Script API documentation search
└── /schemas         # OpenAPI schema utilities
```

Import from specific submodules to access their functionality:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {findAndDeployCartridges} from '@salesforce/b2c-tooling-sdk/operations/code';
import {tailLogs} from '@salesforce/b2c-tooling-sdk/operations/logs';
```

## Quick Start

### B2C Instance Operations

```typescript
import {B2CInstance} from '@salesforce/b2c-tooling-sdk';

const instance = new B2CInstance(
  {hostname: 'your-sandbox.demandware.net', codeVersion: 'v1'},
  {oauth: {clientId: 'your-client-id', clientSecret: 'your-client-secret'}},
);

// Typed WebDAV client
await instance.webdav.put('Cartridges/v1/app.zip', zipBuffer);

// Typed OCAPI client (openapi-fetch)
const {data} = await instance.ocapi.GET('/sites');
```

### Job Execution

```typescript
import {executeJob, waitForJob} from '@salesforce/b2c-tooling-sdk/operations/jobs';

const execution = await executeJob(instance, 'MyCustomJob');
const result = await waitForJob(instance, 'MyCustomJob', execution.id!);
```

### Platform Service Clients

```typescript
import {createSlasClient, OAuthStrategy} from '@salesforce/b2c-tooling-sdk';

const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const slasClient = createSlasClient({shortCode: 'kv7kzm78'}, auth);
const {data} = await slasClient.GET('/tenants/{tenantId}/clients', {
  params: {path: {tenantId: 'your-tenant'}},
});
```

### MRT Operations

```typescript
import {pushBundle, ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk';

const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!);
const result = await pushBundle(
  {
    projectSlug: 'my-storefront',
    buildDirectory: './build',
    target: 'staging',
  },
  auth,
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
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';

// Override specific values, rest loaded from dw.json
const config = resolveConfig({
  hostname: process.env.SFCC_SERVER, // Override hostname
  clientId: process.env.SFCC_CLIENT_ID, // Override from env
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
config.hasOAuthConfig(); // OAuth credentials available?
config.hasBasicAuthConfig(); // Basic auth credentials available?
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
  clientId: 'your-client-id', // Still needed for OCAPI
  clientSecret: 'your-client-secret',
});

const instance = config.createB2CInstance();
```

When both are configured, WebDAV uses Basic auth and OCAPI uses OAuth.

## Typed Clients

The SDK provides typed clients for B2C Commerce APIs. All clients use [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) for full TypeScript support with type-safe paths, parameters, and responses.

### Instance Clients

These clients are accessed via `B2CInstance` for operations on a specific B2C Commerce instance:

| Client                                               | Description                                      | API Reference                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [WebDavClient](./clients/classes/WebDavClient.md)    | File operations (upload, download, list)         | WebDAV                                                                                                                       |
| [OcapiClient](./clients/type-aliases/OcapiClient.md) | Data API operations (sites, jobs, code versions) | [OCAPI Data API](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/b2c-commerce-ocapi/b2c-api-doc.html) |

### Platform Service Clients

These clients are created directly for platform-wide services:

| Client                                                             | Description                                          | API Reference                                                                                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [SlasClient](./clients/type-aliases/SlasClient.md)                 | SLAS tenant and client management                    | [SLAS Admin API](https://developer.salesforce.com/docs/commerce/commerce-api/references/slas-admin?meta=Summary)                    |
| [OdsClient](./clients/type-aliases/OdsClient.md)                   | On-demand sandbox management                         | [ODS REST API](https://developer.salesforce.com/docs/commerce/b2c-commerce/references/ods-rest-api?meta=Summary)                    |
| [MrtClient](./clients/type-aliases/MrtClient.md)                   | Managed Runtime projects and deployments             | [MRT Admin API](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/references/mrt-admin?meta=Summary)           |
| [MrtB2CClient](./clients/type-aliases/MrtB2CClient.md)             | MRT B2C Commerce integration                         | [MRT B2C Config API](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/references/mrt-b2c-config?meta=Summary) |
| [CdnZonesClient](./clients/type-aliases/CdnZonesClient.md)         | eCDN zone and cache management                       | [CDN Zones API](https://developer.salesforce.com/docs/commerce/commerce-api/references/cdn-api-process-apis?meta=Summary)           |
| [ScapiSchemasClient](./clients/type-aliases/ScapiSchemasClient.md) | SCAPI schema discovery                               | [SCAPI Schemas API](https://developer.salesforce.com/docs/commerce/commerce-api/references/scapi-schemas?meta=Summary)              |
| [CustomApisClient](./clients/type-aliases/CustomApisClient.md)     | Custom SCAPI endpoint status                         | [Custom APIs](https://developer.salesforce.com/docs/commerce/commerce-api/references/custom-apis?meta=Summary)                      |
| `CipClient`                                                        | B2C Commerce Intelligence (CIP/CCAC) query execution | [JDBC Driver Intro](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/jdbc_intro.html)                   |

### CIP Analytics (SDK)

Use the CIP client directly for raw SQL, or combine it with metadata + curated report operations.

```typescript
import {
  OAuthStrategy,
  createCipClient,
  describeCipTable,
  executeCipReport,
  listCipTables,
} from '@salesforce/b2c-tooling-sdk';

const auth = new OAuthStrategy({
  clientId: process.env.SFCC_CLIENT_ID!,
  clientSecret: process.env.SFCC_CLIENT_SECRET!,
});

const cip = createCipClient({instance: 'zzxy_prd'}, auth);

// Metadata discovery
const tables = await listCipTables(cip, {schema: 'warehouse', tableNamePattern: 'ccdw_aggr_%'});
const columns = await describeCipTable(cip, 'ccdw_aggr_ocapi_request', {schema: 'warehouse'});

// Curated report execution
const report = await executeCipReport(cip, 'sales-analytics', {
  params: {
    siteId: 'Sites-RefArch-Site',
    from: '2025-01-01',
    to: '2025-01-31',
  },
});

// Or run raw SQL directly
const raw = await cip.query('SELECT submit_date, num_orders FROM ccdw_aggr_sales_summary LIMIT 10');
```

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

```typescript
// List sites
const {data, error} = await instance.ocapi.GET('/sites', {
  params: {query: {select: '(**)'}},
});

// Get a specific site
const {data, error} = await instance.ocapi.GET('/sites/{site_id}', {
  params: {path: {site_id: 'RefArch'}},
});

// Activate a code version
const {data, error} = await instance.ocapi.PATCH('/code_versions/{code_version_id}', {
  params: {path: {code_version_id: 'v1'}},
  body: {active: true},
});
```

## Account Manager Operations

The SDK provides a unified client for managing users, roles, organizations, and API clients through the Account Manager API.

### Authentication

Account Manager operations use **OAuth implicit flow** by default, which opens a browser for interactive authentication. This is ideal for development and manual operations where you want to use roles assigned to your user account.

For CI/CD and automation, you can also use **OAuth client credentials flow** (requires both client ID and secret).

### Unified Client (Recommended)

The recommended approach is to use the unified `createAccountManagerClient`, which provides access to all Account Manager APIs (users, roles, organizations, and API clients):

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

// Create Account Manager client with implicit OAuth (opens browser for login)
const auth = new ImplicitOAuthStrategy({
  clientId: 'your-client-id',
  // No clientSecret needed for implicit flow
});

const client = createAccountManagerClient({accountManagerHost: 'account.demandware.com'}, auth);

// Users API
const users = await client.listUsers({size: 25, page: 0});
const user = await client.getUser('user-id');
const userByLogin = await client.findUserByLogin('user@example.com');
await client.createUser({
  mail: 'newuser@example.com',
  firstName: 'John',
  lastName: 'Doe',
  organizations: ['org-id'],
  primaryOrganization: 'org-id',
});
await client.updateUser('user-id', {firstName: 'Jane'});
await client.grantRole('user-id', 'bm-admin', 'tenant1,tenant2');
await client.revokeRole('user-id', 'bm-admin', 'tenant1');
await client.resetUser('user-id');
await client.deleteUser('user-id');

// Roles API
const roles = await client.listRoles({size: 20, page: 0});
const role = await client.getRole('bm-admin');

// Organizations API
const orgs = await client.listOrgs({size: 25, page: 0});
const org = await client.getOrg('org-id');
const orgByName = await client.getOrgByName('My Organization');
const auditLogs = await client.getOrgAuditLogs('org-id');

// API Clients API (service accounts for programmatic access)
const apiClients = await client.listApiClients({size: 20, page: 0});
const apiClient = await client.getApiClient('api-client-uuid', ['organizations', 'roles']);
await client.createApiClient({
  name: 'my-client',
  organizations: ['org-id'],
  password: 'SecureP@ss12',
  active: false,
});
await client.updateApiClient('api-client-uuid', {name: 'new-name', active: true});
await client.changeApiClientPassword('api-client-uuid', 'oldPassword', 'newPassword12');
await client.deleteApiClient('api-client-uuid'); // Client must be disabled 7+ days first
```

### Client Credentials Flow (Alternative)

For automation and CI/CD, you can use client credentials flow:

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

// Create Account Manager client with client credentials OAuth
const auth = new OAuthStrategy({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

const client = createAccountManagerClient({accountManagerHost: 'account.demandware.com'}, auth);

// Use the unified client as shown above
```

### Individual Clients

If you only need access to a specific API, you can create individual clients:

```typescript
import {
  createAccountManagerUsersClient,
  createAccountManagerRolesClient,
  createAccountManagerOrgsClient,
  createAccountManagerApiClientsClient,
} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new ImplicitOAuthStrategy({
  clientId: 'your-client-id',
});

// Users client
const usersClient = createAccountManagerUsersClient({accountManagerHost: 'account.demandware.com'}, auth);

// Roles client
const rolesClient = createAccountManagerRolesClient({accountManagerHost: 'account.demandware.com'}, auth);

// Organizations client
const orgsClient = createAccountManagerOrgsClient({accountManagerHost: 'account.demandware.com'}, auth);

// API Clients client (service accounts)
const apiClientsClient = createAccountManagerApiClientsClient({accountManagerHost: 'account.demandware.com'}, auth);
```

### User Operations

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new ImplicitOAuthStrategy({clientId: 'your-client-id'});
const client = createAccountManagerClient({}, auth);

// List users with pagination
const users = await client.listUsers({size: 25, page: 0});

// Get user by email/login
const user = await client.findUserByLogin('user@example.com');

// Get user with expanded organizations and roles
const userExpanded = await client.getUser('user-id', ['organizations', 'roles']);

// Create a new user
const newUser = await client.createUser({
  mail: 'newuser@example.com',
  firstName: 'John',
  lastName: 'Doe',
  organizations: ['org-id'],
  primaryOrganization: 'org-id',
});

// Update a user
await client.updateUser('user-id', {firstName: 'Jane'});

// Grant a role to a user
await client.grantRole('user-id', 'bm-admin', 'tenant1,tenant2'); // Optional tenant filter

// Revoke a role from a user
await client.revokeRole('user-id', 'bm-admin', 'tenant1'); // Optional: remove specific scope

// Reset user to INITIAL state
await client.resetUser('user-id');

// Delete (disable) a user
await client.deleteUser('user-id');
```

### Role Operations

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new ImplicitOAuthStrategy({clientId: 'your-client-id'});
const client = createAccountManagerClient({}, auth);

// Get role details by ID
const role = await client.getRole('bm-admin');

// List all roles with pagination
const roles = await client.listRoles({size: 25, page: 0});

// List roles filtered by target type
const userRoles = await client.listRoles({
  size: 25,
  page: 0,
  roleTargetType: 'User',
});
```

### Organization Operations

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new ImplicitOAuthStrategy({clientId: 'your-client-id'});
const client = createAccountManagerClient({}, auth);

// Get organization by ID
const org = await client.getOrg('org-123');

// Get organization by name
const orgByName = await client.getOrgByName('My Organization');

// List organizations with pagination
const orgs = await client.listOrgs({size: 25, page: 0});

// List all organizations (uses max page size of 5000)
const allOrgs = await client.listOrgs({all: true});

// Get audit logs for an organization
const auditLogs = await client.getOrgAuditLogs('org-123');
```

### API Client Operations

Manage Account Manager API clients (service accounts for programmatic access). API clients are created inactive by default and must be disabled for at least 7 days before deletion.

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {ImplicitOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const auth = new ImplicitOAuthStrategy({clientId: 'your-client-id'});
const client = createAccountManagerClient({}, auth);

// List API clients with pagination
const result = await client.listApiClients({size: 20, page: 0});

// Get API client by ID (optionally expand organizations and roles)
const apiClient = await client.getApiClient('api-client-uuid', ['organizations', 'roles']);

// Create a new API client (created inactive by default)
const newClient = await client.createApiClient({
  name: 'my-client',
  organizations: ['org-id'],
  password: 'SecureP@ss12',
  active: false,
});

// Update an API client (only provided fields are updated)
await client.updateApiClient('api-client-uuid', {name: 'new-name', active: true});

// Change API client password
await client.changeApiClientPassword('api-client-uuid', 'oldPassword', 'newPassword12');

// Delete an API client (must have been disabled for at least 7 days)
await client.deleteApiClient('api-client-uuid');
```

### Required Permissions

Account Manager operations require:

- Account Manager hostname configuration
- For implicit flow: roles configured on your **user account**
- For client credentials flow: roles configured on the **API client**

## Logging

Configure logging for debugging HTTP requests:

```typescript
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

// Enable debug logging (shows HTTP request summaries)
configureLogger({level: 'debug'});

// Enable trace logging (shows full request/response with headers and bodies)
configureLogger({level: 'trace'});
```
