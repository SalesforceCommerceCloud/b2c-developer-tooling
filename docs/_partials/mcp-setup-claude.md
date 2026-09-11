**Install the plugin** <span class="recommended VPBadge">Recommended</span>

<!--@include: ./mcp-plugin-claude.md-->

Start a new Claude Code session in your project. Use `--scope user` instead for all projects.

<details class="details custom-block" data-setup-anchor="claude-manual">
<summary>Manual MCP setup</summary>

From your project directory:

```bash
claude mcp add --transport stdio --scope project b2c-dx-mcp -- npx -y @salesforce/b2c-dx-mcp@latest
```

Start a new session. Use `--scope user` instead for all projects.
See [Claude Code MCP setup](https://code.claude.com/docs/en/mcp).

</details>

[Claude Desktop setup](/mcp/#claude-desktop)
