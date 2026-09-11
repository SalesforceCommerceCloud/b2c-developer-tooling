<McpInstallButtons client="vscode" />

**Install the plugin** <span class="recommended VPBadge">Recommended</span>

1. Open the Command Palette (`Cmd/Ctrl+Shift+P`) and run **Chat: Install Plugin from Source**.
2. Enter `SalesforceCommerceCloud/b2c-developer-tooling`.
3. Select **b2c-dx-mcp** and follow the installation prompts.
4. Start a new chat in GitHub Copilot.

<details class="details custom-block" data-setup-anchor="vscode-manual">
<summary>Manual MCP setup</summary>

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
