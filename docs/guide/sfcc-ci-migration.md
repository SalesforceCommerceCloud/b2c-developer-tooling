---
description: Migrate from sfcc-ci to @salesforce/b2c-cli with command mappings, environment variable compatibility, and CI/CD pipeline updates.
---

# Migrating from sfcc-ci

[sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci) is deprecated. The `@salesforce/b2c-cli` package is its replacement, providing the same core capabilities plus additional features.

If you haven't installed the B2C CLI yet, see the [Installation guide](./installation).

::: tip Migrating from sfcc-ci's JavaScript API?
If you use `require('sfcc-ci')` in Node.js scripts, see the
[SDK Migration Guide](./sdk-migration) for side-by-side code examples.
:::

## Authentication

The biggest change from sfcc-ci is how authentication works by default.

**sfcc-ci** uses **stateful auth** — you run `sfcc-ci client:auth` once to store a token, then all subsequent commands use it automatically.

**b2c-cli** defaults to **stateless auth** — credentials are provided per-command via environment variables or flags. This is more explicit and works better in CI/CD pipelines where each step is independent.

### Stateful Auth (sfcc-ci Compatible)

For users who prefer the sfcc-ci workflow, the B2C CLI includes a compatibility layer that mirrors the stateful auth pattern:

| sfcc-ci | b2c-cli |
|---------|---------|
| `sfcc-ci client:auth <id> <secret>` | `b2c client:auth --client-id <id> --client-secret <secret>` |
| `sfcc-ci client:auth:renew` | `b2c client:auth:renew` |
| `sfcc-ci client:auth:token` | `b2c client:auth:token` |
| `sfcc-ci auth:login [client]` | `b2c auth:login [client]` |
| `sfcc-ci auth:logout` | `b2c auth:logout` |

The colon-separated forms are aliases — the canonical commands are `b2c auth client`, `b2c auth login`, etc.

After authenticating, subsequent commands automatically use the stored token when it is valid. See [Auth Commands](/cli/auth) for full details.

### Stateless Auth (Recommended for CI/CD)

For automation and CI/CD, set credentials as environment variables and the CLI uses them directly — no separate auth step needed:

```bash
export SFCC_CLIENT_ID=my-client-id
export SFCC_CLIENT_SECRET=my-secret

# Commands authenticate automatically
b2c code list
b2c sandbox list
```

See [Authentication Setup](./authentication) for the full guide including Account Manager configuration, OCAPI permissions, and WebDAV access.

::: tip
Use **stateless auth** (environment variables) for CI/CD pipelines and **stateful auth** (`b2c auth client` or `b2c auth login`) for local development.
:::

## Command Mapping

The B2C CLI's canonical syntax uses spaces instead of colons (e.g., `b2c code deploy`), but for the most commonly used commands, sfcc-ci's colon-separated syntax is also accepted (e.g., `b2c code:deploy`). The tables below show the drop-in colon form where available.

### Code Management

| sfcc-ci | b2c-cli | Notes |
|---------|---------|-------|
| `sfcc-ci code:list` | `b2c code:list` | |
| `sfcc-ci code:deploy <archive>` | `b2c code:deploy` | Deploys from local cartridge source |
| `sfcc-ci code:activate <version>` | `b2c code:activate <version>` | |
| `sfcc-ci code:delete` | `b2c code:delete` | |

### Instance / Data

| sfcc-ci | b2c-cli | Notes |
|---------|---------|-------|
| `sfcc-ci instance:upload <file>` | `b2c webdav put <file> <remote-path>` | See [WebDAV commands](/cli/webdav) |
| `sfcc-ci instance:import <archive>` | `b2c content import <archive>` | Or `b2c job run sfcc-site-archive-import` |
| `sfcc-ci instance:export` | `b2c content export` | See [Content commands](/cli/content) |

### Cartridge Path

