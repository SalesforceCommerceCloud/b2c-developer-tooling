**Use the IDE Extension** <span class="recommended VPBadge">Recommended</span>

Install the [B2C IDE Extension](/vscode-extension/), then open your project in a
trusted workspace. The extension automatically registers **salesforce-b2c-commerce**
with Cursor. Enable the server and its tools in Cursor's MCP settings if prompted.
The default launcher needs Node.js 22 or later and `npx` on the extension host.

This one server includes the B2C Commerce tools and live IDE context: your selected
instance and code-sync status. No `.cursor/mcp.json` entry or context URL is needed.
See [AI Chat settings](/vscode-extension/configuration#ai-chat).

If you already installed the B2C MCP through a plugin or configuration file,
disable or remove that duplicate entry when using the extension-managed server.
To keep your existing installation instead, set `b2c-dx.mcp.enabled` to `false`;
that also disables Cursor's live IDE-context connection.

<details class="details custom-block" data-setup-anchor="cursor-manual">
<summary>Install MCP without the IDE Extension</summary>

<McpInstallButtons client="cursor" />

Add this to `.cursor/mcp.json` in your project:

<!--@include: ./mcp-manual-json.md-->

For all projects, use `~/.cursor/mcp.json` instead.

Reload the MCP server in Cursor after installation. This standalone installation
does not receive the extension's live instance selection or code-sync status.

</details>

See [Cursor's MCP documentation](https://cursor.com/docs/context/mcp).
