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

Tools that interact with B2C Commerce instances (e.g., MRT, SCAPI, cartridge deployment) require credentials, which can be provided via **environment variables**, a **`.env` file**, a **`dw.json` file**, or the **`--config`** flag. Local tools (e.g., scaffolding, development guidelines) work without configuration.

**Priority order** (highest to lowest):

1. Environment variables (`SFCC_*`) — includes `.env` file if present (shell env vars override `.env`)
2. `dw.json` file (auto-discovered or via `--config`)

#### Option 1: Environment Variables

Set environment variables directly or create a `.env` file in your project root:

```bash
# .env file or shell exports
SFCC_HOSTNAME="your-sandbox.demandware.net"
SFCC_USERNAME="your.username"
SFCC_PASSWORD="your-access-key"
SFCC_CLIENT_ID="your-client-id"
SFCC_CLIENT_SECRET="your-client-secret"
SFCC_CODE_VERSION="version1"
```

#### Option 2: dw.json File

Create a `dw.json` file in your project root (auto-discovered by searching upward from current working directory):

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

> **Note:** Environment variables take precedence over `dw.json` values.

## License

Apache-2.0
