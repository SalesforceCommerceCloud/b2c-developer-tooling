**Use the IDE Extension** <span class="recommended VPBadge">Recommended</span>

Install the [B2C IDE Extension](/vscode-extension/), then open your project in a
trusted workspace. The extension provides the **B2C Commerce** MCP server to
VS Code. Enable the server and its tools in chat; no `.vscode/mcp.json` entry is
needed. The default launcher needs Node.js 22 or later and `npx` on the extension host.

Attach **#b2cContext** in chat to include the selected instance and live code-sync
status. See [AI Chat settings](/vscode-extension/configuration#ai-chat).

If you already installed the B2C MCP through a plugin or configuration file,
disable or remove that duplicate entry when using the extension-managed server.
To keep your existing installation instead, set `b2c-dx.mcp.enabled` to `false`;
the native **#b2cContext** tool remains available.

<details class="details custom-block">
<summary>Install the plugin without the IDE Extension</summary>

1. Open the Command Palette (`Cmd/Ctrl+Shift+P`) and run **Chat: Install Plugin from Source**.
2. Enter `SalesforceCommerceCloud/b2c-developer-tooling`.
3. Select **b2c-dx-mcp** and follow the installation prompts.
4. Start a new chat in GitHub Copilot.

</details>

<details class="details custom-block" data-setup-anchor="vscode-manual">
<summary>Manual MCP setup</summary>

<McpInstallButtons client="vscode" />

Add this to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "b2c-dx-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@salesforce/b2c-dx-mcp@latest"]
    }
  }
}
```

See [VS Code MCP setup](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

</details>

[Copilot CLI setup](/mcp/#copilot-cli)
