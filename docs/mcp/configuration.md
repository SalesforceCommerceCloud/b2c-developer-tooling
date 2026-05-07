---
description: Configure the B2C DX MCP Server with credentials, flags, environment variables, and toolset selection.
---

# Configuration

The B2C DX MCP Server uses the same configuration system as the B2C CLI.

See the [CLI Configuration guide](../guide/configuration) and [Authentication Setup guide](../guide/authentication) for credential formats and setup details.

## Credentials

### `dw.json` (Recommended) {#dw-json}

Create a [`dw.json`](../guide/configuration#configuration-file) file in your project root. The MCP server uses the same format as the CLI and loads it automatically with project-level installation.

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

With user-level Cursor configuration, add `--project-directory "${workspaceFolder}"` to the args array so the server can find `dw.json`. Claude Code and GitHub Copilot automatically detect the project location.

See the [CLI Configuration guide](../guide/configuration#configuration-file) for the complete `dw.json` format, supported fields, and multi-instance configuration.

**Required fields per toolset:**

| Toolset | Required Fields |
|---------|----------------|
| **SCAPI** | `short-code`, `tenant-id`, `client-id`, `client-secret` |
| **CARTRIDGES** | `hostname`, `username`, `password` (or OAuth: `hostname`, `client-id`, `client-secret`) |
| **MRT** | `mrtProject`, `mrtApiKey` (or `api_key` in `~/.mobify`, or `MRT_API_KEY` env var). `mrtEnvironment` required when deploying. |
| **PWAV3** | None (project directory auto-detected) |
| **STOREFRONTNEXT** | None (project directory auto-detected) |

**Note:** Some tools require specific scopes. See [Configuring Scopes](../guide/authentication#configuring-scopes) in the Authentication Setup guide and individual tool pages for scope requirements.

### `.env` File {#env-file}

As an alternative to `dw.json`, you can place a `.env` file in your project root. The server loads it automatically at startup via Node.js native `process.loadEnvFile()`.

```bash
SFCC_SERVER=xxx.demandware.net
SFCC_CLIENT_ID=...
SFCC_CLIENT_SECRET=...
SFCC_SHORTCODE=...
SFCC_TENANT_ID=...
```

> **Note:** The `.env` file is loaded from the process working directory. Claude Code and GitHub Copilot set cwd to the project root regardless of scope, so `.env` works in all cases. Cursor user-level config (`~/.cursor/mcp.json`) sets cwd to `~`, so `.env` in the project root **will not be found** — use `dw.json` or system environment variables instead. Cursor project-level config (`.cursor/mcp.json`) works as expected.

See the [Environment Variables Reference](#environment-variables-reference) for the complete list of supported variables.

### MRT Credentials (`~/.mobify`) {#mrt-credentials}

MRT tools require an API key. You can include `mrtApiKey`, `mrtProject`, and `mrtEnvironment` in `dw.json` (see [required fields](#dw-json) above), or store the API key in a separate [`~/.mobify`](../guide/configuration#mrt-api-key) file (user-level, shared across projects):

```json
{
  "api_key": "your-mrt-api-key"
}
```

**`~/.mobify` file locations:**
- Default: `~/.mobify`
- With `--cloud-origin`: `~/.mobify--{hostname}` (e.g., `~/.mobify--custom.example.com`)
- With `--credentials-file` (or `MRT_CREDENTIALS_FILE`): uses the specified path

If both `dw.json` and `~/.mobify` contain an API key, `dw.json` takes precedence. For complete setup instructions, see the [Authentication Guide](../guide/authentication#managed-runtime-api-key).

## Configuration Priority

When the same setting is provided in multiple places, the server resolves values in this order:

1. **Flags** (highest) — e.g., `--server`, `--api-key` in the `args` array
2. **Environment variables** — via `.env` file, MCP client `env` object, or system environment
3. **Config files** (lowest) — `dw.json` and `~/.mobify`

In practice, you rarely need flags or env vars in `mcp.json` — `dw.json` and `.env` handle most cases. Flags and the `env` object are available for overrides or CI environments.

## Toolset Selection

### Auto-Discovery (Default)

By default, the server automatically detects your project type and enables relevant toolsets. No configuration needed. See [Project Type Detection](./#project-type-detection) for details.

### Manual Selection

Override auto-discovery with `--toolsets` or `SFCC_TOOLSETS`:

```json
{
  "mcpServers": {
    "b2c-dx-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@salesforce/b2c-dx-mcp@latest",
        "--toolsets",
        "CARTRIDGES,MRT",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

**Available toolsets:** `CARTRIDGES`, `MRT`, `PWAV3`, `SCAPI`, `STOREFRONTNEXT`, `all`

With auto-discovery, the `SCAPI` toolset is always included. When using `--toolsets` or `--tools`, only the specified toolsets/tools are enabled.

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

## Logging

Set logging verbosity with `--log-level` or `SFCC_LOG_LEVEL`:

```json
{
  "args": ["--log-level", "debug"]
}
```

**Available levels:** `trace`, `debug`, `info`, `warn`, `error`, `silent`

The `--debug` flag (or `SFCC_DEBUG`) is a shorthand for `--log-level debug`.

## Telemetry

Telemetry is enabled by default and collects anonymous usage data to help improve the developer experience.

**What we collect:** server lifecycle events, tool usage (which tools and execution time), command metrics, and environment info (platform, Node.js version, package version).

**What we don't collect:** credentials, business data, tool arguments/results, or file contents.

To disable, set either variable in your `.env` file or MCP client `env` object:

| Variable | Description |
|----------|-------------|
| `SFCC_DISABLE_TELEMETRY` | Set to `true` to disable telemetry |
| `SF_DISABLE_TELEMETRY` | Set to `true` to disable telemetry (sf CLI standard) |

## MCP Server Flags Reference {#mcp-server-flags}

Flags specific to the MCP server (in addition to the shared CLI flags in the [CLI Configuration guide](../guide/configuration)):

| Flag | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `--toolsets` | string | Auto-detect | Toolsets to enable (comma-separated) |
| `--tools` | string | - | Individual tools to enable (comma-separated) |
| `--allow-non-ga-tools` | boolean | `false` | Enable non-GA (experimental) tools |

Environment variable equivalents for these flags are listed in [MCP Server Environment Variables](#mcp-server-environment-variables).

## Environment Variables Reference {#environment-variables-reference}

These can be set in a `.env` file, the MCP client `env` object, or as system environment variables.

### MCP Server Environment Variables {#mcp-server-environment-variables}

MCP-specific environment variables (flag equivalents):

| Env Variable | Equivalent Flag | Type | Default | Description |
| ------------ | --------------- | ---- | ------- | ----------- |
| `SFCC_TOOLSETS` | `--toolsets` | string | Auto-detect | Toolsets to enable (comma-separated) |
| `SFCC_TOOLS` | `--tools` | string | - | Individual tools to enable (comma-separated) |
| `SFCC_ALLOW_NON_GA_TOOLS` | `--allow-non-ga-tools` | boolean | `false` | Enable non-GA (experimental) tools |

**B2C instance:**

| Variable | Description |
|----------|-------------|
| `SFCC_SERVER` | B2C instance hostname |
| `SFCC_CODE_VERSION` | Code version for deployments |
| `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
| `SFCC_PASSWORD` | Password/access key for Basic auth |
| `SFCC_CLIENT_ID` | OAuth client ID (`SFCC_OAUTH_CLIENT_ID` also supported) |
| `SFCC_CLIENT_SECRET` | OAuth client secret (`SFCC_OAUTH_CLIENT_SECRET` also supported) |
| `SFCC_SHORTCODE` | SCAPI short code |
| `SFCC_TENANT_ID` | Organization/tenant ID |

**MRT:**

| Variable | Description |
|----------|-------------|
| `MRT_API_KEY` | MRT API key (`SFCC_MRT_API_KEY` also supported) |
| `MRT_PROJECT` | MRT project slug (`SFCC_MRT_PROJECT` also supported) |
| `MRT_ENVIRONMENT` | Target environment (`SFCC_MRT_ENVIRONMENT` also supported) |
| `MRT_CLOUD_ORIGIN` | MRT API origin URL (`SFCC_MRT_CLOUD_ORIGIN` also supported) |
| `MRT_CREDENTIALS_FILE` | Path to MRT credentials file (overrides `~/.mobify`) |

**General:**

| Variable | Description |
|----------|-------------|
| `SFCC_PROJECT_DIRECTORY` | Project directory (`SFCC_WORKING_DIRECTORY` also supported) |
| `SFCC_CONFIG` | Path to config file |
| `SFCC_INSTANCE` | Instance name from configuration file |
| `SFCC_LOG_LEVEL` | Logging level |
| `SFCC_DEBUG` | Enable debug logging |

See the [CLI Configuration guide](../guide/configuration#environment-variables) for the complete list including OAuth and advanced options.

## Next Steps

- [Installation](./installation) - Set up the MCP server
- [CLI Configuration](../guide/configuration) - Learn about `dw.json`, environment variables, and credential resolution
- [Authentication Setup](../guide/authentication) - Set up API clients, WebDAV access, and MRT API keys
- [Toolsets & Tools](./toolsets) - Explore available toolsets and tools
- [MCP Server Overview](./) - Learn more about the MCP server
