---
description: Migrate from sfcc-ci's programmatic JavaScript API to @salesforce/b2c-tooling-sdk with side-by-side code examples and API mapping.
---

# Migrating from sfcc-ci's JavaScript API

This guide is for users who call sfcc-ci programmatically via `require('sfcc-ci')` in Node.js scripts. If you only use the CLI, see the [CLI migration guide](./sfcc-ci-migration) instead.

## Key Paradigm Shifts

### Callbacks to async/await

sfcc-ci uses Node.js-style callbacks. The SDK uses Promises and async/await.

**sfcc-ci:**

```javascript
const sfcc = require('sfcc-ci');

sfcc.code.list('my-instance.demandware.net', token, function (err, versions) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(versions);
});
```

**b2c-tooling-sdk:**

```typescript
import {listCodeVersions} from '@salesforce/b2c-tooling-sdk/operations/code';

const versions = await listCodeVersions(instance);
console.log(versions);
```

The SDK is TypeScript-first with full type definitions. All examples use TypeScript, but the SDK works in plain JavaScript (ESM) as well.

### Token Passing to Config-Based Auth

With sfcc-ci you authenticate once, then thread the token through every call:

```javascript
sfcc.auth.auth(clientId, clientSecret, function (err, token) {
  sfcc.code.list(instance, token, function (err, versions) {
    sfcc.job.run(instance, 'my-job', [], token, function (err, execution) {
      // ...
    });
  });
});
```

The SDK resolves credentials from `dw.json`, environment variables, or explicit overrides. You never pass a token — the SDK creates authenticated clients that handle token lifecycle internally:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';

const config = await resolveConfig();

// Instance operations (code, jobs, WebDAV, BM roles) use a B2CInstance
const instance = config.createB2CInstance();
const versions = await listCodeVersions(instance);

// Account Manager operations (users, AM roles, orgs) use a separate client
const amClient = createAccountManagerClient({}, config.createOAuth());
const users = await listUsers(amClient.users, {size: 25});
```

Both `instance` and `amClient` manage their own tokens — you never see or pass a token string. See the [Authentication Setup](./authentication) guide for credential configuration details.

### Untyped Objects to Typed Clients

sfcc-ci returns plain objects with no type information. The SDK provides:

- **Typed operation results** — `CodeVersion`, `JobExecution`, etc.
- **openapi-fetch typed clients** — OCAPI, SLAS, ODS with full IDE autocompletion
- **TypeScript generics** — request params, bodies, and response shapes are all type-checked

```typescript
// IDE autocomplete knows `versions` is CodeVersion[], each with .id, .active, etc.
const versions = await listCodeVersions(instance);

// The OCAPI client is fully typed — invalid paths or params are compile-time errors
const {data, error} = await instance.ocapi.GET('/sites/{site_id}', {
  params: {path: {site_id: 'RefArch'}},
});
```

## Quick Start: Replacing a Typical sfcc-ci Script

Here is a realistic before/after for a CI/CD deploy script.

**Before (sfcc-ci):**

```javascript
const sfcc = require('sfcc-ci');

sfcc.auth.auth(process.env.CLIENT_ID, process.env.CLIENT_SECRET, function (err, token) {
  if (err) throw err;

  sfcc.code.deploy('my-sandbox.demandware.net', './build/code.zip', token, {}, function (err) {
    if (err) throw err;

    sfcc.code.activate('my-sandbox.demandware.net', 'version1', token, function (err) {
      if (err) throw err;
      console.log('Deployed and activated!');
    });
  });
});
```

**After (b2c-tooling-sdk):**

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {findAndDeployCartridges, activateCodeVersion} from '@salesforce/b2c-tooling-sdk/operations/code';

const config = await resolveConfig();
const instance = config.createB2CInstance();

await findAndDeployCartridges(instance, './cartridges', {reload: true});
await activateCodeVersion(instance, 'version1');
console.log('Deployed and activated!');
```

Key differences:

- **No ZIP file** — the SDK discovers cartridges from source directories and handles zipping/uploading
- **No token threading** — credentials come from `dw.json` or environment variables
- **Flat control flow** — async/await instead of nested callbacks
- **Error handling** — use standard try/catch

## API Mapping by Module

### Authentication (`sfcc.auth`)

sfcc-ci requires an explicit auth call that returns a token:

```javascript
sfcc.auth.auth(clientId, clientSecret, function (err, token) {
  // token must be passed to all subsequent calls
});
```

The SDK resolves config from multiple sources (environment variables, `dw.json`, explicit overrides) and creates authenticated instances automatically:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';

