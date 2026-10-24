---
description: Set up authentication for the B2C CLI including Account Manager API clients, SCAPI scopes, OCAPI permissions, and WebDAV access keys.
---

# Authentication Setup

This guide covers setting up authentication for the B2C CLI, including Account Manager API clients, OCAPI permissions, and WebDAV access.

## Overview

The CLI uses different authentication mechanisms depending on the operation:

| Operation                                                                                          | Auth Method                                                           | Setup Required                                                                                                       |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [Code](/cli/code) deploy, watch, download; [logs](/cli/logs); [WebDAV](/cli/webdav)                | WebDAV: sign in with your account, access key, or API client          | None ([sign in when asked](#webdav-access))                                                                          |
| [Code](/cli/code) activate, delete                                                                 | OAuth + SCAPI (`sfcc.scripts` / `sfcc.scripts.rw`), OCAPI fallback    | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication) (or [OCAPI](#ocapi-configuration)) |
| [Jobs](/cli/jobs)                                                                                  | OAuth + SCAPI (`sfcc.jobs` / `sfcc.jobs.rw`), OCAPI fallback          | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication) (or [OCAPI](#ocapi-configuration)) |
| [BM users / roles](/cli/bm)                                                                        | OAuth + SCAPI (`sfcc.users(.rw)` / `sfcc.roles(.rw)`), OCAPI fallback | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication) (or [OCAPI](#ocapi-configuration)) |
| [Sites](/cli/sites) list, cartridge path (read)                                                    | OAuth + SCAPI (`sfcc.sites` / `sfcc.sites.rw`), OCAPI fallback        | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication) (or [OCAPI](#ocapi-configuration)) |
| [Sites](/cli/sites) cartridge path (add/remove/set)                                                | OAuth + OCAPI / site import                                           | [API Client](#account-manager-api-client) + [OCAPI](#ocapi-configuration)                                            |
| SCAPI commands ([schemas](/cli/scapi-schemas), [custom-apis](/cli/custom-apis), [eCDN](/cli/ecdn)) | System OAuth + SCAPI scopes                                           | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication)                                    |
| [CIP analytics](/cli/cip) (`cip query`, `cip report`)                                              | OAuth + Client Credentials                                            | [API Client](#account-manager-api-client) + Salesforce Commerce API role + tenant filter                             |
| [SLAS](/cli/slas) client management                                                                | OAuth                                                                 | None (uses built-in client) or [API Client](#account-manager-api-client)                                             |
| [Sandbox](/cli/sandbox) management                                                                 | OAuth                                                                 | None (uses built-in client) or [API Client](#account-manager-api-client)                                             |
| [Account Manager](/cli/account-manager)                                                            | OAuth                                                                 | None (uses built-in client) or [API Client](#account-manager-api-client)                                             |
| [MRT](/cli/mrt) commands (most)                                                                    | MRT API Key                                                           | [MRT API Key](#managed-runtime-api-key)                                                                              |
| [MRT](/cli/mrt) `bundle history`, `bundle deploy <id>`                                             | MRT API Key, or OAuth + SCAPI (`sfcc.storefront.deployments` / `.rw`) | [MRT API Key](#managed-runtime-api-key) or [SCAPI Scopes](#scapi-authentication)                                     |

::: tip Commands that need no setup
Code upload, file, and log commands can sign you in with your Account Manager account, so they need only your instance hostname. Sandbox, SLAS, and Account Manager commands work the same way. Configure an API client for the other commands, and for automation and CI.
:::

::: tip
Each CLI command page documents its specific authentication requirements. See the [CLI Reference](/cli/) for details.
:::

## Account Manager API Client

Jobs, sites, code version activation, and other API commands use an Account Manager API client. This is configured in the Salesforce Commerce Cloud Account Manager.

### Authentication Methods

The CLI supports five authentication methods:

| Method                             | When Used                                                                           | Role Configuration                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| **User Authentication**            | When `--user-auth` is passed, or when only a client ID is provided (no secret)      | Roles configured on your **user account** |
| **Client Credentials**             | When both `--client-id` and `--client-secret` are provided                          | Roles configured on the **API client**    |
| **JWT Bearer**                     | When `--jwt-cert` and `--jwt-key` are provided (certificate-based authentication)   | Roles configured on the **API client**    |
| **Stateful User Authentication**   | After running `b2c auth login` — browser-based login, token stored and reused       | Roles configured on your **user account** |
| **Stateful Client Authentication** | After running `b2c auth client` — client credentials login, token stored and reused | Roles configured on the **API client**    |

**User Authentication** opens a browser for interactive login and uses roles assigned to your user account. This is ideal for development and manual operations. Use `--user-auth` as a shorthand for `--auth-methods user` on any OAuth command — both select the Authorization Code + PKCE flow.

In dw.json, the same shorthand is available as `"user-auth": true`. It is mutually exclusive with `"auth-methods"` — set one or the other, not both.

**Client Credentials** uses the API client's secret for non-interactive authentication. This is ideal for CI/CD pipelines and automation.

**JWT Bearer** uses a public/private certificate pair for authentication without storing client secrets. See [JWT Authentication](#jwt-authentication-certificate-based) for details.

**Stateful User Auth** uses `b2c auth login` to open a browser for interactive login once (Authorization Code + PKCE). The CLI persists both the access token _and_ a long-lived refresh token, so subsequent commands silently refresh expired access tokens without re-opening the browser. Clear the session with `b2c auth logout`. See [Auth Commands](/cli/auth#b2c-auth-login) for details.

**Stateful Client Auth** uses `b2c auth client` to authenticate once with client credentials (or user/password) and store the **access token** for reuse across subsequent commands. The client secret is never persisted, and there is no automatic refresh — when the access token expires, re-run `b2c auth client` with the same credentials. For refresh-capable user authentication, use `b2c auth login` instead. See [Auth Commands](/cli/auth#b2c-auth-client) for details.

After signing in with `auth login` or `auth client`, you can omit the client ID from later commands. The CLI automatically reuses the valid saved session when no other client is configured.

::: warning Stateful vs Stateless Precedence
The stored session is used only when the token is valid **and** no explicit auth flags are provided. The CLI falls back to stateless auth when:

- The stored token is **expired or invalid** — a warning suggests re-running `b2c auth client --client-id <id> --client-secret <secret>` (for client-credentials sessions) or `b2c auth login` (for user sessions).
- **Explicit stateless auth flags** are passed (`--client-secret`, `--user-auth`, or `--auth-methods`) — a warning lists the flags that triggered the override. Remove them to use the stored session. Note that `--client-id` alone does not force stateless; the stored session is used if the configured client ID matches.

To opt out of stateful auth entirely, run `b2c auth logout` to clear the stored session. The CLI will then use stateless auth exclusively.
:::

::: tip
For Account Manager operations that require user-level roles (organization and API client management), use `--user-auth` to authenticate with your user account. See [Account Manager Authentication](/cli/account-manager#authentication) for per-subtopic role requirements.
:::

### Creating an API Client

1. Log in to [Account Manager](https://account.demandware.com).
2. Navigate to **API Client** in the left menu.
3. Click **Add API Client**.
4. Fill in the required fields:
   - **Display Name**: A descriptive name (e.g., "B2C CLI")
   - **Password**: A strong client secret (save this securely for Client Credentials auth)
5. Configure the **Token Endpoint Auth Method**:
   - `client_secret_basic` for client credentials flow
   - `private_key_jwt` for JWT Bearer authentication (certificate-based)

::: info
For client credentials with secrets, use `client_secret_basic` (the default). `client_secret_post` is not currently supported.
:::

### Assigning Roles

Roles grant permission to perform specific operations. Roles are configured differently depending on your authentication method.

#### Understanding Roles and Tenant Filters

Most roles require a **tenant filter** that specifies which tenants/realms the role applies to. This is configured alongside the role assignment.

| Role                              | Operations                                | Notes                                         |
| --------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `Salesforce Commerce API`         | SCAPI commands and CIP analytics commands | API clients only. Requires a tenant filter.   |
| `Sandbox API User`                | ODS management, SLAS client management    | Requires tenant filter with realm/org IDs.    |
| `SLAS Organization Administrator` | SLAS client management (user auth only)   | User accounts only. Requires a tenant filter. |

#### For Client Credentials (Roles on API Client)

Under the API Client's **Roles** section:

1. Add roles needed for your operations
2. For each role, configure the **tenant filter** with the tenant IDs (for example, `zzxy_prd`) or realm IDs you need to access

**Important:** The `Salesforce Commerce API` role is currently only available for API Clients, not user accounts.

#### For User Authentication (roles on User)

In Account Manager, navigate to your user account and add roles. Note that some operations require Client Credentials authentication.

### Configuring Scopes

Under **Default Scopes**, add the following scopes based on your needs:

| Scope          | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `mail`         | Required for user info in authentication flows            |
| `roles`        | Critical - returns role information in the token          |
| `tenantFilter` | Critical - returns tenant access information in the token |
| `openid`       | Required for OpenID Connect                               |

For SCAPI commands, also add the relevant API scopes:

| Scope                | Commands              | Reference                           |
| -------------------- | --------------------- | ----------------------------------- |
| `sfcc.cdn-zones`     | eCDN read operations  | [eCDN Commands](/cli/ecdn)          |
| `sfcc.cdn-zones.rw`  | eCDN write operations | [eCDN Commands](/cli/ecdn)          |
| `sfcc.scapi-schemas` | SCAPI schema browsing | [SCAPI Schemas](/cli/scapi-schemas) |
| `sfcc.custom-apis`   | Custom API status     | [Custom APIs](/cli/custom-apis)     |

**Note:** Do NOT add `SALESFORCE_COMMERCE_API` as a scope. This is a role, not a scope.

See the individual CLI command pages for complete scope requirements.

### Configuring Tenant Filter

For ODS, SLAS, and SCAPI operations, your API client's roles must have a tenant filter configured:

1. In Account Manager, go to the API Client settings
2. Under each role (for example, `Salesforce Commerce API`, `Sandbox API User`), find the **Tenant Filter**
3. Add the tenant IDs (for example, `zzxy_prd`) or organization IDs you need to access

The tenant filter restricts which tenants/realms the role applies to.

### Redirect URLs

For **User Authentication** (Authorization Code + PKCE), configure redirect URLs in your API client:

| Redirect URL                                                         | Purpose                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| `http://localhost:8080`                                              | Required for B2C CLI user authentication                  |
| `https://admin.dx.commercecloud.salesforce.com/oauth2-redirect.html` | Optional - enables ODS Swagger interface with same client |

**Note:** Redirect URLs are not required for API clients using only Client Credentials or JWT Bearer authentication.

**Use a public client.** The Authorization Code + PKCE flow requires the API client to be registered in Account Manager as a **public client** (not a confidential client). Public clients have no secret and selecting that type configures the Authorization Code + PKCE grant automatically. A client's type can't be changed after creation, so a legacy implicit-only client must be replaced by a newly-created public client, not converted. See [Implicit Flow Deprecation (PKCE Migration)](#implicit-flow-deprecation) for the transitional fallback behavior and how to resolve the deprecation warning.

::: tip Running Behind a Proxy
If you're running the CLI behind a proxy where `localhost:8080` isn't reachable by the browser, set `SFCC_REDIRECT_URI` to the proxy URL (e.g., `https://proxy.example.com:8080`). The proxy should forward traffic to the CLI's local server. You can also change the local server port with `SFCC_OAUTH_LOCAL_PORT`. Make sure to add your proxy URL to the API client's redirect URLs in Account Manager.
:::

## JWT Authentication (Certificate-Based)

JWT Bearer authentication (RFC 7523) is an alternative to client secrets that uses public/private certificate pairs. This can be useful in environments where you want to avoid storing client secrets.

### How It Works

1. You generate a certificate pair (public certificate + private key)
2. You register the **public certificate** in Account Manager
3. The CLI uses the **private key** to sign JWT tokens for authentication
4. Account Manager verifies the signature using your registered certificate

### Benefits

- **No client secret required**: Authenticate without storing a client secret
- **Rotation**: Certificates can be rotated without updating secrets across pipelines
- **Industry standard**: Implements OAuth 2.0 JWT Bearer (RFC 7523)

### Setup Instructions

#### Step 1: Generate Certificate Pair

Generate an RSA certificate pair using OpenSSL:

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem \
  -out cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=B2C CLI"
```

This creates two files:

- `cert.pem` - Public certificate (upload to Account Manager)
- `key.pem` - Private key (keep secure on your machine)

::: tip Encrypted Keys
For additional security, generate an encrypted private key by omitting `-nodes` and adding a passphrase when prompted. You'll provide the passphrase via `--jwt-passphrase` when using the CLI.
:::

#### Step 2: Register Certificate in Account Manager

1. Log in to [Account Manager](https://account.demandware.com)
2. Navigate to **API Client** and select your client
3. Set **Token Endpoint Auth Method** to `private_key_jwt`
4. Upload `cert.pem` in the **Certificates** section
5. Save changes

::: tip Multiple Certificates per Client
You can register **multiple certificates** for the same API client. This is useful for:

- **Team collaboration**: Each developer generates their own key pair and registers their certificate
- **Key rotation**: Add a new certificate before removing the old one (zero downtime)
- **Multi-environment**: Different certificates for CI/CD, staging, production

Account Manager will verify JWT signatures against all registered certificates, so each team member can authenticate with their own private key while sharing the same client ID.
:::

#### Step 3: Configure CLI

You can provide JWT credentials via CLI flags, environment variables, or configuration files.

**Using CLI flags:**

```bash
b2c code list \
  --client-id your-client-id \
  --jwt-cert ./cert.pem \
  --jwt-key ./key.pem
```

**Using environment variables:**

```bash
export SFCC_CLIENT_ID=your-client-id
export SFCC_JWT_CERT=/path/to/cert.pem
export SFCC_JWT_KEY=/path/to/key.pem

b2c code list
```

**Using dw.json:**

```json
{
  "hostname": "your-instance.demandware.net",
  "client-id": "your-client-id",
  "jwt-cert-path": "./cert.pem",
  "jwt-key-path": "./key.pem"
}
```

**For encrypted keys:**

```bash
b2c code list \
  --client-id your-client-id \
  --jwt-cert ./cert.pem \
  --jwt-key ./key.pem \
  --jwt-passphrase "your-passphrase"

# Or via environment variable
export SFCC_JWT_PASSPHRASE=your-passphrase
```

### Authentication Priority

JWT authentication is tried **after** client credentials (if client secret is available) but **before** the user (browser) flow:

1. `client-credentials` - Uses client secret if available
2. `jwt` - Uses JWT certificate if configured (no client secret)
3. `user` - Opens browser for Authorization Code + PKCE login

The legacy `implicit` flow has been removed from the default chain. It is still selectable via `--auth-methods implicit` for backwards compatibility, but emits a deprecation warning; OAuth 2.1 deprecates implicit for public clients.

To force JWT authentication even when a client secret is configured:

```bash
b2c code list --auth-methods jwt
```

### Troubleshooting

**"JWT certificate file not found"**

- Verify the certificate path is correct
- Use absolute paths or paths relative to current directory

**"Invalid JWT private key"**

- Check that the key file is in PEM format
- If encrypted, ensure you provide the correct passphrase via `--jwt-passphrase`

**"JWT authentication failed (401)"**

- Verify the certificate is registered in Account Manager
- Ensure the Token Endpoint Auth Method is set to `private_key_jwt`
- Check that the client ID matches the API client with the registered certificate

**"Invalid certificate format"**

- The certificate must be in PEM format (starts with `-----BEGIN CERTIFICATE-----`)
- Regenerate the certificate using the OpenSSL command above

### Security Best Practices

- **Keep private keys secure**: Never commit `key.pem` to version control
- **Add to .gitignore**: Include `*.pem` and `*.key` in your `.gitignore`
- **Use encrypted keys in production**: Generate keys with passphrases for production use
- **Rotate certificates regularly**: Generate new certificates periodically (every 90-365 days)
- **Store passphrases securely**: Use secret managers for passphrases in CI/CD

## OCAPI Configuration

::: warning OCAPI is deprecated
OCAPI (the Open Commerce API / Data API) is **deprecated** and is being disabled across instances. Newer instances reject OCAPI calls entirely (`OcapiDeprecatedException`). Prefer [SCAPI](#scapi-authentication) for code, jobs, BM users/roles, sites, and catalog discovery. The CLI uses SCAPI first and temporarily falls back on safe capability/auth/request rejections. Configure OCAPI only for compatible instances or operations with no live SCAPI equivalent as of release 26.8, such as inventory-list enumeration and BM `whoami` / access keys / raw user-search JSON. Explicit SCAPI mode rejects these operations before contacting OCAPI.

If a command fails with "OCAPI is deprecated and disabled for this instance," configure [SCAPI scopes](#scapi-authentication) on your API client instead.
:::

For operations that interact with B2C Commerce instances (code deployment, jobs, sites), you need to configure OCAPI permissions on each instance.

### Configuring OCAPI in Business Manager

1. Log in to Business Manager
2. Navigate to **Administration** > **Site Development** > **Open Commerce API Settings**
3. Select the **Data API** type
4. Add a configuration for your client ID

### Example OCAPI Configuration

```json
{
  "_v": "24.5",
  "clients": [
    {
      "client_id": "your-client-id",
      "resources": [
        {
          "resource_id": "/code_versions",
          "methods": ["get"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/code_versions/*",
          "methods": ["get", "put", "patch", "delete"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/jobs/*/executions",
          "methods": ["post"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/jobs/*/executions/*",
          "methods": ["get"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/job_execution_search",
          "methods": ["post"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/sites",
          "methods": ["get"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        },
        {
          "resource_id": "/sites/*",
          "methods": ["get"],
          "read_attributes": "(**)",
          "write_attributes": "(**)"
        }
      ]
    }
  ]
}
```

### Minimal Configuration by Feature

**Code management only:**

```json
{
  "resource_id": "/code_versions",
  "methods": ["get"]
},
{
  "resource_id": "/code_versions/*",
  "methods": ["get", "put", "patch", "delete"]
}
```

**Job execution only:**

```json
{
  "resource_id": "/jobs/*/executions",
  "methods": ["post"]
},
{
  "resource_id": "/jobs/*/executions/*",
  "methods": ["get"]
},
{
  "resource_id": "/job_execution_search",
  "methods": ["post"]
}
```

**Site listing only:**

```json
{
  "resource_id": "/sites",
  "methods": ["get"]
},
{
  "resource_id": "/sites/*",
  "methods": ["get"]
}
```

**BM administration (`bm roles`, `bm users`, `bm whoami`, `bm access-key`):**

```json
{
  "resource_id": "/roles",
  "methods": ["get"]
},
{
  "resource_id": "/roles/*",
  "methods": ["get", "put", "delete"]
},
{
  "resource_id": "/roles/*/users",
  "methods": ["get"]
},
{
  "resource_id": "/roles/*/users/*",
  "methods": ["put", "delete"]
},
{
  "resource_id": "/roles/*/permissions",
  "methods": ["get", "put"]
},
{
  "resource_id": "/users",
  "methods": ["get"]
},
{
  "resource_id": "/users/*",
  "methods": ["get", "patch", "delete"]
},
{
  "resource_id": "/users/this",
  "methods": ["get"]
},
{
  "resource_id": "/users/*/access_key/*",
  "methods": ["get", "put", "patch", "delete"]
},
{
  "resource_id": "/user_search",
  "methods": ["post"]
}
```

::: tip BM functional permissions
`bm whoami` and the `bm access-key` family additionally require _a real BM user identity_. Service-client tokens cannot resolve to a BM user, so the CLI defaults these commands to browser-based user auth. Access-key writes also require the **Manage_Users_Access_Keys** BM functional permission on the user account performing the request — grant it via **Administration** > **Roles & Permissions** in Business Manager. See [BM Commands → Authentication](/cli/bm#authentication) for details.
:::

## SCAPI Authentication

SCAPI (the Salesforce Commerce API) is the **preferred, modern** API surface and the CLI's default for every operation that supports it. SCAPI-native commands (eCDN, SCAPI schemas, custom APIs) require it, and dual-backend commands use it first with a temporary [deprecated OCAPI fallback](#ocapi-configuration). All require OAuth authentication with specific roles and scopes.

As of B2C Commerce release 26.8, the SCAPI Admin APIs used here support stateless client-credentials or JWT Bearer authentication, not browser-based user authentication. `--user-auth` continues to work with OCAPI and WebDAV. In `auto` mode a user-authenticated migrated command selects OCAPI; `--api-backend scapi --user-auth` errors clearly and directs the user to system authentication or OCAPI. The tooling will be updated when platform support becomes available.

### Required Setup

1. **Role:** Assign the `Salesforce Commerce API` role to your API client with appropriate tenant filter
2. **Scopes:** Add required SCAPI scopes to your API client's Default Scopes

### Scopes by Command

| Command                                               | Required Scope                         | Reference                             |
| ----------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| `b2c scapi schemas list/get`                          | `sfcc.scapi-schemas`                   | [SCAPI Schemas](/cli/scapi-schemas)   |
| `b2c scapi custom status`                             | `sfcc.custom-apis`                     | [Custom APIs](/cli/custom-apis)       |
| `b2c ecdn` (read operations)                          | `sfcc.cdn-zones`                       | [eCDN](/cli/ecdn)                     |
| `b2c ecdn` (write operations)                         | `sfcc.cdn-zones.rw`                    | [eCDN](/cli/ecdn)                     |
| `b2c jobs` (read; e.g. `list`, `get`, `wait`)         | `sfcc.jobs` or `sfcc.jobs.rw`          | [Jobs](/cli/jobs)                     |
| `b2c jobs` (write; e.g. `run`, `delete`)              | `sfcc.jobs.rw`                         | [Jobs](/cli/jobs)                     |
| `b2c code list`                                       | `sfcc.scripts` or `sfcc.scripts.rw`    | [Code](/cli/code)                     |
| `b2c code activate`, `code delete`                    | `sfcc.scripts.rw`                      | [Code](/cli/code)                     |
| `b2c bm users list/get`                               | `sfcc.users` or `sfcc.users.rw`        | [BM](/cli/bm)                         |
| `b2c bm users search`                                 | `sfcc.users` or `sfcc.users.rw`        | [BM](/cli/bm)                         |
| `b2c bm users create/update/delete`                   | `sfcc.users.rw`                        | [BM](/cli/bm)                         |
| `b2c bm roles list/get`                               | `sfcc.roles` or `sfcc.roles.rw`        | [BM](/cli/bm)                         |
| `b2c bm roles create/delete/grant/revoke/permissions` | `sfcc.roles.rw`                        | [BM](/cli/bm)                         |
| `b2c sites list`, `sites cartridges list`             | `sfcc.sites` or `sfcc.sites.rw`        | [Sites](/cli/sites)                   |
| `b2c sites cartridges add/remove/set`                 | `sfcc.sites.rw`                        | [Sites](/cli/sites)                   |
| Catalog discovery used by export/VS Code              | `sfcc.catalogs` or `sfcc.catalogs.rw`  | [Jobs](/cli/jobs)                     |
| `b2c mrt bundle history` (SCAPI backend)              | `sfcc.storefront.deployments` or `.rw` | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt bundle deploy <id>` (SCAPI backend)          | `sfcc.storefront.deployments.rw`       | [MRT Backends](/cli/mrt#mrt-backends) |

The CLI automatically requests these scopes. Your API client must have them in the Default Scopes list.

The `code`, `jobs`, `bm users`, `bm roles`, and `sites` commands run over SCAPI where the live API provides an equivalent operation. The CLI defaults to `--api-backend auto`: it tries SCAPI when `shortCode`, `tenantId`, and supported stateless OAuth are detected, then falls back to deprecated OCAPI only for safe capability/auth/request rejections. Missing SCAPI coordinates select OCAPI directly; they are not required for `auto`. If neither backend is usable, the command reports the missing configuration or permission instead of requiring SCAPI coordinates up front. Use `--api-backend scapi` or `--api-backend ocapi` to force a backend explicitly.

Inventory-list enumeration, BM `whoami`, BM access-key administration, raw OCAPI user-search query JSON, and cancellation of a running job currently have no equivalent live SCAPI operation. Those remain explicit temporary OCAPI compatibility paths. Site cartridge-path writes and catalog enumeration are supported by SCAPI.

::: tip
For detailed authentication requirements including specific scopes for each command, see the individual [CLI command reference pages](/cli/).
:::

### Configuration

```bash
# Set credentials
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# Example: List SCAPI schemas
b2c scapi schemas list
```

## WebDAV Access

Code upload, file, and log commands (`code deploy`, `code watch`, `logs`, `webdav`) use WebDAV. Choose how they connect:

| Option                                                                    | Best for                                    | Setup                                    |
| ------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| [Sign in with your account](#option-c-browser-login-account-manager-user) | Getting started and interactive development | None beyond the hostname                 |
| [Access key](#option-a-basic-authentication-user-access)                  | Scripts, or working without a browser       | A Business Manager access key            |
| [API client](#option-b-oauth-based-webdav-api-client-access)              | CI/CD and shared automation                 | WebDAV Client Permissions for the client |

### Sign in with your account {#option-c-browser-login-account-manager-user}

```bash
b2c code deploy --server my-sandbox.dx.commercecloud.salesforce.com
b2c logs list --server my-sandbox.dx.commercecloud.salesforce.com
```

You stay signed in, so later commands don't ask again. The same sign-in works in the MCP server and the VS Code extension.

What you can do depends on your Business Manager roles on the instance. If a request is refused, the error names the permission you need:

| Folder                                                                                     | Business Manager permission   |
| ------------------------------------------------------------------------------------------ | ----------------------------- |
| `Cartridges`                                                                               | `WebDAV_Manage_Customization` |
| `Impex`, `Logs`, `Temp`, `Static`, `Catalogs`, `Libraries`, `Dynamic`, `CustomerSnapshots` | `WebDAV_Transfer_Files`       |
| `Securitylogs`                                                                             | `WebDAV_Security_Logs_Access` |
| `Realmdata`                                                                                | `WebDAV_Realm_Access`         |

Code uploads go to the instance's active code version. Activating a different code version (`code activate`, `code deploy --activate`) needs an [API client](#account-manager-api-client).

### Access key (Basic authentication) {#option-a-basic-authentication-user-access}

Use your Business Manager username and a WebDAV access key instead of signing in, for example in scripts.

The access key is used as the password. Your Account Manager password (the one you use to log in to Business Manager) is not accepted for WebDAV once unified authentication is enabled.

1. In Business Manager, click your username in the upper right corner and select **Manage Access Keys** (or open `https://<host>/on/demandware.store/Sites-Site/default/ViewAccessKeys-List`)
2. Generate a key with the scope **WebDAV File Access and UX Studio**

Or create the key with the CLI:

```bash
b2c bm access-key create --scope WEBDAV_AND_STUDIO
```

See [Create an Access Key for Logins](https://help.salesforce.com/s/articleView?id=cc.b2c_access_keys_for_business_manager.htm&type=5) and [Configure WebDAV File Access](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5) for detailed instructions.

```bash
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

### API client (OAuth) {#option-b-oauth-based-webdav-api-client-access}

For API clients and automation (CI/CD), use OAuth credentials instead of a user's basic auth. This requires configuring WebDAV Client Permissions for the API client:

1. Log in to Business Manager
2. Navigate to **Administration** > **Organization** > **WebDAV Client Permissions**
3. Add a JSON configuration for your API client ID:

```json
{
  "clients": [
    {
      "client_id": "your-client-id",
      "permissions": [
        {"path": "/cartridges", "operations": ["read_write"]},
        {"path": "/impex", "operations": ["read_write"]},
        {"path": "/logs", "operations": ["read_write"]}
      ]
    }
  ]
}
```

Common paths for CLI operations:

| Path                      | Operations             |
| ------------------------- | ---------------------- |
| `/cartridges`             | Code deployment        |
| `/impex`                  | Site import/export     |
| `/logs`                   | Log file access        |
| `/catalogs/<catalog-id>`  | Catalog file access    |
| `/libraries/<library-id>` | Content library access |

**Note:** This configuration is only needed when an API client authenticates with its own credentials (client ID and secret, or JWT). It isn’t needed when you sign in with your account or use an access key.

### Which credentials WebDAV uses

An access key is used when configured, then an API client, then signing in with your account. To use the API client for WebDAV when an access key is also configured, pass `--auth-methods client-credentials` (or set `SFCC_AUTH_METHODS=client-credentials`). Avoid `--auth-methods basic` on commands that also call SCAPI or OCAPI, such as `code deploy`: it disables the API client for those calls too.

## Managed Runtime API Key

MRT commands use a separate API key system.

### Getting an MRT API Key

1. Log in to the [Managed Runtime dashboard](https://runtime.commercecloud.com/)
2. Navigate to **Account Settings** > **API Keys**
3. Click **Create API Key**
4. Copy and save the key securely (it's only shown once)

### Configuring the API Key

```bash
# Save credentials to ~/.mobify
b2c mrt save-credentials --user your-email@example.com --api-key your-mrt-api-key

# Or use an environment variable
export MRT_API_KEY=your-mrt-api-key
```

## Quick Start Example

To upload code and read logs, you only need your instance hostname; see [WebDAV Access](#webdav-access). Here's a complete example for setting up API access as well:

### 1. Create API Client in Account Manager

1. Log in to [Account Manager](https://account.demandware.com)
2. Navigate to **API Client** > **Add API Client**
3. Configure:
   - **Display Name**: `B2C CLI`
   - **Password**: Generate a strong secret (save securely)
   - **Roles**:
     - `Salesforce Commerce API` - add tenant filter with your tenant IDs
     - `Sandbox API User` - if using ODS (add tenant filter)
   - **Default Scopes**: `mail roles tenantFilter openid sfcc.cdn-zones`
   - For SCAPI-backed dual commands, also add the relevant `sfcc.jobs(.rw)`, `sfcc.scripts(.rw)`, `sfcc.users(.rw)`, `sfcc.roles(.rw)` scopes — see [Scopes by Command](#scopes-by-command).
   - **Redirect URLs**: `http://localhost:8080` (for user authentication)

### 2. (Optional) Configure OCAPI fallback

With the SCAPI scopes above configured, `code`, `jobs`, `bm users/roles`, `sites`, and catalog discovery run over SCAPI. Configure OCAPI only for operations with no live equivalent as of release 26.8 — inventory-list enumeration, BM `whoami`, access keys, and raw `bm users search --query` — or as the temporary `auto` fallback. Explicit SCAPI mode raises a capability error before contacting OCAPI. Note that OCAPI is [deprecated](#ocapi-configuration) and disabled on newer instances. To set it up, add the JSON configuration shown in [OCAPI Configuration](#ocapi-configuration).

### 3. (Optional) Configure WebDAV access for automation

Code upload, logs, and `webdav` commands work by signing in with your account. For CI/CD, use an [access key](#option-a-basic-authentication-user-access) or [WebDAV Client Permissions](#option-b-oauth-based-webdav-api-client-access) for the API client.

### 4. Set Environment Variables

```bash
# OAuth credentials
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret

# Instance hostname (used by WebDAV and OCAPI)
export SFCC_SERVER=your-instance.demandware.net

# SCAPI — required for SCAPI-only commands (eCDN, schemas, custom-apis) and
# enables `auto` mode to prefer SCAPI for code/jobs/bm commands.
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# WebDAV (if using BM credentials)
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

### 5. Test the Configuration

```bash
# Test OAuth + SCAPI (code uses SCAPI when sfcc.scripts is configured)
b2c code list

# Test WebDAV
b2c webdav ls --root=cartridges

# Test SCAPI
b2c scapi schemas list
```

## Troubleshooting

### "Unauthorized" errors

- Verify your client ID and secret are correct
- Check that OCAPI is configured for your client ID
- Ensure the API client has the required roles

### "Unauthorized" (401) or "Forbidden" (403) on WebDAV operations

Either status can mean the credentials were refused or the API client has no permission for the folder.

- When you signed in with your account, the error names the Business Manager permission you need; ask an administrator to add it to one of your roles. See [Sign in with your account](#option-c-browser-login-account-manager-user).
- With an access key, use the key (scope **WebDAV File Access and UX Studio**) as the password, not your Account Manager password. See [Access key](#option-a-basic-authentication-user-access).
- With OAuth, check that the API client has an entry for the folder (for example `/logs` or `/cartridges`) in **Administration** > **Organization** > **WebDAV Client Permissions**.
- If both are configured, the access key is used. See [Which credentials WebDAV uses](#which-credentials-webdav-uses).

### "Invalid scope" errors

- Add the required scopes to your API client's Default Scopes
- For SCAPI commands, ensure the relevant `sfcc.*` scopes are in Default Scopes
- Verify that Default Scopes includes `mail roles tenantFilter openid`

## Implicit Flow Deprecation (PKCE Migration) {#implicit-flow-deprecation}

The browser-based `user` authentication method now uses the **Authorization Code flow with PKCE** (Proof Key for Code Exchange). The legacy **implicit** flow is deprecated for public clients per OAuth 2.1 and is no longer the default. Most users are unaffected — this section is for those with a legacy implicit-only client seeing a deprecation warning.

### What changed

- `b2c auth login` and the `user` auth method use Authorization Code + PKCE by default and persist a **refresh token**, so subsequent commands refresh silently without re-opening the browser.
- The implicit flow is still selectable for backward compatibility via `--auth-methods implicit` (or `"auth-methods": ["implicit"]` in `dw.json`), but it emits a deprecation warning and cannot obtain refresh tokens.

### You must use a public client

PKCE requires the Account Manager client to be a **public client**. Selecting that type in Account Manager configures the Authorization Code + PKCE grant automatically and the client has no secret.

**An Account Manager client's type cannot be changed after it is created.** A legacy implicit-only client therefore has to be **replaced by a newly-created public client** — it cannot be converted in place. Create a new public client, add the CLI's redirect URI (`http://localhost:8080` by default), and use its client ID.

### Transitional automatic fallback

To keep existing users working during the migration, if the configured client is **not** a PKCE-capable public client, the `user` flow automatically falls back to the deprecated implicit flow for that client and logs a warning:

```
[Auth] Authorization Code + PKCE failed for client <id> (<oauth error>). Falling back to
the deprecated implicit flow. Recommend creating a new public (PKCE) client in Account
Manager and using it to remove this warning.
```

The fallback triggers **only** for OAuth errors that indicate the client is not a public/PKCE client — `invalid_client` (Account Manager requires client authentication at the token exchange; the most common case for legacy implicit clients), `unauthorized_client`, `unsupported_response_type`, and `unsupported_grant_type`. Other failures (for example `invalid_scope` from requesting scopes the client can't have, or a cancelled login) surface directly without falling back, because they would fail identically under the implicit flow.

The first fallback can require two browser authorization prompts while the tooling switches to the compatible flow. After a successful fallback, later CLI and VS Code sign-ins use that flow directly and avoid the extra prompt. The first browser callback reports that authorization was received instead of reporting a successful sign-in before the fallback completes.

To resolve the warning, create a new public client as described above and use its client ID. To disable the fallback entirely and surface PKCE failures directly, set `SFCC_DISABLE_PKCE_FALLBACK=1`. The fallback is temporary and will be removed once public clients have migrated.

## Next Steps

- [Configuration](./configuration) - Learn how configuration is shared across the CLI, MCP server, and VS Code extension
- [CLI Reference](/cli/) - Browse available commands
