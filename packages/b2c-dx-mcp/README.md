# @salesforce/b2c-dx-mcp

MCP (Model Context Protocol) server for Salesforce B2C Commerce Cloud developer experience tools.

> ⚠️ **Active Development**: This package is under active development. All tools are currently **placeholder implementations** that return mock responses. Tool implementations will be added incrementally.

## Overview

This package provides an MCP server that exposes B2C Commerce developer tools for AI assistants. Built with [oclif](https://oclif.io/) for robust CLI handling with auto-generated help and environment variable support.

## Usage

Since the package is not yet published to npm, see the [Development](#development) section for local setup instructions.

### Supported Flags

#### MCP-Specific Flags

| Flag | Description |
|------|-------------|
| `--toolsets` | Comma-separated toolsets to enable (case-insensitive) |
| `--tools` | Comma-separated individual tools to enable (case-insensitive) |
| `--allow-non-ga-tools` | Enable experimental (non-GA) tools |

#### Auth Flags

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--mrt-api-key` | `SFCC_MRT_API_KEY` | MRT API key for Managed Runtime operations |
| `--mrt-cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL (default: https://cloud.mobify.com). See [Environment-Specific Config Files](#environment-specific-config-files) |

#### Global Flags (inherited from SDK)

| Flag | Description |
|------|-------------|
| `--config` | Path to dw.json config file (auto-discovered if not provided) |
| `--instance` | Instance name from configuration file |
| `--log-level` | Set logging verbosity (trace, debug, info, warn, error, silent) |
| `--debug` | Enable debug logging |
| `--json` | Output logs as JSON lines |
| `--lang` | Language for messages |

### Configuration Examples

```json
// Enable specific toolsets
"args": ["--toolsets", "CARTRIDGES,MRT"]

// Enable specific tools
"args": ["--tools", "cartridge_deploy,mrt_bundle_push"]

// Combine toolsets and tools
"args": ["--toolsets", "CARTRIDGES", "--tools", "mrt_bundle_push"]

// Explicit config file path
"args": ["--toolsets", "all", "--config", "/path/to/dw.json"]

// MRT tools with API key
"args": ["--toolsets", "MRT", "--mrt-api-key", "your-api-key"]

// Or use environment variable in mcp.json
"args": ["--toolsets", "MRT"],
"env": { "SFCC_MRT_API_KEY": "your-api-key" }

// Enable experimental tools (required for placeholder tools)
"args": ["--toolsets", "all", "--allow-non-ga-tools"]

// Enable debug logging
"args": ["--toolsets", "all", "--debug"]
```

### Available Toolsets and Tools

Use `--toolsets all` to enable all toolsets, or select specific ones with `--toolsets CARTRIDGES,MRT`.

> **Note:** All tools are currently placeholder implementations. Use `--allow-non-ga-tools` flag to enable them.

#### CARTRIDGES
Code deployment and version management.
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

This automatically builds before starting the inspector. Open the localhost URL shown in the terminal, click **Connect**, then **List Tools** to see available tools.

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
      "args": ["--conditions", "development", "/full/path/to/packages/b2c-dx-mcp/bin/dev.js", "--toolsets", "all", "--allow-non-ga-tools"]
    }
  }
}
```

> **Note:** Restart the MCP server in your IDE to pick up code changes.

#### 3. JSON-RPC via stdin

Send raw MCP protocol messages:

```bash
# List all tools (--allow-non-ga-tools required for placeholder tools)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bin/dev.js --toolsets all --allow-non-ga-tools

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cartridge_deploy","arguments":{}}}' | node bin/dev.js --toolsets all --allow-non-ga-tools
```

### Configuration

> **Note:** Configuration is not currently required as all tools are placeholder implementations. This section will be relevant once tools are fully implemented.

Different tools require different types of configuration:

| Tool Type | Configuration Required |
|-----------|----------------------|
| **MRT tools** (e.g., `mrt_bundle_push`) | MRT API key |
| **B2C instance tools** (e.g., `cartridge_deploy`, SCAPI) | dw.json config |
| **Local tools** (e.g., scaffolding) | None |

#### MRT API Key

MRT (Managed Runtime) operations require an API key from the [Runtime Admin](https://runtime.commercecloud.com/) dashboard.

**Priority order** (highest to lowest):

1. `--mrt-api-key` flag
2. `SFCC_MRT_API_KEY` environment variable
3. `~/.mobify` config file (or `~/.mobify--[hostname]` if `--mrt-cloud-origin` is set)

**Option A: Flag or environment variable**

```json
// mcp.json - using flag
{
  "mcpServers": {
    "b2c-dx": {
      "command": "b2c-dx-mcp",
      "args": ["--toolsets", "MRT", "--mrt-api-key", "your-api-key"]
    }
  }
}