// Credentials from SFCC_OAUTH_CLIENT_ID / SFCC_OAUTH_CLIENT_SECRET env vars,
// or clientId / clientSecret in dw.json, or explicit overrides:
const config = await resolveConfig({
  clientId: 'my-client-id',
  clientSecret: 'my-client-secret',
});

// Instance handles token lifecycle internally
const instance = config.createB2CInstance();
```

### Code Management (`sfcc.code`)

| sfcc-ci | SDK |
|---------|-----|
| `code.list(instance, token, cb)` | `listCodeVersions(instance)` |
| `code.deploy(instance, archive, token, opts, cb)` | `findAndDeployCartridges(instance, dir, opts)` |
| `code.activate(instance, version, token, cb)` | `activateCodeVersion(instance, versionId)` |

```typescript
import {
  listCodeVersions,
  activateCodeVersion,
  deleteCodeVersion,
  findAndDeployCartridges,
} from '@salesforce/b2c-tooling-sdk/operations/code';

// List code versions
const versions = await listCodeVersions(instance);
for (const v of versions) {
  console.log(`${v.id} active=${v.active}`);
}

// Deploy cartridges from source directory (discovers, zips, uploads via WebDAV)
const result = await findAndDeployCartridges(instance, './cartridges', {reload: true});

// Activate a specific version
await activateCodeVersion(instance, 'version1');

// Delete a code version
await deleteCodeVersion(instance, 'old-version');
```

::: tip
The SDK deploys from cartridge **source directories**, not pre-built ZIP archives. `findAndDeployCartridges` handles discovery (via `.project` files), archiving, and upload in one call.
:::

### Job Execution (`sfcc.job`)

| sfcc-ci | SDK |
|---------|-----|
| `job.run(instance, jobId, params, token, cb)` | `executeJob(instance, jobId, opts?)` |
| `job.status(instance, jobId, execId, token, cb)` | `getJobExecution(instance, jobId, execId)` |
| _(no equivalent)_ | `waitForJob(instance, jobId, execId, opts?)` |

```typescript
import {executeJob, waitForJob, siteArchiveImport} from '@salesforce/b2c-tooling-sdk/operations/jobs';

// Run a custom job
const execution = await executeJob(instance, 'my-custom-job', {
  parameters: [{key: 'param1', value: 'value1'}],
});

// Wait for completion (polls automatically)
const completed = await waitForJob(instance, 'my-custom-job', execution.id);
console.log(`Job finished: ${completed.execution_status}`);

// Import a site archive (upload + run import job + wait)
const importResult = await siteArchiveImport(instance, './site-data.zip');
```

`waitForJob` has no sfcc-ci equivalent — sfcc-ci scripts typically implement their own polling loop. The SDK handles this with configurable polling intervals and timeouts.

### Instance / WebDAV (`sfcc.instance`, `sfcc.webdav`)

| sfcc-ci | SDK |
|---------|-----|
| `instance.upload(instance, file, token, opts, cb)` | `instance.webdav.put(path, data)` |
| `instance.import(instance, file, token, cb)` | `siteArchiveImport(instance, zipPath)` |
| `webdav.upload(instance, path, file, token, opts, cb)` | `instance.webdav.put(path, data)` |

```typescript
import {readFileSync} from 'node:fs';

// Upload a file via WebDAV
const data = readFileSync('./my-file.zip');
await instance.webdav.put('/cartridges/my-file.zip', data);

// Check if a file exists
const exists = await instance.webdav.exists('/cartridges/my-file.zip');

// List directory contents
const listing = await instance.webdav.propfind('/cartridges/');

// Delete a file
await instance.webdav.delete('/cartridges/my-file.zip');
```

The WebDAV client exposes a richer API than sfcc-ci: `put`, `propfind`, `mkcol`, `delete`, `exists`, `copy`, `move`.

### Account Manager Users (`sfcc.user`)

| sfcc-ci | SDK |
|---------|-----|
| `user.create(org, user, mail, ...)` | `createUser(client, opts)` |
| `user.list(org, role, login, ...)` | `listUsers(client, opts)` |
| `user.update(login, changes, ...)` | `updateUser(client, opts)` |
| `user.delete(login, purge, ...)` | `deleteUser(client, userId)` / `purgeUser(client, userId)` |
| `user.reset(login, ...)` | `resetUser(client, userId)` |
| `user.grant(login, role, scope, ...)` | `grantRole(client, opts)` |
| `user.revoke(login, role, scope, ...)` | `revokeRole(client, opts)` |

Account Manager operations use a separate client (not `instance`), since they talk to Account Manager rather than a B2C instance:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {createAccountManagerClient} from '@salesforce/b2c-tooling-sdk/clients';
import {listUsers, createUser, grantRole} from '@salesforce/b2c-tooling-sdk/operations/users';

const config = await resolveConfig();

// Unified client for users, roles, orgs, and API clients
const client = createAccountManagerClient({}, config.createOAuth());

// List users
const users = await listUsers(client.users, {size: 25});

// Create a user
const newUser = await createUser(client.users, {
  mail: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  organizationId: 'my-org-id',
});

// Grant a role
await grantRole(client.users, {
  userId: newUser.id,
  roleId: 'bm-admin',
  scope: 'my-realm',
});
```

