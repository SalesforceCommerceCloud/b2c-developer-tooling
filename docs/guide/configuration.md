---
description: Configure the B2C CLI with environment variables, dw.json files, and multi-instance setups for different environments.
---

# Configuration

The B2C CLI automatically detects and uses available credentials. You can provide credentials via CLI flags, environment variables, or configuration files.

::: tip
For detailed setup instructions including Account Manager API client creation, role configuration, and OCAPI setup, see the [Authentication Setup](./authentication) guide.
:::

## CLI Flags

### OAuth (SCAPI/OCAPI)

OAuth is required for API operations (code list/activate/delete, jobs, sites, SCAPI commands, SLAS, ODS) and can also be used for WebDAV file operations when basic auth credentials are not provided.

#### Client Credentials (Recommended)

OAuth client credentials is the recommended method for production and CI/CD use:

```bash
b2c code deploy \
  --server abcd-123.dx.commercecloud.salesforce.com \
  --client-id your-client-id \
  --client-secret your-client-secret
```

#### Implicit Flow

For development without a client secret, use implicit flow which opens a browser for authentication:

```bash
b2c code deploy \
  --server abcd-123.dx.commercecloud.salesforce.com \
  --client-id your-client-id \
  --auth-methods implicit
```

### Basic Authentication (WebDAV)

Basic authentication uses your B2C instance username and access key. This method is only used for WebDAV operations (code deployment, file uploads, log access).

```bash
b2c code deploy \
  --server abcd-123.dx.commercecloud.salesforce.com \
  --username your-username \
  --password your-access-key
```

See [Configure WebDAV File Access](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5) for instructions on setting up your access key.

## Environment Variables

You can configure the CLI using environment variables:

| Variable | Description |
|----------|-------------|
| `SFCC_WORKING_DIRECTORY` | Project working directory |
| `SFCC_CONFIG` | Path to config file (dw.json format) |
| `SFCC_INSTANCE` | Instance name from config file |
| `SFCC_SERVER` | The B2C instance hostname |
| `SFCC_CLIENT_ID` | OAuth client ID |
| `SFCC_CLIENT_SECRET` | OAuth client secret |
| `SFCC_USERNAME` | Basic auth username |
| `SFCC_PASSWORD` | Basic auth password |
| `SFCC_AUTH_METHODS` | Comma-separated list of allowed auth methods |
| `SFCC_OAUTH_SCOPES` | OAuth scopes to request |
| `SFCC_CODE_VERSION` | Code version for deployments |
| `SFCC_CERTIFICATE` | Path to PKCS12 certificate for two-factor auth (mTLS) |
| `SFCC_CERTIFICATE_PASSPHRASE` | Passphrase for the certificate |
| `SFCC_SELFSIGNED` | Allow self-signed server certificates |

## .env File

The CLI automatically loads a `.env` file from the current working directory if present. Use the same `SFCC_*` variable names as environment variables.

```bash
# .env
SFCC_SERVER=abcd-123.dx.commercecloud.salesforce.com
SFCC_CLIENT_ID=your-client-id
SFCC_CLIENT_SECRET=your-client-secret
```

::: warning
Add `.env` to your `.gitignore` to avoid committing credentials.
:::

## Configuration File

You can create a `dw.json` file to store instance settings. The CLI searches for this file starting from the current directory and walking up the directory tree.

### Single Instance

```json
{
  "hostname": "abcd-123.dx.commercecloud.salesforce.com",
  "code-version": "version1",
  "client-id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "client-secret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "username": "your-username",
  "password": "your-access-key"
}
```

### Multiple Instances

For projects that work with multiple instances, use the `configs` array:

```json
{
  "configs": [
    {
      "name": "dev",
      "active": true,
      "hostname": "abcd-001.dx.commercecloud.salesforce.com",
      "code-version": "version1",
      "client-id": "dev-client-id",
      "username": "dev-username",
      "password": "dev-access-key"
    },
    {
      "name": "staging",
      "hostname": "abcd-002.dx.commercecloud.salesforce.com",
      "code-version": "version1",
      "client-id": "staging-client-id",
      "username": "staging-username",
      "password": "staging-access-key"
    }
  ]
}
```

Use the `-i` or `--instance` flag to select a specific configuration:

```bash
b2c code deploy -i staging
```

If no instance is specified, the config with `"active": true` is used.

### Supported Fields

| Field | Description |
|-------|-------------|
| `hostname` | B2C instance hostname |
| `webdav-hostname` | Separate hostname for WebDAV (if different from main hostname). Also accepts `webdav-server`, `secureHostname`, or `secure-server`. |
| `code-version` | Code version for deployments |
| `client-id` | OAuth client ID |
| `client-secret` | OAuth client secret |
| `username` | Basic auth username (WebDAV) |
| `password` | Basic auth access key (WebDAV) |
| `oauth-scopes` | OAuth scopes (array of strings) |
| `auth-methods` | Authentication methods in priority order (array of strings) |
| `shortCode` | SCAPI short code. Also accepts `short-code` or `scapi-shortcode`. |
| `certificate` | Path to PKCS12 certificate for two-factor auth (mTLS) |
| `certificate-passphrase` | Passphrase for the certificate. Also accepts `passphrase`. |
| `self-signed` | Allow self-signed server certificates. Also accepts `selfsigned`. |

### Two-Factor Authentication (mTLS)

For instances that require client certificate authentication:

```json
{
  "hostname": "cert.staging.example.demandware.net",
  "code-version": "version1",
  "username": "your-username",
  "password": "your-access-key",
  "certificate": "/path/to/client-cert.p12",
  "certificate-passphrase": "cert-password",
  "self-signed": true
}
```

