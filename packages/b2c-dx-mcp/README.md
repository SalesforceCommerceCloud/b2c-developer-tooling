# @salesforce/b2c-dx-mcp

MCP (Model Context Protocol) server for Salesforce B2C Commerce Cloud developer experience tools.

> ⚠️ **Active Development**: This package is under active development. All tools are currently **placeholder implementations** that return mock responses. Tool implementations will be added incrementally.

## Overview

This package provides an MCP server that exposes B2C Commerce developer tools for AI assistants. Built with [oclif](https://oclif.io/) for robust CLI handling with auto-generated help and environment variable support.

## Installation

```bash
npm install -g @salesforce/b2c-dx-mcp
```

## Usage

### Supported Flags

#### MCP-Specific Flags

| Flag | Description |
|------|-------------|
| `--toolsets` | Comma-separated toolsets to enable (case-insensitive) |
| `--tools` | Comma-separated individual tools to enable (case-insensitive) |
| `--allow-non-ga-tools` | Enable experimental (non-GA) tools |

#### MRT Flags (inherited from MrtCommand)

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--api-key` | `SFCC_MRT_API_KEY` | MRT API key for Managed Runtime operations |
| `--project` | `SFCC_MRT_PROJECT` | MRT project slug (required for MRT tools) |
| `--environment` | `SFCC_MRT_ENVIRONMENT` | MRT environment (e.g., staging, production) |
| `--cloud-origin` | `SFCC_MRT_CLOUD_ORIGIN` | MRT cloud origin URL (default: https://cloud.mobify.com). See [Environment-Specific Config](#environment-specific-config) |

#### B2C Instance Flags (inherited from InstanceCommand)

| Flag | Env Variable | Description |
|------|--------------|-------------|
| `--server` | `SFCC_SERVER` | B2C instance hostname |
| `--code-version` | `SFCC_CODE_VERSION` | Code version for deployments |
| `--username` | `SFCC_USERNAME` | Username for Basic auth (WebDAV) |
| `--password` | `SFCC_PASSWORD` | Password/access key for Basic auth |
| `--client-id` | `SFCC_CLIENT_ID` | OAuth client ID |
| `--client-secret` | `SFCC_CLIENT_SECRET` | OAuth client secret |

#### Global Flags (inherited from SDK)

| Flag | Description |
|------|-------------|
| `--config` | Path to dw.json config file (auto-discovered if not provided) |
| `--instance` | Instance name from configuration file |
| `--log-level` | Set logging verbosity (trace, debug, info, warn, error, silent) |
| `--debug` | Enable debug logging |
| `--json` | Output logs as JSON lines |
| `--lang` | Language for messages |
| `--working-directory` | Project working directory (env: `SFCC_WORKING_DIRECTORY`) |

### Workspace Auto-Discovery

The MCP server automatically detects your project type and enables appropriate toolsets when:
1. Neither `--toolsets` nor `--tools` are provided
2. All provided `--toolsets` or `--tools` are invalid (typos, unknown names)

**How it works:**

1. The server analyzes your working directory (from `--working-directory` flag, `SFCC_WORKING_DIRECTORY` env var, or current directory)
2. It checks for project markers like `package.json` dependencies and `.project` files
3. It enables all toolsets that match any detected project type, plus the base SCAPI toolset

**Base Toolset:**

The **SCAPI** toolset is always enabled, providing API discovery and custom API scaffolding capabilities.

**Project Types and Toolsets:**

| Project Type | Detection | Toolsets Enabled |
|--------------|-----------|------------------|
| **PWA Kit v3** | `@salesforce/pwa-kit-*`, `@salesforce/retail-react-app`, or `ccExtensibility` | PWAV3, MRT, SCAPI |
| **Storefront Next** | `@salesforce/storefront-next-*` packages in package.json | STOREFRONTNEXT, MRT, CARTRIDGES, SCAPI |
| **Cartridges** | Any cartridge with `.project` file (detected via `findCartridges`) | CARTRIDGES, SCAPI |
| **No project detected** | No B2C project markers found | SCAPI (base toolset only) |

**Hybrid Projects:**

If multiple project types are detected (e.g., cartridges + PWA Kit v3), toolsets from all matched types are combined.

**Example:**

**Cursor** (supports `${workspaceFolder}`):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": ["--working-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

**Claude Desktop** (use explicit path):

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": ["--working-directory", "/path/to/your/project", "--allow-non-ga-tools"]
    }
  }
}
```

> **Note:** Cursor supports `${workspaceFolder}` variable expansion, but Claude Desktop does not. For Claude Desktop, use an explicit path or set the `SFCC_WORKING_DIRECTORY` environment variable.

> **Warning:** MCP clients like Cursor and Claude Desktop often spawn servers from the home directory (`~`) rather than the project directory. Always set `--working-directory` or `SFCC_WORKING_DIRECTORY` for reliable auto-discovery and scaffolding operations.

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

// B2C instance tools with Basic auth (preferred for WebDAV tools like cartridge_deploy)
"args": ["--toolsets", "CARTRIDGES", "--server", "your-sandbox.demandware.net", "--username", "your.username", "--password", "your-access-key"]

// B2C instance tools with OAuth (for OCAPI/SCAPI tools, or WebDAV fallback)
"args": ["--toolsets", "SCAPI", "--server", "your-sandbox.demandware.net", "--client-id", "your-client-id", "--client-secret", "your-client-secret"]

// B2C instance tools with env vars (Basic auth)
"args": ["--toolsets", "CARTRIDGES"],
"env": { "SFCC_SERVER": "your-sandbox.demandware.net", "SFCC_USERNAME": "your.username", "SFCC_PASSWORD": "your-access-key" }

// MRT tools with project, environment, and API key
"args": ["--toolsets", "MRT", "--project", "my-project", "--environment", "staging", "--api-key", "your-api-key"]

// Or use environment variables in mcp.json
"args": ["--toolsets", "MRT"],
"env": { "SFCC_MRT_API_KEY": "your-api-key", "SFCC_MRT_PROJECT": "my-project", "SFCC_MRT_ENVIRONMENT": "staging" }

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
      "command": "/full/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
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

### Configuration

> **Note:** Configuration is not currently required as all tools are placeholder implementations. This section will be relevant once tools are fully implemented.

Different tools require different types of configuration:

| Tool Type | Configuration Required |
|-----------|----------------------|
| **MRT tools** (e.g., `mrt_bundle_push`) | API key + project |
| **B2C instance tools** (e.g., `cartridge_deploy`) | dw.json or instance flags |
| **Local tools** (e.g., scaffolding) | None |

#### MRT Configuration

MRT tools require an **API key** and **project**. The **environment** is optional (for deployments).

| Setting | Flag | Env Variable | Fallback |
|---------|------|--------------|----------|
| API key | `--api-key` | `SFCC_MRT_API_KEY` | `~/.mobify` |
| Project | `--project` | `SFCC_MRT_PROJECT` | — |
| Environment | `--environment` | `SFCC_MRT_ENVIRONMENT` | — |

> Priority: Flag > Env variable > `~/.mobify` file

**Example:**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
        "--toolsets", "MRT",
        "--project", "my-project",
        "--environment", "staging",
        "--api-key", "your-api-key"
      ]
    }
  }
}
```

Or use environment variables instead of flags:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": ["--toolsets", "MRT"],
      "env": {
        "SFCC_MRT_API_KEY": "your-api-key",
        "SFCC_MRT_PROJECT": "my-project",
        "SFCC_MRT_ENVIRONMENT": "staging"
      }
    }
  }
}
```

