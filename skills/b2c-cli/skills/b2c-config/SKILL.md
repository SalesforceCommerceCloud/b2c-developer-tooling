---
name: b2c-config
description: View and debug b2c CLI configuration and understand where credentials come from. Use when authentication fails, connection errors occur, wrong instance is used, or you need to verify dw.json settings, or OAuth credentials are loaded correctly.
---

# B2C Config Skill

Use the `b2c setup inspect` command to view the resolved configuration and understand where each value comes from. Use the `b2c setup instance` commands to manage named instance configurations.

> **Tip:** `b2c setup config` still works as an alias. If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead (e.g., `npx @salesforce/b2c-cli setup inspect`).

## When to Use

Use `b2c setup inspect` when you need to:

- Verify which configuration file is being used
- Check if environment variables are being read correctly
- Debug authentication failures by confirming credentials are loaded
- Understand credential source priority (dw.json vs env vars vs plugins)
- Identify hostname mismatch protection issues
- Verify MRT API key is loaded from ~/.mobify

Use `b2c setup instance` commands when you need to:

- List all configured instances
- Create a new instance configuration
- Switch between instances (set active)
- Remove an instance configuration

## Inspecting Configuration

### View Current Configuration

```bash
# Display resolved configuration (sensitive values masked by default)
b2c setup inspect

# View configuration for a specific instance from dw.json
b2c setup inspect -i staging

# View configuration with a specific config file
b2c setup inspect --config /path/to/dw.json
```

### Debug Sensitive Values

```bash
# Show actual passwords, secrets, and API keys (use with caution)
b2c setup inspect --unmask
```

### JSON Output for Scripting

```bash
# Output as JSON for parsing in scripts
b2c setup inspect --json

# Pretty-print with jq
b2c setup inspect --json | jq '.config'

# Check which sources are loaded
b2c setup inspect --json | jq '.sources'
```

## IDE Integration (Prophet)

Use `b2c setup ide prophet` to generate a `dw.js` bridge script for the Prophet VS Code extension.

```bash
# Generate ./dw.js in the current project
b2c setup ide prophet

# Overwrite existing file
b2c setup ide prophet --force

# Custom path
b2c setup ide prophet --output .vscode/dw.js
```

The generated script runs `b2c setup inspect --json --unmask` at runtime, so Prophet sees the same resolved config as CLI commands, including configuration plugins. It maps values to `dw.json`-style keys and passes through Prophet fields like `cartridgesPath`, `siteID`, and `storefrontPassword` when present.

## Managing Instances

### List Configured Instances

```bash
# Show all instances from dw.json
b2c setup instance list

# Output as JSON
b2c setup instance list --json
```

### Create a New Instance

```bash
# Interactive mode - prompts for all values
b2c setup instance create staging

# With hostname
b2c setup instance create staging --hostname staging.example.com

# Create and set as active
b2c setup instance create staging --hostname staging.example.com --active

# Non-interactive mode (for scripts)
b2c setup instance create staging \
  --hostname staging.example.com \
  --username admin \
  --password secret \
  --force
```

### Switch Active Instance

```bash
# Set staging as the default instance
b2c setup instance set-active staging

# Now commands use staging by default
b2c code list  # Uses staging
```

### Remove an Instance

```bash
# Remove with confirmation prompt
b2c setup instance remove staging

# Remove without confirmation
b2c setup instance remove staging --force
```

## Understanding the Output

The `setup inspect` command displays configuration organized by category:

- **Instance**: hostname, webdavHostname, codeVersion
- **Authentication (Basic)**: username, password (for WebDAV)
- **Authentication (OAuth)**: clientId, clientSecret, scopes, authMethods
- **TLS/mTLS**: certificate, certificatePassphrase, selfSigned (for two-factor auth)
- **SCAPI**: shortCode
- **Managed Runtime (MRT)**: mrtProject, mrtEnvironment, mrtApiKey
- **Metadata**: instanceName (from multi-instance configs)
- **Sources**: List of all configuration sources that were loaded

Each value shows its source in brackets:

- `[DwJsonSource]` - Value from dw.json file
- `[MobifySource]` - Value from ~/.mobify file
- `[SFCC_*]` - Value from environment variable
- `[password-store]` - Value from a credential plugin

## Configuration Priority

Values are resolved with this priority (highest to lowest):

1. CLI flags and environment variables
2. Plugin sources (high priority)
3. dw.json file
4. ~/.mobify file (MRT API key only)
5. Plugin sources (low priority)
6. package.json b2c key

When troubleshooting, check the source column to understand which configuration is taking precedence.

## Common Issues

### Missing Values

If a value shows `-`, it means no source provided that configuration. Check:

- Is the field spelled correctly in dw.json?
- Is the environment variable set?
- Does the plugin provide that value?

### Wrong Source Taking Precedence

If a value comes from an unexpected source:

- Higher priority sources override lower ones
- Credential groups (username+password, clientId+clientSecret) are atomic
- Hostname mismatch protection may discard values

### Sensitive Values Masked

By default, passwords and secrets show partial values like `admi...REDACTED`. Use `--unmask` to see full values when debugging authentication issues.

## Getting Admin OAuth Tokens

Use `b2c auth token` to get an admin OAuth access token for Account Manager credentials (OCAPI and Admin APIs). This is useful for testing APIs, scripting, or CI/CD pipelines.

```bash
# Get access token (outputs raw token to stdout)
b2c auth token

# Get token with specific scopes
b2c auth token --auth-scope sfcc.orders --auth-scope sfcc.products

# Get token as JSON (includes expiration and scopes)
b2c auth token --json

# Use in curl for OCAPI calls
curl -H "Authorization: Bearer $(b2c auth token)" \
  "https://your-instance.dx.commercecloud.salesforce.com/s/-/dw/data/v24_1/sites"
```

The token is obtained using the `clientId` and `clientSecret` from your configuration (dw.json or environment variables). If only `clientId` is configured, an implicit OAuth flow is used (browser-based).

**Note:** This command returns **admin** tokens for OCAPI/Admin APIs. For **shopper** tokens (SLAS), see the [b2c-slas skill](../b2c-slas/SKILL.md).

## More Commands

See `b2c setup --help` for other setup commands including `b2c setup skills` for AI agent skill installation.
