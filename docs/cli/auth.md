# Auth Commands

Commands for authentication and token management.

## b2c auth token

Get an OAuth access token for use in scripts or other tools.

### Usage

```bash
b2c auth token
```

### Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | Client ID for OAuth |
| `--client-secret` | `SFCC_CLIENT_SECRET` | Client Secret for OAuth |
| `--scope` | `SFCC_OAUTH_SCOPES` | OAuth scopes to request (can be repeated) |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (default: account.demandware.com) |

### Examples

```bash
# Get a token with default scopes
b2c auth token --client-id xxx --client-secret yyy

# Get a token with specific scopes
b2c auth token --scope sfcc.orders --scope sfcc.products

# Output as JSON (useful for parsing)
b2c auth token --json

# Using environment variables
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c auth token
```

### Output

The command outputs the access token:

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

With `--json`:

```json
{"token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...","expires_in":1799}
```

### Use Cases

#### Scripting

Use the token in shell scripts:

```bash
TOKEN=$(b2c auth token)
curl -H "Authorization: Bearer $TOKEN" https://my-instance.demandware.net/s/-/dw/data/v24_3/sites
```

#### CI/CD Pipelines

Get a token for use with other tools:

```bash
export SFCC_TOKEN=$(b2c auth token --json | jq -r '.token')
```

#### Testing API Calls

Quickly get a token for testing OCAPI or SCAPI:

```bash
b2c auth token | pbcopy  # macOS: copy to clipboard
```

---

## Authentication Overview

The CLI supports multiple authentication methods depending on the operation.

### Account Manager API Client (OAuth)

Most instance operations require an Account Manager API Client. The CLI supports two authentication methods:

| Auth Method | When Used | Role Configuration |
|-------------|-----------|-------------------|
| User Authentication | Only `--client-id` provided | Roles on your **user account** |
| Client Credentials | Both `--client-id` and `--client-secret` provided | Roles on the **API client** |

```bash
# User Authentication (opens browser for login)
b2c ods list --client-id xxx

# Client Credentials
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c ods list
```

Used by:
- Code management (`code list`, `code activate`, `code delete`)
- Job operations (`job run`, `job search`, `job import`, `job export`)
- Site operations (`sites list`)
- ODS operations (requires `Sandbox API User` role)
- SLAS operations (requires `SLAS Organization Administrator` or `Sandbox API User` role depending on auth method)

### Basic Auth (WebDAV)

WebDAV operations support Basic Auth using your Business Manager username and WebDAV access key:

```bash
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-webdav-access-key
```

Used by:
- `code deploy` (file upload)
- `code watch` (file upload)
- `webdav` commands

### MRT API Key

Managed Runtime commands use a separate API key obtained from the MRT dashboard:

```bash
export SFCC_MRT_API_KEY=your-mrt-api-key
```

See [MRT Commands](./mrt#authentication) for details.

### Mixed Authentication

Some commands (like `code deploy` with `--reload`) require both OAuth and WebDAV access:

```bash
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-access-key
b2c code deploy --reload
```

### Configuration File

Credentials can be stored in a `dw.json` file:

```json
{
  "client-id": "my-client",
  "client-secret": "my-secret",
  "username": "my-user",
  "password": "my-access-key"
}
```

Use `--config` to specify a custom config file path, or `--instance` to select a named instance configuration.

### Tenant Scope

For ODS and SLAS operations, your API client must have tenant scope configured for the realm/organization you wish to manage. This is set up in Account Manager when creating or editing the API client.
