# Configuration

The B2C CLI automatically detects and uses available credentials. You can provide credentials via CLI flags, environment variables, or configuration files.

::: tip
For detailed setup instructions including Account Manager API client creation and OCAPI configuration, see the [Authentication Setup](./authentication) guide.
:::

## CLI Flags

### OAuth (SCAPI/OCAPI)

OAuth is required for SCAPI and OCAPI operations (jobs, sites, SLAS, etc.) and can also be used for WebDAV operations when basic auth credentials are not provided.

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
| `webdav-hostname` | Separate hostname for WebDAV (if different from main hostname). Also accepts `secureHostname` or `secure-server`. |
| `code-version` | Code version for deployments |
| `client-id` | OAuth client ID |
| `client-secret` | OAuth client secret |
| `username` | Basic auth username (WebDAV) |
| `password` | Basic auth access key (WebDAV) |
| `oauth-scopes` | OAuth scopes (array of strings) |
| `auth-methods` | Authentication methods in priority order (array of strings) |
| `shortCode` | SCAPI short code. Also accepts `short-code` or `scapi-shortcode`. |

::: tip MRT Configuration
Managed Runtime API key is not stored in `dw.json`. It is loaded from `~/.mobify`. You can specify `mrtProject` and `mrtEnvironment` in `dw.json` for project/environment selection.
:::

For multi-instance configurations, each config object also supports:

| Field | Description |
|-------|-------------|
| `name` | Instance name for selection with `-i`/`--instance` |
| `active` | Set to `true` to use this config by default |

### Resolution Priority

Configuration is resolved with the following precedence (highest to lowest):

1. **CLI flags and environment variables** - Explicit values always take priority
2. **Plugin sources (high priority)** - Custom sources with `priority: 'before'`
3. **dw.json** - Project configuration file
4. **~/.mobify** - Home directory file (for MRT API key only)
5. **Plugin sources (low priority)** - Custom sources with `priority: 'after'`

::: tip Extending Configuration
Plugins can add custom configuration sources like secret managers or environment-specific files. See [Extending the CLI](./extending) for details.
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

## Next Steps

- [CLI Reference](/cli/) - Browse available commands
- [API Reference](/api/) - Explore the SDK API
