---
description: Configure the B2C DX MCP Server with credentials, flags, environment variables, and toolset selection.
---

# Configuration

The B2C DX MCP Server supports multiple configuration methods for credentials, flags, and toolset selection.

## Configuration Priority

Credentials are resolved in the following priority order:

1. **Flags** (highest priority)
2. **Environment variables**
3. **Config files** (lowest priority)

## Credential Sources

### Option 1: Config Files (Recommended)

Config files are the recommended approach for managing credentials. They keep credentials out of your MCP client configuration and are automatically loaded from your project.

#### B2C Credentials (`dw.json`)

Create a [`dw.json`](../guide/configuration#configuration-file) file in your project root:

```json
{
  "hostname": "xxx.demandware.net",
  "username": "...",
  "password": "...",
  "client-id": "...",
  "client-secret": "..."
}
```

The server automatically loads this file when `--working-directory` points to your project.

**Required fields per toolset:**

| Toolset | Required Fields |
|---------|----------------|
| **SCAPI** | `hostname`, `client-id`, `client-secret` |
| **CARTRIDGES** | `hostname`, `username`, `password` (or OAuth) |
| **MRT** | (loaded from `~/.mobify`) |
| **PWAV3** | None (uses `--working-directory` only) |
| **STOREFRONTNEXT** | None (uses `--working-directory` only) |

**Note:** Some tools require specific scopes. See [Configuring Scopes](../guide/authentication#configuring-scopes) in the Authentication Setup guide and individual tool pages for scope requirements.

#### MRT Credentials (`~/.mobify`)

Create a [`~/.mobify`](../guide/configuration#mobify-config-file) file in your home directory:

```json
{
  "api_key": "..."
}
```

You can also create this file using the [B2C CLI](../cli/mrt#b2c-mrt-config-set):

```bash
b2c mrt config set --api-key YOUR_API_KEY
```

### Option 2: Environment Variables

Set environment variables in your MCP client configuration:

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--working-directory", "${workspaceFolder}", "--allow-non-ga-tools"],
      "env": {
        "SFCC_SERVER": "xxx.demandware.net",
        "SFCC_USERNAME": "...",
        "SFCC_PASSWORD": "...",
        "SFCC_CLIENT_ID": "...",
        "SFCC_CLIENT_SECRET": "...",
        "SFCC_MRT_API_KEY": "..."
      }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--working-directory", "/path/to/project", "--allow-non-ga-tools"],
      "env": {
        "SFCC_SERVER": "xxx.demandware.net",
        "SFCC_USERNAME": "...",
        "SFCC_PASSWORD": "..."
      }
    }
  }
}
```

### Option 3: Flags

Pass credentials directly as command-line flags:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--working-directory",
        "${workspaceFolder}",
        "--server",
        "xxx.demandware.net",
        "--username",
        "...",
        "--password",
        "...",
        "--client-id",
        "...",
        "--client-secret",
        "...",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

> **Note:** Flags are less secure than config files or environment variables, especially if your MCP client configuration is shared or committed to version control.

## Flag Reference

### Core Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--working-directory` | `SFCC_WORKING_DIRECTORY` | Project directory (enables auto-discovery and config loading) |
| `--toolsets` | — | Comma-separated toolsets to enable |
| `--tools` | — | Comma-separated individual tools to enable |
| `--allow-non-ga-tools` | — | Enable experimental (non-GA) tools |
| `--config` | — | Explicit path to `dw.json` (advanced) |
| `--log-level` | — | Logging verbosity (trace, debug, info, warn, error, silent) |
| `--debug` | — | Enable debug logging |

### B2C Instance Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--server` | `SFCC_SERVER` | B2C instance hostname |
| `--username` | `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
| `--password` | `SFCC_PASSWORD` | Password/access key for Basic auth |
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |
| `--code-version` | `SFCC_CODE_VERSION` | Code version for deployments |

### MRT Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--api-key` | `SFCC_MRT_API_KEY` | MRT API key |
| `--project` | `SFCC_MRT_PROJECT` | MRT project slug |
| `--environment` | `SFCC_MRT_ENVIRONMENT` | MRT environment (staging, production) |
| `--cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL |

## Toolset Selection

### Auto-Discovery (Default)

By default, the server automatically detects your project type and enables relevant toolsets. See [Project Type Detection](./installation#project-type-detection) for details.

### Manual Selection

Override auto-discovery by specifying toolsets explicitly:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--working-directory",
        "${workspaceFolder}",
        "--toolsets",
        "CARTRIDGES,MRT",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

**Available toolsets:**
- `CARTRIDGES` - Cartridge deployment and code version management
- `MRT` - Managed Runtime bundle operations
- `PWAV3` - PWA Kit v3 development tools
- `SCAPI` - Salesforce Commerce API discovery
- `STOREFRONTNEXT` - Storefront Next development tools
- `all` - Enable all toolsets

**Note:** The `SCAPI` toolset is always enabled, even if not explicitly specified.

### Individual Tool Selection

Enable specific tools instead of entire toolsets:

```json
{
  "args": [
    "--working-directory",
    "${workspaceFolder}",
    "--tools",
    "cartridge_deploy,scapi_schemas_list",
    "--allow-non-ga-tools"
  ]
}
```

## Credential Details

For authentication setup instructions, see the [Authentication Setup guide](../guide/authentication) which covers API client creation, WebDAV access, SCAPI authentication, and MRT API keys.

### B2C Credentials

#### Username/Password (WebDAV)

- `username` - Your B2C Commerce username
- `password` - Your [WebDAV access key](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5)

**Used by:** CARTRIDGES toolset

See the [Authentication Setup guide](../guide/authentication#webdav-access) for detailed WebDAV access configuration.

#### OAuth Client Credentials

- `client-id` - API client ID from Account Manager
- `client-secret` - API client secret from Account Manager

**Used by:** SCAPI toolset

**Note:** Some tools require specific scopes. See [Configuring Scopes](../guide/authentication#configuring-scopes) in the Authentication Setup guide and individual tool pages for scope requirements.

See the [Authentication Setup guide](../guide/authentication#account-manager-api-client) for creating and configuring API clients, and [SCAPI Authentication](../guide/authentication#scapi-authentication) for SCAPI-specific setup.

### MRT Credentials

- `api-key` - MRT API key from your Managed Runtime project
- `project` - MRT project slug (required)
- `environment` - MRT environment: `staging` or `production` (required when deploying)

**Used by:** MRT toolset

**Configuration location:** `~/.mobify` file

See the [Authentication Setup guide](../guide/authentication#managed-runtime-api-key) for detailed MRT API key setup instructions.

## Telemetry Configuration

Telemetry is enabled by default. Configure it via environment variables:

### Disable Telemetry

```json
{
  "env": {
    "SF_DISABLE_TELEMETRY": "true"
  }
}
```

Or:

```json
{
  "env": {
    "SFCC_DISABLE_TELEMETRY": "true"
  }
}
```

### Custom Telemetry Endpoint

```json
{
  "env": {
    "SFCC_APP_INSIGHTS_KEY": "your-key"
  }
}
```

**Note:** Telemetry is automatically disabled when using `bin/dev.js` (development mode).

## Logging Configuration

### Log Level

Set logging verbosity:

```json
{
  "args": [
    "--log-level",
    "debug"
  ]
}
```

**Available levels:** `trace`, `debug`, `info`, `warn`, `error`, `silent`

### Debug Mode

Enable debug logging (equivalent to `--log-level debug`):

```json
{
  "args": [
    "--debug"
  ]
}
```

## Examples

### Minimal Configuration (Auto-Discovery)

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--working-directory",
        "${workspaceFolder}",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

Requires `dw.json` in project root for B2C credentials.

### Full Configuration with Environment Variables

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--working-directory",
        "${workspaceFolder}",
        "--allow-non-ga-tools"
      ],
      "env": {
        "SFCC_SERVER": "xxx.demandware.net",
        "SFCC_CLIENT_ID": "...",
        "SFCC_CLIENT_SECRET": "...",
        "SFCC_MRT_API_KEY": "..."
      }
    }
  }
}
```

### Manual Toolset Selection

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp",
        "--working-directory",
        "${workspaceFolder}",
        "--toolsets",
        "CARTRIDGES,SCAPI",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

## Next Steps

- [Installation](./installation) - Set up the MCP server
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
