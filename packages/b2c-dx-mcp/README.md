# Salesforce Commerce Cloud B2C MCP Server

MCP (Model Context Protocol) server for Salesforce B2C Commerce Cloud developer experience tools.

> ⚠️ **Active Development**: This package is under active development. All tools are currently **placeholder implementations** that return mock responses. Tool implementations will be added incrementally.

## Overview

This MCP server enables AI assistants to help with B2C Commerce development tasks. It provides toolsets for **SCAPI**, **CARTRIDGES**, **MRT**, **PWAV3**, and **STOREFRONTNEXT** development.

The server automatically detects your project type and enables relevant tools. See [Available Toolsets and Tools](#available-toolsets-and-tools) for details.

## Usage

### Working Directory and Auto-Discovery

The most important flag is **`--working-directory`** (or env var `SFCC_WORKING_DIRECTORY`). It tells the server where your project is located, enabling:

1. **Auto-discovery** - Detects your project type and enables appropriate toolsets
2. **Configuration loading** - Reads [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) from your project for credentials
3. **Scaffolding** - Creates new files in the correct location

> **Important:** MCP clients like Cursor and Claude Desktop spawn servers from the home directory (`~`), not your project. Always set `--working-directory`.

<!-- TODO: Update command to use npx once published to npm -->

**Cursor** (supports `${workspaceFolder}`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "node",
      "args": ["/path/to/packages/b2c-dx-mcp/bin/dev.js", "--working-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

**Claude Desktop** (use explicit path):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "node",
      "args": ["/path/to/packages/b2c-dx-mcp/bin/dev.js", "--working-directory", "/path/to/your/project", "--allow-non-ga-tools"]
    }
  }
}
```

### Project Type Detection

The server analyzes your working directory and enables toolsets based on what it finds:

| Project Type | Detection | Toolsets Enabled |
|--------------|-----------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` in package.json | PWAV3, MRT, SCAPI |
| **Storefront Next** | `@salesforce/storefront-next-*` in package.json | STOREFRONTNEXT, MRT, SCAPI |
| **Cartridges** | `.project` file in cartridge directory | CARTRIDGES, SCAPI |
| **No project detected** | No B2C markers found | SCAPI (base toolset only) |

The **SCAPI** toolset is always enabled. Hybrid projects (e.g., cartridges + PWA Kit) get combined toolsets.

### Manual Toolset Selection

Override auto-discovery by specifying toolsets explicitly:

```json
"args": ["--working-directory", "${workspaceFolder}", "--toolsets", "CARTRIDGES,MRT", "--allow-non-ga-tools"]
```

### Configuration

Credentials can be provided via **config files** (recommended), **environment variables**, or **flags**. Priority: Flags > Env vars > Config files.

| Toolset | Required Credentials |
|---------|---------------------|
| **SCAPI** | `hostname` + `client-id` + `client-secret` |
| **CARTRIDGES** | `hostname` + `username` + `password` (or OAuth) |
| **MRT** | `api-key` + `project` (optionally `environment`) |
| **PWAV3** | `--working-directory` only (+ MRT config for deployments) |
| **STOREFRONTNEXT** | `--working-directory` only (+ MRT/CARTRIDGES config for those tools) |

**Option 1: Config files (recommended)**

B2C credentials — [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) in your project root:
```json
{ "hostname": "xxx.demandware.net", "username": "...", "password": "...", "client-id": "...", "client-secret": "..." }
```