> **Note:** Make sure the script is executable: `chmod +x /path/to/packages/b2c-dx-mcp/bin/dev.js`

#### Environment-Specific Config

If you have a `~/.mobify` file from the `b2c` CLI, the MCP server will use it as a fallback for API key:

```json
{
  "api_key": "your-api-key"
}
```

For non-production environments, use `--cloud-origin` to select an environment-specific config file:

| `--cloud-origin` | Config File |
|------------------|-------------|
| (not set) | `~/.mobify` |
| `https://cloud-staging.mobify.com` | `~/.mobify--cloud-staging.mobify.com` |
| `https://cloud-dev.mobify.com` | `~/.mobify--cloud-dev.mobify.com` |

#### B2C Instance Config (dw.json)

Tools that interact with B2C Commerce instances (e.g., `cartridge_deploy`, SCAPI tools) require instance credentials.

**Authentication Methods:**

| Method | Credentials | Used By |
|--------|-------------|---------|
| **Basic auth** | `--username` + `--password` | WebDAV tools (`cartridge_deploy`) |
| **OAuth** | `--client-id` + `--client-secret` | OCAPI tools, SCAPI tools |

> **Recommendation:** Use Basic auth (username/password) for WebDAV tools like `cartridge_deploy`. OAuth credentials (client-id/client-secret) are required for OCAPI/SCAPI tools. If you need both WebDAV and OCAPI tools, configure all four credentials.

**Priority order** (highest to lowest):

1. Flags (`--server`, `--username`, `--password`, `--client-id`, `--client-secret`)
2. Environment variables (`SFCC_*`)
3. `dw.json` file (via `--config` flag or auto-discovery)

**Option A: Flags with Basic auth (for WebDAV tools like cartridge_deploy)**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
        "--toolsets", "CARTRIDGES",
        "--server", "your-sandbox.demandware.net",
        "--username", "your.username",
        "--password", "your-access-key"
      ]
    }
  }
}
```

**Option B: Flags with OAuth (for OCAPI/SCAPI tools, or WebDAV fallback)**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
        "--toolsets", "SCAPI",
        "--server", "your-sandbox.demandware.net",
        "--client-id", "your-client-id",
        "--client-secret", "your-client-secret"
      ]
    }
  }
}
```

**Option C: Environment variables (all credentials)**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": ["--toolsets", "CARTRIDGES"],
      "env": {
        "SFCC_SERVER": "your-sandbox.demandware.net",
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

**Option D: dw.json with explicit path**

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": ["--toolsets", "CARTRIDGES", "--config", "/path/to/dw.json"]
    }
  }
}
```

**Option E: dw.json with auto-discovery**

When `--config` is not provided, the MCP server searches for `dw.json` starting from the `--working-directory` path (or `SFCC_WORKING_DIRECTORY` env var).

> **Important:** MCP clients like Cursor and Claude Desktop often spawn servers from the home directory (`~`) rather than the project directory. Always set `--working-directory` for reliable `dw.json` auto-discovery.

**Cursor** (supports `${workspaceFolder}`):
```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
        "--toolsets", "CARTRIDGES",
        "--working-directory", "${workspaceFolder}",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

**Claude Desktop** (use explicit path):
```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "/path/to/packages/b2c-dx-mcp/bin/dev.js",
      "args": [
        "--toolsets", "CARTRIDGES",
        "--working-directory", "/path/to/your/project",
        "--allow-non-ga-tools"
      ]
    }
  }
}
```

**Example dw.json:**
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

> **Note:** Flags override environment variables, and environment variables override `dw.json`. You can mix sources (e.g., secrets via env vars, other settings via dw.json).

## License

Apache-2.0