The certificate must be in PKCS12 format (`.p12` or `.pfx`). The `self-signed` option is often needed for staging environments with internal certificates.

::: tip MRT Configuration
Managed Runtime API key is not stored in `dw.json`. It is loaded from `~/.mobify`. You can specify `mrtProject` and `mrtEnvironment` in `dw.json` for project/environment selection.
:::

For multi-instance configurations, each config object also supports:

| Field | Description |
|-------|-------------|
| `name` | Instance name for selection with `-i`/`--instance` |
| `active` | Set to `true` to use this config by default |

## Project Configuration (package.json)

You can store project-level defaults in your `package.json` file under the `b2c` key. This is useful for settings that are shared across your entire project and safe to commit to version control.

```json
{
  "name": "my-storefront",
  "version": "1.0.0",
  "b2c": {
    "shortCode": "abc123",
    "clientId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "mrtProject": "my-project",
    "accountManagerHost": "account.demandware.com"
  }
}
```

### Allowed Fields

Only non-sensitive, project-level fields can be configured in `package.json`:

| Field | Description |
|-------|-------------|
| `shortCode` | SCAPI short code |
| `clientId` | OAuth client ID (for implicit login discovery) |
| `mrtProject` | MRT project slug |
| `mrtOrigin` | MRT API origin URL override |
| `accountManagerHost` | Account Manager hostname for OAuth |

::: warning Security Note
Sensitive fields like `hostname`, `password`, `clientSecret`, `username`, and `mrtApiKey` are intentionally **not** supported in `package.json`. These should be configured via `dw.json` (which should be in `.gitignore`), environment variables, or secure credential stores.
:::

::: tip Lowest Priority
`package.json` has the lowest priority of all configuration sources. Values from `dw.json`, environment variables, or CLI flags will always override `package.json` settings. This makes it ideal for project defaults that can be overridden per-environment.
:::

### Resolution Priority

Configuration is resolved with the following precedence (highest to lowest):

1. **CLI flags and environment variables** - Explicit values always take priority (includes `.env` file)
2. **Plugin sources (high priority)** - Custom sources with `priority: 'before'` (or priority < 0)
3. **dw.json** - Project configuration file (priority 0)
4. **~/.mobify** - Home directory file for MRT API key (priority 0)
5. **Plugin sources (low priority)** - Custom sources with `priority: 'after'` (or priority 1-999)
6. **package.json** - Project-level defaults (priority 1000, lowest)

::: tip Extending Configuration
Plugins can add custom configuration sources like secret managers or environment-specific files. Plugins can use numeric priorities for fine-grained control over ordering. See [Extending the CLI](./extending) for details.
:::

### Credential Grouping

To prevent mixing credentials from different sources, certain fields are treated as atomic groups:

- **OAuth**: `clientId` and `clientSecret`
- **Basic Auth**: `username` and `password`

If any field in a group is set by a higher-priority source, all fields in that group from lower-priority sources are ignored. This ensures credential pairs always come from the same source.

**Example:**
- dw.json provides `clientId` only
- A plugin provides `clientSecret`
- Result: Only `clientId` is used; the plugin's `clientSecret` is ignored to prevent mismatched credentials

::: warning Hostname Mismatch Protection
When you explicitly specify a hostname that differs from the `dw.json` hostname, the CLI ignores all other values from `dw.json` and only uses your explicit overrides. This prevents accidentally using credentials from one instance with a different server.
:::

## MRT API Key

Managed Runtime (MRT) commands use an API key for authentication. The API key is resolved in this order:

1. `--api-key` flag
2. `SFCC_MRT_API_KEY` environment variable
3. `~/.mobify` config file

The `~/.mobify` file format:

```json
{
  "api_key": "your-mrt-api-key"
}
```

When using the `--cloud-origin` flag to specify a different MRT endpoint, the CLI looks for `~/.mobify--{hostname}` instead. For example, `--cloud-origin https://custom.example.com` loads from `~/.mobify--custom.example.com`.

## Overriding Authentication Behavior

By default, the CLI automatically detects available credentials and tries authentication methods in this order: `client-credentials`, then `implicit`. You can override this behavior to control which methods are used.

### Available Auth Methods

- `client-credentials` - OAuth 2.0 client credentials flow (requires client ID and secret). Used for SCAPI/OCAPI and WebDAV.
- `implicit` - OAuth 2.0 implicit flow (requires client ID only, opens browser for login). Used for SCAPI/OCAPI and WebDAV.
- `basic` - Basic authentication with username and access key. Used for WebDAV operations only.
- `api-key` - API key authentication. Used for MRT commands only.

### Specifying Auth Methods

You can specify allowed auth methods in priority order using comma-separated values or multiple flags:

```bash
# Comma-separated (preferred)
b2c code deploy --auth-methods client-credentials,implicit

# Multiple flags (also supported)
b2c code deploy --auth-methods client-credentials --auth-methods implicit

# Via environment variable
SFCC_AUTH_METHODS=client-credentials,implicit b2c code deploy
```

The CLI will try each method in order until one succeeds.

## Debugging Configuration

Use `b2c setup config` to view the resolved configuration and see which source provided each value:

```bash
# Display resolved configuration (sensitive values masked)
b2c setup config

# Show actual sensitive values
b2c setup config --unmask

# Output as JSON
b2c setup config --json
```

This command helps troubleshoot issues like:
- Verifying which configuration file is being used
- Checking if environment variables are being read
- Understanding credential source priority
- Identifying hostname mismatch protection triggers

See [setup config](/cli/setup#b2c-setup-config) for full documentation.

## Next Steps

- [CLI Reference](/cli/) - Browse available commands
- [API Reference](/api/) - Explore the SDK API
