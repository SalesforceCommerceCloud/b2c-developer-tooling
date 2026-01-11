# Configuration

The B2C CLI supports multiple authentication methods and configuration options.

::: tip
For detailed setup instructions including Account Manager API client creation and OCAPI configuration, see the [Authentication Setup](./authentication) guide.
:::

## Authentication Methods

The CLI supports multiple auth methods that can be specified via the `--auth-methods` flag:

- `client-credentials` - OAuth 2.0 client credentials flow (requires client ID and secret)
- `implicit` - OAuth 2.0 implicit flow (requires client ID only, opens browser for login)
- `basic` - Basic authentication (for WebDAV operations)
- `api-key` - API key authentication

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

The CLI will try each method in order until one succeeds. If no methods are specified, the default is `client-credentials,implicit`.

### OAuth Client Credentials (Recommended)

OAuth authentication using client credentials is the recommended method for production and CI/CD use.

```bash
b2c code deploy \
  --server your-instance.demandware.net \
  --client-id your-client-id \
  --client-secret your-client-secret
```

### OAuth Implicit Flow

For development without a client secret, use implicit flow which opens a browser for authentication:

```bash
b2c code deploy \
  --server your-instance.demandware.net \
  --client-id your-client-id \
  --auth-methods implicit
```

### Basic Authentication

For development and testing, you can use basic authentication with Business Manager credentials:

```bash
b2c code deploy \
  --server your-instance.demandware.net \
  --username your-username \
  --password your-password
```

### API Key

For certain operations, you may use an API key.

## Environment Variables

You can configure authentication using environment variables:

| Variable | Description |
|----------|-------------|
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
  "hostname": "your-instance.demandware.net",
  "code-version": "version1",
  "client-id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "client-secret": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
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
      "hostname": "dev-instance.demandware.net",
      "code-version": "version1",
      "client-id": "dev-client-id"
    },
    {
      "name": "staging",
      "hostname": "staging-instance.demandware.net",
      "code-version": "version1",
      "client-id": "staging-client-id"
    }
  ]
}
```

Use the `--instance` flag to select a specific configuration:

```bash
b2c code deploy --instance staging
```

If no instance is specified, the config with `"active": true` is used.

### Supported Fields

| Field | Description |
|-------|-------------|
| `hostname` | B2C instance hostname |
| `webdav-hostname` | Separate hostname for WebDAV (if different) |
| `code-version` | Code version for deployments |
| `client-id` | OAuth client ID |
| `client-secret` | OAuth client secret |
| `username` | Basic auth username |
| `password` | Basic auth password/access-key |
| `scopes` | OAuth scopes (array or comma-separated string) |
| `auth-methods` | Authentication methods in priority order |
| `account-manager-host` | Custom Account Manager hostname |
| `shortCode` | SCAPI short code |

### Resolution Priority

Configuration is resolved with the following precedence (highest to lowest):

1. **CLI flags and environment variables** - Explicit values always take priority
2. **dw.json** - Project configuration file
3. **~/.mobify** - Home directory file (for MRT API key only)

::: warning Hostname Mismatch Protection
When you explicitly specify a hostname that differs from the `dw.json` hostname, the CLI ignores all other values from `dw.json` and only uses your explicit overrides. This prevents accidentally using credentials from one instance with a different server.
:::

## Next Steps

- [CLI Reference](/cli/) - Browse available commands
- [API Reference](/api/) - Explore the SDK API
