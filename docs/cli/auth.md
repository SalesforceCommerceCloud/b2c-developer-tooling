---
description: Authentication commands for obtaining OAuth tokens and configuring Account Manager API clients, OCAPI, and WebDAV access.
---

# Auth Commands

Commands for authentication and token management.

## Stateful vs stateless auth

The CLI supports **stateful auth** (session stored on disk) in addition to **stateless auth** (client credentials or one-off implicit flow):

- **Stateful (browser)**: After you run `b2c auth login`, your token is stored in the same location as [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci). Subsequent commands (e.g. `b2c auth token`, `b2c am orgs list`) use this token when it is present and valid. If the token is missing or expired, the CLI falls back to stateless auth.
- **Stateful (client credentials)**: Use `b2c auth client` to authenticate with client ID and secret (or user/password) for non-interactive/automation use. Supports auto-renewal with `--renew`.
- **Stateless**: You provide `--client-id` (and optionally `--client-secret`) per run or via environment/config; no session is persisted.

The stored session is used only when the token is valid and no explicit stateless auth flags are provided. The CLI falls back to stateless auth when the stored token is expired/invalid, or when `--client-secret`, `--user-auth`, or `--auth-methods` are passed on the command line. In both cases a warning is shown explaining why stateful auth was skipped. Note that `--client-id` alone does not force stateless; the stored session is used if the client ID matches. To opt out of stateful auth entirely, run `b2c auth logout` to clear the stored session.

Use **auth:logout** to clear the stored session and return to stateless-only behavior.

## b2c auth login

Log in via browser (implicit OAuth) and save the session for stateful auth. Uses the same storage as sfcc-ci.

### Usage

```bash
b2c auth login
b2c auth login --client-id your-client-id
```

After a successful login, subsequent commands use the stored token until it expires or you run `b2c auth logout`.

## b2c auth logout

Clear the stored OAuth session (stateful auth). After logout, commands use stateless auth when configured.

```bash
b2c auth logout
```

## b2c auth client

Authenticate an API client using client credentials or resource owner password credentials and save the session for stateful auth. Mirrors the [sfcc-ci `client:auth`](https://github.com/SalesforceCommerceCloud/sfcc-ci) command.

This is the non-interactive alternative to `auth login` — ideal for CI/CD pipelines and automation.

### Usage

```bash
# Client credentials grant (client ID + secret)
b2c auth client --client-id <id> --client-secret <secret>

# With auto-renewal enabled
b2c auth client --client-id <id> --client-secret <secret> --renew

# Resource owner password credentials grant (+ user credentials)
b2c auth client --client-id <id> --client-secret <secret> --user <email> --user-password <pwd>

# Force a specific grant type
b2c auth client --client-id <id> --client-secret <secret> --grant-type client_credentials
```

### Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--client-id` | `SFCC_CLIENT_ID` | Client ID (required) |
| `--client-secret` | `SFCC_CLIENT_SECRET` | Client secret (required) |
| `--renew` / `-r` | | Enable auto-renewal (stores credentials for `auth client renew`) |
| `--grant-type` / `-t` | | Force grant type: `client_credentials` or `password` |
| `--user` | `SFCC_OAUTH_USER_NAME` | Username for password grant |
| `--user-password` | `SFCC_OAUTH_USER_PASSWORD` | Password for password grant |
| `--auth-scope` | `SFCC_OAUTH_SCOPES` | OAuth scopes to request |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname |

### Grant type auto-detection

If `--grant-type` is not specified:
- **client_credentials** is used when only `--client-id` and `--client-secret` are provided
- **password** is used when `--user` and `--user-password` are also provided

### Examples

```bash
# Authenticate for automation (CI/CD)
export SFCC_CLIENT_ID=my-client
export SFCC_CLIENT_SECRET=my-secret
b2c auth client

# Authenticate with auto-renewal for long-running scripts
b2c auth client --client-id <id> --client-secret <secret> --renew

# Authenticate with user credentials
b2c auth client --client-id <id> --client-secret <secret> \
  --user admin@example.com --user-password secret123
```

## b2c auth client renew

Renew the authentication token using stored credentials. Requires initial authentication with `--renew` flag.

Uses `refresh_token` grant when a refresh token is stored, otherwise falls back to `client_credentials` grant.

### Usage

```bash
b2c auth client renew
```

### Example

```bash
# Initial auth with --renew
b2c auth client --client-id <id> --client-secret <secret> --renew

# Later, renew the token without re-entering credentials
b2c auth client renew
```

## b2c auth client token

Return the current stored authentication token. Mirrors [sfcc-ci `client:auth:token`](https://github.com/SalesforceCommerceCloud/sfcc-ci).

### Usage

```bash
# Raw token to stdout (pipe-friendly)
b2c auth client token

# Full metadata as JSON
b2c auth client token --json
```

### Output

Raw token output (default):

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

JSON output (`--json`):

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "clientId": "my-client-id",
  "expires": "2025-01-27T12:00:00.000Z",
  "scopes": ["mail", "roles"],
  "user": "admin@example.com",
  "renewable": true
}
```

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
| `--auth-scope` | `SFCC_OAUTH_SCOPES` | OAuth scopes to request (can be repeated) |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (default: account.demandware.com) |

### Examples

```bash
# Get a token with default scopes
b2c auth token --client-id xxx --client-secret yyy

# Get a token with specific scopes
b2c auth token --auth-scope sfcc.orders --auth-scope sfcc.products

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
