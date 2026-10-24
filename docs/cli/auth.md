---
description: Sign in and out of Account Manager, check who you're signed in as, and get access tokens for scripts.
---

# Auth Commands

Sign in and out of Account Manager, check who you're signed in as, and get access tokens for scripts.

## b2c auth login

Sign in with your Account Manager account in the browser and stay signed in. Later commands reuse the sign-in until you run `b2c auth logout`. Running `auth login` again renews it.

### Usage

```bash
b2c auth login [--client-id <id>]
```

Pass the client ID with `--client-id` or as the `CLIENTID` argument. When omitted, the configured client ID (`SFCC_CLIENT_ID` or `dw.json`) is used. With no client configured, you sign in with the CLI's built-in client, the same sign-in that file, log, sandbox, and Account Manager commands use, so they won't ask again.

```bash
# Sign in with your Account Manager account
b2c auth login

# With your own API client
b2c auth login --client-id your-client-id

# Deprecated implicit flow, for clients not yet migrated
b2c auth login --client-id your-client-id --auth-methods implicit
```

Commands that have a client secret, JWT, or access key configured don't need a sign-in.

::: info When the saved sign-in isn't used
A command skips the saved sign-in, with a warning, when you pass `--client-secret`, `--user-auth`, or `--auth-methods`, or when the saved sign-in has expired. `--client-id` alone doesn't skip it when it matches the signed-in client.
:::

To sign in with your own API client, register it as described in [Redirect URLs](/guide/authentication#redirect-urls). If you see a deprecation warning about the implicit flow, see [Implicit Flow Deprecation](/guide/authentication#implicit-flow-deprecation).

### Flags

| Flag                     | Environment Variable        | Description                                                          |
| ------------------------ | --------------------------- | -------------------------------------------------------------------- |
| `--client-id`            | `SFCC_CLIENT_ID`            | Client ID (default: the configured client, then the built-in client) |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname                                             |
| `--auth-scope`           | `SFCC_OAUTH_SCOPES`         | OAuth scopes to request (can be repeated)                            |
| `--auth-methods`         | `SFCC_AUTH_METHODS`         | `user` (default) or `implicit` (deprecated)                          |

## b2c auth logout

Sign out of Account Manager and clear all saved sign-ins. Commands that need Account Manager ask you to sign in again; commands with a configured client secret, JWT, or access key keep working.

```bash
b2c auth logout
```

## b2c auth status

Show who you're signed in as and how the configured instance authenticates.

```bash
# Sessions, plus how the configured instance authenticates
b2c auth status

# For a specific instance
b2c auth status --server my-sandbox.example.com

# As JSON
b2c auth status --json
```

When an instance is configured, the command shows how file and API requests to it authenticate and whether you're signed in, followed by your saved sign-ins. One sign-in can work for several instances. Sign out with [`b2c auth logout`](#b2c-auth-logout).

## b2c auth client

Get a token with a client ID and secret (or a user's password) and save it for later commands. It's mainly for scripts migrated from `sfcc-ci client:auth`; see [Migrating from sfcc-ci](/guide/sfcc-ci-migration). You don't need it for CI/CD, because commands with a configured client secret get their own tokens.

The secret is not stored, and the saved token doesn't renew: when it expires, run the command again.

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

| Flag                     | Environment Variable        | Description                                          |
| ------------------------ | --------------------------- | ---------------------------------------------------- |
| `--client-id`            | `SFCC_CLIENT_ID`            | Client ID (required)                                 |
| `--client-secret`        | `SFCC_CLIENT_SECRET`        | Client secret (required)                             |
| `--grant-type` / `-t`    |                             | Force grant type: `client_credentials` or `password` |
| `--user`                 | `SFCC_OAUTH_USER_NAME`      | Username for password grant                          |
| `--user-password`        | `SFCC_OAUTH_USER_PASSWORD`  | Password for password grant                          |
| `--auth-scope`           | `SFCC_OAUTH_SCOPES`         | OAuth scopes to request                              |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname                             |

### Grant type auto-detection

If `--grant-type` is not specified:

- **client_credentials** is used when only `--client-id` and `--client-secret` are provided
- **password** is used when `--user` and `--user-password` are also provided

### Examples

```bash
# Authenticate with client credentials from the environment
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

| Flag                     | Environment Variable        | Description                                                                                                                                                             |
| ------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--client-id`            | `SFCC_CLIENT_ID`            | Client ID for OAuth                                                                                                                                                     |
| `--client-secret`        | `SFCC_CLIENT_SECRET`        | Client Secret for OAuth                                                                                                                                                 |
| `--auth-scope`           | `SFCC_OAUTH_SCOPES`         | OAuth scopes to request (can be repeated)                                                                                                                               |
| `--client-auth-method`   | `SFCC_CLIENT_AUTH_METHOD`   | How client credentials are sent: `basic` (default), `basic-unencoded`, or `body`. See [client authentication method](/guide/configuration#client-authentication-method) |
| `--account-manager-host` | `SFCC_ACCOUNT_MANAGER_HOST` | Account Manager hostname (default: account.demandware.com)                                                                                                              |
| `--short-code`           | `SFCC_SHORTCODE`            | SCAPI short code                                                                                                                                                        |
| `--tenant-id`            | `SFCC_TENANT_ID`            | Organization/tenant ID                                                                                                                                                  |
| `--auth-methods`         | `SFCC_AUTH_METHODS`         | Allowed auth methods in priority order (comma-separated): client-credentials, jwt, user, implicit, basic, api-key                                                       |
| `--user-auth`            |                             | Sign in with your Account Manager account in the browser                                                                                                                |
| `--jwt-cert`             | `SFCC_JWT_CERT`             | Path to JWT certificate file (cert.pem) for JWT Bearer authentication                                                                                                   |
| `--jwt-key`              | `SFCC_JWT_KEY`              | Path to JWT private key file (key.pem) for JWT Bearer authentication                                                                                                    |
| `--jwt-passphrase`       | `SFCC_JWT_PASSPHRASE`       | Passphrase for encrypted JWT private key                                                                                                                                |

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
{"token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", "expires_in": 1799}
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

For which commands need which credentials, see [Authentication Setup](/guide/authentication#overview). Each command page documents its requirements, including scopes.
