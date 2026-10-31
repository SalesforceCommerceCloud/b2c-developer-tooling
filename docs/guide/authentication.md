---
description: Set up authentication for the B2C CLI, including signing in, Account Manager API clients, SCAPI scopes, WebDAV access, and MRT API keys.
---

# Authentication Setup

This guide covers signing in, Account Manager API clients, SCAPI scopes, WebDAV access, and MRT API keys.

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
| [SLAS](/cli/slas) client management                                                                | OAuth                                                                 | None (sign in when asked) or [API Client](#account-manager-api-client)                                               |
| [Sandbox](/cli/sandbox) management                                                                 | OAuth                                                                 | None (sign in when asked) or [API Client](#account-manager-api-client)                                               |
| [Account Manager](/cli/account-manager)                                                            | OAuth                                                                 | None (sign in when asked) or [API Client](#account-manager-api-client)                                               |
| [MRT](/cli/mrt) commands (most)                                                                    | MRT API Key                                                           | [MRT API Key](#managed-runtime-api-key)                                                                              |
| [MRT](/cli/mrt) `bundle history`, `bundle deploy <id>`                                             | MRT API Key, or OAuth + SCAPI (`sfcc.storefront.deployments` / `.rw`) | [MRT API Key](#managed-runtime-api-key) or [SCAPI Scopes](#scapi-authentication)                                     |

::: tip Commands that need no setup
Code upload, file, and log commands can sign you in with your Account Manager account, so they need only your instance hostname. Sandbox, SLAS, and Account Manager commands work the same way. Configure an API client for the other commands, and for automation and CI. Each [CLI command page](/cli/) lists its requirements.
:::

## Account Manager API Client

Jobs, sites, code version activation, and other API commands use an Account Manager API client. This is configured in the Salesforce Commerce Cloud Account Manager.

### Authentication Methods

An API client can authenticate in three ways:

| Method                                       | Best for                           | Configure                                        | Permissions come from  |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------- |
| Sign in with your account                    | Interactive development            | `client-id`                                      | Your user's roles      |
| Client credentials                           | CI/CD and automation               | `client-id` and `client-secret`                  | The API client's roles |
| [JWT](#jwt-authentication-certificate-based) | Automation without a stored secret | `client-id`, `jwt-cert-path`, and `jwt-key-path` | The API client's roles |

With a client secret configured, the CLI uses client credentials. Pass `--user-auth` to sign in with your account instead.

Run `b2c auth login` once to stay signed in; later commands reuse the sign-in. Client credentials and JWT need no sign-in: each command gets its own token. See [Auth Commands](/cli/auth) for details.

::: tip
Account Manager commands that manage organizations and API clients need roles on your user account, so use `--user-auth` for them. See [Account Manager Authentication](/cli/account-manager#authentication).
:::

### Creating an API Client

To create the client from the CLI with your own sign-in, use [`b2c am clients create`](/cli/account-manager#b2c-am-clients-create). This requires the API Administrator or Account Administrator role; see [API Client Provisioning](./account-manager#api-client-provisioning). To create one in Account Manager:

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
2. For each role, configure the **tenant filter** with the tenant IDs (for example, `zzxy_prd`) or realm IDs you need to access. The tenant filter limits which tenants or realms the role applies to.

#### For User Authentication (roles on User)

In Account Manager, navigate to your user account and add roles. These apply when you sign in with your account; each command's page says whether it needs an API client instead.

### Configuring Scopes

Under **Default Scopes**, add the following scopes based on your needs:

| Scope          | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `mail`         | Required for user info in authentication flows            |
| `roles`        | Critical - returns role information in the token          |
| `tenantFilter` | Critical - returns tenant access information in the token |
| `openid`       | Required for OpenID Connect                               |

For SCAPI commands, also add the API scopes listed in [Scopes by Command](#scopes-by-command).

::: warning
Don't add `SALESFORCE_COMMERCE_API` as a scope. It's a role, not a scope.
:::

### Redirect URLs

To sign in with your own API client, add these redirect URLs to it:

| Redirect URL                                                         | Purpose                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| `http://localhost:8080`                                              | Required for B2C CLI sign-in                              |
| `https://admin.dx.commercecloud.salesforce.com/oauth2-redirect.html` | Optional - enables ODS Swagger interface with same client |

Create the client as a **public client** (no secret). A client's type can't be changed later. Clients that use only client credentials or JWT don't need redirect URLs.

::: info Running behind a proxy
If the browser can't reach `localhost:8080`, set `SFCC_REDIRECT_URI` to the proxy URL (for example, `https://proxy.example.com:8080`) and add it to the client's redirect URLs. The proxy forwards to the CLI's local server; change that server's port with `SFCC_OAUTH_LOCAL_PORT`.
:::

## SCAPI Authentication

SCAPI (the Salesforce Commerce API) is the CLI's default API for every command that supports it. It needs an API client with the `Salesforce Commerce API` role and the scopes below.

SCAPI Admin APIs need a client secret or JWT; browser sign-in isn't supported yet (as of release 26.8). Commands run with `--user-auth` use [OCAPI](#ocapi-configuration) instead.

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
| `b2c mrt project list/get` (SCAPI backend)            | `sfcc.storefront.storefronts` or `.rw` | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt project create/update/delete` (SCAPI)        | `sfcc.storefront.storefronts.rw`       | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt env`, `env var` reads (SCAPI backend)        | `sfcc.storefront.environments`         | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt env`, `env var` writes (SCAPI backend)       | `sfcc.storefront.environments.rw`      | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt bundle history` (SCAPI backend)              | `sfcc.storefront.deployments` or `.rw` | [MRT Backends](/cli/mrt#mrt-backends) |
| `b2c mrt bundle deploy <id>` (SCAPI backend)          | `sfcc.storefront.deployments.rw`       | [MRT Backends](/cli/mrt#mrt-backends) |

The CLI automatically requests these scopes. Your API client must have them in the Default Scopes list.

The `code`, `jobs`, `bm`, and `sites` commands use SCAPI when it's configured and fall back to OCAPI automatically. `--api-backend scapi` or `--api-backend ocapi` forces one. Inventory-list enumeration, `bm whoami`, `bm access-key`, raw `bm users search --query` JSON, and cancelling a running job still need OCAPI.

::: info How the API is chosen
With `--api-backend auto` (the default), a command uses SCAPI when `shortCode`, `tenantId`, and a client secret or JWT are configured, and falls back to OCAPI only when SCAPI rejects the request as unsupported or unauthorized. Without SCAPI settings it uses OCAPI directly. With `--user-auth`, `auto` uses OCAPI and `--api-backend scapi` fails with an error. `--api-backend scapi` also fails before contacting OCAPI for the OCAPI-only operations above. If neither API is usable, the command reports the missing configuration or permission.
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

## OCAPI Configuration

::: warning OCAPI is deprecated
OCAPI (the Open Commerce API / Data API) is **deprecated** and is being disabled across instances; newer instances reject OCAPI calls (`OcapiDeprecatedException`). Use [SCAPI](#scapi-authentication) instead, and configure OCAPI only for the [operations that still need it](#scapi-authentication) or when you sign in with `--user-auth`.

If a command fails with "OCAPI is deprecated and disabled for this instance," configure [SCAPI scopes](#scapi-authentication) on your API client instead.
:::

To use OCAPI, configure permissions for your client ID on each instance.

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

An access key is used when configured, then an API client, then signing in with your account. To use the API client for WebDAV when an access key is also configured, pass `--auth-methods client-credentials` (or set `SFCC_AUTH_METHODS=client-credentials`).

::: warning
Avoid `--auth-methods basic` on commands that also call APIs, such as `code deploy --activate`: it disables the API client for those calls too.
:::

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

## JWT Authentication (Certificate-Based)

JWT authentication uses a certificate instead of a client secret. You register a certificate in Account Manager, and the CLI signs requests with your private key, so there's no secret to store and certificates can be rotated.

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

::: tip Multiple certificates
You can register several certificates on one client, so each developer can use their own key and you can rotate keys without downtime.
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

### Which method is used

With a client secret, the CLI uses client credentials; otherwise it uses JWT when a certificate is configured, then browser sign-in. To force JWT even when a client secret is configured:

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

- Never commit private keys; add `*.pem` and `*.key` to `.gitignore`.
- Use encrypted keys with passphrases (kept in a secret manager) for production and CI/CD.
- Rotate certificates regularly.

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
   - Add the `sfcc.*` scopes for the commands you use — see [Scopes by Command](#scopes-by-command).
   - **Redirect URLs**: `http://localhost:8080` (for user authentication)

### 2. (Optional) Configure WebDAV access for automation

Code upload, logs, and `webdav` commands work by signing in with your account. For CI/CD, use an [access key](#option-a-basic-authentication-user-access) or [WebDAV Client Permissions](#option-b-oauth-based-webdav-api-client-access) for the API client.

### 3. Set Environment Variables

```bash
# OAuth credentials
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret

# Instance hostname
export SFCC_SERVER=your-instance.demandware.net

# SCAPI
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# Optional: an access key for WebDAV without signing in
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

### 4. Test the Configuration

```bash
# Test the API client
b2c code list

# Test WebDAV
b2c webdav ls --root=cartridges

# Test SCAPI
b2c scapi schemas list
```

## Troubleshooting

### "Unauthorized" errors

- Verify your client ID and secret are correct
- Ensure the API client has the required roles and [scopes](#scopes-by-command)
- For commands that use OCAPI, check that your client ID is in [Open Commerce API Settings](#ocapi-configuration)

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

### Deprecation warning about the implicit flow {#implicit-flow-deprecation}

Your API client was registered for the deprecated implicit flow. Create a new **public client** in Account Manager (a client's type can't be changed), add the redirect URL `http://localhost:8080`, and use its client ID. To keep using the old client for now, pass `--auth-methods implicit`.

::: info How the fallback works
When a configured client isn't a public client, browser sign-in falls back to the implicit flow and logs:

```
[Auth] Authorization Code + PKCE failed for client <id> (<oauth error>). Falling back to
the deprecated implicit flow. Recommend creating a new public (PKCE) client in Account
Manager and using it to remove this warning.
```

The fallback happens only for `invalid_client` (the most common case), `unauthorized_client`, `unsupported_response_type`, and `unsupported_grant_type`. Other errors, such as `invalid_scope` or a cancelled sign-in, are reported directly. The first fallback can ask you to sign in twice; later sign-ins with that client use the implicit flow directly. Implicit sign-ins don't renew, so you sign in again when they expire. Set `SFCC_DISABLE_PKCE_FALLBACK=1` to turn the fallback off and see the original error.
:::

## Next Steps

- [Configuration](./configuration) - Learn how configuration is shared across the CLI, MCP server, and VS Code extension
- [CLI Reference](/cli/) - Browse available commands