See the [Account Manager guide](./account-manager) for more details on AM operations.

### Account Manager & BM Roles (`sfcc.role`)

The SDK separates Account Manager roles from Business Manager instance roles into distinct modules:

| sfcc-ci | SDK | Module |
|---------|-----|--------|
| `role.list(token, count)` | `listRoles(client, opts)` | `operations/roles` |
| `role.listLocal(instance, ...)` | `listBmRoles(instance, opts)` | `operations/bm-roles` |
| `user.grantLocal(instance, login, role, ...)` | `grantBmRole(instance, roleId, login)` | `operations/bm-roles` |
| `user.revokeLocal(instance, login, role, ...)` | `revokeBmRole(instance, roleId, login)` | `operations/bm-roles` |

```typescript
// Account Manager roles (organization-level)
import {listRoles} from '@salesforce/b2c-tooling-sdk/operations/roles';
const amRoles = await listRoles(client.roles, {size: 50});

// Business Manager roles (instance-level)
import {listBmRoles, grantBmRole, revokeBmRole} from '@salesforce/b2c-tooling-sdk/operations/bm-roles';
const bmRoles = await listBmRoles(instance);
await grantBmRole(instance, 'Administrator', 'user@example.com');
await revokeBmRole(instance, 'Administrator', 'user@example.com');
```

### Organizations (`sfcc.org`)

```typescript
import {listOrgs, getOrg} from '@salesforce/b2c-tooling-sdk/operations/orgs';

const orgs = await listOrgs(client.orgs, {size: 25});
const org = await getOrg(client.orgs, 'my-org-id');
```

## Using Typed Clients Directly

For APIs that have a typed client but no high-level operations wrapper, use the openapi-fetch client directly. All typed clients follow the same pattern: `client.METHOD('/path', {params, body})` returning `{data, error}`.

### SLAS Client Management

sfcc-ci has `slas.tenant.*` and `slas.client.*` methods. The SDK provides a typed SLAS client:

```typescript
import {resolveConfig} from '@salesforce/b2c-tooling-sdk/config';
import {createSlasClient} from '@salesforce/b2c-tooling-sdk/clients';

const config = await resolveConfig();
const slas = createSlasClient({shortCode: 'kv7kzm78'}, config.createOAuth());

// List tenants (sfcc-ci: slas.tenant.list(...))
const {data: tenants} = await slas.GET('/tenants');

// Get a specific tenant (sfcc-ci: slas.tenant.get(...))
const {data: tenant} = await slas.GET('/tenants/{tenantId}', {
  params: {path: {tenantId: 'my-tenant'}},
});

// List SLAS clients (sfcc-ci: slas.client.list(...))
const {data: clients} = await slas.GET('/tenants/{tenantId}/clients', {
  params: {path: {tenantId: 'my-tenant'}},
});
```

### Direct OCAPI Access

For any OCAPI Data API endpoint, use `instance.ocapi`:

```typescript
// Get site details
const {data: site} = await instance.ocapi.GET('/sites/{site_id}', {
  params: {path: {site_id: 'RefArch'}},
});

// Search for something via OCAPI
const {data, error} = await instance.ocapi.POST('/customer_search', {
  body: {query: {text_query: {fields: ['email'], search_phrase: 'test@example.com'}}},
});

if (error) {
  console.error('Search failed:', error);
}
```

The OCAPI client is generated from the OpenAPI spec, so all paths, parameters, and response types are fully typed.

## Comprehensive Mapping Table

