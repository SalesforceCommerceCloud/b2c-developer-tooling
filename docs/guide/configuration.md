# Configuration

The B2C CLI supports multiple authentication methods and configuration options.

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

You can create a configuration file to store instance settings. See the [CLI Reference](/cli/) for more details on configuration file options.

## Next Steps

- [CLI Reference](/cli/) - Browse available commands
- [API Reference](/api/) - Explore the SDK API
