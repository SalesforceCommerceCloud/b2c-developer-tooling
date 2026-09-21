Add this to `opencode.json` in your project:

```json
{
  "mcp": {
    "b2c-dx-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@salesforce/b2c-dx-mcp@latest"],
      "enabled": true
    }
  }
}
```

Restart OpenCode. For all projects, use `~/.config/opencode/opencode.json`.
See [OpenCode MCP setup](https://opencode.ai/docs/mcp-servers/).
