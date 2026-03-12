---
description: Configure the B2C DX MCP Server with credentials, flags, environment variables, and toolset selection.
---

# Configuration

The B2C DX MCP Server uses the same configuration system as the B2C CLI. For MCP, environment variables are set in your MCP client's JSON config (`env` object), not as system environment variables. See the [CLI Configuration guide](../guide/configuration) and [Authentication Setup guide](../guide/authentication) for credential formats and setup details.

## Configuration Priority

Credentials are resolved in the following priority order (same as the CLI):

1. **Flags** (highest priority)
2. **Environment variables**
3. **Config files** (lowest priority)

## Credential Sources

### Option 1: Config Files (Recommended)

Config files are the recommended approach for managing credentials. They keep credentials out of your MCP client configuration and are automatically loaded from your project.

#### B2C Credentials (`dw.json`)

Create a [`dw.json`](../guide/configuration#configuration-file) file in your project root. The MCP server uses the same format as the CLI. See the [CLI Configuration guide](../guide/configuration#configuration-file) for the complete `dw.json` format, supported fields, and multi-instance configuration.

**Example minimal configuration:**

```json
{
  "hostname": "xxx.demandware.net",
  "username": "...",
  "password": "...",
  "client-id": "...",
  "client-secret": "...",
  "short-code": "...",
  "tenant-id": "..."
}
```

The server automatically loads this file when using project-level configuration (recommended). With user-level Cursor configuration, ensure `--project-directory "${workspaceFolder}"` is included in the args array. Claude Code and GitHub Copilot automatically detect the project location.

**Required fields per toolset:**

| Toolset | Required Fields |
|---------|----------------|
| **SCAPI** | `short-code`, `tenant-id`, `client-id`, `client-secret` |
| **CARTRIDGES** | `hostname`, `username`, `password` (or OAuth: `hostname`, `client-id`, `client-secret`) |
| **MRT** | `project`, MRT API key (from `~/.mobify` or `--api-key`) |
| **PWAV3** | None (project directory auto-detected with project-level installation) |
| **STOREFRONTNEXT** | None (project directory auto-detected with project-level installation) |

**Note:** Some tools require specific scopes. See [Configuring Scopes](../guide/authentication#configuring-scopes) in the Authentication Setup guide and individual tool pages for scope requirements.

#### MRT Credentials (`~/.mobify`)

MRT tools require an API key for authentication. Unlike B2C credentials (which use `dw.json`), MRT API keys are stored in a separate [`~/.mobify`](../guide/configuration#mrt-api-key) file in your home directory.

**File location:** `~/.mobify` (or `~/.mobify--{hostname}` when using `--cloud-origin`)

Create the `~/.mobify` file manually:

```json
{
  "api_key": "your-mrt-api-key"
}
```

**What goes where:**
- **`dw.json`** - Can include `mrtProject` and `mrtEnvironment` (project-level config)
- **`~/.mobify`** - Stores the MRT API key (user-level, shared across projects)
- **Environment variables** - Can override both (see [Option 2: Environment Variables](#option-2-environment-variables))
- **Flags** - Highest priority overrides (see [Option 3: Flags](#option-3-flags))

**Cloud origin override:** When using `--cloud-origin` (or `MRT_CLOUD_ORIGIN` environment variable) to target a different MRT endpoint, the server looks for `~/.mobify--{hostname}` instead of `~/.mobify`, where `{hostname}` is extracted from the URL. This allows separate API keys for different MRT environments.

**Example:** With `--cloud-origin https://custom.example.com`, the config file `~/.mobify--custom.example.com` is used instead of `~/.mobify`.

For complete setup instructions, including how to get your API key, see the [Authentication Guide](../guide/authentication#managed-runtime-api-key).

### Option 2: Environment Variables

Set environment variables in the `env` object of your MCP client configuration. The MCP server supports the same environment variables as the CLI. See the [CLI Configuration guide](../guide/configuration#environment-variables) for the complete list of supported variables.

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--allow-non-ga-tools"],
      "env": {
        "SFCC_SERVER": "xxx.demandware.net",
        "SFCC_CLIENT_ID": "...",
        "SFCC_CLIENT_SECRET": "...",
        "SFCC_SHORTCODE": "...",
        "SFCC_TENANT_ID": "...",
        "MRT_API_KEY": "..."
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

> **Note:** Flags and environment variables in your MCP client configuration are less secure than config files (`dw.json`), especially if your MCP client configuration is shared or committed to version control. Use `dw.json` (which can be gitignored) for sensitive credentials.

See the [CLI Configuration guide](../guide/configuration#cli-flags) for complete flag and environment variable documentation.

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
    "--tools",
    "cartridge_deploy,scapi_schemas_list",
    "--allow-non-ga-tools"
  ]
}
```

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

## Telemetry

Telemetry is enabled by default and collects anonymous usage data to help improve the developer experience.

### What We Collect

- **Server lifecycle events**: When the server starts, stops, or encounters errors
- **Tool usage**: Which tools are called and their execution time (not the arguments or results)
- **Command metrics**: Command duration and success/failure status
- **Environment info**: Platform, architecture, Node.js version, and package version

### What We Don't Collect

- **No credentials**: No API keys, passwords, or secrets
- **No business data**: No product data, customer information, or site content
- **No tool arguments**: No input parameters or output results from tool calls
- **No file contents**: No source code, configuration files, or project data

To disable telemetry, set `SFCC_DISABLE_TELEMETRY=true` in your MCP client configuration's `env` object.

## Next Steps

- [Installation](./installation) - Set up the MCP server
- [CLI Configuration](../guide/configuration) - Learn about `dw.json`, environment variables, and credential resolution
- [Authentication Setup](../guide/authentication) - Set up API clients, WebDAV access, and MRT API keys
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