MRT credentials — [`~/.mobify`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#mobify-config-file) (create manually or via [B2C CLI](https://salesforcecommercecloud.github.io/b2c-developer-tooling/cli/mrt.html)):
```json
{ "api_key": "..." }
```

**Option 2: Environment variables**
```json
"env": { "SFCC_SERVER": "xxx.demandware.net", "SFCC_USERNAME": "...", "SFCC_PASSWORD": "...", "SFCC_MRT_API_KEY": "..." }
```

**Option 3: Flags**
```json
"args": ["--server", "xxx.demandware.net", "--username", "...", "--password", "...", "--api-key", "..."]
```

See [Flag Reference](#flag-reference) for all available flags and env vars.

- `username`/`password` = B2C username + [WebDAV access key](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_sso_use_webdav_file_access.htm&type=5)
- `client-id`/`client-secret` = API client credentials from Account Manager

### Flag Reference

<details>
<summary>Click to expand flag reference</summary>

#### Core Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--working-directory` | `SFCC_WORKING_DIRECTORY` | Project directory (enables auto-discovery and config loading) |
| `--toolsets` | — | Comma-separated toolsets to enable |
| `--tools` | — | Comma-separated individual tools to enable |
| `--allow-non-ga-tools` | — | Enable experimental (non-GA) tools |
| `--config` | — | Explicit path to [`dw.json`](https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/configuration.html#configuration-file) (advanced) |
| `--log-level` | — | Logging verbosity (trace, debug, info, warn, error, silent) |
| `--debug` | — | Enable debug logging |

#### B2C Instance Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--server` | `SFCC_SERVER` | B2C instance hostname |
| `--username` | `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
| `--password` | `SFCC_PASSWORD` | Password/access key for Basic auth |
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |
| `--code-version` | `SFCC_CODE_VERSION` | Code version for deployments |

#### MRT Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--api-key` | `SFCC_MRT_API_KEY` | MRT API key |
| `--project` | `SFCC_MRT_PROJECT` | MRT project slug |
| `--environment` | `SFCC_MRT_ENVIRONMENT` | MRT environment (staging, production) |
| `--cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL |

</details>

### Available Toolsets and Tools

Use `--toolsets all` to enable all toolsets, or select specific ones with `--toolsets CARTRIDGES,MRT`.

> **Note:** All tools are currently placeholder implementations. Use `--allow-non-ga-tools` flag to enable them.

#### CARTRIDGES
Cartridge development, deployment, and code version management.
- **Status:** 🚧 Placeholder

| Tool | Description |
|------|-------------|
| `cartridge_deploy` | Deploy cartridges to a B2C Commerce instance |

#### MRT
Managed Runtime operations for PWA Kit and Storefront Next deployments.
- **Status:** 🚧 Placeholder

| Tool | Description |
|------|-------------|
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

#### PWAV3
PWA Kit v3 development tools for building headless storefronts.
- **Status:** 🚧 Placeholder

| Tool | Description |
|------|-------------|
| `pwakit_create_storefront` | Create a new PWA Kit storefront project |
| `pwakit_create_page` | Create a new page component in PWA Kit project |
| `pwakit_create_component` | Create a new React component in PWA Kit project |
| `pwakit_get_dev_guidelines` | Get PWA Kit development guidelines and best practices |
| `pwakit_recommend_hooks` | Recommend appropriate React hooks for PWA Kit use cases |
| `pwakit_run_site_test` | Run site tests for PWA Kit project |
| `pwakit_install_agent_rules` | Install AI agent rules for PWA Kit development |
| `pwakit_explore_scapi_shop_api` | Explore SCAPI Shop API endpoints and capabilities |
| `scapi_discovery` | Discover available SCAPI endpoints and capabilities |
| `scapi_custom_api_discovery` | Discover custom SCAPI API endpoints |
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

#### SCAPI
Salesforce Commerce API discovery and exploration.
- **Status:** 🚧 Placeholder

| Tool | Description |
|------|-------------|
| `scapi_discovery` | Discover available SCAPI endpoints and capabilities |
| `scapi_customapi_scaffold` | Scaffold a new custom SCAPI API |
| `scapi_custom_api_discovery` | Discover custom SCAPI API endpoints |

#### STOREFRONTNEXT
Storefront Next development tools for building modern storefronts.
- **Status:** 🚧 Placeholder

| Tool | Description |
|------|-------------|
| `sfnext_development_guidelines` | Get Storefront Next development guidelines and best practices |
| `sfnext_site_theming` | Configure and manage site theming for Storefront Next |
| `sfnext_figma_to_component_workflow` | Convert Figma designs to Storefront Next components |
| `sfnext_generate_component` | Generate a new Storefront Next component |
| `sfnext_map_tokens_to_theme` | Map design tokens to Storefront Next theme configuration |
| `sfnext_design_decorator` | Apply design decorators to Storefront Next components |
| `sfnext_generate_page_designer_metadata` | Generate Page Designer metadata for Storefront Next components |
| `scapi_discovery` | Discover available SCAPI endpoints and capabilities |
| `scapi_custom_api_discovery` | Discover custom SCAPI API endpoints |
| `mrt_bundle_push` | Build, push bundle (optionally deploy) |

> **Note:** Some tools appear in multiple toolsets (e.g., `mrt_bundle_push`, `scapi_discovery`). When using multiple toolsets, tools are automatically deduplicated.

## Telemetry

The MCP server collects anonymous usage telemetry to help improve the developer experience. Telemetry is enabled by default.

**Development mode**: Telemetry is automatically disabled when using `bin/dev.js`, so local development and testing won't pollute production data.

### Disabling Telemetry

Set one of these environment variables to disable telemetry:

```bash
# Salesforce CLI standard (recommended)
SF_DISABLE_TELEMETRY=true

# Or SFCC-specific
SFCC_DISABLE_TELEMETRY=true
```

You can also override the telemetry connection string for testing:

```bash
SFCC_APP_INSIGHTS_KEY=your-connection-string
```

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

## Development

### Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Navigate to the package directory
cd packages/b2c-dx-mcp

# Launch MCP Inspector for development (no build needed, uses TypeScript directly)
pnpm run inspect:dev

# Launch MCP Inspector with production build (runs build first)
pnpm run inspect

# Build the package
pnpm run build

# Run tests (includes linting)
pnpm run test

# Format code
pnpm run format

# Run linter only
pnpm run lint

# Clean build artifacts
pnpm run clean
```

### Working Directory

Commands should be run from the `packages/b2c-dx-mcp` directory:

```bash
cd packages/b2c-dx-mcp
```

Or use pnpm's filter flag from the monorepo root:

```bash
pnpm --filter @salesforce/b2c-dx-mcp run <script>
```

### Testing the MCP Server Locally

#### 1. MCP Inspector

Use MCP Inspector to browse tools and test them in a web UI:

```bash
pnpm run inspect:dev
```

This runs TypeScript directly (no build needed). Open the localhost URL shown in the terminal, click **Connect**, then **List Tools** to see available tools.

For CLI-based testing:

```bash
# List all tools
npx mcp-inspector --cli node bin/dev.js --toolsets all --allow-non-ga-tools --method tools/list

# Call a specific tool
npx mcp-inspector --cli node bin/dev.js --toolsets all --allow-non-ga-tools \
  --method tools/call \
  --tool-name sfnext_design_decorator
```

#### 2. IDE Integration

Configure your IDE to use the local MCP server. Add this to your IDE's MCP configuration:

```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": [
        "/full/path/to/packages/b2c-dx-mcp/bin/dev.js",
        "--toolsets", "all",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

> **Note:** Make sure the script is executable: `chmod +x /full/path/to/packages/b2c-dx-mcp/bin/dev.js`
>
> The script's shebang (`#!/usr/bin/env -S node --conditions development`) handles Node.js setup automatically.

> **Note:** Restart the MCP server in your IDE to pick up code changes.

#### 3. JSON-RPC via stdin

Send raw MCP protocol messages:

```bash
# List all tools (--allow-non-ga-tools required for placeholder tools)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bin/dev.js --toolsets all --allow-non-ga-tools

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cartridge_deploy","arguments":{}}}' | node bin/dev.js --toolsets all --allow-non-ga-tools
```

## License

Apache-2.0
