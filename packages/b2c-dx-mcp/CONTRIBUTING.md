# Contributing to B2C DX MCP

For general contributing guidelines, see the [root CONTRIBUTING.md](../../CONTRIBUTING.md).

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
> **Note:** Make sure the script is executable: `chmod +x /full/path/to/packages/b2c-dx-mcp/bin/dev.js`
>
> **Note:** Restart the MCP server in your IDE to pick up code changes.