| sfcc-ci | b2c-cli | Notes |
|---------|---------|-------|
| `sfcc-ci cartridge:add <name> --siteid <id>` | `b2c sites cartridges add <name> --site-id <id>` | Supports `--position` and `--target` flags |
| _(no equivalent)_ | `b2c sites cartridges list --site-id <id>` | List the active cartridge path |
| _(no equivalent)_ | `b2c sites cartridges remove <name> --site-id <id>` | Remove a cartridge from the path |
| _(no equivalent)_ | `b2c sites cartridges set <path> --site-id <id>` | Replace the entire cartridge path |

The B2C CLI also supports the Business Manager cartridge path via the `--bm` flag (shorthand for `--site-id Sites-Site`). When OCAPI direct permissions are unavailable, the commands automatically fall back to site archive import/export. See [Sites commands](/cli/sites#cartridge-commands) for details.

### Jobs

| sfcc-ci | b2c-cli | Notes |
|---------|---------|-------|
| `sfcc-ci job:run <id>` | `b2c job:run <id>` | Supports `--wait` and `--timeout` |
| `sfcc-ci job:status <id> <exec>` | `b2c job wait <id> --execution-id <exec>` | |

### Sandbox

Sandbox commands map directly, with spaces replacing colons:

| sfcc-ci | b2c-cli |
|---------|---------|
| `sfcc-ci sandbox:list` | `b2c sandbox list` |
| `sfcc-ci sandbox:create` | `b2c sandbox create` |
| `sfcc-ci sandbox:get` | `b2c sandbox get` |
| `sfcc-ci sandbox:delete` | `b2c sandbox delete` |
| `sfcc-ci sandbox:start` | `b2c sandbox start` |
| `sfcc-ci sandbox:stop` | `b2c sandbox stop` |
| `sfcc-ci sandbox:restart` | `b2c sandbox restart` |
| `sfcc-ci sandbox:reset` | `b2c sandbox reset` |
| `sfcc-ci sandbox:alias:list` | `b2c sandbox alias list` |
| `sfcc-ci sandbox:alias:add` | `b2c sandbox alias create` |
| `sfcc-ci sandbox:alias:delete` | `b2c sandbox alias delete` |

### SLAS

| sfcc-ci | b2c-cli |
|---------|---------|
| `sfcc-ci slas:client:add` | `b2c slas client create` |
| `sfcc-ci slas:client:get` | `b2c slas client get` |
| `sfcc-ci slas:client:list` | `b2c slas client list` |
| `sfcc-ci slas:client:delete` | `b2c slas client delete` |

### User / Org / Role

Account Manager operations are under the `am` topic. Instance-level Business Manager role management is under the `bm` topic:

| sfcc-ci | b2c-cli | Notes |
|---------|---------|-------|
| `sfcc-ci user:list` | `b2c am users list` | |
| `sfcc-ci user:create` | `b2c am users create` | |
| `sfcc-ci user:delete` | `b2c am users delete` | |
| `sfcc-ci org:list` | `b2c am orgs list` | |
| `sfcc-ci role:list` | `b2c am roles list` | Account Manager roles |
| `sfcc-ci role:list -i <instance>` | `b2c bm roles list` | Instance BM roles |
| `sfcc-ci role:grant` | `b2c am roles grant` | Account Manager roles |
| `sfcc-ci role:grant -i <instance>` | `b2c bm roles grant` | Instance BM roles |
| `sfcc-ci role:revoke` | `b2c am roles revoke` | Account Manager roles |
| `sfcc-ci role:revoke -i <instance>` | `b2c bm roles revoke` | Instance BM roles |

## Environment Variables

Most sfcc-ci environment variables are supported directly or through backward-compatible aliases. Existing CI/CD configurations using these variables will continue to work.

| sfcc-ci | b2c-cli | Status |
|---------|---------|--------|
| `SFCC_OAUTH_CLIENT_ID` | `SFCC_CLIENT_ID` | Both accepted |
| `SFCC_OAUTH_CLIENT_SECRET` | `SFCC_CLIENT_SECRET` | Both accepted |
| `SFCC_LOGIN_URL` | `SFCC_ACCOUNT_MANAGER_HOST` | Both accepted |
| `SFCC_OAUTH_USER_NAME` | `SFCC_OAUTH_USER_NAME` | Same |
| `SFCC_OAUTH_USER_PASSWORD` | `SFCC_OAUTH_USER_PASSWORD` | Same |
| `SFCC_SANDBOX_API_HOST` | `SFCC_SANDBOX_API_HOST` | Same |
| `SFCC_SCAPI_SHORTCODE` | `SFCC_SHORTCODE` | Renamed |
| `SFCC_SCAPI_TENANTID` | `SFCC_TENANT_ID` | Renamed |

The B2C CLI also introduces new environment variables not present in sfcc-ci:

| Variable | Purpose |
|----------|---------|
| `SFCC_SERVER` | B2C instance hostname |
| `SFCC_USERNAME` | WebDAV / Basic auth username |
| `SFCC_PASSWORD` | WebDAV / Basic auth password |
| `SFCC_CODE_VERSION` | Code version for deployments |
| `SFCC_AUTH_METHODS` | Auth method priority (comma-separated) |

See the [Configuration guide](./configuration) for the complete list of environment variables and configuration sources.

## Configuration

The `dw.json` configuration file is fully supported. Fields are normalized to camelCase (e.g., `client-id` in the file becomes `clientId` internally), but both kebab-case and camelCase are accepted.

The B2C CLI adds a layered configuration system with a clear priority order:

1. CLI flags (highest priority)
2. Environment variables (`SFCC_*`)
3. `dw.json` in the current directory
4. Instance configuration (`b2c setup instance`)
5. Defaults (lowest priority)

Instance management uses `b2c setup instance create` instead of `sfcc-ci instance:add`. See the [Configuration guide](./configuration) for details.

## CI/CD Migration

### Before (sfcc-ci)

sfcc-ci CI/CD pipelines typically authenticate first, then run commands:

```bash
# Authenticate (stores token)
sfcc-ci client:auth $SFCC_OAUTH_CLIENT_ID $SFCC_OAUTH_CLIENT_SECRET

# Deploy code
sfcc-ci code:deploy build/code.zip -i $INSTANCE
sfcc-ci code:activate v1 -i $INSTANCE
```

### After (b2c-cli — stateless)

With the B2C CLI, set environment variables and run commands directly:

```bash
# No separate auth step — credentials are used automatically
export SFCC_CLIENT_ID=$SFCC_OAUTH_CLIENT_ID
export SFCC_CLIENT_SECRET=$SFCC_OAUTH_CLIENT_SECRET
export SFCC_SERVER=$INSTANCE

b2c code deploy
b2c code activate v1
```

### After (b2c-cli — stateful, sfcc-ci compatible)

If you prefer minimal changes to your existing pipeline scripts:

```bash
# Same pattern as sfcc-ci — colon-separated aliases are supported
b2c client:auth --client-id $SFCC_OAUTH_CLIENT_ID --client-secret $SFCC_OAUTH_CLIENT_SECRET

b2c code:deploy
b2c code:activate v1 --server $INSTANCE
```

### GitHub Actions

The B2C CLI provides official GitHub Actions that handle installation, credential configuration, and caching automatically. See the [CI/CD with GitHub Actions](./ci-cd) guide for complete examples and action reference.

## Next Steps

- [Installation](./installation) — install the B2C CLI
- [Authentication Setup](./authentication) — configure API clients, OCAPI, and WebDAV
- [Configuration](./configuration) — environment variables, dw.json, and instance management
- [CI/CD with GitHub Actions](./ci-cd) — official GitHub Actions for automation
- [SDK Migration (Programmatic API)](./sdk-migration) — migrate from sfcc-ci's JavaScript API to the SDK
- [CLI Reference](/cli/) — browse all available commands
