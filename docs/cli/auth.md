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

The CLI supports multiple authentication methods depending on the operation:

### OAuth Client Credentials

Most commands use OAuth client credentials authentication:

```bash
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
```

Required for:
- Code management (`code list`, `code activate`, `code delete`)
- Job operations (`job run`, `job search`, `job import`, `job export`)
- Site operations (`sites list`)
- ODS operations
- SLAS operations
- MRT operations

### Basic Auth (WebDAV)

WebDAV operations support Basic Auth for better performance:

```bash
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-access-key
```

Used by:
- `code deploy` (file upload)
- `code watch` (file upload)
- `webdav` commands

### Mixed Authentication

Some commands (like `code deploy`) require both OAuth and WebDAV access. You can provide both:

```bash
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
export SFCC_USERNAME=my-user
export SFCC_PASSWORD=my-access-key
b2c code deploy --reload
```

### Configuration File

Credentials can also be stored in a `dw.json` file:

```json
{
  "client-id": "my-client",
  "client-secret": "my-secret",
  "username": "my-user",
  "password": "my-access-key"
}
```

Use `--config` to specify a custom config file path, or `--instance` to select a named instance configuration.
