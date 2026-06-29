---
description: Authentication commands for obtaining OAuth tokens and configuring Account Manager API clients, OCAPI, and WebDAV access.
---

# Auth Commands

Commands for authentication and token management.

## Stateful vs stateless auth

The CLI supports **stateful auth** (session stored on disk) in addition to **stateless auth** (client credentials or one-off browser login):

- **Stateful (browser)**: After you run `b2c auth login`, your access token *and* a long-lived refresh token are stored on disk in the CLI data directory. Subsequent commands silently refresh the access token without re-prompting. If both tokens are missing/expired, the CLI falls back to stateless auth.
- **Stateful (client credentials)**: Use `b2c auth client` to authenticate with client ID and secret (or user/password) for non-interactive/automation use. Only the access token is persisted — the client secret is never stored. When the access token expires, re-run `b2c auth client` with the same credentials. There is no automatic refresh.
- **Stateless**: You provide `--client-id` (and optionally `--client-secret`) per run or via environment/config; no session is persisted.

The stored session is used only when the token is valid and no explicit stateless auth flags are provided. The CLI falls back to stateless auth when the stored token is expired/invalid, or when `--client-secret`, `--user-auth`, or `--auth-methods` are passed on the command line. In both cases a warning is shown explaining why stateful auth was skipped. Note that `--client-id` alone does not force stateless; the stored session is used if the client ID matches. To opt out of stateful auth entirely, run `b2c auth logout` to clear the stored session.

Use **auth:logout** to clear the stored session and return to stateless-only behavior.

## b2c auth login

Log in via browser (Authorization Code + PKCE) and save the session for stateful auth. The access token is silently refreshed via the persisted refresh token; you only see a browser prompt when the refresh token also expires (typically after 24 hours of disuse).

### Usage

```bash
b2c auth login [CLIENTID]
```

`CLIENTID` is an optional positional argument. When omitted, the `SFCC_CLIENT_ID` environment variable is used as a fallback.

```bash
# Using a positional argument
b2c auth login your-client-id

# Using environment variable
export SFCC_CLIENT_ID=your-client-id
b2c auth login
```

### Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (default: account.demandware.com) |
| `--auth-scope` | `SFCC_OAUTH_SCOPES` | OAuth scopes to request (comma-separated or repeated flag) |

After a successful login, subsequent commands use the stored token until it expires or you run `b2c auth logout`.

### Flags

| Flag | Environment Variable | Description |
|------|---------------------|-------------|
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname |
| `--auth-scope` | `SFCC_OAUTH_SCOPES` | OAuth scopes to request (can be repeated) |
| `--auth-methods` | | Browser-based flow to use: `user` (default — Authorization Code + PKCE) or `implicit` (deprecated) |

### Choosing a flow

`auth login` defaults to **Authorization Code + PKCE**, which is the recommended browser flow for public clients. The legacy implicit flow is still selectable for clients that haven't been migrated:

```bash
# Default: Authorization Code + PKCE
b2c auth login your-client-id

# Legacy implicit flow (emits a deprecation warning)
b2c auth login your-client-id --auth-methods implicit
```

OAuth 2.1 deprecates the implicit flow for public clients. Configure your Account Manager API client as a public client and use the default PKCE flow when possible.

## b2c auth logout

Clear the stored OAuth session (stateful auth). After logout, commands use stateless auth when configured.

```bash
b2c auth logout
```

## b2c auth client

Authenticate an API client using client credentials or resource owner password credentials and save the **access token** for stateful auth. The client secret is **never** persisted: when the access token expires, re-run this command with the same credentials. There is no automatic refresh for client_credentials sessions — for refresh-capable user authentication, use `b2c auth login` (PKCE) instead.

This is the non-interactive alternative to `auth login` — ideal for CI/CD pipelines and automation.

### Usage

```bash
# Client credentials grant (client ID + secret)
b2c auth client --client-id <id> --client-secret <secret>

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

# Authenticate with user credentials
b2c auth client --client-id <id> --client-secret <secret> \
  --user admin@example.com --user-password secret123
```

## b2c auth client token

Return the current stored authentication token. Compatible with the [sfcc-ci `client:auth:token`](https://github.com/SalesforceCommerceCloud/sfcc-ci) workflow.

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
| `--short-code` | `SFCC_SHORTCODE` | SCAPI short code |
| `--tenant-id` | `SFCC_TENANT_ID` | Organization/tenant ID |
| `--auth-methods` | `SFCC_AUTH_METHODS` | Allowed auth methods in priority order (comma-separated): client-credentials, jwt, implicit, basic, api-key |
| `--user-auth` | | Use browser-based user authentication (implicit OAuth flow) |
| `--jwt-cert` | `SFCC_JWT_CERT` | Path to JWT certificate file (cert.pem) for JWT Bearer authentication |
| `--jwt-key` | `SFCC_JWT_KEY` | Path to JWT private key file (key.pem) for JWT Bearer authentication |
| `--jwt-passphrase` | `SFCC_JWT_PASSPHRASE` | Passphrase for encrypted JWT private key |

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
