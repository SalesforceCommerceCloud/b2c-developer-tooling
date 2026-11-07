---
description: SDK reference for the B2C Tooling SDK with typed WebDAV and OCAPI clients for programmatic B2C Commerce operations.
---

# SDK Reference

The `@salesforce/b2c-tooling-sdk` package provides TypeScript APIs for B2C Commerce development, including instance clients (WebDAV, OCAPI), platform service clients (SCAPI, SLAS, MRT, ODS), high-level operations, and developer utilities.

## Installation

```bash
npm install @salesforce/b2c-tooling-sdk
```

## Package Structure

The SDK is organized into focused submodules that can be imported individually:

```
@salesforce/b2c-tooling-sdk
├── /config              # Configuration resolution (dw.json, env vars)
├── /auth                # Authentication strategies (OAuth, Basic, API Key)
├── /clients             # Low-level API clients (WebDAV, OCAPI, SLAS, ODS, MRT, AM)
├── /instance            # B2CInstance wrapper for per-instance operations
├── /logging             # Pino-based logging configuration
├── /errors              # Shared error types
│
├── /operations/code     # Code deployment, cartridge management
├── /operations/content  # Page Designer content export
├── /operations/cip      # Curated CIP analytics reports and SQL helpers
├── /operations/jobs     # Job execution, site archive import/export
├── /operations/cap      # Custom API operations
├── /operations/logs     # Log tailing and retrieval
├── /operations/mrt      # Managed Runtime bundle operations
├── /operations/ods      # On-demand sandbox utilities
├── /operations/debug    # B2C Script Debugger (SDAPI + DAP adapter)
├── /operations/users    # Account Manager users
├── /operations/roles    # Account Manager roles
├── /operations/bm-roles # Business Manager roles
├── /operations/bm-users # Business Manager users
├── /operations/orgs     # Account Manager organizations
├── /operations/sites    # Storefront site info and cartridge paths
├── /operations/catalogs # Catalogs and categories (SCAPI first)
├── /operations/object-types # System object attribute definitions and groups
├── /operations/metrics  # Metrics API (observability)
├── /operations/mtls     # mTLS code upload certificates
│
├── /scapi               # SCAPI contracts, discovery and code mode
├── /guidance            # Bundled skills (same content as the MCP skill:// resources)
├── /xml-validation      # Validate import/export XML against bundled XSDs
├── /openshell           # Run the tooling in an OpenShell sandbox
├── /compat              # Transitional OCAPI/SCAPI backend selection
├── /utils               # Small shared helpers
│
├── /test-utils         # Testing utilities and helpers
├── /telemetry          # Telemetry and analytics
├── /ux                 # User experience utilities
│
├── /slas                # SLAS helpers
├── /safety              # Safety-mode confirmation middleware
├── /discovery           # Instance discovery helpers
├── /skills              # Agent Skills installer
├── /plugins             # Plugin manifest + SDK hooks
├── /scaffold            # Scaffold discovery, generation, and validation
├── /docs                # B2C Script API documentation search
├── /schemas             # OpenAPI schema utilities
├── /cli                 # Shared CLI-side helpers
└── /i18n                # Message loading / translations
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
import {pushBundle} from '@salesforce/b2c-tooling-sdk/operations/mrt';
import {ApiKeyStrategy} from '@salesforce/b2c-tooling-sdk/auth';

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
  // Scopes are tenant-specific; replace `zzxy_001` with your tenant short code.
  scopes: ['SALESFORCE_COMMERCE_API:zzxy_001:sites_rw'],
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

Account Manager operations use the **OAuth Authorization Code + PKCE flow** by default, which opens a browser for interactive authentication. This is ideal for development and manual operations where you want to use roles assigned to your user account. (The legacy implicit flow remains available via `ImplicitOAuthStrategy` but is deprecated for public clients under OAuth 2.1.)

For CI/CD and automation, you can also use **OAuth client credentials flow** (requires both client ID and secret).

### Unified Client (Recommended)

The recommended approach is to use the unified `createAccountManagerClient`, which provides access to all Account Manager APIs (users, roles, organizations, and API clients):

```typescript
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {PkceOAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

// Create Account Manager client with Authorization Code + PKCE (opens browser for login)
const auth = new PkceOAuthStrategy({
  clientId: 'your-client-id',
  // No clientSecret needed for a public (PKCE) client
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

### Token Claims: Roles and Tenants

Account Manager user tokens carry the signed-in user's roles and tenant filter when sign-in requests the `roles` and `tenantFilter` scopes (the SDK's default public client grants both). Read them with `readAccountManagerClaims`. It decodes the token without verifying it, so use the result for UI decisions and let the API's response decide.

```typescript
import {
  readAccountManagerClaims,
  isAccountManagerApiClientAdmin,
  hasAccountManagerTenantRole,
} from '@salesforce/b2c-tooling-sdk/auth';

const {accessToken} = await auth.getTokenResponse();
const claims = readAccountManagerClaims(accessToken);

claims.sub; // 'jane@example.com'
claims.isUser; // true for user sign-in, false for client credentials or JWT bearer
claims.roles; // ['AM_ACCOUNT_ADMIN', 'ECOM_ADMIN', ...]
claims.tenantFilter; // {ECOM_ADMIN: ['zzzz_001', 'abcd_prd'], ...}
claims.tenants; // every tenant in the filter, sorted

isAccountManagerApiClientAdmin(claims); // Account or API Administrator
hasAccountManagerTenantRole(claims, 'ECOM_ADMIN', 'zzzz-001'); // true
```

### Create a Commerce API Client

`provisionCommerceApiClient` creates an API client with the `SALESFORCE_COMMERCE_API` role for the given tenants, generates its password and returns the client secret once. The caller needs the Account Administrator or API Administrator role. If Account Manager refuses, it throws `NotPermittedError`.

```typescript
import {createAccountManagerApiClientsClient, provisionCommerceApiClient} from '@salesforce/b2c-tooling-sdk/clients';

const apiClients = createAccountManagerApiClientsClient({hostname: 'account.demandware.com'}, userAuth);
const {clientId, clientSecret} = await provisionCommerceApiClient(apiClients, {
  name: 'My App – jane@example.com – 2026-11-06',
  organizationId: 'my-am-org-id',
  tenants: claims.tenants,
  scopes: ['sfcc.products', 'sfcc.catalogs'],
});
// Store clientSecret securely; it is never logged and cannot be read again.
```

A new client can take a short time before its credentials work, so retry the first token request with backoff.

### Required Permissions

Account Manager operations require:

- Account Manager hostname configuration
- For browser-based user auth (Authorization Code + PKCE): roles configured on your **user account**
- For client credentials flow: roles configured on the **API client**

## Embedding the SDK in an App

Desktop and server apps can use the SDK as a library, with no `dw.json`, environment variables or files outside the app's control. The app holds credentials and passes them in as an `AuthStrategy`, and passes safety policy in as a value.

### Use the App's Credentials with Instance Operations

SDK operations take a `B2CInstance`. When the app owns credentials, give the instance its strategies directly instead of an `auth` config. `scapiStrategy` is used for SCAPI with the configured `shortCode` and `tenantId`. It must be able to request `sfcc.*` scopes per call, as `OAuthStrategy` and `JwtOAuthStrategy` can. `webdavStrategy` is used for WebDAV whatever else is configured.

```typescript
import {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {OAuthStrategy} from '@salesforce/b2c-tooling-sdk/auth';

const instance = new B2CInstance(
  {hostname: 'my-sandbox.example.com', shortCode: 'abc123', tenantId: 'zzzz_001', apiBackend: 'scapi'},
  {},
  {
    scapiStrategy: () => new OAuthStrategy({clientId, clientSecret}),
    webdavStrategy: () => userWebDavAuth, // e.g. the signed-in user's PkceOAuthStrategy
  },
);
```

A failed client credentials token request throws `AccountManagerTokenError` with `status` and `oauthError` (for example `invalid_client`). Tokens are cached per client and secret, so a changed secret gets a new token.

### Cancellation

Pass `signal` to stop long operations when the user cancels: `importSiteArchiveFiles`, `siteArchiveImport` and `waitForJob` (through `waitOptions.signal` too), `getRecentLogs`, `listLogFiles`, and each `WebDavClient` method. The poll sleep ends at once and in-flight requests are aborted. A job that already started keeps running on the instance.

```typescript
const controller = new AbortController();
stopButton.onclick = () => controller.abort();
const result = await importSiteArchiveFiles(instance, files, {signal: controller.signal});
```

### Account Manager Sign-in Without a Local Server

By default, `PkceOAuthStrategy` opens the system browser and listens on `localhost` for the redirect. An app that can intercept the redirect itself (for example, an Electron `BrowserWindow` watching `will-redirect`) passes `authorize`. The SDK then opens no listener, but still checks `state` and does the PKCE token exchange. `redirectUri` can be any URI registered for the API client, including an app scheme such as `myapp://oauth/callback`; the SDK matches the scheme, host and path of the redirect.

Set `interactive: false` so that, after sign-in, the strategy only refreshes silently. When the refresh token has expired or been revoked, it throws `AuthRequiredError` instead of opening a browser, and the app decides when to ask the user to sign in again. Pass `sessionBackend` to keep tokens in the app's own encrypted storage.

```typescript
import {
  PkceOAuthStrategy,
  isAuthRequiredError,
  getAccountManagerHostInfo,
  type AuthSessionBackend,
} from '@salesforce/b2c-tooling-sdk/auth';

const host = getAccountManagerHostInfo('account.demandware.com')!;
const sessions: AuthSessionBackend = myEncryptedSessionStore; // find/save/delete/list/clearAll

const auth = new PkceOAuthStrategy({
  clientId: myClientId,
  accountManagerHost: host.host,
  redirectUri: 'http://127.0.0.1:8086/callback', // registered for myClientId
  scopes: ['openid', 'roles', 'tenantFilter'],
  interactive: false,
  sessionBackend: sessions,
  authorize: (url, {redirectUri}) => openSignInWindowAndWaitForRedirect(url, redirectUri), // resolves with the redirect URL
});

await auth.signIn(); // from the app's "Sign in" action

try {
  await client.listApiClients();
} catch (error) {
  if (isAuthRequiredError(error)) showSignInPrompt();
}

auth.signOut(); // clears the cached token, refresh token and stored session
```

`ACCOUNT_MANAGER_HOSTS` lists the SDK's public client for each Account Manager host, with its registered redirect URIs and default scopes. An app can reuse an SDK client only if it can catch one of that client's registered redirect URIs; otherwise, register a public client for the app. To drive each step yourself, use `buildPkceAuthorizeRequest`, `readPkceAuthorizationResponse` and `exchangePkceAuthorizationCode`.

A session backend implements `find`, `save`, `delete`, `list` and `clearAll`, plus an optional `flush`. A strategy given `sessionBackend` reads and writes only that backend. Sessions contain access and refresh tokens, so encrypt them at rest. `setAuthSessionBackend()` replaces the store process-wide instead.

### SCAPI Code Mode In-process

`createScapiRequest` builds a request helper with the app's auth and safety policy. `runScapiCode` runs a JavaScript program in a disposable Node process, whose `scapi.request()` calls go back to that helper. The worker never receives credentials. It can load only a short list of safe built-in modules (such as `crypto`, `url` and `util`), so it can't open network connections itself, and it refuses to start if Node's permission model is off.

```typescript
import {createScapiRequest, loadBundledScapiDocuments, runScapiCode} from '@salesforce/b2c-tooling-sdk/scapi';

const documents = loadBundledScapiDocuments({authType: 'admin'});
const safety = {
  level: 'READ_ONLY' as const,
  confirm: true,
  rules: [
    {method: 'GET', api: 'product/**', action: 'allow' as const},
    {readOnlySearch: true, action: 'allow' as const},
    {operationId: 'updateProduct', action: 'confirm' as const},
    {path: '**', action: 'block' as const},
  ],
};

const request = createScapiRequest({
  shortCode,
  tenantId: 'zzzz_001',
  auth, // AuthStrategy; withAdditionalScopes adds the tenant and operation scopes, invalidateToken runs after a 401
  documents,
  safety,
  // Called for each `confirm` with operationId, api, pathTemplate, pathParams, body and requestIndex.
  // Resolve to approve; reject to decline.
  confirm: async (pending, signal) => askUser(pending, signal),
  onDispatch: () => markMayHaveApplied(),
});

const result = await runScapiCode({
  code,
  input,
  documents,
  safety, // hides operations the policy always blocks from spec.paths and spec.search
  organizationId: 'zzzz_001',
  request,
});
```

In Electron, the worker runs the app binary as Node (`ELECTRON_RUN_AS_NODE=1`) without extra options. Pass `worker` only to start a different executable.

`searchScapiOperations(documents, query, {safety})` filters search results with the same policy. A blocked request fails with `SafetyBlockedError` before it is sent.

Discovery decides visibility from each operation's path template, before any parameter values are known. A rule that allows only one value (for example `path: '/product/products/v1/organizations/*/products/p1'`) ahead of a catch-all block still lets the request through, but hides the operation from search and `spec.paths`. Use `operationId` or `api` rules for an allow-list you want programs to see.

To include the tenant's own contracts (custom APIs and `c_*` properties), resolve documents with `resolveScapiDocuments()`. It falls back to the bundled contracts with a warning when the tenant can't be reached, and the cache keeps contracts between calls.

```typescript
import {ScapiLiveSchemaCache, resolveScapiDocuments, searchScapiOperations} from '@salesforce/b2c-tooling-sdk/scapi';

const cache = new ScapiLiveSchemaCache(); // one per process
const {documents, source, warnings} = await resolveScapiDocuments({
  api: 'product',
  live: {tenant: () => ({client: schemasClient, shortCode: 'abc123', organizationId: 'f_ecom_zzzz_001'}), cache},
});
const hits = searchScapiOperations(documents, 'update product');
```

### Logs and Debugger Sessions for Turn-based Tools

`tailLogs()` and `tailMrtLogs()` deliver entries through callbacks. Tools that read in turns (an agent tool call, a request/response UI) can instead start a buffered watch and poll it. Entries are filtered as they arrive and kept up to a count and byte cap, oldest first out; each poll reports how many were dropped.

```typescript
import {watchLogs} from '@salesforce/b2c-tooling-sdk/operations/logs';
import {watchMrtLogs} from '@salesforce/b2c-tooling-sdk/operations/mrt';

const watch = await watchLogs(instance, {prefixes: ['error', 'customerror'], level: ['ERROR']});
const {entries, errors, droppedEntries, truncated} = await watch.poll({timeoutMs: 5000});
await watch.stop(); // unread entries stay readable

const mrt = await watchMrtLogs({projectSlug: 'my-project', environmentSlug: 'production'}, mrtAuth);
const {stopped} = await mrt.poll({timeoutMs: 5000}); // true when the stream ended on its own
```

`WebDavClient.getTextRange()` reads part of a text file, such as the end of a log, without downloading all of it. It decodes only complete UTF-8 characters and returns `nextOffset` to continue from. `normalizeWebDavPath()` turns user or server paths (including `/Sites/LOGS/...` from a job execution) into a checked path under one of the `WEBDAV_ROOTS`; a bad path or range throws `WebDavReadError` with a `code`.

```typescript
import {normalizeWebDavPath} from '@salesforce/b2c-tooling-sdk/clients';

const path = normalizeWebDavPath(execution.log_file_path);
const {content, nextOffset} = await instance.webdav.getTextRange(path, {tail: true, maxBytes: 8000});
```

`parseSinceTime()` throws `InvalidTimeError` for a value it can't read; its message names no option, and `InvalidTimeError.describe(value, 'since')` adds your input's name.

`DebugSessionManager` tracks the breakpoints it set and can wait for a halt, so a tool can arm a breakpoint and capture the stopped request in one call:

```typescript
await manager.addBreakpoints([{script_path: '/app_storefront/cartridge/controllers/Cart.js', line_number: 42}]);
const thread = await manager.waitForHalt(30_000, signal); // null on timeout
```

### Skills

The SDK ships the same skills the MCP server and `b2c docs skill` serve: the agent plugin collections (`b2c-cli`, `b2c`, `b2c-ops`, `storefront-next`), the MCP workflow skills (`mcp`) and `cap-dev`. Read them offline with `loadBundledGuidanceCatalog()`. URIs match the MCP's `skill://` resources.

```typescript
import {loadBundledGuidanceCatalog} from '@salesforce/b2c-tooling-sdk/guidance';

const catalog = loadBundledGuidanceCatalog();
const hits = catalog.read({query: 'deploy cartridges'});
const scapiSkill = catalog.readResource('skill://mcp/b2c-mcp-scapi/SKILL.md');
const mcpOnly = loadBundledGuidanceCatalog({collections: ['mcp']});
```

### Logs

Send SDK logs to the app's own log sink. Fields such as `password`, `client_secret`, `access_token`, `token`, `secret` and `authorization` are redacted, including Basic credentials. SCAPI code-mode requests log their method, path template, status and size at `debug`, never bodies or responses.

```typescript
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

configureLogger({level: 'info', json: true, redact: true, destination: myLogStream});
```

The built-in redaction covers those keys at the top level and one level down. To redact secret-named keys at any depth, and tokens or form secrets inside messages, register `deepLogRedactor`. Use `redactLogValue()` on entries the app logs itself so both follow the same rules.

```typescript
import {deepLogRedactor, globalLogRedactorRegistry, redactLogValue} from '@salesforce/b2c-tooling-sdk/logging';

globalLogRedactorRegistry.register(deepLogRedactor);
appLog.info(redactLogValue({request, response}));
```

SCAPI code-mode failures throw `ScapiCodeError` with a `code` such as `SCAPI_SAFETY_BLOCKED` or `SCAPI_EXECUTION_TIMEOUT`.

## Logging

Configure logging for debugging HTTP requests:

```typescript
import {configureLogger} from '@salesforce/b2c-tooling-sdk/logging';

// Enable debug logging (shows HTTP request summaries)
configureLogger({level: 'debug'});

// Enable trace logging (shows full request/response with headers and bodies)
configureLogger({level: 'trace'});
```