| sfcc-ci Method | SDK Equivalent | Import Path |
|---------------|----------------|-------------|
| `auth.auth(clientId, secret, cb)` | `resolveConfig()` + `config.createB2CInstance()` | `*/config` |
| `code.list(instance, token, cb)` | `listCodeVersions(instance)` | `*/operations/code` |
| `code.deploy(instance, archive, token, opts, cb)` | `findAndDeployCartridges(instance, dir, opts)` | `*/operations/code` |
| `code.activate(instance, version, token, cb)` | `activateCodeVersion(instance, versionId)` | `*/operations/code` |
| `code.compare(...)` | _Not ported_ | |
| `code.diffdeploy(...)` | _Not ported_ | |
| `manifest.generate(...)` | _Not ported_ | |
| `cartridge.add(...)` | `addCartridge(instance, siteId, opts)` | `*/operations/sites` |
| `instance.upload(instance, file, token, opts, cb)` | `instance.webdav.put(path, data)` | `*/instance` |
| `instance.import(instance, file, token, cb)` | `siteArchiveImport(instance, zipPath)` | `*/operations/jobs` |
| `job.run(instance, jobId, params, token, cb)` | `executeJob(instance, jobId, opts?)` | `*/operations/jobs` |
| `job.status(instance, jobId, execId, token, cb)` | `getJobExecution(instance, jobId, execId)` | `*/operations/jobs` |
| `webdav.upload(instance, path, file, token, opts, cb)` | `instance.webdav.put(path, data)` | `*/instance` |
| `user.create(org, user, ...)` | `createUser(client, opts)` | `*/operations/users` |
| `user.list(org, role, ...)` | `listUsers(client, opts)` | `*/operations/users` |
| `user.update(login, changes, ...)` | `updateUser(client, opts)` | `*/operations/users` |
| `user.delete(login, purge, ...)` | `deleteUser(client, id)` / `purgeUser(client, id)` | `*/operations/users` |
| `user.reset(login, ...)` | `resetUser(client, id)` | `*/operations/users` |
| `user.grant(login, role, scope, ...)` | `grantRole(client, opts)` | `*/operations/users` |
| `user.revoke(login, role, scope, ...)` | `revokeRole(client, opts)` | `*/operations/users` |
| `user.createLocal(...)` | _Not ported_ | |
| `user.searchLocal(...)` | _Not ported_ | |
| `user.updateLocal(...)` | _Not ported_ | |
| `user.deleteLocal(...)` | _Not ported_ | |
| `user.grantLocal(instance, login, role, ...)` | `grantBmRole(instance, roleId, login)` | `*/operations/bm-roles` |
| `user.revokeLocal(instance, login, role, ...)` | `revokeBmRole(instance, roleId, login)` | `*/operations/bm-roles` |
| `role.list(token, count)` | `listRoles(client, opts)` | `*/operations/roles` |
| `role.listLocal(instance, ...)` | `listBmRoles(instance, opts)` | `*/operations/bm-roles` |
| `slas.tenant.add/get/list/delete(...)` | `createSlasClient()` typed client | `*/clients` |
| `slas.client.add/get/list/delete(...)` | `createSlasClient()` typed client | `*/clients` |

All import paths use the `@salesforce/b2c-tooling-sdk` prefix (abbreviated as `*` above).

## What the SDK Adds Beyond sfcc-ci

The SDK provides many capabilities that sfcc-ci does not have:

- **Content library operations** — fetch, parse, and export content libraries
- **CIP analytics** — run SQL queries against Commerce Intelligence Platform
- **MRT operations** — full Managed Runtime lifecycle (projects, bundles, deployments, environments, redirects, notifications)
- **Log operations** — tail and search instance logs in real-time
- **Scaffold system** — generate project templates from scaffolds
- **Workspace discovery** — detect project types (PWA Kit, SFRA, Storefront Next, cartridges)
- **Plugin/middleware system** — extend with custom config sources, HTTP middleware, lifecycle hooks
- **CDN zones management** — manage CDN configuration
- **Full TypeScript type safety** — typed API clients generated from OpenAPI specs

See the [SDK Reference](/api/) for the complete API surface.

## Error Handling

sfcc-ci uses callback error parameters:

```javascript
sfcc.code.list(instance, token, function (err, result) {
  if (err) {
    console.error('Failed:', err);
    return;
  }
  // use result
});
```

The SDK throws errors that you catch with try/catch:

```typescript
import {HTTPError} from '@salesforce/b2c-tooling-sdk/errors';

try {
  const versions = await listCodeVersions(instance);
} catch (error) {
  if (error instanceof HTTPError) {
    console.error(`HTTP ${error.statusCode}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

SDK operations throw `Error` with descriptive messages. HTTP-level errors include status codes and response details via the `cause` property.

## Next Steps

- [Authentication Setup](./authentication) — configure API clients, OCAPI, and WebDAV
- [sfcc-ci CLI Migration](./sfcc-ci-migration) — CLI command mapping
- [SDK Reference](/api/) — full API documentation
- [Extending the CLI](./extending) — custom plugins, middleware, and hooks
- [CI/CD with GitHub Actions](./ci-cd) — official GitHub Actions for automation
