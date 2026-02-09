---
description: Authentication commands for obtaining OAuth tokens and configuring Account Manager API clients, OCAPI, and WebDAV access.
---

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

For complete authentication setup instructions, see the [Authentication Setup Guide](/guide/authentication).

### Quick Reference

| Operation | Auth Required |
|-----------|--------------|
| [Code](/cli/code) deploy/watch | WebDAV credentials |
| [Code](/cli/code) list/activate/delete, [Jobs](/cli/jobs), [Sites](/cli/sites) | OAuth + OCAPI configuration |
| SCAPI commands ([eCDN](/cli/ecdn), [schemas](/cli/scapi-schemas), [custom-apis](/cli/custom-apis)) | OAuth + SCAPI scopes |
| [Sandbox](/cli/sandbox), [SLAS](/cli/slas) | OAuth + appropriate roles |
| [MRT](/cli/mrt) | API Key |

See [Configuration](/guide/configuration) for setting up credentials via environment variables or config files.

::: tip
Each command page below documents its specific authentication requirements including required scopes.
:::