// mcp.json - using env var
{
  "mcpServers": {
    "b2c-dx": {
      "command": "b2c-dx-mcp",
      "args": ["--toolsets", "MRT"],
      "env": {
        "SFCC_MRT_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Option B: ~/.mobify file (legacy)**

If you already use the `b2c` CLI for MRT operations, you may have a `~/.mobify` file configured:

```json
{
  "username": "your.email@example.com",
  "api_key": "your-api-key"
}
```

The MCP server will automatically use this file as a fallback if no flag or environment variable is set.

##### Environment-Specific Config Files

When using `~/.mobify` config files (i.e., no `--mrt-api-key` flag or `SFCC_MRT_API_KEY` env var), you can use `--mrt-cloud-origin` to select an environment-specific config file:

```json
// mcp.json - uses ~/.mobify--cloud-staging.mobify.com for API key
{
  "mcpServers": {
    "b2c-dx-staging": {
      "command": "b2c-dx-mcp",
      "args": ["--toolsets", "MRT", "--mrt-cloud-origin", "https://cloud-staging.mobify.com"]
    }
  }
}
```

| Cloud Origin | Config File |
|--------------|-------------|
| (default) | `~/.mobify` |
| `https://cloud-staging.mobify.com` | `~/.mobify--cloud-staging.mobify.com` |
| `https://cloud-dev.mobify.com` | `~/.mobify--cloud-dev.mobify.com` |

> **Note:** `--mrt-cloud-origin` is only relevant when the API key is resolved from a config file. If `--mrt-api-key` or `SFCC_MRT_API_KEY` is provided, this flag is ignored.

#### B2C Instance Config (dw.json)

Tools that interact with B2C Commerce instances (e.g., `cartridge_deploy`, SCAPI tools) require instance credentials.

**Priority order** (highest to lowest):

1. Environment variables (`SFCC_*`)
2. `dw.json` file (via `--config` flag or auto-discovery)

**Option A: Environment variables**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "b2c-dx-mcp",
      "args": ["--toolsets", "CARTRIDGES"],
      "env": {
        "SFCC_HOSTNAME": "your-sandbox.demandware.net",
        "SFCC_USERNAME": "your.username",
        "SFCC_PASSWORD": "your-access-key",
        "SFCC_CLIENT_ID": "your-client-id",
        "SFCC_CLIENT_SECRET": "your-client-secret",
        "SFCC_CODE_VERSION": "version1"
      }
    }
  }
}
```

**Option B: dw.json with explicit path**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "b2c-dx-mcp",
      "args": ["--toolsets", "CARTRIDGES", "--config", "/path/to/dw.json"]
    }
  }
}
```

**Option C: dw.json with auto-discovery**

Create a `dw.json` file in your project root. The MCP server will auto-discover it by searching upward from the current working directory:

```json
{
  "hostname": "your-sandbox.demandware.net",
  "username": "your.username",
  "password": "your-access-key",
  "client-id": "your-client-id",
  "client-secret": "your-client-secret",
  "code-version": "version1"
}
```

> **Note:** Environment variables override values from `dw.json`. You can use env vars to override specific fields (e.g., secrets) while using dw.json for other settings.

## License

Apache-2.0
