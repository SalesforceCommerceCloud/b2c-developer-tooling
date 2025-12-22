# @salesforce/b2c-dx-mcp

MCP (Model Context Protocol) server for Salesforce B2C Commerce Cloud developer experience tools.

## Overview

This package provides an MCP server that exposes B2C Commerce operations as tools for AI assistants. It wraps functionality from `@salesforce/b2c-tooling-sdk` and is built with [oclif](https://oclif.io/) for robust CLI handling with auto-generated help and environment variable support.

## Installation

```bash
npm install -g @salesforce/b2c-dx-mcp
```

## Configuration

The server needs B2C Commerce credentials, provided via **environment variables** or a **`dw.json` file**.

### Option 1: Environment Variables

```bash
export SFCC_HOSTNAME="your-sandbox.demandware.net"
export SFCC_USERNAME="your.username"
export SFCC_PASSWORD="your-access-key"
export SFCC_CLIENT_ID="your-client-id"
export SFCC_CLIENT_SECRET="your-client-secret"
export SFCC_CODE_VERSION="version1"
```

### Option 2: dw.json File

Create a `dw.json` file (auto-discovered from current directory):

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

## Usage

Configure your AI assistant to use this MCP server.

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "all"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "all"]
    }
  }
}
```

### Configuration Examples

```json
// Enable specific toolsets
"args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "CARTRIDGES,JOBS"]

// Enable specific tools
"args": ["-y", "@salesforce/b2c-dx-mcp", "--tools", "code_upload,code_list"]

// Combine toolsets and tools
"args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "CARTRIDGES", "--tools", "job_run"]

// Explicit dw.json path
"args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "all", "--dw-json", "/path/to/dw.json"]

// Enable experimental tools
"args": ["-y", "@salesforce/b2c-dx-mcp", "--toolsets", "all", "--allow-non-ga-tools"]
```

### Supported Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--toolsets` | `-s` | Comma-separated toolsets to enable (case-insensitive) |
| `--tools` | `-t` | Comma-separated individual tools to enable (case-insensitive) |
| `--allow-non-ga-tools` | | Enable experimental (non-GA) tools |
| `--dw-json` | | Path to dw.json (optional, auto-discovered) |

### Available Toolsets

- **CARTRIDGES** - Code deployment and version management
- **MRT** - Managed Runtime operations
- **PWAV3** - PWA Kit v3 development tools
- **STOREFRONTNEXT** - Storefront Next development tools

Use `--toolsets all` to enable all available toolsets.

## Development

### Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Build
pnpm run build

# Run tests (includes linting)
pnpm run test

# Format code
pnpm run format

# Check formatting (CI)
pnpm run format:check

# Run linter
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

### Testing the MCP Server

#### 1. MCP Inspector (Recommended)

Use MCP Inspector to browse tools and test them in a web UI:

```bash
pnpm run inspect
```

This automatically builds before starting the inspector. Open the localhost URL shown in the terminal, click **Connect**, then **List Tools** to see available tools.

For CLI-based testing:

```bash
# List all tools
npx mcp-inspector --cli node bin/run.js -s all --allow-non-ga-tools --method tools/list

# Call a specific tool
npx mcp-inspector --cli node bin/run.js -s all --allow-non-ga-tools \
  --method tools/call \
  --tool-name code_list
```

#### 2. IDE Integration

Configure your IDE to use the local build. First, build the package:

```bash
pnpm run build
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": ["/full/path/to/packages/b2c-dx-mcp/bin/run.js", "-s", "all"]
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": ["/full/path/to/packages/b2c-dx-mcp/bin/run.js", "-s", "all"]
    }
  }
}
```

> **Note:** After making code changes, run `pnpm run build` and restart your IDE to pick up the changes.

#### 3. JSON-RPC via stdin

Send raw MCP protocol messages:

```bash
# List all tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bin/run.js -s all

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"code_list","arguments":{}}}' | node bin/run.js -s all
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile TypeScript to JavaScript |
| `pnpm run inspect` | Start MCP Inspector web UI |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run clean` | Remove compiled files |

## License

Apache-2.0
