# Authentication Setup

This guide covers setting up authentication for the B2C CLI, including Account Manager API clients, OCAPI permissions, and WebDAV access.

## Overview

The CLI uses different authentication mechanisms depending on the operation:

| Operation | Auth Method | Setup Required |
|-----------|-------------|----------------|
| Code management, Jobs, Sites | Account Manager API Client | [API Client](#account-manager-api-client) + [OCAPI](#ocapi-configuration) |
| WebDAV file operations | Business Manager credentials | [WebDAV permissions](#webdav-permissions) |
| On-Demand Sandboxes (ODS) | Account Manager API Client | [API Client](#account-manager-api-client) with `Sandbox API User` role |
| SLAS client management | Account Manager API Client | [API Client](#account-manager-api-client) with SLAS roles |
| Managed Runtime (MRT) | MRT API Key | [MRT API Key](#managed-runtime-api-key) |

## Account Manager API Client

Most CLI operations require an Account Manager API Client. This is configured in the Salesforce Commerce Cloud Account Manager.

### Authentication Methods

The CLI supports two authentication methods:

| Method | When Used | Role Configuration |
|--------|-----------|-------------------|
| **User Authentication** | When only `--client-id` is provided (no secret) | Roles configured on your **user account** |
| **Client Credentials** | When both `--client-id` and `--client-secret` are provided | Roles configured on the **API client** |

**User Authentication** opens a browser for interactive login and uses roles assigned to your user account. This is ideal for development and manual operations.

**Client Credentials** uses the API client's secret for non-interactive authentication. This is ideal for CI/CD pipelines and automation.

### Creating an API Client

1. Log in to [Account Manager](https://account.demandware.com)
2. Navigate to **API Client** in the left menu
3. Click **Add API Client**
4. Fill in the required fields:
   - **Display Name**: A descriptive name (e.g., "B2C CLI")
   - **Password**: A strong client secret (save this securely for Client Credentials auth)
5. Configure the **Token Endpoint Auth Method**:
   - `client_secret_post` for client credentials flow
6. Set **Access Token Format** to `JWT`

### Assigning Roles

Roles grant permission to perform specific operations. Where you configure roles depends on your authentication method:

#### For Client Credentials (roles on API Client)

Under the API Client's **Roles** section, add:

| Role | Operations |
|------|------------|
| `Sandbox API User` | ODS management, SLAS client management |

#### For User Authentication (roles on User)

In Account Manager, navigate to your user account and add roles:

| Role | Operations |
|------|------------|
| `Sandbox API User` | ODS management |
| `SLAS Organization Administrator` | SLAS client management |

### Configuring Scopes

Under **Allowed Scopes**, add:

- `SALESFORCE_COMMERCE_API` - Required for OCAPI/SCAPI operations
- `mail` - Required for some user authentication flows
- `openid` - Required for OpenID Connect

You can also add specific SCAPI scopes as needed (e.g., `sfcc.products`, `sfcc.orders`).

### Setting Tenant Scope

For ODS and SLAS operations, you must configure tenant access:

1. In the API Client settings, find **Organizations**
2. Add the organization/tenant IDs you need to access
3. This grants the API client permission to manage resources in those tenants

### Default Scopes

Under **Default Scopes**, you can set scopes that are automatically requested. A common configuration:

```
SALESFORCE_COMMERCE_API openid
```

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

## WebDAV Permissions

WebDAV access is required for file upload operations (`code deploy`, `code watch`, `webdav` commands).

### Creating a WebDAV Access Key

1. Log in to Business Manager
2. Navigate to **Administration** > **Organization** > **WebDAV Client Permissions**
3. Add your client ID with appropriate permissions

### WebDAV Client Permissions Configuration

Add your API client with access to the required folders:

| Folder | Operations |
|--------|------------|
| `/cartridges` | Code deployment |
| `/impex` | Site import/export |
| `/temp` | Temporary files |
| `/logs` | Log file access |

### Using Business Manager Credentials

Alternatively, you can use your Business Manager username and a WebDAV access key:

1. In Business Manager, go to **Administration** > **Organization** > **Users**
2. Select your user
3. Generate or view your **WebDAV Access Key**

```bash
export SFCC_USERNAME=your-bm-username
export SFCC_PASSWORD=your-webdav-access-key
```

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

Here's a complete example for setting up CLI access to deploy code:

### 1. Create API Client in Account Manager

- Display Name: `B2C CLI`
- Password: (generate a strong secret)
- Roles: `Sandbox API User` (if using ODS)
- Scopes: `SALESFORCE_COMMERCE_API`

### 2. Configure OCAPI in Business Manager

Add the JSON configuration shown above to enable code version and job APIs.

### 3. Configure WebDAV (optional, for file uploads)

Either:
- Add your API client to WebDAV Client Permissions, or
- Use your BM username + WebDAV access key

### 4. Set Environment Variables

```bash
# OAuth credentials
export SFCC_CLIENT_ID=your-client-id
export SFCC_CLIENT_SECRET=your-client-secret

# Instance
export SFCC_SERVER=your-instance.demandware.net

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
- Check that Default Scopes includes `SALESFORCE_COMMERCE_API`

## Next Steps

- [Configuration](./configuration) - Learn about CLI configuration options
- [CLI Reference](/cli/) - Browse available commands
