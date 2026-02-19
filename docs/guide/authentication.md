---
description: Set up authentication for the B2C CLI including Account Manager API clients, OCAPI permissions, and WebDAV access keys.
---

# Authentication Setup

This guide covers setting up authentication for the B2C CLI, including Account Manager API clients, OCAPI permissions, and WebDAV access.

## Overview

The CLI uses different authentication mechanisms depending on the operation:

| Operation                                                                                          | Auth Method                  | Setup Required                                                                           |
| -------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| [Code](/cli/code) deploy, watch (file upload)                                                      | WebDAV (Basic Auth or OAuth) | [WebDAV Access](#webdav-access)                                                          |
| [Code](/cli/code) list, activate, delete                                                           | OAuth + OCAPI                | [API Client](#account-manager-api-client) + [OCAPI](#ocapi-configuration)                |
| [Jobs](/cli/jobs), [Sites](/cli/sites)                                                             | OAuth + OCAPI                | [API Client](#account-manager-api-client) + [OCAPI](#ocapi-configuration)                |
| SCAPI commands ([schemas](/cli/scapi-schemas), [custom-apis](/cli/custom-apis), [eCDN](/cli/ecdn)) | OAuth + SCAPI scopes         | [API Client](#account-manager-api-client) + [SCAPI Scopes](#scapi-authentication)        |
| [CIP analytics](/cli/cip) (`cip query`, `cip report`)                                              | OAuth + Client Credentials   | [API Client](#account-manager-api-client) + Salesforce Commerce API role + tenant filter |
| [SLAS](/cli/slas) client management                                                                | OAuth                        | None (uses built-in client) or [API Client](#account-manager-api-client)                 |
| [Sandbox](/cli/sandbox) management                                                                 | OAuth                        | None (uses built-in client) or [API Client](#account-manager-api-client)                 |
| [Account Manager](/cli/account-manager)                                                            | OAuth                        | None (uses built-in client) or [API Client](#account-manager-api-client)                 |
| [MRT](/cli/mrt) commands                                                                           | MRT API Key                  | [MRT API Key](#managed-runtime-api-key)                                                  |

::: tip Zero-Config for Platform Commands
Sandbox, SLAS, and Account Manager commands work out of the box without any client configuration. The CLI includes a built-in public client that authenticates via browser login (implicit flow). You only need to configure an API client if you want to use client credentials for automation/CI or need specific scopes.
:::

::: tip
Each CLI command page documents its specific authentication requirements. See the [CLI Reference](/cli/) for details.
:::

## Account Manager API Client

Most CLI operations require an Account Manager API Client. This is configured in the Salesforce Commerce Cloud Account Manager.

### Authentication Methods

The CLI supports four authentication methods:

| Method                             | When Used                                                                                      | Role Configuration                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **User Authentication**            | When `--user-auth` is passed, or when only `--client-id` is provided (no secret)               | Roles configured on your **user account** |
| **Client Credentials**             | When both `--client-id` and `--client-secret` are provided                                     | Roles configured on the **API client**    |
| **Stateful User Authentication**   | After running `b2c auth login` — browser-based login, token stored and reused                  | Roles configured on your **user account** |
| **Stateful Client Authentication** | After running `b2c auth client` — client credentials login, token stored and reused            | Roles configured on the **API client**    |

**User Authentication** opens a browser for interactive login and uses roles assigned to your user account. This is ideal for development and manual operations. Use `--user-auth` as a shorthand for `--auth-methods implicit` on any OAuth command.

**Client Credentials** uses the API client's secret for non-interactive authentication. This is ideal for CI/CD pipelines and automation.

**Stateful User Auth** uses `b2c auth login` to open a browser for interactive login once, then stores the session on disk. Subsequent commands automatically use the stored token when it is present and valid, without re-opening the browser. Uses the same storage as [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci). Clear the session with `b2c auth logout`. See [Auth Commands](/cli/auth#b2c-auth-login) for details.

**Stateful Client Auth** uses `b2c auth client` to authenticate once with client credentials (or user/password), store the session, and reuse it across subsequent commands without passing credentials each time. Use `--renew` to enable automatic token renewal via `b2c auth client renew`. See [Auth Commands](/cli/auth#b2c-auth-client) for details.

::: warning Stateful vs Stateless Precedence
The stored session is used only when the token is valid **and** no explicit auth flags are provided. The CLI falls back to stateless auth when:
- The stored token is **expired or invalid** — a warning suggests `b2c auth client renew` (if renewable) or `b2c auth client` / `b2c auth login` to re-authenticate.
- **Explicit stateless auth flags** are passed (`--client-secret`, `--user-auth`, or `--auth-methods`) — a warning lists the flags that triggered the override. Remove them to use the stored session. Note that `--client-id` alone does not force stateless; the stored session is used if the client ID matches.

To opt out of stateful auth entirely, run `b2c auth logout` to clear the stored session. The CLI will then use stateless auth exclusively.
:::

::: tip
For Account Manager operations that require user-level roles (organization and API client management), use `--user-auth` to authenticate with your user account. See [Account Manager Authentication](/cli/account-manager#authentication) for per-subtopic role requirements.
:::

### Creating an API Client

1. Log in to [Account Manager](https://account.demandware.com)
2. Navigate to **API Client** in the left menu
3. Click **Add API Client**
4. Fill in the required fields:
   - **Display Name**: A descriptive name (e.g., "B2C CLI")
   - **Password**: A strong client secret (save this securely for Client Credentials auth)
5. Configure the **Token Endpoint Auth Method**:
   - `client_secret_post` for client credentials flow

### Assigning Roles

Roles grant permission to perform specific operations. Roles are configured differently depending on your authentication method.

#### Understanding Roles and Tenant Filters

Most roles require a **tenant filter** that specifies which tenants/realms the role applies to. This is configured alongside the role assignment.

| Role                              | Operations                                | Notes                                       |
| --------------------------------- | ----------------------------------------- | ------------------------------------------- |
| `Salesforce Commerce API`         | SCAPI commands and CIP analytics commands | API Clients only. Requires tenant filter.   |
| `Sandbox API User`                | ODS management, SLAS client management    | Requires tenant filter with realm/org IDs.  |
| `SLAS Organization Administrator` | SLAS client management (user auth only)   | User accounts only. Requires tenant filter. |

#### For Client Credentials (roles on API Client)

Under the API Client's **Roles** section:

1. Add roles needed for your operations
2. For each role, configure the **tenant filter** with the tenant IDs (e.g., `zzxy_prd`) or realm IDs you need to access

**Important:** The `Salesforce Commerce API` role is currently only available for API Clients, not user accounts.

#### For User Authentication (roles on User)

In Account Manager, navigate to your user account and add roles. Note that some operations require Client Credentials authentication.

### Configuring Scopes

Under **Allowed Scopes**, add the following scopes based on your needs:

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
2. Under each role (e.g., `Salesforce Commerce API`, `Sandbox API User`), find the **Tenant Filter**
3. Add the tenant IDs (e.g., `zzxy_prd`) or organization IDs you need to access

The tenant filter restricts which tenants/realms the role applies to.

### Default Scopes

Under **Default Scopes**, set scopes that are automatically requested. Recommended configuration:

```
mail roles tenantFilter openid
```

These scopes ensure proper authentication and authorization for CLI operations.

### Redirect URLs

For **User Authentication** (implicit flow), configure redirect URLs in your API client:

| Redirect URL                                                         | Purpose                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| `http://localhost:8080`                                              | Required for B2C CLI user authentication                  |
| `https://admin.dx.commercecloud.salesforce.com/oauth2-redirect.html` | Optional - enables ODS Swagger interface with same client |

**Note:** Redirect URLs are not required for API clients using only Client Credentials authentication.

## OCAPI Configuration

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

## SCAPI Authentication

SCAPI commands (eCDN, SCAPI schemas, custom APIs) require OAuth authentication with specific roles and scopes.

### Required Setup

1. **Role:** Assign the `Salesforce Commerce API` role to your API client with appropriate tenant filter
2. **Scopes:** Add required SCAPI scopes to your API client's Allowed Scopes

### Scopes by Command

| Command                       | Required Scope       | Reference                           |
| ----------------------------- | -------------------- | ----------------------------------- |
| `b2c scapi schemas list/get`  | `sfcc.scapi-schemas` | [SCAPI Schemas](/cli/scapi-schemas) |
| `b2c scapi custom status`     | `sfcc.custom-apis`   | [Custom APIs](/cli/custom-apis)     |
| `b2c ecdn` (read operations)  | `sfcc.cdn-zones`     | [eCDN](/cli/ecdn)                   |
| `b2c ecdn` (write operations) | `sfcc.cdn-zones.rw`  | [eCDN](/cli/ecdn)                   |

The CLI automatically requests these scopes. Your API client must have them in the Allowed Scopes list.

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

WebDAV is required for file upload operations (`code deploy`, `code watch`, `webdav` commands).

### Option A: Basic Authentication (Recommended)

Use your Business Manager username and a WebDAV access key. This provides better performance for file operations.

1. In Business Manager, go to **Administration** > **Organization** > **Users**
2. Select your user
3. Generate or view your **WebDAV Access Key**

See [Configure WebDAV File Access](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5) for detailed instructions.

```bash
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

### Option B: OAuth-based WebDAV

If you prefer to use OAuth credentials for WebDAV (instead of basic auth), you must configure WebDAV Client Permissions:

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

**Note:** This configuration is only needed when using OAuth for WebDAV. It is not required when using basic authentication with username/access key.

## Managed Runtime API Key

MRT commands use a separate API key system.

### Getting an MRT API Key

1. Log in to the [Managed Runtime dashboard](https://runtime.commercecloud.com/)
2. Navigate to **Account Settings** > **API Keys**
3. Click **Create API Key**
4. Copy and save the key securely (it's only shown once)

### Configuring the API Key

```bash
# Environment variable
export SFCC_MRT_API_KEY=your-mrt-api-key

# Or in ~/.mobify config file
echo '{"api_key": "your-mrt-api-key"}' > ~/.mobify
```

## Quick Start Example

Here's a complete example for setting up CLI access:

### 1. Create API Client in Account Manager

1. Log in to [Account Manager](https://account.demandware.com)
2. Navigate to **API Client** > **Add API Client**
3. Configure:
   - **Display Name**: `B2C CLI`
   - **Password**: Generate a strong secret (save securely)
   - **Roles**:
     - `Salesforce Commerce API` - add tenant filter with your tenant IDs
     - `Sandbox API User` - if using ODS (add tenant filter)
   - **Allowed Scopes**: `mail roles tenantFilter openid sfcc.cdn-zones`
   - **Default Scopes**: `mail roles tenantFilter openid`
   - **Redirect URLs**: `http://localhost:8080` (for user authentication)

### 2. Configure OCAPI (for code list/activate/delete, jobs, sites)

Add the JSON configuration shown in [OCAPI Configuration](#ocapi-configuration) to enable code version and job APIs.

### 3. Configure WebDAV Access (for code deploy/watch, webdav commands)

Either:

- Use your BM username + WebDAV access key (recommended), or
- Configure WebDAV Client Permissions for OAuth

### 4. Set Environment Variables

```bash
# OAuth credentials
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret

# Instance (for OCAPI commands)
export SFCC_SERVER=your-instance.demandware.net

# SCAPI (for eCDN, schemas, custom-apis)
export SFCC_TENANT_ID=zzxy_prd
export SFCC_SHORTCODE=kv7kzm78

# WebDAV (if using BM credentials)
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

### 5. Test the Configuration

```bash
# Test OAuth + OCAPI
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

### "Forbidden" on WebDAV operations

- Check WebDAV Client Permissions in Business Manager
- Verify your WebDAV access key is correct
- Ensure the folder you're accessing is permitted

### "Invalid scope" errors

- Add the required scopes to your API client's Allowed Scopes
- For SCAPI commands, ensure the relevant `sfcc.*` scopes are in Allowed Scopes
- Verify Default Scopes includes `mail roles tenantFilter openid`

## Next Steps

- [Configuration](./configuration) - Learn about CLI configuration options
- [CLI Reference](/cli/) - Browse available commands
