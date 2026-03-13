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
    "b2c-dx-mcp": {
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

## Creating "Add to Cursor" Deep Links

When updating MCP documentation, you may need to create or update the "Add to Cursor" deep link. This link allows users to install the MCP server directly from Cursor.

### Link Format

The deep link follows this format:
```
cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=<base64-encoded-config>
```

### Generating the Base64 Config

1. **Create the configuration object** with `command` and `args`:

   The "Add to Cursor" link uses **user-level configuration** with `--project-directory`:
   ```json
   {
     "command": "npx",
     "args": ["-y", "@salesforce/b2c-dx-mcp@latest", "--project-directory", "${workspaceFolder}", "--allow-non-ga-tools"]
   }
   ```

   The `${workspaceFolder}` variable automatically expands to the current workspace directory in Cursor.

2. **Encode to Base64** using Node.js:
   ```bash
   node -e "console.log(Buffer.from(JSON.stringify({command: 'npx', args: ['-y', '@salesforce/b2c-dx-mcp@latest', '--project-directory', '\${workspaceFolder}', '--allow-non-ga-tools']})).toString('base64'))"
   ```

3. **Construct the full link**:
   ```
   cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=<base64-string>
   ```

### Example

**User-level link (used in documentation):**
```markdown
[Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=b2c-dx-mcp&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBzYWxlc2ZvcmNlL2IyYy1keC1tY3AiLCItLXByb2plY3QtZGlyZWN0b3J5IiwiJHt3b3Jrc3BhY2VGb2xkZXJ9IiwiLS1hbGxvdy1ub24tZ2EtdG9vbHMiXX0=)
```

### Where to Update

Update the "Add to Cursor" links in:
- `docs/guide/index.md` - Quick MCP Install section
- `docs/mcp/index.md` - Quick Start section
- `docs/mcp/installation.md` - Cursor installation section
- `docs/mcp/configuration.md` - Configuration section

**Note:** The "Add to Cursor" link uses user-level configuration (`~/.cursor/mcp.json`) with `--project-directory "${workspaceFolder}"` to automatically detect the project from the current workspace.

## Telemetry in Development

**Telemetry is disabled by default** when using `bin/dev.js` to avoid polluting production telemetry data. The development script automatically sets `SFCC_DISABLE_TELEMETRY=true` unless you explicitly enable it.

### Enable Telemetry for Testing

To enable telemetry during local development (for testing telemetry collection), you **must** set `SFCC_APP_INSIGHTS_KEY` to a development/test Application Insights key to avoid sending data to production:

```bash
SFCC_DISABLE_TELEMETRY=false SFCC_APP_INSIGHTS_KEY="InstrumentationKey=your-dev-key-here" node bin/dev.js --toolsets all --allow-non-ga-tools
```

Or in your IDE MCP configuration:

```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": ["/full/path/to/packages/b2c-dx-mcp/bin/dev.js", "--toolsets", "all", "--allow-non-ga-tools"],
      "env": {
        "SFCC_DISABLE_TELEMETRY": "false",
        "SFCC_APP_INSIGHTS_KEY": "InstrumentationKey=your-dev-key-here"
      }
    }
  }
}
```

### Enable Telemetry Logging

To see what telemetry data would be collected (requires telemetry to be enabled), set `SFCC_TELEMETRY_LOG=true`:

```bash
SFCC_DISABLE_TELEMETRY=false SFCC_APP_INSIGHTS_KEY="InstrumentationKey=your-dev-key-here" SFCC_TELEMETRY_LOG=true node bin/dev.js --toolsets all --allow-non-ga-tools
```

Or in your IDE MCP configuration:

```json
{
  "mcpServers": {
    "b2c-dx-local": {
      "command": "node",
      "args": ["/full/path/to/packages/b2c-dx-mcp/bin/dev.js", "--toolsets", "all", "--allow-non-ga-tools"],
      "env": {
        "SFCC_DISABLE_TELEMETRY": "false",
        "SFCC_APP_INSIGHTS_KEY": "InstrumentationKey=your-dev-key-here",
        "SFCC_TELEMETRY_LOG": "true"
      }
    }
  }
}
```

This will output debug logs showing what telemetry attributes are being collected, helping you verify that sensitive data is not included.

**Important:** Always set `SFCC_APP_INSIGHTS_KEY` to a development/test Application Insights key when testing telemetry in dev mode. Without this, telemetry will use the production key from `package.json`, which will pollute production telemetry data.

**Note:** By default, `bin/dev.js` disables telemetry. Set `SFCC_DISABLE_TELEMETRY=false` to enable it, and always provide `SFCC_APP_INSIGHTS_KEY` with a dev/test key.
