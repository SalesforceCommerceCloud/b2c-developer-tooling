# Contributing to B2C DX MCP

For general contributing guidelines, see the [root CONTRIBUTING.md](../../CONTRIBUTING.md).

## Quick Start

```bash
# Install dependencies (from monorepo root)
pnpm install

# Build all packages (builds SDK first, then MCP)
pnpm run build

# Run MCP tests (includes linting)
pnpm --filter @salesforce/b2c-dx-mcp run test

# Format code
pnpm run -r format

# Lint only
pnpm run lint

# Clean MCP build artifacts
pnpm --filter @salesforce/b2c-dx-mcp run clean
```

For package-specific commands (e.g. `inspect:dev`), run from `packages/b2c-dx-mcp` or use `pnpm --filter @salesforce/b2c-dx-mcp run <script>`.

## Development Build (Local)

For local development or testing, use the development build directly:

```json
{
  "mcpServers": {
    "b2c-dx": {
      "command": "node",
      "args": ["/path/to/packages/b2c-dx-mcp/bin/dev.js", "--project-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
    }
  }
}
```

Replace `/path/to/packages/b2c-dx-mcp/bin/dev.js` with the actual path to your cloned repository.

## Testing the MCP Server Locally

### MCP Inspector

Use MCP Inspector to browse tools and test them in a web UI:

```bash
cd packages/b2c-dx-mcp
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
  --tool-name storefront_next_page_designer_decorator
```

### JSON-RPC via stdin

Send raw MCP protocol messages for testing:

```bash
# List all tools (run from packages/b2c-dx-mcp)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bin/dev.js --toolsets all --allow-non-ga-tools

# Call a specific tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cartridge_deploy","arguments":{}}}' | node bin/dev.js --toolsets all --allow-non-ga-tools
```

### IDE Integration

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

> **Note:** When developing the B2C DX MCP package (`packages/b2c-dx-mcp`), use `node` with the path to `bin/dev.js` in args. Build to latest (`pnpm run build` from the repo root) so changes that require a rebuild are reflected when you run the server.
>
> **Note:** Make sure the script is executable: `chmod +x /full/path/to/packages/b2c-dx-mcp/bin/dev.js`. The script's shebang (`#!/usr/bin/env -S node --conditions development`) handles Node.js setup automatically.
>
> **Note:** Restart the MCP server in your IDE to pick up code changes.
